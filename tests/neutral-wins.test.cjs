const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const fixture=fs.readFileSync(path.join(__dirname,'new-roles.test.cjs'),'utf8').split('const messages =')[0];
const game=new Function('require','__dirname',fixture+'\nreturn game;')(require,__dirname);
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');

function localVotes(c){
  const start=html.indexOf('    function resolveDay(');
  vm.runInContext(html.slice(start,html.indexOf('\n    function ',start+1)),c);
  const nodes={};c.$=id=>nodes[id] ||= {};
  c.endGame=result=>{c.winner=result;c.state.phase='gameover';};
}

for(const neutral of ['framer','gambler','serial_killer','leader','persuader']){
  for(const autoSideWinChecks of [true,false]){
    for(const mode of ['offline','online']){
      test(`${mode}: each allegiance can win from Good/${neutral}/Evil with side wins ${autoSideWinChecks}`,async()=>{
        for(const [eliminated,winner] of [[2,'Good'],[0,neutral==='serial_killer'?'Serial Killer':neutral[0].toUpperCase()+neutral.slice(1)],[1,'Evil']]){
          const c=game(['detective',neutral,'mafia']);
          c.state.phase='day';c.state.autoSideWinChecks=autoSideWinChecks;
          assert.equal(c.checkWin().done,false);
          c.state.day.votes=Object.fromEntries(c.state.players.map(p=>[p.id,p.id===eliminated?(eliminated+1)%3:eliminated]));
          if(mode==='offline'){localVotes(c);c.resolveDay();}else await c.resolveOnlineDay();
          assert.equal(c.state.phase,'gameover');
          assert.equal(c.playerOf(eliminated).alive,false);
          assert.equal(c.winner.winner,winner);
          assert.equal(c.winner.personalWinners,undefined);
        }
      });
    }
  }
}

test('Neutral wins the whole game against Evil and alone, without a shared survival reward',()=>{
  for(const ids of [['framer','mafia'],['gambler'],['leader','persuader']]){
    const c=game(ids),result=c.checkWin();
    assert.equal(result.done,true);
    assert.equal(result.winner,ids.map(id=>c.state.roles.find(r=>r.id===id)).filter(r=>r.orientation==='neutral').map(r=>r.title).join(' & '));
    assert.equal(result.personalWinners,undefined);
  }
});

test('dead and removed Neutrals cannot take a final-two victory',()=>{
  for(const removed of [true,false]){
    const c=game(['detective','gambler','mafia']);
    if(removed)c.playerOf(1).removed=true;else c.playerOf(1).alive=false;
    assert.equal(c.checkWin().winner,'Evil');
  }
});

test('Neutrals keep larger no-Evil and no-Good games open until a win condition is met',()=>{
  for(const autoSideWinChecks of [true,false]){
    for(const ids of [['detective','gambler','leader'],['mafia','gambler','leader'],['gambler','leader','framer']]){
      const c=game(ids);c.state.autoSideWinChecks=autoSideWinChecks;
      assert.equal(c.checkWin().done,false);
    }
  }
});

test('ordinary side wins remain optional above two players',()=>{
  for(const [ids,winner] of [[['detective','citizen','bodyguard'],'Good'],[['mafia','mafia','gambler'],'Evil']]){
    const c=game(ids);c.state.autoSideWinChecks=true;
    assert.equal(c.checkWin().winner,winner);
    c.state.autoSideWinChecks=false;
    assert.equal(c.checkWin().done,false);
  }
});

test('Jester cannot claim a final-two survival victory, but voting Jester out still wins immediately',async()=>{
  for(const [ids,winner] of [[['jester','mafia'],'Evil'],[['jester','citizen'],'Good'],[['jester'],'Nobody'],[['jester','framer'],'Framer']]){
    const c=game(ids);assert.equal(c.checkWin().winner,winner);
  }
  const c=game(['detective','jester','mafia']);c.state.phase='day';
  c.state.day.votes={0:1,1:2,2:1};await c.resolveOnlineDay();
  assert.equal(c.winner.winner,'Jester');
});

test('Hater and Undercover retain precedence over the circular final-two matchups',async()=>{
  const c=game(['detective','gambler','hater']);c.state.phase='day';
  c.playerOf(2).haterTargetId=0;c.state.day.votes={0:2,1:0,2:0};
  await c.resolveOnlineDay();assert.equal(c.winner.winner,'Evil');
  assert.equal(game(['undercover','mafia']).checkWin().winner,'Good');
});

test('temporary fake deaths still count as players and true allegiance determines final-two results',()=>{
  const c=game(['detective','gambler','mafia']);
  c.playerOf(0).alive=false;c.playerOf(0).fakeDeathReturnRound=2;
  assert.equal(c.checkWin().done,false);
  delete c.playerOf(0).fakeDeathReturnRound;
  c.playerOf(1).framedRoleId='citizen';
  assert.equal(c.checkWin().winner,'Gambler');
  c.playerOf(1).roleOverrides={orientation:'good'};
  assert.equal(c.checkWin().winner,'Evil');
});
