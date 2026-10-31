import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { validateRequest, makePayload, submitRequest, validateOffer, CONSENT_TEXT } from '../validation.js';

const requestId='2847ddf4-6dde-45d8-94f7-7e3fe25bf888';
const values={name:'Sample Request',phone:'(202) 555-0123',email:'sample@example.com',state:'FL',consent:true,website:''};
const endpoint='https://script.google.com/macros/s/example-deployment/exec';
test('validates phone and consent while allowing an optional email',()=>{
  assert.deepEqual(validateRequest({...values,email:''}),{});
  assert.deepEqual(Object.keys(validateRequest({...values,phone:'123',consent:false})),['phone','consent']);
});
test('rejects unconfigured delivery before transmitting contact details',async()=>{
  let called=false;
  await assert.rejects(submitRequest(makePayload(values,requestId,Date.now()-5000),'',async()=>{called=true;}),/not connected/);
  assert.equal(called,false);
});
test('requires an explicit matching server acknowledgement',async()=>{
  const payload=makePayload(values,requestId,Date.now()-5000);
  await assert.rejects(submitRequest(payload,endpoint,async()=>({ok:true,json:async()=>({ok:true,requestId:'wrong'})})),/could not confirm/);
  const result=await submitRequest(payload,endpoint,async(_url,options)=>{
    assert.equal(options.method,'POST');assert.equal(options.credentials,'omit');
    assert.equal(options.headers['Content-Type'],'text/plain;charset=utf-8');
    return {ok:true,json:async()=>({ok:true,requestId})};
  });
  assert.equal(result.requestId,requestId);
});
test('retains server failure rather than displaying a success',async()=>{
  await assert.rejects(submitRequest(makePayload(values,requestId,Date.now()-5000),endpoint,async()=>({ok:true,json:async()=>({ok:false,message:'Unable to save your request.'})})),/Unable to save/);
});
test('network failures do not produce a save acknowledgement',async()=>{
  await assert.rejects(submitRequest(makePayload(values,requestId,Date.now()-5000),endpoint,async()=>{throw new TypeError('Failed to fetch');}),/could not confirm/);
});

const source=await fs.readFile(new URL('../backend/Code.template.gs',import.meta.url),'utf8');
function server(offer){
  const records=[['Submitted at','Request ID','Name','Phone','Email','State','Contact preference','Contact consent','Status','Team notes']];
  let flushed=0;const properties=new Map([['SPREADSHEET_ID','test-sheet']]);const cache=new Map();
  if(offer)properties.set('ROVE6_OFFER_JSON',JSON.stringify(offer));
  const sheet={
    getLastRow:()=>records.length,
    getRange:(row,col,rows=1,cols=1)=>({
      getValues:()=>records.slice(row-1,row-1+rows).map(r=>r.slice(col-1,col-1+cols)),
      setNumberFormat:()=>{},
      setValues:(rs)=>{for(let i=0;i<rs.length;i++)records[row-1+i]=rs[i];},
      createTextFinder:(v)=>({matchEntireCell:()=>({findNext:()=>records.slice(1).find(r=>r[1]===v)||null})})
    })
  };
  const context={Date,JSON,Error,String,Array,console,
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k),setProperty:(k,v)=>properties.set(k,v)})},
    SpreadsheetApp:{openById:id=>{assert.equal(id,'test-sheet');return{getSheetByName:()=>sheet};},flush:()=>{flushed++;}},
    CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},
    Utilities:{DigestAlgorithm:{SHA_256:'SHA256'},computeDigest:(_a,v)=>v,base64EncodeWebSafe:v=>v},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:t=>({setMimeType:()=>t})}
  };
  vm.createContext(context);vm.runInContext(source,context);
  const post=p=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(p)}}));
  return{post,records,context,get flushed(){return flushed;}};
}
test('receiver persists once and acknowledges repeated request IDs without duplicate leads',()=>{
  const s=server();const p=makePayload(values,requestId,Date.now()-5000);
  assert.equal(s.post(p).ok,true);assert.equal(s.records.length,2);assert.equal(s.flushed,1);
  assert.equal(s.records[1][2],values.name);assert.equal(s.records[1][3],'2025550123');
  assert.equal(s.records[1][7],CONSENT_TEXT);assert.equal(s.records[1][8],'New');
  assert.equal(s.post(p).ok,true);assert.equal(s.records.length,2);
});
test('receiver validates independently and escapes spreadsheet formulas',()=>{
  const s=server();const p=makePayload(values,requestId,Date.now()-5000);
  assert.equal(s.post({...p,consent:false}).ok,false);assert.equal(s.records.length,1);
  assert.equal(s.post({...p,website:'bot'}).ok,false);assert.equal(s.records.length,1);
  assert.equal(s.post({...p,state:'ZZ'}).ok,false);assert.equal(s.records.length,1);
  assert.equal(s.post({...p,name:'=HYPERLINK("https://example.com")'}).ok,true);
  assert.ok(s.records[1][2].startsWith("'="));
});
const sampleOffer={amountMinor:12345,currency:'USD',title:'Sample package',checkoutUrl:'https://payments-na1.hubspot.com/payments/sample-link'};
test('private offer is available only with a saved request, including an idempotent retry',()=>{
  const s=server(sampleOffer);const p=makePayload(values,requestId,Date.now()-5000);
  assert.equal(JSON.parse(s.context.doGet()).offer,undefined);
  assert.equal(s.post({...p,consent:false}).offer,undefined);
  assert.deepEqual(s.post(p).offer,sampleOffer);assert.equal(s.flushed,1);
  assert.deepEqual(s.post(p).offer,sampleOffer);assert.equal(s.records.length,2);
});
test('missing or malformed offer keeps the saved request and gives no checkout URL',()=>{
  for(const offer of [undefined,{...sampleOffer,checkoutUrl:'https://example.com/pay'},{...sampleOffer,amountMinor:-1}]){
    const s=server(offer);const result=s.post(makePayload(values,requestId,Date.now()-5000));
    assert.equal(result.ok,true);assert.equal(result.offer,null);assert.equal(s.records.length,2);
  }
});
test('browser accepts only a valid USD offer with a trusted HubSpot payment URL',()=>{
  assert.deepEqual(validateOffer(sampleOffer),sampleOffer);
  for(const offer of [null,{...sampleOffer,currency:'EUR'},{...sampleOffer,amountMinor:0},{...sampleOffer,checkoutUrl:'javascript:alert(1)'},{...sampleOffer,checkoutUrl:'https://payments-na1.hubspot.com.evil.example/payments/sample'},{...sampleOffer,checkoutUrl:'https://user:password@payments-na1.hubspot.com/payments/sample'},{...sampleOffer,checkoutUrl:'https://payments-na1.hubspot.com/payments/purchase/session-only'}])assert.equal(validateOffer(offer),null);
});
