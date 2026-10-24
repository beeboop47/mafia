const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/gerar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
    await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
    await page.evaluate(()=>{
      window.expect=(ok,message)=>{if(!ok)throw new Error(message);};
      window.resetCustom=(action='kill')=>{
        online.mode='offline';online.isHost=false;state.mode='manual';state.phase='night';state.round=1;state.autoSideWinChecks=false;state.narratorMode=false;state.timeline=[];state.logs=[];state.gameResult=null;
        state.roles=structuredClone(DEFAULT_ROLES);state.roles.push({id:'customtest',title:'Custom test',orientation:'good',nightAction:action,nightReaction:'none',visibility:'nobody'});
        state.players=['customtest','mafia','citizen','doctor','citizen'].map((roleId,id)=>({...createPlayer(id,`Player ${id}`),roleId,uid:`uid${id}`}));
        state.night={round:1,index:0,queue:state.players.slice(),round1Players:state.players.slice(),pendingAttacks:[],protectedIds:[],blockedIds:[],actionRecords:{},round1Actions:{},round1Submitted:{},gamblerActions:{},reactionQueue:state.players.slice(),reactionCompleted:[],usedTeamKillRoleIds:[],turnRevealed:true,onlineResults:{}};
        state.night.haterTargets={};state.visibleTokens=[];initializeExtraNight();hide('onlineEntry','onlineLobby','onlineGame','setupScreen','handoffCard','dayCard','winCard');show('gameScreen','nightCard');$('nightActionArea').replaceChildren();
      };
      window.assignCustom=(action,value='2',second='',text='')=>{playerOf(0).hostSetup={abilitySchedule:{1:{action,value,second,text}}};};
      resetCustom('kill');assignCustom('kill');renderStandardAction(playerOf(0),roleOf(playerOf(0)),playersAlive());
      renderNightKnownRoles(playerOf(0));
      expect($('nightActionArea').querySelectorAll('button').length===1,'local kill still lets player choose');
      expect($('nightPrompt').textContent.includes('assigned')&&$('nightPrompt').textContent.includes('Player 2'),'assigned action details missing');
    });
    await page.screenshot({path:path.join(require('node:os').tmpdir(),'mafia-customisation-night.png'),fullPage:true,animations:'disabled'});
    await page.locator('#nightActionArea button').click({force:true});
    assert.equal(await page.evaluate(()=>state.night.pendingAttacks[0]?.targetId),2);
    await page.evaluate(()=>{
      resetCustom('framer');assignCustom('framer','2','mafia');renderStandardAction(playerOf(0),roleOf(playerOf(0)),playersAlive());
    });
    await page.locator('#nightActionArea button').click({force:true});
    assert.equal(await page.locator('#nightActionArea button').count(),1);
    await page.locator('#nightActionArea button').click({force:true});
    assert.equal(await page.evaluate(()=>playerOf(2).framedRoleId),'mafia');
    await page.evaluate(async()=>{
      // Submitting another target from a forged client cannot override host configuration.
      resetCustom('kill');assignCustom('kill','2');publishOnlineRoom=async()=>{};maybeFinishOnlineRound1=async()=>{};
      const payload=onlinePrivatePayloadFor(playerOf(0));expect(payload.turn.hostAssigned,'online kill is not locked');expect(payload.turn.options.length===1,'online kill has alternate choices');
      await handleOnlineNightRound1(playerOf(0),'4','kill');
      expect(state.night.round1Actions[0].targetId===2,'forged kill target accepted');
      resetCustom('framer');assignCustom('framer','2','mafia');
      await handleOnlineNightRound1(playerOf(0),'4','framer');
      expect(state.night.framerTargetId===2,'forged frame target accepted');
      await handleOnlineNightRound1(playerOf(0),'citizen','framerRoleChoice');
      expect(state.night.round1Actions[0].framedRoleId==='mafia','forged framing role accepted');
      resetCustom('changeRole');assignCustom('changeRole','2','doctor');
      await handleOnlineNightRound1(playerOf(0),'4','changeRole');
      await handleOnlineNightRound1(playerOf(0),'mafia','changeRoleChoice');
      expect(state.night.round1Actions[0].newRoleId==='doctor','forged role change accepted');
      resetCustom('compare');assignCustom('compare','1:2');await handleOnlineNightRound1(playerOf(0),'3:4','compare');expect(state.night.round1Actions[0].value==='1:2','comparison not assigned');
      resetCustom('sendNote');assignCustom('sendNote','2','','Host note');await handleOnlineNightRound1(playerOf(0),JSON.stringify({targetId:4,text:'Forged note'}),'sendNote');expect(state.night.extraActions[0].text==='Host note'&&state.night.extraActions[0].targetId===2,'message assignment not enforced');
      resetCustom('kill');assignCustom('kill','2');setPlayerAlive(playerOf(2),false);await handleOnlineNightRound1(playerOf(0),'4','kill');expect(state.night.round1Actions[0].action==='none','invalid target did not skip');
      resetCustom('doctor');assignCustom('doctor','2');setPlayerAlive(playerOf(2),false);state.night.round=2;state.night.index=0;
      await handleOnlineNightReaction(playerOf(0),'4');expect(playerOf(2).alive&&playerOf(0).used.doctor,'assigned Doctor target not revived');
      resetCustom('janitor');assignCustom('janitor','2');setPlayerAlive(playerOf(2),false);state.night.round=2;
      await handleOnlineNightReaction(playerOf(0),'4');expect(state.night.actionRecords[0].targetId===2,'assigned Janitor target not inspected');
      for(const action of Object.keys(EXTRA_ABILITIES)){
        resetCustom(action);const spec=EXTRA_ABILITIES[action];
        if(spec.dead)setPlayerAlive(playerOf(2),false);
        if(action==='borrowReaction')playerOf(2).roleOverrides={nightReaction:'escape'};
        const choices=extraChoices(playerOf(0),action),target=choices.targets[0]?.id||'',secondary=spec.second==='player'?choices.secondary.find(o=>o.id!==target)?.id||'':choices.secondary[0]?.id||'';
        assignCustom(action,target,secondary,'Host-selected text');
        await handleOnlineNightRound1(playerOf(0),'skip',action);
        expect(state.night.round1Submitted[0],`${action}: host assignment stalled`);
        const expected=hostAssignedValue(playerOf(0));
        if(!isPassiveAbility(action)&&!spec.once&&expected!=='skip')expect(state.night.extraActions[0]?.action===action,`${action}: player skipped a host assignment`);
      }
      resetCustom('hater');playerOf(0).hostSetup={haterTarget:2};await handleOnlineNightRound1(playerOf(0),'skip','hater');expect(playerOf(0).haterTargetId===2,'host Hater target was declined');
    });
    await page.evaluate(()=>{
      resetCustom('bestowAbility');assignCustom('bestowAbility','2','protect');
      const choices=extraChoices(playerOf(0),'bestowAbility');expect(!choices.secondary.some(o=>o.id==='bestowAbility'),'bestow passes itself');
      const c=parseExtraChoice(playerOf(0),'bestowAbility',hostAssignedValue(playerOf(0)));recordExtraChoice(playerOf(0),'bestowAbility',c);resolveExtraDefenses();resolveExtraEffects();
      expect(nightActionFor(playerOf(2))==='protect'&&nightActionFor(playerOf(0))==='bestowAbility'&&playerOf(0).used.bestowAbility,'bestow redesign failed');
      roleOf(playerOf(0)).bestowPool=['kill'];expect(extraChoices(playerOf(0),'bestowAbility').secondary.every(o=>o.id==='kill'),'bestow role pool ignored');
      for(const reaction of ['stealWeapon','vengefulAwakening']){
        resetCustom('none');playerOf(0).roleOverrides={nightReaction:reaction};state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];prepareExtraAttacks();resolveNewReaction(playerOf(0),'activate');
        expect(playerOf(0).alive&&nightActionFor(playerOf(0))==='kill'&&nightReactionFor(playerOf(0))==='none',`${reaction} was not useful without another survival power`);
      }
      resetCustom('none');const actor=playerOf(0),r=roleOf(actor);r.recognitionRoleId='mafia';r.knowsDisguise=true;
      expect(visibleTo(playerOf(1),actor),'Evil cannot recognise disguise');expect(!visibleTo(actor,playerOf(1)),'disguise leaked Evil roster');
      renderKnownRoles(playerOf(1),'nightKnownRoles');expect($('nightKnownRoles').textContent.includes('Mafia')&&!$('nightKnownRoles').textContent.includes('Custom test'),'recognition showed true role');
      expect(investigationRoleOf(actor,playerOf(1)).title==='Custom test','disguise falsified investigation');
      expect(onlineKnownRolesFor(playerOf(1)).find(p=>p.id===0).role==='Mafia','online recognition showed true role');
      expect(privateCustomisationText(actor).includes('Mafia'),'known disguise note missing');r.knowsDisguise=false;expect(!privateCustomisationText(actor).includes('Mafia'),'secret disguise revealed to wearer');
      actor.hostSetup={challenge:'Speak in a subtle Icelandic accent.'};expect(privateCustomisationText(actor).includes('Icelandic'),'challenge missing');expect(!privateCustomisationText(playerOf(1)).includes('Icelandic'),'challenge leaked');
      const saved=serializeAuthoritativeState();hydratePersistedState(saved);expect(hostSettings(playerOf(0)).challenge.includes('Icelandic'),'challenge lost on restore');
      playerOf(1).spectatorRolesUnlocked=true;playerOf(1).alive=false;expect(onlineKnownRolesFor(playerOf(1)).find(p=>p.id===0).role==='Custom test','spectator did not see true identity');
    });
    await page.evaluate(()=>{
      resetCustom('kill');playerOf(0).hostSetup={challenge:'Speak with a subtle accent.',abilitySchedule:{3:{action:'kill',value:'2'}}};
      state.phase='handoff';state.handoffIndex=0;state.handoffRevealed=true;updateHandoff();
      expect($('handoffKnownRoles').textContent.includes('personal challenge'),'challenge absent at role reveal');
      expect(!/host|assigned night|night actions/i.test($('handoffKnownRoles').textContent),'role reveal forecasts manual assignments or identifies challenge author');
      expect(!/assigned/i.test(onlinePrivatePayloadFor(playerOf(0)).customisationText),'online handoff forecasts assignments');
      state.phase='night';state.round=3;$('nightActionArea').replaceChildren();renderStandardAction(playerOf(0),roleOf(playerOf(0)),playersAlive());
      expect($('nightPrompt').textContent.includes('Kill')&&$('nightPrompt').textContent.includes('Player 2'),'local assigned night omits actual assignment');
      const assigned=onlinePrivatePayloadFor(playerOf(0));expect(assigned.turn.prompt.includes('Player 2')&&assigned.turn.options.length===1,'online assignment omits actual target');
      expect(!Object.hasOwn(EXTRA_ABILITIES,'exposeCover'),'retired hunt remains selectable');
      expect(!state.roles.some(r=>r.id==='counterintelligence'),'retired counter role remains available');
    });
    await page.evaluate(()=>{
      resetCustom();const p=playerOf(0);p.roleId='policeman';p.hostSetup={policemanTarget:1,recognises:[1]};playerOf(1).roleId='henchman';
      expect(ensurePolicemanIntel(p).targetId!==1,'Policeman selected recognised player');
      delete p.policemanIntel;state.players.slice(1).forEach(p=>p.roleId='henchman');expect(ensurePolicemanIntel(p).targetId!=null,'all-recognised fallback failed');
      resetCustom();state.phase='setup';renderHostSetup();
      expect($('hostPlayerSettings').textContent.includes('Host-assigned Kill by night'),'generic host controls missing');
      const actions=Object.keys(NIGHT_ACTIONS).filter(id=>!NIGHT_REACTION_ACTIONS.has(id));
      for(const action of actions){roleOf(playerOf(0)).nightAction=action;renderHostSetup();expect($('hostPlayerSettings').children.length===state.players.length,`${action} breaks host setup`);}
      roleOf(playerOf(0)).nightAction='kill';renderHostSetup();
      const first=$('hostPlayerSettings').firstElementChild;const control=first.querySelector('[aria-label="Night 1 control"]');control.value='assign';control.dispatchEvent(new Event('change'));const target=first.querySelector('.host-night-row .grid2 select');target.value='2';target.dispatchEvent(new Event('change'));expect(hostSettings(playerOf(0)).abilitySchedule[1].value==='2','host form did not save target');
      openRoleEditor('customtest');$('recognitionDisguise').value='mafia';$('knowsDisguise').checked=false;
      expect(identityEditorSettings().recognitionRoleId==='mafia'&&!identityEditorSettings().knowsDisguise,'identity editor did not save');closeRoleEditor();
      state.phase='night';recordTimelineEvent('A secret attack was blocked.',[0,2]);expect(!('timeline' in onlinePublicSnapshot()),'timeline leaked before game over');
      state.phase='gameover';const pub=onlinePublicSnapshot();expect(pub.timeline.length>0,'timeline missing at game over');renderOnlineGameOver({...pub,winner:'Test',reason:'Finished'});expect($('onlineGameOver').textContent.includes('secret attack'),'timeline did not render');
      const history=serializeAuthoritativeState();state.timeline=[];hydratePersistedState(history);expect(state.timeline.length>0,'timeline lost on restore');
    });
    await page.evaluate(async()=>{
      resetCustom();state.players=state.players.slice(0,3);playerOf(0).roleId='detective';playerOf(1).roleId='gambler';playerOf(2).roleId='hater';playerOf(2).haterTargetId=0;
      state.phase='day';state.day={votes:{0:2,1:2,2:0},secondBallot:false,tiedCandidates:[]};
      await resolveOnlineDay();expect(state.phase==='gameover'&&state.gameResult.winner==='Good','voting Hater did not award Good');
      const pub=onlinePublicSnapshot();expect(pub.personalWinners.length===1&&pub.personalWinners[0].id===1,'online snapshot omitted Gambler personal win');
      renderOnlineGameOver(pub);expect($('onlineWinnerTitle').textContent.includes('Good'),'online faction result wrong');expect($('onlineGameOver').querySelector('.personal-victories').textContent.includes('Gambler'),'online personal win missing');
      endGame(state.gameResult);expect($('winnerTitle').textContent.includes('Good'),'offline faction result wrong');expect($('winCard').querySelector('.personal-victories').textContent.includes('Gambler'),'offline personal win missing');
      const saved=serializeAuthoritativeState();state.gameResult=null;online._winner=null;hydratePersistedState(saved);expect(onlinePublicSnapshot().personalWinners[0].id===1,'personal victory lost after restoring host state');
      resetCustom();state.players=state.players.slice(0,2);playerOf(0).roleId='gambler';playerOf(1).roleId='leader';const result=checkWin();endGame(result);expect($('winnerTitle').textContent==='No faction victory'&&$('winCard').querySelector('.personal-victories').textContent.includes('Leader'),'neutral-only ending claimed a faction victory');
    });
    await page.evaluate(()=>{resetCustom('kill');state.phase='setup';hide('gameScreen','onlineGame');show('setupScreen');renderSetup();$('hostSetupPanel').open=true;const details=$('hostPlayerSettings').firstElementChild;details.open=true;details.querySelector('details').open=true;details.scrollIntoView();});
    for(const width of [390,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);}
    await page.screenshot({path:path.join(require('node:os').tmpdir(),'mafia-customisation-host.png'),fullPage:true,animations:'disabled'});
    assert.deepEqual(errors,[]);console.log('Customisation browser checks passed: host enforcement, disguises, challenges, Policeman, Bestow, reactions, timeline and responsive layout.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
