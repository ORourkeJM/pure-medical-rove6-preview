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
    document.querySelectorAll('[data-florida-label]').forEach(label=>{label.textContent=label.dataset.floridaLabel;});
    const logo=document.querySelector('.brand img');logo.src='./assets/logo-florida-coral-teal.png';logo.width=800;logo.height=422;
    const text=(selector,value)=>{const el=document.querySelector(selector);if(el)el.textContent=value;};
    text('.hero-copy .eyebrow','INOGEN ROVE 6 · FLORIDA LIVING');
    document.getElementById('hero-title').innerHTML='More freedom for<br><em>Florida living.</em>';
    text('.hero-description','Palm-lined mornings. A ride through the neighborhood. A little time by the water. Explore portable oxygen for the South Florida life you enjoy.');
    const hero=document.querySelector('.hero-photo');
    hero.src='./assets/florida-golf-cart-product.webp';hero.alt='An older woman with an Inogen Rove 6 riding in a golf cart with her partner in South Florida';hero.width=1024;hero.height=1280;
    text('.photo-caption','Room for your Florida plans.');
    text('.hero-bottom>span:first-child','MORE TO LOOK FORWARD TO. MORE PLANS TO EXPLORE.');
    text('.everyday .eyebrow','YOUR FLORIDA CHAPTER');
    document.getElementById('everyday-title').innerHTML='Your Florida days.<br>More possibilities.';
    text('.everyday .section-heading>p:last-child','Florida living can mean mornings outdoors, neighborhood outings, and time with family. If you use oxygen at home, explore whether the Rove 6 fits your prescription and plans with your clinician.');
    const moments=[
      {title:'Around the neighborhood.',copy:'Palm-lined streets, familiar faces, and a coffee stop. Explore a portable oxygen option for your everyday plans.',image:'florida-golf-cart-product.webp',alt:'A retired woman with an Inogen Rove 6 on a golf-cart outing with her partner'},
      {title:'Along the shoreline.',copy:'Sea air, a favorite stretch of sand, and time together. Talk with your clinician about an oxygen option for your plans.',image:'florida-beach-walk-product.webp',alt:'An older woman carrying an Inogen Rove 6 in its bag during a beach walk with her partner'},
      {title:'Out on the water.',copy:'A day offshore with good company. Discuss your plans with your clinician, and ask our team about portable oxygen and battery options.',image:'florida-offshore-fishing-product.webp',alt:'A seated older man with an Inogen Rove 6 enjoying an offshore fishing charter'}
    ];
    document.querySelectorAll('.moments article').forEach((article,index)=>{
      const moment=moments[index];
      article.querySelector('h3').textContent=moment.title;article.querySelector('p').textContent=moment.copy;
      const image=article.querySelector('.moment-photo')||document.createElement('img');image.src='./assets/'+moment.image;image.alt=moment.alt;image.loading='lazy';image.width=800;image.height=600;image.className='moment-photo';if(!image.parentElement)article.prepend(image);
    });
  }
  return campaign;
}
