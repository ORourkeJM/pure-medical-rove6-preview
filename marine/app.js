import{DEMO_KEY,validateMarine,marineRecord,readMarine}from'./reservation.js';
const form=document.getElementById('marine-form');
const ids={name:'management-name',email:'management-email',phone:'management-phone',role:'contact-role',flag:'vessel-flag',operation:'vessel-use',kitQuantity:'kit-quantity',consent:'contact-consent'};
const month=document.getElementById('delivery-month');month.min=new Date().toISOString().slice(0,7);
try{const saved=readMarine(sessionStorage);if(saved)for(const key of ['name','email','phone','role','company','vessel','specification','flag','operation','kitQuantity','deliveryMonth']){const control=form.elements.namedItem(key);if(control)control.value=saved[key]||'';}if(saved)document.getElementById('professional-crew').checked=saved.professionalCrew===true;}catch{}
form.addEventListener('submit',event=>{
  event.preventDefault();
  for(const name of Object.keys(ids)){document.getElementById(name+'-error').textContent='';document.getElementById(ids[name]).removeAttribute('aria-invalid');}
  const values={...Object.fromEntries(new FormData(form)),consent:document.getElementById('contact-consent').checked,professionalCrew:document.getElementById('professional-crew').checked};
  const errors=validateMarine(values);
  if(Object.keys(errors).length){for(const[key,message]of Object.entries(errors)){document.getElementById(key+'-error').textContent=message;document.getElementById(ids[key]).setAttribute('aria-invalid','true');}document.getElementById(ids[Object.keys(errors)[0]]).focus();return;}
  try{sessionStorage.setItem(DEMO_KEY,JSON.stringify(marineRecord(values)));location.href='./checkout.html';}
  catch{document.getElementById('form-error').textContent='Enable this tab’s browser storage to continue through the client preview.';}
});
