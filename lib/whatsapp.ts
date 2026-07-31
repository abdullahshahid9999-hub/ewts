export const WHATSAPP_NUMBER = "923336515349";

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Same idea, but TO the customer/agent's own number instead of the
// business's — used by admin to one-click notify an applicant about a
// status change. Not automatic (no paid WhatsApp Business API set up),
// but genuinely one tap away from actually sending it.
export function waLinkTo(phone: string, message: string) {
  const digits = phone.replace(/[^\d]/g, "");
  const withCountryCode = digits.startsWith("92") ? digits : digits.startsWith("0") ? `92${digits.slice(1)}` : `92${digits}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
