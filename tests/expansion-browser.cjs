const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/gerar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',error=>errors.push(error.message));await page.route('https://**/*',route=>route.abort());
  await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
  assert.equal(await page.locator('#roleNightAction option[value="publicNotice"]').count(),1);
  assert.equal(await page.locator('#roleNightReaction option').count(),37);
  assert.equal(await page.locator('#roleNightReaction optgroup[label="Investigative"] option').count(),6);
  assert.equal(await page.locator('#roleNightReaction optgroup[label="Deceitful"] option').count(),6);
  assert.equal(await page.locator('#roleNightReaction option[value="counterframe"]').innerText(),'Lingering Frame');
  assert.equal(await page.locator('#roleNightReaction option[value="lastShot"]').innerText(),'Break Their Reaction');
  assert.equal(await page.locator('#roleNightAction option[value="predictDeath"]').innerText(),'Read Last Night');
  await page.evaluate(()=>{
    window.resetExpansion=(ability='none',reaction='none')=>{
      online.mode='offline';state.narratorMode=false;state.phase='night';state.round=1;state.logs=[];state.visibleTokens=[];
      state.roles=structuredClone(DEFAULT_ROLES);state.roles.push({id:'expansion',title:'Expansion Test',orientation:'good',nightAction:ability,nightReaction:reaction,visibility:'nobody'});
      state.players=['expansion','mafia','citizen','doctor','citizen'].map((roleId,id)=>({...createPlayer(id,`Player ${id}`),roleId,uid:`uid${id}`}));
      state.night={round:1,index:0,queue:state.players.slice(),round1Players:state.players.slice(),pendingAttacks:[],protectedIds:[],blockedIds:[],actionRecords:{},round1Actions:{},round1Submitted:{},gamblerActions:{},reactionQueue:[],reactionCompleted:[],usedTeamKillRoleIds:[],turnRevealed:true};
      initializeExtraNight();
      hide('setupScreen','handoffCard','dayCard');show('gameScreen','nightCard');
      $('nightActionArea').innerHTML='';
    };
    resetExpansion('publicNotice');renderExtraForm($('nightActionArea'),'publicNotice',extraChoices(playerOf(0),'publicNotice'),value=>{window.formSubmission=parseExtraChoice(playerOf(0),'publicNotice',value);});
  });
  assert.equal(await page.locator('#nightActionArea select').count(),0);
  await page.locator('#nightActionArea textarea').fill('Announcement from the browser');
  await page.locator('#nightActionArea button[type="submit"]').click({force:true});
  assert.equal(await page.evaluate(()=>window.formSubmission.text),'Announcement from the browser');
  await page.evaluate(()=>{
    resetExpansion();
    state.roles.forEach(r=>{r.visibility='nobody';r.visibleToRoleIds=[];});
    const actor=playerOf(0);
    setPlayerAlive(actor,false);
    renderNightKnownRoles(actor);
    if($('nightKnownRoles').textContent.includes('Player 1'))throw new Error('Local night screen leaked roles immediately on death');
    if(onlinePrivatePayloadFor(actor).knownRoles.length)throw new Error('Online payload leaked roles immediately on death');
    state.phase='day';state.round++;
    renderKnownRoles(actor,'nightKnownRoles');
    if($('nightKnownRoles').textContent.includes('Player 1'))throw new Error('Roles leaked at dawn');
    actor.spectatorRolesUnlocked=true;
    renderKnownRoles(actor,'nightKnownRoles');
    if(!$('nightKnownRoles').textContent.includes('Player 1'))throw new Error('Spectator roles did not unlock');
    setPlayerAlive(actor,true);
    renderKnownRoles(actor,'nightKnownRoles');
    if($('nightKnownRoles').textContent.includes('Player 1'))throw new Error('Revival retained spectator roles');
  });
  await page.evaluate(()=>{
    resetExpansion('deadLetter');setPlayerAlive(playerOf(2),false);
    renderExtraForm($('nightActionArea'),'deadLetter',extraChoices(playerOf(0),'deadLetter'),value=>{window.formSubmission=parseExtraChoice(playerOf(0),'deadLetter',value);});
  });
  assert.equal(await page.locator('#nightActionArea select option[value="2"]').count(),0);
  assert.equal(await page.locator('#nightActionArea select option[value="1"]').count(),1);
  await page.evaluate(()=>{
    resetExpansion('inspectReaction','decoyTrail');renderProposedPlanning(playerOf(0));
  });
  assert.match(await page.locator('#nightPrompt').innerText(),/Decoy Trail/);
  await page.evaluate(()=>{saveProposedPlan(playerOf(0),'2');recordExtraChoice(playerOf(0),'inspectReaction',{targetId:1});state.night.round=2;state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];prepareExtraAttacks();renderReactionTurn(playerOf(0));});
  assert.match(await page.locator('#nightActionArea').innerText(),/Use Decoy Trail/);
  await page.evaluate(()=>resolveNewReaction(playerOf(0),'activate'));
  assert.equal(await page.evaluate(()=>state.night.pendingAttacks[0].targetId),2);
  // Both devices receive different private turns for a bargain; forged responses are rejected.
  const bargain=await page.evaluate(async()=>{
    resetExpansion('none','bargainLife');online.mode='host';online.isHost=true;
    online.playersCache=Object.fromEntries(state.players.map(p=>[p.uid,{uid:p.uid,seatId:p.id}]));
    publishOnlineRoom=async()=>{};state.processedCommandIds={};state.onlineVersion=1;
    state.night.round=2;state.night.reactionQueue=state.players.slice();
    state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];prepareExtraAttacks();
    await handleOnlineNightReaction(playerOf(0),'activate','uid0','start');
    const target=onlinePrivatePayloadFor(playerOf(0)).turn,attacker=onlinePrivatePayloadFor(playerOf(1)).turn;
    await handleOnlineCommand({uid:'uid2',seatId:2,payload:{version:1,actionType:'bargainDecision',value:'spare'}},'forged');
    const rejected=!state.onlineCommandAcks.uid2.accepted;
    await handleOnlineCommand({uid:'uid1',seatId:1,payload:{version:1,actionType:'bargainDecision',value:'spare'}},'accepted');
    return {target,attacker,rejected,survived:playerOf(0).alive,silenced:playerOf(0).silenced,pending:state.night.pendingAttacks.length};
  });
  assert.equal(bargain.attacker.action,'bargainDecision');assert.equal(bargain.target.options.length,0);assert.equal(bargain.rejected,true);assert.equal(bargain.survived,true);assert.equal(bargain.silenced,true);assert.equal(bargain.pending,0);
  await page.evaluate(()=>{
    resetExpansion('sealedReply');recordExtraChoice(playerOf(0),'sealedReply',{targetId:2,text:'Reply privately'});resolveExtraDefenses();resolveExtraEffects();state.night.round=2;state.night.index=2;state.night.reactionQueue=state.players.slice();
    online.mode='host';online.seatId=2;online.public={phase:'night',players:state.players.map(p=>({id:p.id,alive:p.alive}))};online.private=onlinePrivatePayloadFor(playerOf(2));renderOnlinePrivate();
  });
  assert.equal(await page.locator('#onlineActionArea textarea').count(),0);
  assert.match(await page.locator('#onlineActionResult').innerText(),/Reply privately/);
  const addedReactions=await page.evaluate(async()=>{
    const names=['identifyAssailant','readWeapon','traceTheirSteps','countThreats','witnessSearch','readTheirPast','counterframe','falseColours','plantEscapeRoute','eraseFootprints','borrowTheirFace','scrambleWitnesses'];
    const results=[];
    for(const action of names){
      resetExpansion('none',action);state.night.round=2;state.night.reactionQueue=state.players.slice();
      state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];recordNightAction(playerOf(1),'kill',0);prepareExtraAttacks();
      renderReactionTurn(playerOf(0));
      const localOptions=$('nightActionArea').querySelectorAll('button').length;
      online.mode='host';const turn=onlinePrivatePayloadFor(playerOf(0)).turn;
      const value=action==='counterframe'?'choose:doctor':action==='falseColours'?'choose:good':action==='plantEscapeRoute'?'choose:2':'activate';
      await handleOnlineNightReaction(playerOf(0),value,'uid0',action);
      results.push({action,localOptions,accepted:state.onlineCommandAcks.uid0.accepted,dead:!playerOf(0).alive,hasPrivateResult:!!state.night.onlineResults[0]});
    }
    resetExpansion('none','counterframe');state.night.round=2;state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];prepareExtraAttacks();renderReactionTurn(playerOf(0));
    return results;
  });
  for(const result of addedReactions){assert.ok(result.localOptions>=2,result.action);assert.equal(result.accepted,true,result.action);assert.equal(result.dead,['counterframe','falseColours','plantEscapeRoute','scrambleWitnesses'].includes(result.action),result.action);assert.equal(result.hasPrivateResult,true,result.action);}
  await page.getByRole('button',{name:'Frame attacker as Doctor',exact:true}).click();
  assert.match(await page.locator('#nightResult').innerText(),/Chosen role: Doctor/);
  assert.match(await page.locator('#nightResult').innerText(),/following night/);
  assert.equal(await page.evaluate(()=>roleOf(playerOf(1)).title),'Mafia');
  const orderedReports=await page.evaluate(async()=>{
    const results=[];
    for(const narrated of [false,true])for(const order of [[0,2,1,3,4],[2,0,1,3,4]]){
      resetExpansion('seer');state.narratorMode=narrated;state.night.narratorReporting=narrated;playerOf(2).roleOverrides={nightReaction:'counterframe'};
      state.night.seerTargets={0:1};state.night.round1SeerTargets={0:1};state.night.pendingAttacks=[{attackerId:1,targetId:2,sourceAction:'kill'}];recordNightAction(playerOf(1),'kill',2);prepareExtraAttacks();
      state.night.round=2;state.night.reactionQueue=order.map(playerOf);const early=[];
      for(const id of order){
        state.night.index=order.indexOf(id);
        if(id===0){renderReactionTurn(playerOf(0));early.push($('nightResult').textContent);online.mode='host';const payload=onlinePrivatePayloadFor(playerOf(0));early.push(payload.result);}
        if(id===2){if(narrated)resolveNewReaction(playerOf(2),'choose:doctor');else await handleOnlineNightReaction(playerOf(2),'choose:doctor','uid2','frame');}
      }
      finishExtraNight();const originalQueue=state.night.reactionQueue.map(p=>p.id),noDawn=state.players.every(p=>p.dawnMessages.length===0);
      state.round++;const living=order.map(playerOf).filter(p=>p.alive);
      state.night={round:1,index:0,queue:living.slice(),round1Players:living.slice(),pendingAttacks:[],protectedIds:[],blockedIds:[],actionRecords:{},round1Actions:{},round1Submitted:{},gamblerActions:{},reactionQueue:living.slice(),reactionCompleted:[]};
      initializeExtraNight();resolveExtraDefenses();resolveExtraEffects();state.night.seerTargets={0:1};state.night.round1SeerTargets={0:1};state.night.round=2;state.night.index=living.findIndex(p=>p.id===0);
      renderReactionTurn(playerOf(0));const nextLocal=$('nightResult').textContent,nextOnline=onlinePrivatePayloadFor(playerOf(0)).result;
      results.push({order:originalQueue,early,noDawn,nextLocal,nextOnline});
    }
    return results;
  });
  for(let i=0;i<orderedReports.length;i++){
    assert.deepEqual(orderedReports[i].order,i%2===0?[0,2,1,3,4]:[2,0,1,3,4]);
    for(const early of orderedReports[i].early){assert.match(early,/Player 1.*Mafia/);assert.doesNotMatch(early,/at dawn|wait|settle/);}
    assert.equal(orderedReports[i].noDawn,true);
    assert.match(orderedReports[i].nextLocal,/Player 1.*Doctor/);assert.match(orderedReports[i].nextOnline,/Player 1.*Doctor/);
  }
  assert.equal(orderedReports[0].nextOnline,orderedReports[1].nextOnline);
  const privateEnding=await page.evaluate(()=>{
    state.phase='night';const before=JSON.stringify(onlinePublicSnapshot());
    state.phase='gameover';online.public=onlinePublicSnapshot();online.private=onlinePrivatePayloadFor(playerOf(0));renderOnlinePrivate();
    return {before,messages:online.private.dawnMessages,public:JSON.stringify(online.public),dialogs:document.querySelectorAll('dialog[open]').length};
  });
  assert.deepEqual(privateEnding.messages,[]);assert.equal(privateEnding.dialogs,0);
  assert.doesNotMatch(privateEnding.before,/Seer result/);assert.match(privateEnding.public,/Seer result/);
  for(const width of [390,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);}
  assert.deepEqual(errors,[]);console.log('Expansion browser checks passed, including all 12 information/deception reactions through offline controls and online resolution.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
