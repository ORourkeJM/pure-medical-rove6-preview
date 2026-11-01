const SOURCES=new Set(['google','flibs','linkedin','marine_publisher','licensed_geo','perplexity','gemini']);
const MEDIA=new Set(['cpc','paid_social','display','sponsorship','email','referral','organic','qr']);
const CAMPAIGNS=new Set(['marine_fll_launch_2026','marine_flibs_2026','marine_palm_beach_2026','marine_miami_2026']);
export function validMeasurementId(value){return /^G-[A-Z0-9]{6,20}$/.test(value||'');}
export function publicPagePayload(href,referrer=''){
  const url=new URL(href);const payload={page_location:url.origin+url.pathname,page_title:'Pure Medical Marine — Public campaign',page_referrer:''};
  try{payload.page_referrer=new URL(referrer).origin;}catch{}
  for(const[key,field,allowed]of [['utm_source','campaign_source',SOURCES],['utm_medium','campaign_medium',MEDIA],['utm_campaign','campaign_name',CAMPAIGNS]]){
    const value=url.searchParams.get(key);if(allowed.has(value))payload[field]=value;
  }
  return payload;
}
export function createMeasurementGate({measurementId,load,emit,disable}){
  let granted=false,loaded=false;
  return{
    setConsent(value){granted=value===true&&validMeasurementId(measurementId);if(granted&&!loaded){load();loaded=true;}if(!granted&&loaded)disable();return granted;},
    pageView(payload){if(granted){emit('page_view',payload);return true;}return false;}
  };
}
