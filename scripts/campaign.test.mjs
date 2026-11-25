import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCampaign} from '../campaign.js';
test('all entry URLs use Florida, including retired national and control links',()=>{
  for(const search of ['', '?market=florida', '?variant=standard', '?market=national', '?market=florida&variant=standard', '?utm_campaign=rove6_national']){
    assert.deepEqual(selectCampaign(search),{market:'florida',variant:'florida'},search);
  }
});
test('old assignments and unavailable storage cannot change the campaign',()=>{
  for(const stored of ['standard','florida',null]){
    assert.deepEqual(selectCampaign('',{getItem:()=>stored},()=>0),{market:'florida',variant:'florida'});
  }
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.deepEqual(selectCampaign('',blocked),{market:'florida',variant:'florida'});
  assert.ok(Object.isFrozen(selectCampaign()));
});
