const VARIANT_KEY='rove6:florida-lifestyle:v1';
export function selectCampaign(search,storage,random=Math.random){
  const params=new URLSearchParams(search);
  const forced=params.get('variant');
  const florida=params.get('market')==='florida'||/florida/i.test(params.get('utm_campaign')||'')||forced==='florida';
  const market=florida?'florida':'national';
  if(forced==='standard'||forced==='florida')return Object.freeze({market,variant:forced});
  if(!florida)return Object.freeze({market,variant:'standard'});
  let variant;
  try{variant=storage?.getItem(VARIANT_KEY);}catch{}
  if(variant!=='standard'&&variant!=='florida'){
    variant=random()<.5?'standard':'florida';
    try{storage?.setItem(VARIANT_KEY,variant);}catch{}
  }
  return Object.freeze({market,variant});
}
export function applyCampaignTheme(){
  let storage;try{storage=window.localStorage;}catch{}
  const campaign=selectCampaign(window.location.search,storage);
  document.documentElement.dataset.theme=campaign.variant;
  if(campaign.variant==='florida'){
    const text=(selector,value)=>{const el=document.querySelector(selector);if(el)el.textContent=value;};
    text('.hero-copy .eyebrow','INOGEN ROVE 6 · FLORIDA LIVING');
    document.getElementById('hero-title').innerHTML='More freedom for<br><em>Florida living.</em>';
    text('.hero-description','Morning coffee outdoors. Family down for a visit. A little time by the water. Explore portable oxygen for the retirement lifestyle you enjoy.');
    text('.photo-caption','Room for your Florida plans.');
    text('.hero-bottom>span:first-child','MORE TO LOOK FORWARD TO. MORE PLANS TO EXPLORE.');
    text('.everyday .eyebrow','YOUR FLORIDA CHAPTER');
    document.getElementById('everyday-title').innerHTML='Your Florida days.<br>More possibilities.';
    text('.everyday .section-heading>p:last-child','Florida living can mean mornings outdoors, neighborhood outings, and time with family. If you use oxygen at home, explore whether the Rove 6 fits your prescription and plans with your clinician.');
    const moments=[['Coffee with friends.','A patio table. A familiar face. Explore a portable oxygen option for the everyday moments you look forward to.'],['Family in town.','Visits with children, grandchildren, and friends. Talk through an oxygen option designed to come along.'],['Plans beyond the porch.','A neighborhood outing or a day away. Ask our team about the Rove 6 and battery options for your plans.']];
    document.querySelectorAll('.moments article').forEach((article,index)=>{article.querySelector('h3').textContent=moments[index][0];article.querySelector('p').textContent=moments[index][1];});
  }
  return campaign;
}
