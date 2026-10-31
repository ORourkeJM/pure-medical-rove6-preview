// Only email prefill is verified for this hosted payment link.
// Name, phone, coverage answers and consent are never added to its URL.
export function checkoutUrlWithEmail(base,email=''){
  let url;try{url=new URL(base);}catch{return null;}
  if(url.protocol!=='https:'||url.hostname!=='payments-na1.hubspot.com'||url.username||url.password||url.port||!/^\/payments\/[A-Za-z0-9_-]+$/.test(url.pathname))return null;
  url.searchParams.delete('email');
  const value=typeof email==='string'?email.trim():'';
  if(value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))url.searchParams.set('email',value);
  return url.href;
}
