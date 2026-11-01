import{DEMO_KEY,readMarine}from'./reservation.js';
let record;try{record=readMarine(sessionStorage);}catch{}
const show=id=>document.getElementById(id).hidden=false;
const set=(id,value)=>document.getElementById(id).textContent=value;
const prettyMonth=value=>{if(!/^\d{4}-\d{2}$/.test(value||''))return '';const[y,m]=value.split('-').map(Number);return new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));};
function save(){sessionStorage.setItem(DEMO_KEY,JSON.stringify(record));}
function confirmation(){document.getElementById('checkout-view').hidden=true;show('confirmation-view');const month=document.getElementById('shipping-month');month.min=new Date().toISOString().slice(0,7);month.value=record.deliveryMonth||'';document.getElementById('confirmation-view').focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});}
if(!record){show('start-gate');}
else{
  for(const key of ['name','email','phone','company'])set('review-'+key,record[key]||'');
  set('review-vessel',record.vessel||record.specification||'Vessel details for review');set('review-quantity',record.kitQuantity);set('confirmed-contact',record.name+' · '+record.email);set('confirmed-vessel',record.vessel||record.specification||'Vessel details for review');set('confirmed-quantity',record.kitQuantity);set('review-operation',record.operation);set('review-flag',record.flag+' flag');
  if(record.deliveryMonth)set('review-delivery',prettyMonth(record.deliveryMonth)+' · requested');
  if(record.status==='demo_paid')confirmation();else show('checkout-view');
}
document.getElementById('deposit-form').addEventListener('submit',event=>{
  event.preventDefault();if(!record||!event.currentTarget.reportValidity())return;
  // Explicit client-review simulation only. No payment provider or CRM is called.
  record.status='demo_paid';save();confirmation();
});
document.getElementById('delivery-form').addEventListener('submit',event=>{
  event.preventDefault();if(!record||record.status!=='demo_paid'||!event.currentTarget.reportValidity())return;
  record.deliveryMonth=document.getElementById('shipping-month').value;save();set('delivery-status-copy',prettyMonth(record.deliveryMonth)+' is requested. The dispatch window remains subject to team confirmation.');show('delivery-status');
});
document.getElementById('start-over').addEventListener('click',()=>{sessionStorage.removeItem(DEMO_KEY);location.href='./#reserve';});
