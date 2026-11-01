export const DEMO_KEY='puremedical:marine-reservation-demo:v1';
export const DEPOSIT_MINOR=250000;
export const ROLES=['Captain','Yacht manager','Management staff','Procurement representative','Other authorized representative'];
export const FLAGS=['United States','Bahamas','Cayman Islands','British / other Red Ensign flag','Other flag','To be confirmed'];
export const QUANTITIES=['1 kit','2 kits','3 kits','4+ kits','To be confirmed'];
export const OPERATIONS=['Private use','Commercial charter','Mixed / dual use','To be confirmed'];
export function validateMarine(values){
  const errors={};
  if(!values.name||values.name.trim().length<2||values.name.length>100)errors.name='Enter the management contact’s name.';
  if(!values.email||values.email.length>254||!/^\S+@\S+\.\S+$/.test(values.email))errors.email='Enter a valid email address.';
  if(!values.phone||values.phone.replace(/\D/g,'').length<7||values.phone.replace(/\D/g,'').length>15)errors.phone='Enter a valid contact phone number.';
  if(!ROLES.includes(values.role))errors.role='Select the contact’s role.';
  if(!FLAGS.includes(values.flag))errors.flag='Select the vessel flag.';
  if(!OPERATIONS.includes(values.operation))errors.operation='Select the vessel operation.';
  if(!QUANTITIES.includes(values.kitQuantity))errors.kitQuantity='Select the kit quantity being considered.';
  if(values.consent!==true)errors.consent='Confirm contact permission.';
  return errors;
}
export function marineRecord(values){
  const record={demo:true,status:'awaiting_demo_deposit',depositMinor:DEPOSIT_MINOR};
  for(const key of ['name','email','phone','role','company','vessel','specification','flag','operation','kitQuantity','deliveryMonth'])record[key]=String(values[key]||'').trim();
  record.professionalCrew=values.professionalCrew===true;record.consent=values.consent===true;
  return record;
}
export function readMarine(storage){try{const value=JSON.parse(storage.getItem(DEMO_KEY));return value?.demo===true&&value.depositMinor===DEPOSIT_MINOR?value:null;}catch{return null;}}
