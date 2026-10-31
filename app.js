import { config } from './config.js';
import { validateRequest, makePayload, submitRequest, validateOffer } from './validation.js';
const form=document.getElementById('request-form');
const submit=document.getElementById('submit-button');
const submitLabel=document.getElementById('submit-label');
const submissionError=document.getElementById('submission-error');
const formContent=document.getElementById('form-content');
const success=document.getElementById('form-success');
const offerPanel=document.getElementById('private-offer');
const checkout=document.getElementById('offer-checkout');
let startedAt=Date.now();
let requestId=crypto.randomUUID();
let busy=false;
function clearErrors(){
  for(const name of ['name','phone','email','consent']){ document.getElementById(name+'-error').textContent='';document.getElementById(name).removeAttribute('aria-invalid'); }
  submissionError.hidden=true;
}
form.addEventListener('submit',async(event)=>{
  event.preventDefault();if(busy)return;clearErrors();
  const data=new FormData(form);
  const values={...Object.fromEntries(data),consent:document.getElementById('consent').checked};
  const errors=validateRequest(values);
  if(Object.keys(errors).length){
    for(const [name,message] of Object.entries(errors)){document.getElementById(name+'-error').textContent=message;document.getElementById(name).setAttribute('aria-invalid','true');}
    document.getElementById(Object.keys(errors)[0]).focus();return;
  }
  busy=true;submit.disabled=true;submitLabel.textContent='Getting your offer…';
  try{
    const payload=makePayload(values,requestId,startedAt);
    const result=await submitRequest(payload,config.requestEndpoint);
    const offer=validateOffer(result.offer);
    document.getElementById('success-kicker').textContent='REQUEST RECEIVED';
    document.getElementById('success-heading').textContent=offer?'Your Rove 6 offer is ready.':'Thank you for reaching out.';
    document.getElementById('success-message').textContent=offer?'Choose secure checkout, or call us for personal help.':'Our team will be in touch to discuss your Rove 6. You can also call us below.';
    if(offer){
      document.getElementById('offer-product').textContent=offer.title;
      document.getElementById('offer-price').textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:offer.currency,minimumFractionDigits:offer.amountMinor%100?2:0,maximumFractionDigits:2}).format(offer.amountMinor/100);
      checkout.href=offer.checkoutUrl;checkout.hidden=false;offerPanel.hidden=false;
    }
    // No name, phone, email, prescription, or insurance information is put into analytics.
    window.dispatchEvent(new CustomEvent('rove6:request-saved',{detail:{event:'rove6_request_saved'}}));
    form.reset();formContent.hidden=true;success.hidden=false;success.focus({preventScroll:true});success.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){
    submissionError.textContent=error.message||'Unable to send your request. Please try again or call (888) 747-7590.';
    submissionError.hidden=false;submissionError.focus();
  }finally{busy=false;submit.disabled=false;submitLabel.textContent='Request the Rove 6';}
});
document.getElementById('reset-form').addEventListener('click',()=>{success.hidden=true;offerPanel.hidden=true;checkout.hidden=true;checkout.removeAttribute('href');document.getElementById('offer-price').textContent='';formContent.hidden=false;startedAt=Date.now();requestId=crypto.randomUUID();clearErrors();document.getElementById('name').focus();});
