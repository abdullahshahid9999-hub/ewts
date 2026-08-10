import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Page Not Found — East &amp; West Travel Services</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #fafaf9;
            color: #1a1a1a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
          }
          .wrap {
            text-align: center;
            max-width: 480px;
            width: 100%;
          }
          .code {
            font-size: clamp(80px, 20vw, 140px);
            font-weight: 900;
            line-height: 1;
            color: #f0ede8;
            letter-spacing: -4px;
            margin-bottom: 8px;
            user-select: none;
          }
          .brand {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 28px;
            text-decoration: none;
          }
          .brand-icon {
            width: 36px; height: 36px;
            background: #1a2e1a;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; font-weight: 800; color: #c9a84c;
          }
          .brand-name {
            font-size: 15px; font-weight: 700; color: #1a1a1a;
          }
          h1 {
            font-size: clamp(22px, 5vw, 30px);
            font-weight: 800;
            color: #1a1a1a;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
          }
          p {
            font-size: 15px;
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 36px;
          }
          .actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 13px 28px;
            background: #1a2e1a;
            color: #fff;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            transition: opacity 0.15s;
          }
          .btn-primary:hover { opacity: 0.85; }
          .btn-ghost {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 13px 28px;
            background: #fff;
            color: #374151;
            border: 1.5px solid #e5e7eb;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: border-color 0.15s;
          }
          .btn-ghost:hover { border-color: #9ca3af; }
          .divider {
            width: 48px; height: 3px;
            background: #c9a84c;
            border-radius: 99px;
            margin: 20px auto 28px;
          }
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <div className="code">404</div>

          <a href="/" className="brand">
            <div className="brand-icon">EW</div>
            <span className="brand-name">East &amp; West Travel</span>
          </a>

          <div className="divider" />

          <h1>This page doesn&apos;t exist</h1>
          <p>
            The link you followed may be broken, or the page may have been moved.
            Let&apos;s get you back on track.
          </p>

          <div className="actions">
            <a href="/" className="btn-primary">← Go Home</a>
            <a href="/contact" className="btn-ghost">Contact Us</a>
          </div>
        </div>
      </body>
    </html>
  );
}
