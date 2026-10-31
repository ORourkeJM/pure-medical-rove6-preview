import test from 'node:test';
import assert from 'node:assert/strict';
import {coverageMessage,countdownParts,remainingHold} from '../flow.js';
test('coverage copy explains covered options and the separate direct purchase without denying benefits',()=>{
  for(const answer of ['yes','no','unsure']){
    const message=coverageMessage(answer);assert.ok(message.body.includes('direct purchase'));
    assert.ok(!/will not cover|never covers|ineligible/i.test(message.body));
  }
  assert.ok(coverageMessage('yes').body.includes('may include portable equipment'));
});
test('countdown uses a fixed server deadline with elapsed monotonic time',()=>{
  assert.deepEqual(countdownParts(86400000),{hours:'24',minutes:'00',seconds:'00'});
  assert.deepEqual(countdownParts(-1),{hours:'00',minutes:'00',seconds:'00'});
  assert.equal(remainingHold(100000,50000,100,10100),40000);
  assert.equal(remainingHold(100000,50000,100,60100),0);
});
