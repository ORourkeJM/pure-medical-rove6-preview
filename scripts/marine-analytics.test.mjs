import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs/promises';
import{createMeasurementGate,publicPagePayload}from'../marine/analytics-core.js';
test('marine analytics sends nothing before explicit consent or for a missing client ID',()=>{
  const calls=[];const options={load:()=>calls.push('load'),emit:()=>calls.push('event'),disable:()=>calls.push('disable')};
  const gate=createMeasurementGate({...options,measurementId:'G-ABC1234567'});
  assert.equal(gate.pageView({}),false);gate.setConsent(false);assert.deepEqual(calls,[]);
  gate.setConsent(true);gate.pageView({});assert.deepEqual(calls,['load','event']);gate.setConsent(false);assert.equal(gate.pageView({}),false);assert.equal(calls.at(-1),'disable');
  const missing=createMeasurementGate({...options,measurementId:''});assert.equal(missing.setConsent(true),false);
});
test('analytics strips URL queries, fragments, referrer paths and non-allowlisted campaign values',()=>{
  const p=publicPagePayload('https://example.com/marine/?email=person@example.com&vessel=private&lat=26.1&utm_source=flibs&utm_campaign=marine_flibs_2026#private','https://referrer.example/private/contact?phone=2025550146');
  assert.equal(p.page_location,'https://example.com/marine/');assert.equal(p.page_referrer,'https://referrer.example');assert.equal(p.campaign_source,'flibs');
  assert.ok(!JSON.stringify(p).includes('person@example.com'));assert.ok(!JSON.stringify(p).includes('26.1'));
  assert.equal(publicPagePayload('https://example.com/marine/?utm_source=personname').campaign_source,undefined);
});
test('marine checkout and strategy pages do not load public-page analytics',async()=>{
  for(const name of ['checkout.html','opportunity.html'])assert.ok(!(await fs.readFile(new URL('../marine/'+name,import.meta.url),'utf8')).includes('src="./analytics.js"'));
  const js=await fs.readFile(new URL('../marine/analytics.js',import.meta.url),'utf8');assert.ok(!/FormData|querySelectorAll\(['"]input|geolocation|purchase|generate_lead/.test(js));
});
