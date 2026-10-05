const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function game() {
  const context = vm.createContext({ state: {mode:'manual', round:1, players:[], roles:[]},
    alert: () => {},
    randomChoice: list => list[0], shuffle: list => [...list],
    gamblerAbilityPool: () => ['seer', 'kill', 'protect'],
    roleOf: p => context.state.roles.find(r => r.id === p?.roleId),
    roleHasSpecialId: (r, id) => r?.id === id,
    playerOf: id => context.state.players.find(p => p.id === Number(id)),
    investigationSubject: p => p,
    isPassiveAbility: action => action === 'seer',
    extraNotice: () => {},
    normalizedWinCondition: role => role?.winCondition || 'none',
    setPlayerAlive: (p, alive) => {p.alive = alive;},
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'judge.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'signal-receiver.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'host-setup.js'), 'utf8'), context);
  for (const name of ['assignRoles', 'ensurePolicemanIntel', 'visibleTo', 'resolveLimitedInvestigations', 'checkWin', 'trackReport']) {
    const start = html.indexOf(`    function ${name}(`);
    const end = html.indexOf('\n    function ', start + 1);
    vm.runInContext(html.slice(start, end), context);
  }
  return context;
}

test('surviving neutrals win at the final two regardless of opponent or side-win setting', () => {
  for (const id of ['persuader', 'serial_killer', 'framer', 'gambler', 'leader']) {
    for (const orientation of ['good', 'evil', 'neutral']) {
      for (const autoSideWinChecks of [true, false]) {
        const c = game();
        c.state.autoSideWinChecks = autoSideWinChecks;
        c.state.roles = [{id, title:id, orientation:'neutral'}, {id:'opponent', title:'Opponent', orientation, winCondition:orientation === 'neutral' ? 'votedOut' : 'none'}];
        c.state.players = [{id:0, name:'Survivor', roleId:id, alive:true}, {id:1, name:'Opponent', roleId:'opponent', alive:true}];
        assert.equal(c.checkWin().winner, id);
        c.state.players[1].alive = false;
        assert.equal(c.checkWin().winner, id);
      }
    }
  }
});

test('Jester must be voted out, while other final neutrals can win together', () => {
  const c = game();
  c.state.roles = [{id:'jester', title:'Jester', orientation:'neutral', winCondition:'votedOut'}, {id:'citizen', orientation:'good'}, {id:'framer', title:'Framer', orientation:'neutral'}, {id:'gambler', title:'Gambler', orientation:'neutral'}];
  c.state.players = [{id:0, name:'Jester', roleId:'jester', alive:true}, {id:1, name:'Citizen', roleId:'citizen', alive:true}];
  assert.equal(c.checkWin().winner, 'Good');
  c.state.players[1].alive = false;
  assert.equal(c.checkWin().winner, 'Nobody');
  c.state.players[0].alive = false;
  c.state.players[0].eliminatedByVote = true;
  c.state.players[1].alive = true;
  assert.equal(c.checkWin().winner, 'Jester');
  c.state.players = [{id:0, name:'Framer', roleId:'framer', alive:true}, {id:1, name:'Gambler', roleId:'gambler', alive:true}];
  assert.equal(c.checkWin().winner, 'Framer & Gambler');
});
test('manual assignments consume pool copies and satisfy their evil minimum', () => {
  const c = game();
  c.state.roles = [{id:'mafia',orientation:'evil',randomCount:1}, {id:'seer',orientation:'good',randomCount:1}, {id:'citizen',orientation:'good'}];
  c.state.players = [{id:0,roleId:'mafia'}, {id:1,roleId:'seer'}, {id:2,roleId:''}, {id:3,roleId:null}];
  c.assignRoles();
  assert.deepEqual(c.state.players.map(p => p.roleId), ['mafia','seer','citizen','citizen']);
});
test('remaining role copies can be drawn without duplicating manual pool copies', () => {
  const c = game();
  c.state.roles = [{id:'mafia',orientation:'evil',randomCount:2}, {id:'seer',orientation:'good',randomCount:1}, {id:'citizen',orientation:'good'}];
  c.state.players = [{id:0,roleId:'mafia'}, {id:1}, {id:2}, {id:3}];
  c.assignRoles();
  assert.deepEqual(c.state.players.map(p => p.roleId), ['mafia','mafia','seer','citizen']);
});
test('random mode ignores manual assignments and disabled roles', () => {
  const c = game(); c.state.mode = 'random';
  c.state.roles = [{id:'mafia',orientation:'evil',randomCount:1}, {id:'seer',orientation:'good',randomCount:5,randomEnabled:false}, {id:'citizen',orientation:'good'}];
  c.state.players = [{id:0,roleId:'seer'}, {id:1,roleId:'mafia'}, {id:2}];
  c.assignRoles(); assert.deepEqual(c.state.players.map(p => p.roleId), ['mafia','citizen','citizen']);
});
test('two Seers and Gamblers receive independent settings on each night', () => {
  const c = game(); const candidates = [{id:0}, {id:3}];
  const a = {hostSetup:{seerSchedule:{1:3,2:0},gamblerSchedule:{1:'kill',2:'protect'}}};
  const b = {hostSetup:{seerSchedule:{1:0,2:3},gamblerSchedule:{1:'protect',2:'kill'}}};
  assert.equal(c.scheduledSeerTarget(a,candidates),3); assert.equal(c.scheduledSeerTarget(b,candidates),0);
  assert.equal(c.scheduledGamblerAbility(a),'kill'); assert.equal(c.scheduledGamblerAbility(b),'protect');
  c.state.round=2;
  assert.equal(c.scheduledSeerTarget(a,candidates),0); assert.equal(c.scheduledSeerTarget(b,candidates),3);
  assert.equal(c.scheduledGamblerAbility(a),'protect'); assert.equal(c.scheduledGamblerAbility(b),'kill');
});
test('missing or dead Seer targets and invalid abilities fall back to random', () => {
  const c = game(), actor = {hostSetup:{seerSchedule:{1:9},gamblerSchedule:{1:'removedAbility'}}};
  assert.equal(c.scheduledSeerTarget(actor,[{id:3}]),3);
  assert.equal(c.scheduledSeerTarget(actor,[]),null);
  assert.equal(c.scheduledGamblerAbility(actor),'seer');
  c.state.mode='random'; actor.hostSetup.seerSchedule[1]=9;
  assert.equal(c.scheduledSeerTarget(actor,[{id:3},{id:9}]),9);
});
test('Random mode applies per-player schedules and intelligence targets', () => {
  const c = game(); c.state.mode = 'random';
  const actor = {id:1,roleId:'policeman',hostSetup:{seerSchedule:{1:3},gamblerSchedule:{1:'protect'},policemanTarget:3,haterTarget:3}};
  const candidates = [{id:0,roleId:'citizen'}, {id:3,roleId:'mafia'}];
  c.state.roles = [{id:'policeman'}, {id:'citizen'}, {id:'mafia',title:'Mafia',orientation:'evil'}];
  c.state.players = [...candidates,actor];
  assert.equal(c.scheduledSeerTarget(actor,candidates),3);
  assert.equal(c.scheduledGamblerAbility(actor),'protect');
  assert.equal(c.ensurePolicemanIntel(actor).targetId,3);
  assert.equal(c.hostTarget(actor,'haterTarget',candidates).id,3);
});
test('random Evil-heavy pools cannot start at the Evil win threshold', () => {
  const c = game(); c.state.mode='random';
  c.state.roles=[{id:'mafia',orientation:'evil',randomCount:3},{id:'hater',orientation:'evil',randomCount:2},{id:'godfather',orientation:'evil',randomCount:1},{id:'seer',orientation:'good',randomCount:1},{id:'citizen',orientation:'good'}];
  c.state.players=Array.from({length:8},(_,id)=>({id}));
  c.assignRoles();
  assert.equal(c.state.players.filter(p=>c.roleOf(p).orientation==='evil').length,3);
  assert.equal(c.checkWin().done,false);
  assert.equal(c.state.players[0].roleId,'godfather');
});
test('a manually assigned Evil player satisfies the Evil minimum', () => {
  const c=game(); c.state.requireEvil=true;
  c.state.roles=[{id:'mafia',orientation:'evil',randomCount:1},{id:'hater',orientation:'evil',randomCount:1},{id:'citizen',orientation:'good'}];
  c.state.players=[{id:0,roleId:'hater'},{id:1},{id:2}]; c.assignRoles();
  assert.deepEqual(c.state.players.map(p=>p.roleId),['hater','mafia','citizen']);
});
test('Evil minimum rejects an empty Evil pool without changing player roles', () => {
  const c=game(); c.state.requireEvil=true;
  c.state.roles=[{id:'mafia',orientation:'evil',randomCount:1},{id:'citizen',orientation:'good'}];
  c.state.players=[{id:0},{id:1},{id:2}];
  c.state.mode='random'; c.state.roles[0].randomEnabled=false;
  assert.equal(c.assignRoles(),false);
  assert.equal(c.state.players[0].roleId,undefined);
});
test('Policeman intel and Hater target accept player zero and stay per player', () => {
  const c = game(); c.state.roles=[{id:'policeman'}, {id:'mafia',title:'Mafia',orientation:'evil'}];
  const target={id:0,roleId:'mafia'};
  const a={id:1,roleId:'policeman',hostSetup:{policemanTarget:0,haterTarget:0}};
  const b={id:2,roleId:'policeman',hostSetup:{policemanTarget:1}};
  c.state.players=[target,a,b];
  assert.equal(c.ensurePolicemanIntel(a).targetId,0); assert.equal(c.ensurePolicemanIntel(b).targetId,1);
  assert.equal(c.hostTarget(a,'haterTarget',[target,b]).id,0);
});
test('recognition can be one-way or mutual without granting other players visibility', () => {
  const c = game(); c.state.roles=[{id:'citizen',visibility:'nobody'}];
  const a={id:0,alive:true,roleId:'citizen',hostSetup:{recognises:[1]}};
  const b={id:1,alive:true,roleId:'citizen'};
  assert.equal(c.visibleTo(a,b),true); assert.equal(c.visibleTo(b,a),false);
  b.hostSetup={recognises:[0]}; assert.equal(c.visibleTo(b,a),true);
  c.state.mode='random'; assert.equal(c.visibleTo(a,b),true);
});
test('removing a seat clears its references and preserves remaining player links', () => {
  const c=game(); const config={policemanTarget:1,haterTarget:2,seerSchedule:{1:1,2:2},recognises:[1,2]};
  c.state.players=[{id:0,hostSetup:config},{id:1},{id:2}]; c.removeHostReferences(1);
  assert.equal(config.policemanTarget,undefined); assert.equal(config.haterTarget,1);
  assert.equal(config.seerSchedule[1],undefined); assert.equal(config.seerSchedule[2],1);
  assert.equal(JSON.stringify(config.recognises),'[1]');
});

test('Evil roles have no priority over Good roles and there is no mandatory Evil', () => {
  const c = game(); c.state.mode='random';
  c.state.roles=[{id:'mafia',orientation:'evil',randomCount:1},{id:'hater',orientation:'evil',randomCount:1},{id:'seer',orientation:'good',randomCount:2},{id:'citizen',orientation:'good'}];
  c.state.players=[{id:0},{id:1}]; c.shuffle = list => [...list].reverse();
  c.assignRoles(); assert.deepEqual(c.state.players.map(p=>p.roleId),['seer','seer']);
});
test('optional minimum can be satisfied by a Neutral without any Evil', () => {
  const c=game(); c.state.mode='random'; c.state.requireNeutral=true;
  c.state.roles=[{id:'seer',orientation:'good',randomCount:5},{id:'jester',orientation:'neutral',randomCount:1},{id:'citizen',orientation:'good'}];
  c.state.players=[{id:0},{id:1},{id:2}]; c.assignRoles();
  assert.equal(c.state.players.filter(p=>c.roleOf(p).orientation==='neutral').length,1);
  assert.equal(c.state.players.filter(p=>c.roleOf(p).orientation==='evil').length,0);
});
test('optional minimum rejects an unavailable pool, while a fixed Neutral satisfies it', () => {
  const c=game(); c.state.requireNeutral=true;
  c.state.roles=[{id:'citizen',orientation:'good'},{id:'jester',orientation:'neutral',randomEnabled:false}];
  c.state.players=[{id:0},{id:1}]; assert.equal(c.assignRoles(),false);
  c.state.players[0].roleId='jester'; c.assignRoles();
  assert.deepEqual(c.state.players.map(p=>p.roleId),['jester','citizen']);
});
test('a surviving Jester remains a Jester when Evil is eliminated', () => {
  const c=game();
  c.state.roles=[{id:'citizen',orientation:'good'},{id:'jester',orientation:'neutral'},{id:'serial_killer',orientation:'neutral'}];
  c.state.players=[{id:0,roleId:'jester',alive:true},{id:1,roleId:'citizen',alive:true},{id:2,roleId:'citizen',alive:true}];
  assert.equal(c.checkWin().done,false); assert.equal(c.state.players[0].roleId,'jester');
});
test('both independent minimums are met together', () => {
  const c=game(); c.state.mode='random'; c.state.requireEvil=true; c.state.requireNeutral=true;
  c.state.roles=[{id:'citizen',orientation:'good'},{id:'seer',orientation:'good',randomCount:5},{id:'mafia',orientation:'evil',randomCount:1},{id:'jester',orientation:'neutral',randomCount:1}];
  c.state.players=Array.from({length:5},(_,id)=>({id})); c.assignRoles();
  assert.equal(c.state.players.filter(p=>c.roleOf(p).orientation==='evil').length,1);
  assert.equal(c.state.players.filter(p=>c.roleOf(p).orientation==='neutral').length,1);
  assert.equal(c.checkWin().done,false);
});
test('random Evil caps handle odd, even, and two-player games', () => {
  for (const count of [2,3,4,5,6,7,8,9]) {
    const c=game(); c.state.mode='random'; c.state.autoSideWinChecks=false;
    c.state.roles=[{id:'mafia',orientation:'evil',randomCount:20},{id:'citizen',orientation:'good'}];
    c.state.players=Array.from({length:count},(_,id)=>({id})); c.assignRoles();
    assert.equal(c.state.players.filter(p=>c.roleOf(p).orientation==='evil').length,Math.floor((count-1)/2));
    assert.notEqual(c.checkWin().winner,'Evil');
  }
});
test('a two-player Evil minimum is rejected instead of starting an immediate Evil win', () => {
  const c=game(); c.state.mode='random'; c.state.requireEvil=true;
  c.state.roles=[{id:'mafia',orientation:'evil',randomCount:1},{id:'citizen',orientation:'good'}];
  c.state.players=[{id:0},{id:1}]; assert.equal(c.assignRoles(),false);
});
test('first Evil is Godfather when available, with or without the Evil minimum', () => {
  for (const required of [false,true]) {
    const c=game(); c.state.mode='random'; c.state.requireEvil=required;
    c.state.roles=[{id:'mafia',orientation:'evil',randomCount:1},{id:'godfather',orientation:'evil',randomCount:1},{id:'citizen',orientation:'good'}];
    c.state.players=Array.from({length:3},(_,id)=>({id})); c.assignRoles();
    assert.deepEqual(c.state.players.map(p=>p.roleId),['godfather','citizen','citizen']);
    c.state.roles[1].randomEnabled=false; c.assignRoles();
    assert.equal(c.state.players[0].roleId,'mafia');
  }
});
test('Godfather priority preserves pool counts and does not force Evil into a Good-only draw', () => {
  const c=game(); c.state.mode='random';
  c.state.roles=[{id:'mafia',orientation:'evil',randomCount:1},{id:'godfather',orientation:'evil',randomCount:1},{id:'seer',orientation:'good',randomCount:3},{id:'citizen',orientation:'good'}];
  c.state.players=Array.from({length:5},(_,id)=>({id})); c.assignRoles();
  assert.equal(c.state.players.filter(p=>p.roleId==='godfather').length,1);
  assert.equal(c.state.players.filter(p=>p.roleId==='mafia').length,1);
  c.shuffle=list=>[...list].reverse(); c.state.players=Array.from({length:3},(_,id)=>({id})); c.assignRoles();
  assert.equal(c.state.players.some(p=>c.roleOf(p).orientation==='evil'),false);
});
function activityGame(actions, blockedIds=[]) {
  const c=game();
  c.state.players=Array.from({length:4},(_,id)=>({id,name:`Player ${id}`,alive:true}));
  c.state.night={extraActions:actions,blockedIds,limitedInvestigations:{2:{action:'audit',ids:[0]}},actionRecords:{}};
  const source=fs.readFileSync(path.join(root,'abilities.js'),'utf8');
  const helper=source.indexOf('function extraTargetsAvailable(');
  vm.runInContext(source.slice(helper,source.indexOf('\nfunction ',helper+1)),c);
  c.EXTRA_ABILITIES={fakeActivity:{},hideActivity:{}};
  const start=source.indexOf('function resolveExtraEffects()');
  vm.runInContext(source.slice(start,source.indexOf('\nfunction ',start+1)),c);
  c.resolveExtraEffects(); c.resolveLimitedInvestigations(); return c;
}
test('Fake Activity makes an idle target appear active to Check Activity, without a Track visit', () => {
  const c=activityGame({1:{action:'fakeActivity',targetId:0}});
  assert.equal(c.state.night.limitedResults[2],'Player 0 used a night ability.');
  assert.equal(c.trackReport(c.state.players[0],c.state.players[2]),'Player 0 made no recorded night ability use.');
});
test('Hide Activity overrides Fake Activity and blocking the faker prevents it', () => {
  const hidden=activityGame({1:{action:'fakeActivity',targetId:0},3:{action:'hideActivity',targetId:0}});
  assert.equal(hidden.state.night.limitedResults[2],'Player 0 made no recorded night ability use.');
  const blocked=activityGame({1:{action:'fakeActivity',targetId:0}},[1]);
  assert.equal(blocked.state.night.limitedResults[2],'Player 0 made no recorded night ability use.');
  const blockedTarget=activityGame({1:{action:'fakeActivity',targetId:0}},[0]);
  assert.equal(blockedTarget.state.night.limitedResults[2],'Player 0 used a night ability.');
});
