const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function extract(name) {
  const start = html.search(new RegExp(`    (?:async )?function ${name}\\(`));
  assert.ok(start >= 0);
  const rest = html.slice(start + 1);
  const end = rest.search(/\n    (?:async )?function /);
  return html.slice(start, start + 1 + end);
}

test('tabs reuse the saved browser identity and repeated clicks reuse authentication', async () => {
  let signIns = 0;
  const local = {};
  const api = {
    appMod: {initializeApp: () => ({})},
    authMod: {
      browserLocalPersistence: local,
      getAuth: () => ({currentUser:{uid:'saved-player'}}),
      setPersistence: async (auth, persistence) => {assert.equal(persistence, local);},
      signInAnonymously: async auth => { auth.currentUser = {uid:`player-${++signIns}`}; },
    },
  };
  const tabs = Array.from({length:3}, () => {
    const context = vm.createContext({
      online:{}, FIREBASE_CONFIG:{}, firebaseConfigured:()=>true,
      loadFirebase:async()=>api, $:()=>({}),
    });
    vm.runInContext(`let authInitPromise = null; ${extract('ensureAnonymousAuth')}`, context);
    return context;
  });
  await Promise.all(tabs.flatMap(tab => [tab.ensureAnonymousAuth(), tab.ensureAnonymousAuth()]));
  assert.deepEqual(tabs.map(tab => tab.online.uid), ['saved-player', 'saved-player', 'saved-player']);
  await tabs[0].ensureAnonymousAuth();
  assert.equal(signIns, 0);
});

test('host gives unassigned guests distinct seats and preserves their role assignments', () => {
  const writes = [];
  const context = vm.createContext({
    online:{isHost:true, roomCode:'ABC123', uid:'host', roomStatus:'lobby', db:{},
      playersCache:{host:{uid:'host',name:'Host',seatId:0,joinedAt:1},
        a:{uid:'a',name:'Alice',seatId:null,joinedAt:2},
        b:{uid:'b',name:'Bob',joinedAt:3}},
      api:{dbMod:{ref:(_db, target)=>target, update:(target, value)=>{writes.push({target,value});return Promise.resolve();}}}},
    state:{phase:'setup',players:[{id:0,uid:'host',roleId:'mafia'}]},
    createPlayer:(id,name)=>({id,name,roleId:null}), renderSetup:()=>{}, console,
  });
  vm.runInContext(extract('reconcileHostPlayers'), context);
  context.reconcileHostPlayers();
  assert.deepEqual(Array.from(context.state.players, p=>p.id), [0,1,2]);
  assert.equal(writes.length, 2);
  assert.equal(context.state.players[0].roleId, 'mafia');
  context.state.players[1].roleId = 'seer';
  context.online.playersCache.a.name = 'Renamed';
  context.reconcileHostPlayers();
  assert.equal(context.state.players[1].roleId, 'seer');
  assert.equal(context.state.players[1].name, 'Renamed');
  assert.equal(writes.length, 2);
});
