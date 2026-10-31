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
    text('.hero-description','Palm-lined mornings. A ride through the neighborhood. A little time by the water. Explore portable oxygen for the South Florida life you enjoy.');
    const hero=document.querySelector('.hero-photo');
    hero.src='./assets/florida-golf-cart.webp';hero.alt='An older couple enjoying a golf-cart ride through a palm-lined South Florida retirement community';hero.width=1024;hero.height=1280;
    text('.photo-caption','Room for your Florida plans.');
    text('.hero-bottom>span:first-child','MORE TO LOOK FORWARD TO. MORE PLANS TO EXPLORE.');
    text('.everyday .eyebrow','YOUR FLORIDA CHAPTER');
    document.getElementById('everyday-title').innerHTML='Your Florida days.<br>More possibilities.';
    text('.everyday .section-heading>p:last-child','Florida living can mean mornings outdoors, neighborhood outings, and time with family. If you use oxygen at home, explore whether the Rove 6 fits your prescription and plans with your clinician.');
    const moments=[
      {title:'Around the neighborhood.',copy:'Palm-lined streets, familiar faces, and a coffee stop. Explore a portable oxygen option for your everyday plans.',image:'florida-golf-cart.webp',alt:'A retired couple riding in a golf cart through a tropical residential community'},
      {title:'Along the shoreline.',copy:'Sea air, a favorite stretch of sand, and time together. Talk with your clinician about an oxygen option for your plans.',image:'florida-beach-walk.webp',alt:'An older couple walking beside calm turquoise water on a South Florida beach'},
      {title:'Out on the water.',copy:'A day offshore with good company. Discuss your plans with your clinician, and ask our team about portable oxygen and battery options.',image:'florida-offshore-fishing.webp',alt:'Older adults enjoying a calm offshore fishing charter in the Atlantic'}
    ];
    document.querySelectorAll('.moments article').forEach((article,index)=>{
      const moment=moments[index];
      article.querySelector('h3').textContent=moment.title;article.querySelector('p').textContent=moment.copy;
      const image=document.createElement('img');image.src='./assets/'+moment.image;image.alt=moment.alt;image.loading='lazy';image.width=800;image.height=600;image.className='moment-photo';article.prepend(image);
    });
  }
  return campaign;
}
