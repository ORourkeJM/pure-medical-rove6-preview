import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCampaign} from '../campaign.js';
function memory(){const values=new Map();return{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};}
test('national traffic stays on the standard design',()=>{
  assert.deepEqual(selectCampaign('?utm_campaign=rove6_national',memory(),()=>.9),{market:'national',variant:'standard'});
});
test('Florida campaign traffic is split and keeps its assigned version',()=>{
  const storage=memory();
  assert.deepEqual(selectCampaign('?market=florida',storage,()=>.8),{market:'florida',variant:'florida'});
  assert.deepEqual(selectCampaign('?utm_campaign=Rove6_Florida_Search',storage,()=>.1),{market:'florida',variant:'florida'});
  assert.deepEqual(selectCampaign('?market=florida',memory(),()=>.1),{market:'florida',variant:'standard'});
});
test('review links force either variant without changing the experiment assignment',()=>{
  const storage=memory();selectCampaign('?market=florida',storage,()=>.1);
  assert.deepEqual(selectCampaign('?market=florida&variant=florida',storage),{market:'florida',variant:'florida'});
  assert.deepEqual(selectCampaign('?market=florida',storage),{market:'florida',variant:'standard'});
  assert.deepEqual(selectCampaign('?market=florida&variant=standard',memory()),{market:'florida',variant:'standard'});
});
test('blocked browser storage does not prevent a Florida page from opening',()=>{
  const storage={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};
  assert.deepEqual(selectCampaign('?market=florida',storage,()=>.8),{market:'florida',variant:'florida'});
});
