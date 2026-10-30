const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('online timeline excludes host actions and preserves subsequent gameplay',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const custom=fs.readFileSync(path.join(__dirname,'../customisation.js'),'utf8');
  const c=vm.createContext({state:{phase:'day',round:2},online:{},onlinePublicSnapshot:()=>({})});
  vm.runInContext(html.match(/    function hostPanelAction\(action\) \{[\s\S]*?\n    \}/)[0],c);
  vm.runInContext(custom.match(/function recordTimelineEvent\([\s\S]*?\n\}/)[0],c);
  vm.runInContext(custom.split('\n').find(line=>line.includes('const originalSnapshot=onlinePublicSnapshot;')),c);
  c.hostPanelAction(()=>c.recordTimelineEvent('Host killed Alex',[0]));
  assert.equal(c.state.timelineSource,undefined);
  assert.throws(()=>c.hostPanelAction(()=>{throw new Error('failed');}),/failed/);
  assert.equal(c.state.timelineSource,undefined);
  c.recordTimelineEvent('Players voted out Blair',[1]);
  c.state.phase='gameover';
  assert.equal(c.state.timeline.length,2);
  const pub=c.onlinePublicSnapshot();
  assert.equal(pub.timeline.length,1);
  assert.equal(pub.timeline[0].text,'Players voted out Blair');
});
