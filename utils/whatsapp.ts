/**
 * Tautan WhatsApp ke Admin. Nomor dari /meta company.admin_whatsapp ("6281234567890");
 * format lain (0812..., +62 812...) dirapikan ke 62...
 */
export function whatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  return digits.length >= 9 ? digits : null;
}

export function whatsappUrl(raw: string | null | undefined, text?: string): string | null {
  const number = whatsappNumber(raw);
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
