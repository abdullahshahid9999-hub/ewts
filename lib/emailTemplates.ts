const BASE = "https://eastwestpk.com";
const WA = "https://wa.me/923336515349";
const LOGO_URL = `${BASE}/logo.png`;

export function emailWrap(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F4F0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F0;padding:32px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:560px;width:100%">

  <!-- Header -->
  <tr><td style="background:#1C1E26;padding:20px 32px;text-align:center">
    <img src="${LOGO_URL}" height="38" alt="" style="vertical-align:middle;margin-right:10px" onerror="this.style.display='none'">
    <span style="color:#B8923A;font-size:20px;font-weight:700;vertical-align:middle;font-family:Arial,sans-serif">East &amp; West Travel Services</span>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 32px 8px">
    ${content}
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F9F8F5;padding:20px 32px;border-top:1px solid #EEECE6">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:12px;color:#9CA3AF;line-height:1.6">
          <strong style="color:#6B7280">East &amp; West Travel Services</strong><br>
          IATA Certified · Est. 2003<br>
          Chaudhry Arcade, Regency Road, New Civil Lines, Faisalabad
        </td>
        <td align="right" style="vertical-align:top">
          <a href="${WA}" style="display:inline-block;background:#25D366;color:#fff;font-size:12px;font-weight:700;padding:8px 14px;border-radius:6px;text-decoration:none">💬 WhatsApp</a>
        </td>
      </tr>
    </table>
    <p style="font-size:11px;color:#9CA3AF;margin:12px 0 0">
      <a href="${BASE}" style="color:#B8923A;text-decoration:none">eastwestpk.com</a> · 
      This email was sent regarding your travel application. Please do not reply directly — use WhatsApp for queries.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

export function refTable(batchRef: string, visaLabel: string, travelers: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EEECE6;border-radius:8px;overflow:hidden;margin:20px 0;font-size:13px">
    <tr style="background:#F9F8F5"><td style="padding:10px 16px;color:#6B7280;width:40%">Reference</td><td style="padding:10px 16px;font-weight:700;font-family:monospace;font-size:14px;color:#1C1E26">${batchRef}</td></tr>
    <tr style="border-top:1px solid #EEECE6"><td style="padding:10px 16px;color:#6B7280">Visa</td><td style="padding:10px 16px;font-weight:600">${visaLabel}</td></tr>
    <tr style="border-top:1px solid #EEECE6;background:#F9F8F5"><td style="padding:10px 16px;color:#6B7280">Travelers</td><td style="padding:10px 16px;font-weight:600">${travelers}</td></tr>
  </table>`;
}

export function ctaButton(href: string, text: string, color = "#B8923A"): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:20px 0">
    <tr><td style="background:${color};border-radius:8px">
      <a href="${href}" style="display:inline-block;padding:13px 28px;color:#fff;font-weight:700;font-size:14px;text-decoration:none;font-family:Arial,sans-serif">${text}</a>
    </td></tr>
  </table>`;
}

export function waButton(refNo: string): string {
  const msg = encodeURIComponent(`Hi, I'm enquiring about my visa application. Reference: ${refNo}`);
  return ctaButton(`${WA}?text=${msg}`, "💬 Message Us on WhatsApp", "#25D366");
}

export function uploadButton(batchRef: string, uploadToken: string): string {
  return ctaButton(`${BASE}/visa/track?ref=${batchRef}&token=${uploadToken}`, "📎 Upload Your Documents", "#2563EB");
}

export function travelersStr(adults: number, children: number, infants: number): string {
  return [
    `${adults} Adult${adults !== 1 ? "s" : ""}`,
    children > 0 ? `${children} Child${children !== 1 ? "ren" : ""}` : "",
    infants > 0 ? `${infants} Infant${infants !== 1 ? "s" : ""}` : "",
  ].filter(Boolean).join(", ");
}
