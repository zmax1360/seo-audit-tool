const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/audit', async (req, res) => {
  const { url } = req.body ?? {};

  if (typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      error: 'Request body must include a non-empty "url" string.',
    });
  }

  const targetUrl = url.trim();
  try {
    new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL.' });
  }

  try {
    const response = await axios.get(targetUrl, {
      responseType: 'text',
      timeout: 20000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'SEO-Audit-Tool/1.0',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
    });

    const { status, statusText, data } = response;
    if (status < 200 || status >= 300) {
      return res.status(502).json({
        error: `Failed to fetch URL: HTTP ${status} ${statusText || ''}`.trim(),
      });
    }

    const $ = cheerio.load(data);

    const titleRaw = $('title').first().text().trim();
    const title = titleRaw.length > 0 ? titleRaw : null;

    const metaRaw =
      $('meta[name="description"]').attr('content') ??
      $('meta[name="Description"]').attr('content');
    const metaDescription =
      metaRaw != null && String(metaRaw).trim().length > 0
        ? String(metaRaw).trim()
        : null;

    const h1Raw = $('h1').first().text().trim();
    const h1 = h1Raw.length > 0 ? h1Raw : null;

    let imagesWithoutAlt = 0;
    $('img').each((_, el) => {
      const alt = $(el).attr('alt');
      if (alt === undefined || String(alt).trim() === '') {
        imagesWithoutAlt += 1;
      }
    });

    const h1Count = $('h1').length;
    const multipleH1 = h1Count > 1;

    const hasHttps = /^https:\/\//i.test(targetUrl);

    const hasCanonical = $('head link')
      .toArray()
      .some((el) => {
        const rel = $(el).attr('rel');
        if (!rel) return false;
        return rel
          .toLowerCase()
          .split(/\s+/)
          .includes('canonical');
      });

    const audit = {
      title,
      metaDescription,
      h1,
      imagesWithoutAlt,
      multipleH1,
      hasHttps,
      hasCanonical,
    };

    const failedChecks = [];
    if (title == null) {
      failedChecks.push('Page title: missing or empty <title> tag.');
    }
    if (metaDescription == null) {
      failedChecks.push('Meta description: missing or empty meta name="description".');
    }
    if (h1 == null) {
      failedChecks.push('H1: no heading level 1 found.');
    }
    if (imagesWithoutAlt > 0) {
      failedChecks.push(
        `Images: ${imagesWithoutAlt} image(s) missing alt text (empty or absent alt attribute).`,
      );
    }
    if (multipleH1) {
      failedChecks.push('H1: more than one <h1> on the page.');
    }
    if (!hasHttps) {
      failedChecks.push('HTTPS: URL does not use HTTPS.');
    }
    if (!hasCanonical) {
      failedChecks.push('Canonical: no rel="canonical" link found in <head>.');
    }

    let aiRecommendations = null;
    if (failedChecks.length > 0) {
      const failedList = failedChecks
        .map((line, i) => `${i + 1}. ${line}`)
        .join('\n');
      const prompt = [
        `Audited URL: ${targetUrl}`,
        '',
        'The following SEO checks failed:',
        '',
        failedList,
        '',
        'For each failed check above, give one short, plain English fix recommendation.',
        'Number your answers to match the failed checks (1, 2, …). Be concise and actionable.',
      ].join('\n');

      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        });
        const textParts = message.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text);
        aiRecommendations = textParts.join('\n').trim() || null;
      } catch {
        aiRecommendations = null;
      }
    }

    return res.json({
      ...audit,
      aiRecommendations,
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') {
        return res.status(502).json({
          error: 'Request timed out while fetching the URL.',
        });
      }
      if (err.response) {
        return res.status(502).json({
          error: `Failed to fetch URL: HTTP ${err.response.status} ${err.response.statusText || ''}`.trim(),
        });
      }
      return res.status(502).json({
        error: err.message || 'Could not reach the URL.',
      });
    }

    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unexpected error.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
