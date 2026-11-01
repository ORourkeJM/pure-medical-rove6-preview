import{analyticsConfig}from'./analytics-config.js';
import{validMeasurementId,publicPagePayload,createMeasurementGate}from'./analytics-core.js';
// Public B2B landing-page measurement only. No form, checkout, contact or payment events.
const {measurementId,enabled}=analyticsConfig;
const CHOICE_KEY='puremedical:marine-analytics-choice:v1';
if(enabled&&validMeasurementId(measurementId)){
  const payload=publicPagePayload(location.href,document.referrer);
  let selected='';try{selected=localStorage.getItem(CHOICE_KEY)||'';}catch{}
  const banner=document.createElement('section');banner.className='analytics-choice';banner.setAttribute('aria-label','Analytics preferences');
  banner.innerHTML='<div><strong>Optional website analytics</strong><p>Allow Google Analytics to measure visits to this public campaign page. Your contact and vessel form details are not sent. <a href="https://puremedco.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy policy</a>.</p></div><div class="analytics-buttons"><button type="button" data-choice="denied">Decline</button><button type="button" data-choice="granted">Allow analytics</button></div>';
  const settings=document.createElement('button');settings.type='button';settings.className='analytics-settings';settings.textContent='Analytics preferences';
  document.querySelector('.footer .wrap').append(settings);document.body.append(banner);
  const gate=createMeasurementGate({measurementId,load(){
    window['ga-disable-'+measurementId]=false;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted'});
    window.gtag('js',new Date());
    window.gtag('config',measurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,...payload});
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;document.head.append(script);
  },emit(event,data){window['ga-disable-'+measurementId]=false;window.gtag('event',event,data);},disable(){window['ga-disable-'+measurementId]=true;}});
  function choose(choice){try{localStorage.setItem(CHOICE_KEY,choice);}catch{}banner.hidden=true;if(gate.setConsent(choice==='granted'))gate.pageView(payload);}
  for(const button of banner.querySelectorAll('[data-choice]'))button.addEventListener('click',()=>choose(button.dataset.choice));
  settings.addEventListener('click',()=>{banner.hidden=false;banner.querySelector('button').focus();});
  if(['granted','denied'].includes(selected))choose(selected);
}
