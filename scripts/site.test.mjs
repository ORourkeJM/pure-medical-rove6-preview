import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const app=await fs.readFile(new URL('../app.js',import.meta.url),'utf8');
test('client review uses the completed offer screen without simulated confirmation copy',()=>{
  for(const text of ['PREVIEW COMPLETE','Your form test is complete','No request was sent or stored','Shared privately','preview-checkout','__PREVIEW_HIDDEN__'])assert.ok(!(html+app).includes(text),text);
  assert.ok(app.includes('await submitRequest(payload,config.requestEndpoint)'));
  assert.ok(html.includes('Your Rove 6 offer is ready.'));
  assert.ok(html.includes('Secure payment through HubSpot'));
  assert.ok(html.includes('Are you on Medicare and currently using oxygen?'));
  assert.ok(html.includes('Your exclusive end-of-season price'));
  assert.ok(html.includes('id="offer-timer" hidden'));
});
test('contains crawlable product content and a gated offer layout without price or checkout URL',()=>{
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes('Prescription required before fulfillment'));
  assert.ok(html.includes('Direct purchase'));
  assert.ok(!/payments-na|checkoutUrl|\$\s*\d|"offers"\s*:|"price"\s*:/i.test(html));
  const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.ok(ld['@graph'].some(x=>x['@type']==='Product'));
  assert.ok(html.includes('id="private-offer" hidden'));
  assert.ok(!html.includes('There is no online checkout'));
});
test('all local navigation targets exist and form controls have labels',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(match[1]),match[1]);
  for(const id of ['name','phone','email','state','consent'])assert.ok(html.includes(`for="${id}"`));
  assert.ok(html.includes('role="alert"'));assert.ok(html.includes('noscript'));
});

test('email and explicit contact permission are required and consent is not preselected',()=>{
  assert.match(html,/<input[^>]*id="email"[^>]*required/);
  const consent=html.match(/<input[^>]*id="consent"[^>]*>/)[0];
  assert.ok(consent.includes('required'));assert.ok(!consent.includes('checked'));
  assert.ok(html.includes('may call, text, or email me'));
});
