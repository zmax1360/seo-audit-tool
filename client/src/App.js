import { useState } from 'react';

const API_URL = 'https://seo-audit-server-production.up.railway.app/api/audit';

function AuditField({ label, value }) {
  const ok = value != null && String(value).trim() !== '';
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        marginBottom: 12,
        background: ok ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#64748b',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 15,
          lineHeight: 1.5,
          color: ok ? '#166534' : '#b91c1c',
          fontWeight: ok ? 500 : 600,
        }}
      >
        {ok && (
          <span style={{ flexShrink: 0, fontSize: 18 }} aria-hidden>
            ✓
          </span>
        )}
        <span>{ok ? String(value).trim() : 'Missing'}</span>
      </div>
    </div>
  );
}

function StatusAuditField({ label, ok, message }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        marginBottom: 12,
        background: ok ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#64748b',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 15,
          lineHeight: 1.5,
          color: ok ? '#166534' : '#b91c1c',
          fontWeight: ok ? 500 : 600,
        }}
      >
        {ok && (
          <span style={{ flexShrink: 0, fontSize: 18 }} aria-hidden>
            ✓
          </span>
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === 'string' ? data.error : `Request failed (${res.status})`,
        );
        return;
      }
      setResult({
        title: data.title ?? null,
        metaDescription: data.metaDescription ?? null,
        h1: data.h1 ?? null,
        imagesWithoutAlt:
          typeof data.imagesWithoutAlt === 'number' ? data.imagesWithoutAlt : 0,
        multipleH1: Boolean(data.multipleH1),
        hasHttps: Boolean(data.hasHttps),
        hasCanonical: Boolean(data.hasCanonical),
        aiRecommendations:
          typeof data.aiRecommendations === 'string' && data.aiRecommendations.trim()
            ? data.aiRecommendations
            : null,
      });
    } catch {
      setError('Could not reach the audit server. Is it running on port 3001?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: '40px 20px',
        fontFamily:
          'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        background: 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)',
        color: '#0f172a',
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          SEO audit
        </h1>
        <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: 15 }}>
          Enter a URL to run a quick SEO check: title, meta, H1, images, HTTPS, and
          canonical.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            padding: 24,
            borderRadius: 14,
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
            border: '1px solid #e2e8f0',
            marginBottom: 20,
          }}
        >
          <label
            htmlFor="audit-url"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}
          >
            URL
          </label>
          <input
            id="audit-url"
            type="url"
            name="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 16,
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              outline: 'none',
              marginBottom: 16,
            }}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            style={{
              width: '100%',
              padding: '12px 18px',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              borderRadius: 10,
              cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
              background: loading || !url.trim() ? '#94a3b8' : '#2563eb',
              color: '#fff',
            }}
          >
            {loading ? 'Auditing…' : 'Submit'}
          </button>
        </form>

        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '20px 16px',
              color: '#64748b',
              fontSize: 15,
            }}
          >
            Loading results…
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '14px 16px',
              borderRadius: 12,
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {result && !loading && (
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 14,
              boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 18px',
                color: '#0f172a',
              }}
            >
              Results
            </h2>
            <AuditField label="Title" value={result.title} />
            <AuditField label="Meta description" value={result.metaDescription} />
            <AuditField label="H1" value={result.h1} />
            <StatusAuditField
              label="Image alt text"
              ok={result.imagesWithoutAlt === 0}
              message={
                result.imagesWithoutAlt === 0
                  ? 'All images have alt text'
                  : `${result.imagesWithoutAlt} images missing alt text`
              }
            />
            <StatusAuditField
              label="H1 count"
              ok={!result.multipleH1}
              message={
                result.multipleH1
                  ? 'Multiple H1 tags found'
                  : 'Single H1'
              }
            />
            <StatusAuditField
              label="HTTPS"
              ok={result.hasHttps}
              message={result.hasHttps ? 'HTTPS enabled' : 'Not using HTTPS'}
            />
            <StatusAuditField
              label="Canonical"
              ok={result.hasCanonical}
              message={
                result.hasCanonical
                  ? 'Canonical tag present'
                  : 'No canonical tag'
              }
            />
            {result.aiRecommendations && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: 'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)',
                    border: '1px solid #c7d2fe',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: '#4338ca',
                      marginBottom: 10,
                    }}
                  >
                    AI Recommendations
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      lineHeight: 1.55,
                      color: '#312e81',
                      fontWeight: 500,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {result.aiRecommendations}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
