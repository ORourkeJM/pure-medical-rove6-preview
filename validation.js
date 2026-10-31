export const CONSENT_TEXT = 'Please have the Pure Medical team contact me about my Rove 6 request using the details I provided.';
export function validateRequest(values) {
  const errors = {};
  const name = String(values.name || '').trim();
  const phone = String(values.phone || '').trim();
  const email = String(values.email || '').trim();
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2 || name.length > 100 || /[\r\n]/.test(name)) errors.name = 'Please enter your name.';
  if (!(digits.length === 10 || (digits.length === 11 && digits.startsWith('1')))) errors.phone = 'Please enter a 10-digit U.S. phone number.';
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = 'Please enter a valid email address, or leave this blank.';
  if (values.consent !== true) errors.consent = 'Please confirm that our team may contact you about this request.';
  return errors;
}
export function makePayload(values, requestId, startedAt) {
  return { requestId, name: String(values.name || '').trim(), phone: String(values.phone || '').trim(), email: String(values.email || '').trim(), state: String(values.state || '').trim(), consent: values.consent === true, consentText: CONSENT_TEXT, contactPreference: 'Phone', website: String(values.website || ''), startedAt };
}
export function validateOffer(offer) {
  if (!offer || offer.currency !== 'USD' || !Number.isSafeInteger(offer.amountMinor) || offer.amountMinor <= 0 || offer.amountMinor > 10000000 || typeof offer.title !== 'string' || !offer.title.trim() || offer.title.length > 120) return null;
  try {
    const url = new URL(offer.checkoutUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'payments-na1.hubspot.com' || url.username || url.password || url.port || !/^\/payments\/[A-Za-z0-9_-]+$/.test(url.pathname)) return null;
    return { amountMinor: offer.amountMinor, currency: offer.currency, title: offer.title.trim(), checkoutUrl: url.href };
  } catch { return null; }
}
export async function submitRequest(payload, endpoint, fetcher = fetch) {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) throw new Error('The callback form is not connected yet. Please call (888) 747-7590.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetcher(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), redirect: 'follow', credentials: 'omit', signal: controller.signal });
    if (!response.ok) throw new Error('Unable to send your request right now. Please try again or call (888) 747-7590.');
    const result = await response.json();
    if (result.ok !== true || result.requestId !== payload.requestId) throw new Error(result.message || 'We could not confirm your request. Please try again with this form or call (888) 747-7590.');
    return result;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('We could not confirm your request in time. Please retry or call (888) 747-7590.');
    if (err instanceof TypeError || err instanceof SyntaxError) throw new Error('We could not confirm your request. Please retry or call (888) 747-7590.');
    throw err;
  } finally { clearTimeout(timer); }
}
