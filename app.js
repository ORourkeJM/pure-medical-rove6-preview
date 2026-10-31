import { config } from './config.js';
import { applyCampaignTheme } from './campaign.js';
import { validateRequest, makePayload, submitRequest, resumeOffer, validateOffer } from './validation.js';
import { coverageMessage, countdownParts, remainingHold } from './flow.js';
const campaign=applyCampaignTheme();
const form=document.getElementById('request-form');
const submit=document.getElementById('submit-button');
const submitLabel=document.getElementById('submit-label');
const submitIdleLabel=submitLabel.textContent;
const submissionError=document.getElementById('submission-error');
const formContent=document.getElementById('form-content');
const coverageStep=document.getElementById('coverage-step');
const coverageNext=document.getElementById('coverage-next');
const success=document.getElementById('form-success');
const offerPanel=document.getElementById('private-offer');
const checkout=document.getElementById('offer-checkout');
const STORAGE_KEY='rove6:private-offer:v1';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let startedAt=Date.now(),requestId=crypto.randomUUID(),coverageAnswer='',busy=false,timer=null;
function remember(id){try{localStorage.setItem(STORAGE_KEY,id);}catch{}}
function forget(){try{localStorage.removeItem(STORAGE_KEY);}catch{}}
function progress(step){for(const name of ['coverage','details','offer']){const el=document.getElementById('progress-'+name);el.toggleAttribute('data-complete',['coverage','details','offer'].indexOf(name)<step);if(name===['coverage','details','offer'][step])el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');}}
function focusStep(el){el.focus({preventScroll:true});el.scrollIntoView({behavior:'smooth',block:'start'});}
function clearErrors(){
  for(const name of ['name','phone','email','consent']){document.getElementById(name+'-error').textContent='';document.getElementById(name).removeAttribute('aria-invalid');}
  submissionError.hidden=true;
}
function clearOffer(){
  clearInterval(timer);timer=null;offerPanel.hidden=true;checkout.hidden=true;checkout.removeAttribute('href');
  for(const id of ['offer-comparison','offer-savings','offer-timer'])document.getElementById(id).hidden=true;
  for(const id of ['offer-price','offer-regular','offer-savings-amount'])document.getElementById(id).textContent='';
}
function expiredOffer(){
  clearOffer();document.getElementById('success-kicker').textContent='PRICE HOLD ENDED';
  document.getElementById('success-heading').textContent='Let’s check your current offer.';
  document.getElementById('success-message').textContent='Your 24-hour price hold has ended. Call our team for current pricing and help with your Rove 6.';
}
function showOffer(result,scroll=true){
  clearOffer();
  coverageStep.hidden=true;formContent.hidden=true;success.hidden=false;progress(2);
  const info=coverageMessage(coverageAnswer);
  document.getElementById('confirmation-coverage-title').textContent=info.heading;
  document.getElementById('confirmation-coverage-copy').textContent=info.body;
  document.getElementById('confirmation-coverage').hidden=false;
  if(result.expired===true){expiredOffer();if(scroll)focusStep(success);return;}
  const offer=validateOffer(result.offer);
  document.getElementById('success-kicker').textContent=offer?'END-OF-SEASON SALE':'REQUEST RECEIVED';
  document.getElementById('success-heading').textContent=offer?'Your Rove 6 offer is ready.':'Thank you for reaching out.';
  document.getElementById('success-message').textContent=offer?'Your private sale offer is ready. Choose secure checkout, or call us for personal help.':'Our team will be in touch to discuss your Rove 6. You can also call us below.';
  if(offer){
    const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:offer.currency,minimumFractionDigits:value%100?2:0,maximumFractionDigits:2}).format(value/100);
    document.getElementById('offer-product').textContent=offer.title;
    document.getElementById('offer-price').textContent=money(offer.amountMinor);
    if(offer.regularAmountMinor){
      document.getElementById('offer-regular').textContent=money(offer.regularAmountMinor);
      document.getElementById('offer-savings-amount').textContent=money(offer.regularAmountMinor-offer.amountMinor);
      document.getElementById('offer-comparison').hidden=false;document.getElementById('offer-savings').hidden=false;
    }
    checkout.href=offer.checkoutUrl;checkout.hidden=false;offerPanel.hidden=false;
    if(Number.isFinite(result.expiresAt)&&Number.isFinite(result.serverNow)){
      const receivedAt=performance.now();
      document.getElementById('offer-deadline').textContent='Price held until '+new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/New_York',timeZoneName:'short'}).format(new Date(result.expiresAt))+'.';
      const tick=()=>{const left=remainingHold(result.expiresAt,result.serverNow,receivedAt,performance.now());if(left<=0){expiredOffer();return;}const parts=countdownParts(left);for(const key of ['hours','minutes','seconds'])document.getElementById('hold-'+key).textContent=parts[key];};
      tick();if(!offerPanel.hidden){document.getElementById('offer-timer').hidden=false;timer=setInterval(tick,1000);}
    }
  }
  if(scroll)focusStep(success);
}
for(const input of document.querySelectorAll('input[name="medicare-coverage"]'))input.addEventListener('change',()=>{
  coverageAnswer=input.value;coverageNext.disabled=false;
});
coverageNext.addEventListener('click',()=>{if(!coverageAnswer)return;coverageStep.hidden=true;formContent.hidden=false;progress(1);document.getElementById('name').focus();});
document.getElementById('back-to-coverage').addEventListener('click',()=>{formContent.hidden=true;coverageStep.hidden=false;progress(0);coverageNext.focus();});
form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;clearErrors();
  const values={...Object.fromEntries(new FormData(form)),consent:document.getElementById('consent').checked};
  const errors=validateRequest(values);
  if(Object.keys(errors).length){for(const[name,message]of Object.entries(errors)){document.getElementById(name+'-error').textContent=message;document.getElementById(name).setAttribute('aria-invalid','true');}document.getElementById(Object.keys(errors)[0]).focus();return;}
  busy=true;submit.disabled=true;submitLabel.textContent='Getting your offer…';
  try{
    const payload=makePayload(values,requestId,startedAt,campaign);
    const result=await submitRequest(payload,config.requestEndpoint);
    // Coverage answers stay in this page. They are not sent to the receiver or analytics.
    remember(requestId);showOffer(result);form.reset();
    window.dispatchEvent(new CustomEvent('rove6:request-saved',{detail:{event:'rove6_request_saved',market:campaign.market,variant:campaign.variant}}));
  }catch(error){submissionError.textContent=error.message||'Unable to send your request. Please try again or call (888) 747-7590.';submissionError.hidden=false;submissionError.focus();}
  finally{busy=false;submit.disabled=false;submitLabel.textContent=submitIdleLabel;}
});
document.getElementById('reset-form').addEventListener('click',()=>{
  forget();clearOffer();success.hidden=true;formContent.hidden=true;coverageStep.hidden=false;
  document.getElementById('confirmation-coverage').hidden=true;
  for(const input of document.querySelectorAll('input[name="medicare-coverage"]'))input.checked=false;
  coverageAnswer='';coverageNext.disabled=true;startedAt=Date.now();requestId=crypto.randomUUID();clearErrors();progress(0);focusStep(coverageStep);
});
let savedId;try{savedId=localStorage.getItem(STORAGE_KEY);}catch{}
if(savedId&&uuid.test(savedId))resumeOffer(savedId,config.requestEndpoint).then(result=>{requestId=savedId;showOffer(result);}).catch(()=>{ /* A network error never reveals an unconfirmed offer or resets its server deadline. */ });
