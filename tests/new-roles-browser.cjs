// Real offline UI and two-device online checks with an in-memory room, no live writes.
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/gerar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const errors=[];
  try {
    const host=await browser.newPage({viewport:{width:1280,height:900}});
    const guest=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    for(const page of [host,guest]){
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('https://**/*',route=>route.abort());
      await page.goto('file:///C:/Users/gerar/Downloads/Websites/Mafia/index.html',{waitUntil:'load'});
    }
    assert.equal(await host.locator('#roleNightAction option[value="signalReceiver"]').count(),1);
    assert.equal(await host.locator('#roleSpecialId option[value="judge"]').count(),1);
    async function offlineDay(ids){
      await host.evaluate(ids=>{
        online.mode='offline';state.narratorMode=false;state.autoSideWinChecks=false;state.round=1;
        state.players=ids.map((roleId,id)=>({...createPlayer(id,`Player ${id}`),roleId}));
        state.logs=[];state.night={};hide('setupScreen','onlineEntry','onlineGame');show('gameScreen');startDay();
      },ids);
    }
    await offlineDay(['judge','citizen','mafia','citizen','signal_receiver','citizen']);
    assert.match(await host.locator('#dayVoteRules').innerText(),/A Judge is present/);
    assert.equal(await host.locator('#dayVoteArea select').count(),1);
    assert.equal(await host.locator('#skipDayBtn').isVisible(),false);
    assert.equal(await host.locator('#nextNightBtn').isDisabled(),true);
    await host.locator('#dayVoteArea select').selectOption('1');
    await host.getByRole('button',{name:'Resolve Judge verdict',exact:true}).click();
    assert.match(await host.locator('#dayResult').innerText(),/Good.*Judge was voted out/);
    assert.deepEqual(await host.evaluate(()=>state.players.slice(0,2).map(p=>[p.alive,p.eliminatedByVote])),[[false,true],[false,true]]);
    await host.evaluate(()=>startDay());
    assert.equal(await host.locator('#dayVoteArea select').count(),4);
    assert.equal(await host.locator('#skipDayBtn').isVisible(),true);

    await offlineDay(['judge','citizen','mafia','citizen']);
    await host.locator('#dayVoteArea select').selectOption('skip');
    await host.getByRole('button',{name:'Resolve Judge verdict',exact:true}).click();
    assert.match(await host.locator('#dayResult').innerText(),/Nobody was eliminated/);
    assert.equal(await host.evaluate(()=>state.players.every(p=>p.alive)),true);

    // A signal is delivered after a genuine death, revival and deceptive frame.
    await host.evaluate(()=>{
      state.phase='night';state.round=1;
      state.players=['signal_receiver','mafia','citizen','doctor','judge'].map((roleId,id)=>({...createPlayer(id,`Player ${id}`),roleId}));
      state.night={round:2,round1Players:state.players.slice(),gamblerActions:{},pendingAttacks:[],protectedIds:[],blockedIds:[],actionRecords:{}};
      initializeExtraNight();
      recordNightAction(state.players[1],'kill',2);
      state.night.pendingAttacks=[{attackerId:1,targetId:2,sourceAction:'kill'}];
      prepareExtraAttacks();resolveNightBeforeReactions();
      setPlayerAlive(state.players[2],true);recordNightAction(state.players[3],'doctor',2);
      state.players[1].framedRoleId='citizen';state.night.hiddenAllegiance=[1];
      window.randomChoiceSaved=randomChoice;randomChoice=list=>list[0];
      finishExtraNight();state.round++;hide('nightCard');startDay();randomChoice=window.randomChoiceSaved;
    });
    assert.equal(await host.locator('dialog[open]').count(),1);
    await host.getByRole('button',{name:'Reveal private messages',exact:true}).click();
    assert.match(await host.locator('dialog[open]').innerText(),/Signal Receiver — night 1:/);
    assert.equal(await host.evaluate(()=>state.players[0].dawnMessages.length),1);
    assert.equal(await host.evaluate(()=>state.players[0].dawnMessages[0].includes('3 living Good players')),false);
    await host.getByRole('button',{name:'Hide & pass',exact:true}).click();
    assert.equal(await host.locator('dialog[open]').count(),0);

    const commands=[],updates={};
    await host.exposeFunction('mockUpdate',values=>{Object.assign(updates,values);});
    await guest.exposeFunction('mockSet',(_ref,value)=>{commands.push(value);});
    for(const [page,seat] of [[host,0],[guest,1]])await page.evaluate(seat=>{
      online.mode=seat?'guest':'host';online.isHost=seat===0;online.uid=`uid-${seat}`;online.seatId=seat;
      online.roomCode='TEST';online.roomStatus='started';online.db={};state.phase='day';state.round=1;state.narratorMode=false;state.autoSideWinChecks=false;
      state.players=['judge','citizen','mafia','citizen','signal_receiver','citizen'].map((roleId,id)=>({...createPlayer(id,`Player ${id}`),roleId,uid:`uid-${id}`}));
      state.day={votes:{},secondBallot:false,tiedCandidates:[]};state.night={};state.onlineVersion=1;state.processedCommandIds={};state.onlineCommandAcks={};
      online.playersCache=Object.fromEntries(state.players.map(p=>[p.uid,{uid:p.uid,seatId:p.id}]));
      online.api={dbMod:{ref:(_db,path)=>({path}),push:ref=>({...ref,key:'command'}),
        set:(ref,value)=>window.mockSet(ref,value),update:(_ref,values)=>window.mockUpdate(values)}};
      hide('gameScreen','setupScreen','onlineEntry');show('onlineGame','onlineActionCard');
    },seat);
    async function flush(){
      for(const [page,seat] of [[host,0],[guest,1]])await page.evaluate(({pub,priv})=>{
        online.public=pub;online.private=priv;renderOnlinePublic();renderOnlinePrivate();
      },{pub:updates['rooms/TEST/public'],priv:updates[`rooms/TEST/private/uid-${seat}`]});
    }
    await host.evaluate(()=>publishOnlineRoom());await flush();
    assert.match(await guest.locator('#onlinePublicStatus').innerText(),/A Judge is present/);
    assert.equal(await guest.locator('#onlineActionArea button').count(),0);
    assert.match(await host.locator('#onlineActionPrompt').innerText(),/If they are Good/);
    assert.equal(await host.locator('#onlineActionArea button').count(),6);
    // A forged non-Judge request is rejected at the host, independently of UI.
    await host.evaluate(()=>handleOnlineCommand({uid:'uid-1',payload:{version:1,turnType:'dayVote',value:'skip'}},'forged-verdict'));
    assert.equal(await host.evaluate(()=>state.onlineCommandAcks['uid-1'].accepted),false);
    assert.equal(await host.evaluate(()=>state.phase),'day');
    await host.evaluate(()=>handleOnlineCommand({uid:'uid-0',payload:{version:1,turnType:'dayVote',value:1}},'judge-verdict'));
    assert.equal(await host.evaluate(()=>state.phase),'night');
    assert.deepEqual(await host.evaluate(()=>state.players.slice(0,2).map(p=>p.alive)),[false,false]);
    // Fresh night, a Judge is absent from every direct target menu and redirects.
    await host.evaluate(()=>{
      state.players[0].alive=true;state.players[1].alive=true;state.players[1].roleId='scapegoat';
      state.players[2].roleId='hacker';return startOnlineNight();
    });
    const menus=await host.evaluate(()=>{
      const actor=state.players[2],out={};
      for(const action of ['kill','teamKill','protect','roleblock','silence','track','inspectOrientation','framer','changeRole','fakeVisit']){
        actor.roleOverrides={nightAction:action};const turn=onlinePrivatePayloadFor(actor).turn;
        out[action]=turn?.extraForm ? turn.extraForm.targets.map(p=>Number(p.id)) : (turn?.options||[]).map(p=>p.id);
      }
      delete actor.roleOverrides;
      state.night.round=2;state.night.reactionQueue=[state.players[1]];state.night.index=0;
      state.night.pendingAttacks=[{attackerId:2,targetId:1,sourceAction:'kill'}];
      out.redirect=(onlinePrivatePayloadFor(state.players[1]).turn.options||[]).map(p=>p.id);return out;
    });
    for(const [action,ids] of Object.entries(menus))assert.ok(!ids.includes(0),action);
    await host.evaluate(async()=>{
      state.night.pendingAttacks=[];state.night.round=1;
      state.players[1].roleId='citizen';state.players[0].alive=true;
      state.players[4].roleId='signal_receiver';initializeExtraNight();
      recordNightAction(state.players[2],'framer',3);state.players[3].framedRoleId='mafia';
      return finishOnlineNightOnline();
    });
    await flush();
    assert.equal(await host.evaluate(()=>onlinePublicSnapshot().signalHints),undefined);
    const receiverPrivate=updates['rooms/TEST/private/uid-4'];
    assert.equal(receiverPrivate.dawnMessages.length,1);
    assert.equal(updates['rooms/TEST/private/uid-1'].dawnMessages.length,0);
    // Private hints remain visible after the same-day command acknowledgement.
    await guest.evaluate(({pub,priv})=>{
      online.seatId=4;online.uid='uid-4';online.public=pub;online.private=priv;renderOnlinePublic();
    },{pub:updates['rooms/TEST/public'],priv:receiverPrivate});
    assert.match(await guest.locator('#onlineActionResult').innerText(),/Signal Receiver/);
    assert.equal(await guest.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    assert.deepEqual(errors,[]);
    console.log('Browser checks passed: Judge verdicts and return to voting; private dawn signal; two-device authority; immune target menus and redirects; mobile layout.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
