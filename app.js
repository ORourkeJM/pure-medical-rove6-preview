import { config } from './config.js';
import { validateRequest, makePayload, submitRequest } from './validation.js';
const form=document.getElementById('request-form');
const submit=document.getElementById('submit-button');
const submitLabel=document.getElementById('submit-label');
const submissionError=document.getElementById('submission-error');
const formContent=document.getElementById('form-content');
const success=document.getElementById('form-success');
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
  busy=true;submit.disabled=true;submitLabel.textContent=config.mode==='preview'?'Testing form…':'Sending request…';
  try{
    if(config.mode==='preview'){
      document.getElementById('success-kicker').textContent='PREVIEW COMPLETE';
      document.getElementById('success-heading').textContent='Your form test is complete.';
      document.getElementById('success-message').textContent='No request was sent or stored. On the connected live page, this step confirms your callback request was saved for the team.';
    }else{
      const payload=makePayload(values,requestId,startedAt);
      await submitRequest(payload,config.requestEndpoint);
      // No name, phone, email, prescription, or insurance information is put into analytics.
      window.dispatchEvent(new CustomEvent('rove6:request-saved',{detail:{event:'rove6_request_saved'}}));
    }
    form.reset();formContent.hidden=true;success.hidden=false;success.focus();
  }catch(error){
    submissionError.textContent=error.message||'Unable to send your request. Please try again or call (888) 747-7590.';
    submissionError.hidden=false;submissionError.focus();
  }finally{busy=false;submit.disabled=false;submitLabel.textContent='Request the Rove 6';}
});
document.getElementById('reset-form').addEventListener('click',()=>{success.hidden=true;formContent.hidden=false;startedAt=Date.now();requestId=crypto.randomUUID();clearErrors();document.getElementById('name').focus();});
