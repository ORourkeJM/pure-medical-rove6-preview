import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import{validateMarine,marineRecord,readMarine,DEPOSIT_MINOR}from'../marine/reservation.js';
import{fleetScenario}from'../marine/planner.js';
const values={name:'Sample Management Contact',email:'test@example.com',phone:'+44 20 7946 0123',role:'Captain',flag:'United States',operation:'Private use',kitQuantity:'4+ kits',consent:true};
test('marine intake requires a management contact, valid vessel categories and explicit permission',()=>{
  assert.deepEqual(validateMarine(values),{});
  for(const key of ['name','email','phone','role','flag','operation','kitQuantity'])assert.ok(validateMarine({...values,[key]:''})[key]);
  assert.ok(validateMarine({...values,consent:false}).consent);
});
test('marine draft retains only approved management and vessel fields and begins unpaid',()=>{
  const item=marineRecord({...values,depositMinor:1,status:'paid',personalIdentifier:'discard',cardNumber:'discard'});
  assert.equal(item.depositMinor,250000);assert.equal(item.status,'awaiting_demo_deposit');assert.equal(item.demo,true);
  assert.equal(item.cardNumber,undefined);assert.equal(item.personalIdentifier,undefined);
});
test('marine preview handles missing, malformed or non-demo saved data',()=>{
  for(const value of [null,'bad JSON',JSON.stringify({demo:false,depositMinor:DEPOSIT_MINOR})])assert.equal(readMarine({getItem:()=>value}),null);
  assert.equal(readMarine({getItem:()=>{throw Error('blocked');}}),null);
  assert.equal(readMarine({getItem:()=>JSON.stringify(marineRecord(values))}).demo,true);
});
test('fleet deposits scale by vessels and never by requested kit quantity',()=>{
  assert.equal(fleetScenario(4,2).depositMinor,1000000);
  assert.equal(fleetScenario(8,4).depositMinor,2000000);
  assert.equal(fleetScenario(1,8).depositMinor,250000);
  assert.equal(fleetScenario(4,2).requestedKits,8);
  for(const [v,k]of [[0,1],[21,1],[1.5,1],[1,0],[1,99],['bad',1]])assert.throws(()=>fleetScenario(v,k),RangeError);
});
test('marine checkout is explicitly simulated and contains no payment or CRM network calls',async()=>{
  const html=await fs.readFile(new URL('../marine/checkout.html',import.meta.url),'utf8');
  const js=await fs.readFile(new URL('../marine/checkout.js',import.meta.url),'utf8');
  assert.ok(html.includes('No card details collected and no funds charged'));
  assert.ok(html.includes('DEMO DEPOSIT CONFIRMED'));
  assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|Stripe\s*\(/.test(js));
  assert.ok(!/<input[^>]+(?:cc-number|card-number)/.test(html));
});
test('marine pages contain no vessel-identity disclosure requests beyond the agreed intake',async()=>{
  for(const file of ['index.html','checkout.html']){
    const html=await fs.readFile(new URL('../marine/'+file,import.meta.url),'utf8');
    assert.ok(!/ownership|beneficial|\bowner\b|Rove 6|Medicare/i.test(html));
    assert.ok(html.includes('noindex,nofollow'));
  }
});
