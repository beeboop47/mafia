const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fixture=fs.readFileSync(require('node:path').join(__dirname,'new-roles.test.cjs'),'utf8').split('const messages =')[0];
const game=new Function('require','__dirname',fixture+'\nreturn game;')(require,__dirname);
for(const role of ['gambler','serial_killer','leader','persuader'])test(`Detective and ${role} both win after their two votes eliminate Hater`,async()=>{
  const c=game(['detective',role,'hater']);c.state.phase='day';c.playerOf(2).haterTargetId=0;c.state.day.votes={0:2,1:2,2:0};
  await c.resolveOnlineDay();assert.equal(c.playerOf(2).alive,false);assert.equal(c.winner.winner,'Good');
  assert.deepEqual(Array.from(c.winner.personalWinners,p=>p.id),[1]);assert.equal(c.winner.personalWinners[0].role,c.roleOf(c.playerOf(1)).title);
});
test('a surviving Neutral also wins personally alongside Evil, without taking the faction result',async()=>{
  const c=game(['detective','gambler','hater']);c.state.phase='day';c.playerOf(2).haterTargetId=0;c.state.day.votes={0:2,1:0,2:0};
  await c.resolveOnlineDay();assert.equal(c.winner.winner,'Evil');assert.deepEqual(Array.from(c.winner.personalWinners,p=>p.id),[1]);
});
test('dead and removed Neutrals do not receive survival victories',()=>{
  const c=game(['detective','gambler','leader','hater']);c.state.autoSideWinChecks=true;
  c.playerOf(1).alive=false;c.playerOf(2).removed=true;c.playerOf(3).alive=false;
  assert.equal(c.checkWin().winner,'Good');assert.equal(c.checkWin().personalWinners.length,0);
});
test('surviving Jester does not win through survival; being voted out retains its special win',async()=>{
  const c=game(['detective','jester','hater']);c.state.phase='day';c.playerOf(2).haterTargetId=0;c.state.day.votes={0:2,1:2,2:0};
  await c.resolveOnlineDay();assert.equal(c.winner.winner,'Good');assert.equal(c.winner.personalWinners.length,0);
  const d=game(['detective','jester','hater']);d.state.phase='day';d.playerOf(2).haterTargetId=0;d.state.day.votes={0:1,1:2,2:1};
  await d.resolveOnlineDay();assert.equal(d.winner.winner,'Jester');assert.equal(d.winner.personalWinners.length,0);
});
test('Neutrals do not hold a faction game open after all opponents are gone',()=>{
  const good=game(['detective','gambler','leader','persuader']);good.state.autoSideWinChecks=true;
  assert.equal(good.checkWin().winner,'Good');assert.equal(good.checkWin().personalWinners.length,3);
  const evil=game(['mafia','gambler','leader','persuader']);evil.state.autoSideWinChecks=true;
  assert.equal(evil.checkWin().winner,'Evil');assert.equal(evil.checkWin().personalWinners.length,3);
});
test('only Neutrals remaining produces personal wins without a Neutral faction winner',()=>{
  const c=game(['gambler','leader']);const result=c.checkWin();assert.equal(result.winner,'Nobody');assert.equal(result.personalWinners.length,2);
});
