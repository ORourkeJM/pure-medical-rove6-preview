import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
test('contains crawlable product and prescription content without price or checkout data',()=>{
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes('Prescription required before fulfillment'));
  assert.ok(html.includes('Direct purchase'));
  assert.ok(!/payments-na|checkoutUrl|\$\s*\d|"offers"\s*:|"price"\s*:/i.test(html));
  const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.ok(ld['@graph'].some(x=>x['@type']==='Product'));
});
test('all local navigation targets exist and form controls have labels',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(match[1]),match[1]);
  for(const id of ['name','phone','email','state','consent'])assert.ok(html.includes(`for="${id}"`));
  assert.ok(html.includes('role="alert"'));assert.ok(html.includes('noscript'));
});
