// Florida is the sole Rove 6 campaign. Legacy URLs and stored experiment
// assignments must never bring back the retired national/control design.
const campaign=Object.freeze({market:'florida',variant:'florida'});
export function selectCampaign(){return campaign;}
export function applyCampaignTheme(){
  document.documentElement.dataset.theme='florida';
  return campaign;
}
