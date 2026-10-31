import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutUrlWithEmail} from '../checkout.js';
const base='https://payments-na1.hubspot.com/payments/example-link?referrer=PAYMENT_LINK';
test('checkout carries only the verified email field and preserves plus-addressing',()=>{
  const result=checkoutUrlWithEmail(base,' person+offer@example.com ');
  const url=new URL(result);
  assert.equal(url.searchParams.get('email'),'person+offer@example.com');
  assert.equal(url.searchParams.get('referrer'),'PAYMENT_LINK');
  assert.deepEqual([...url.searchParams.keys()],['referrer','email']);
});
test('checkout never sends email to an untrusted or session-only destination',()=>{
  for(const url of ['https://payments-na1.hubspot.com.evil.example/payments/example','http://payments-na1.hubspot.com/payments/example','https://user:password@payments-na1.hubspot.com/payments/example','https://payments-na1.hubspot.com/payments/purchase/session','javascript:alert(1)'])assert.equal(checkoutUrlWithEmail(url,'person@example.com'),null);
});
test('missing or malformed email keeps checkout available without prefill',()=>{
  for(const email of [undefined,'','invalid','person@example.com\r\nInjected',{},'x'.repeat(255)+'@example.com'])assert.equal(new URL(checkoutUrlWithEmail(base,email)).searchParams.has('email'),false);
  assert.equal(new URL(checkoutUrlWithEmail(base+'&email=previous@example.com','')).searchParams.has('email'),false);
});
