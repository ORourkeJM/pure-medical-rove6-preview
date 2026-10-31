/**
 * Pure Medical Rove 6 callback receiver.
 * Deploy from the private Requests spreadsheet as a bound Apps Script web app.
 * Execute as the owner; access: Anyone (anonymous submissions).
 * This code never returns spreadsheet contents or contact details.
 */
const REQUEST_HEADERS = ['Submitted at','Request ID','Name','Phone','Email','State','Contact preference','Contact consent','Status','Team notes'];
const CONTACT_CONSENT = 'I agree that Pure Medical may call, text, or email me at the contact details I provide about my Rove 6 inquiry or order.';
const STATE_CODES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');

function doGet() {
  return json_({ok:true,service:'Rove 6 callback requests',version:1});
}

function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > 4096) throw new Error('Unable to process this request.');
    const raw = JSON.parse(e.postData.contents);
    if (raw && raw.action==='resume') return resumeQuote_(raw.requestId);
    const item = validate_(raw);
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) throw new Error('The form is busy. Please try again.');
    try {
      const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (!id) throw new Error('The callback form is not connected yet.');
      const sheet = SpreadsheetApp.openById(id).getSheetByName('Requests');
      if (!sheet) throw new Error('The callback form is not connected yet.');
      const headers = sheet.getRange(1,1,1,REQUEST_HEADERS.length).getValues()[0];
      if (headers.some(function(v,i){return v !== REQUEST_HEADERS[i];})) throw new Error('The callback form needs a configuration check.');
      const last = sheet.getLastRow();
      // An acknowledged request or a retry after an ambiguous network result is written once.
      if (last > 1) {
        const match = sheet.getRange(2,2,last-1,1).createTextFinder(item.requestId).matchEntireCell(true).findNext();
        if (match) return acknowledgement_(item.requestId,sheet.getRange(match.getRow(),1).getValue());
      }
      const key = 'phone:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,item.phone));
      const cache = CacheService.getScriptCache();
      if (cache.get(key)) throw new Error('A request was just sent for this phone number. Please wait a minute before trying again.');
      const next = sheet.getLastRow()+1;
      const issuedAt = new Date();
      const row = [issuedAt, item.requestId, safeText_(item.name), safeText_(item.phone), safeText_(item.email), item.state, 'Call, text, email', CONTACT_CONSENT, 'New', 'Page: '+item.variant+' | Market: '+item.market];
      sheet.getRange(next,2,1,9).setNumberFormat('@');
      sheet.getRange(next,1,1,10).setValues([row]);
      sheet.getRange(next,1).setNumberFormat('mmm d, yyyy h:mm AM/PM');
      SpreadsheetApp.flush();
      cache.put(key,'1',60);
      return acknowledgement_(item.requestId,issuedAt);
    } finally { lock.releaseLock(); }
  } catch (error) {
    // Return only a controlled message, not a Google exception, sheet ID, or submitted data.
    const known = ['Unable to process this request.','Please enter your name.','Please enter a 10-digit U.S. phone number.','Please enter a valid email address.','Please select a valid state.','Please confirm contact permission.','Unable to verify this request. Please refresh the page and try again.','The form is busy. Please try again.','The callback form is not connected yet.','The callback form needs a configuration check.','A request was just sent for this phone number. Please wait a minute before trying again.'];
    const message = known.indexOf(error.message)>=0 ? error.message : 'Unable to save your request right now. Please try again or call (888) 747-7590.';
    return json_({ok:false,message:message});
  }
}

function validate_(raw) {
  if (!raw || typeof raw!=='object' || Array.isArray(raw) || raw.website) throw new Error('Unable to process this request.');
  if (typeof raw.requestId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.requestId)) throw new Error('Unable to process this request.');
  const name = String(raw.name||'').trim();
  const phone = String(raw.phone||'').replace(/\D/g,'');
  const email = String(raw.email||'').trim();
  const state = String(raw.state||'').trim();
  if (name.length<2 || name.length>100 || /[\r\n]/.test(name)) throw new Error('Please enter your name.');
  if (!(phone.length===10 || (phone.length===11 && phone.charAt(0)==='1'))) throw new Error('Please enter a 10-digit U.S. phone number.');
  if (!email || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (state && STATE_CODES.indexOf(state)<0) throw new Error('Please select a valid state.');
  if (raw.consent!==true || raw.consentText!==CONTACT_CONSENT) throw new Error('Please confirm contact permission.');
  if (typeof raw.startedAt!=='number' || Date.now()-raw.startedAt<1000 || Date.now()-raw.startedAt>86400000) throw new Error('Unable to verify this request. Please refresh the page and try again.');
  const market = raw.market==='florida' ? 'florida' : 'national';
  const variant = market==='florida' && raw.variant==='florida' ? 'florida' : 'standard';
  return {requestId:raw.requestId,name:name,phone:phone,email:email,state:state,market:market,variant:variant};
}
function safeText_(value) { return /^[\s]*[=+\-@]/.test(value) ? "'"+value : value; }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }

function readConfiguredOffer_() {
  try {
    const value = JSON.parse(PropertiesService.getScriptProperties().getProperty('ROVE6_OFFER_JSON') || 'null');
    if (value && value.currency === 'USD' && Number.isSafeInteger(value.amountMinor) && value.amountMinor > 0 && value.amountMinor <= 10000000 && typeof value.title === 'string' && value.title.trim() && value.title.length <= 120 && /^https:\/\/payments-na1\.hubspot\.com\/payments\/[A-Za-z0-9_-]+(?:\?[^#\s]*)?$/.test(value.checkoutUrl)) {
      const offer = {amountMinor:value.amountMinor,currency:'USD',title:value.title.trim(),checkoutUrl:value.checkoutUrl};
      if (Number.isSafeInteger(value.regularAmountMinor) && value.regularAmountMinor>value.amountMinor && value.regularAmountMinor<=10000000) offer.regularAmountMinor=value.regularAmountMinor;
      return offer;
    }
  } catch (_) {}
  return null;
}
function acknowledgement_(requestId,issuedAt) {
  const properties=PropertiesService.getScriptProperties();
  const key='ROVE6_QUOTE_'+requestId;
  let quote=null;
  try { quote=JSON.parse(properties.getProperty(key)||'null'); } catch (_) {}
  if (!quote) {
    const time=new Date(issuedAt).getTime();
    if (!Number.isFinite(time)) throw new Error('Unable to process this request.');
    quote={issuedAt:time,expiresAt:time+86400000,offer:readConfiguredOffer_()};
    properties.setProperty(key,JSON.stringify(quote));
  }
  return quoteResponse_(requestId,quote);
}
function quoteResponse_(requestId,quote) {
  const now=Date.now();
  const expired=!Number.isFinite(quote.expiresAt)||now>=quote.expiresAt;
  return json_({ok:true,requestId:requestId,serverNow:now,expiresAt:quote.expiresAt,expired:expired,offer:expired?null:quote.offer});
}
function resumeQuote_(requestId) {
  if (typeof requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new Error('Unable to process this request.');
  let quote=null;
  try { quote=JSON.parse(PropertiesService.getScriptProperties().getProperty('ROVE6_QUOTE_'+requestId)||'null'); } catch (_) {}
  if (!quote) throw new Error('Unable to process this request.');
  return quoteResponse_(requestId,quote);
}

function configureReceiver() {
  // Run this once from Extensions > Apps Script in the callback spreadsheet.
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet || !spreadsheet.getSheetByName('Requests')) throw new Error('Open this script from the callback Requests spreadsheet.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID',spreadsheet.getId());
  spreadsheet.setSpreadsheetTimeZone('America/New_York');
}
