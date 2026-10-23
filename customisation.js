// Recognition is deliberately separate from true identity and investigation masks.
function recognitionRoleOf(player, viewer=null) {
  const role=roleOf(player);
  if (!role || (viewer && canSeeDeadSpectatorRoles(viewer))) return role;
  return state.roles.find(r=>r.id===role.recognitionRoleId) || role;
}
function privateCustomisationText(player) {
  const role=roleOf(player), parts=[];
  if(role?.recognitionRoleId && role.knowsDisguise!==false){
    const disguise=state.roles.find(r=>r.id===role.recognitionRoleId);
    if(disguise)parts.push(`Players who recognise you see you as ${disguise.title} (${labelOrientation(disguise.orientation)}). Investigations reveal your true identity. You do not automatically recognise their roles.`);
  }
  if(hostSettings(player).challenge?.trim())parts.push(`Personal challenge — all game: ${hostSettings(player).challenge.trim()}`);
  if(Object.keys(hostSettings(player).abilitySchedule||{}).length || hostSettings(player).haterTarget!=null)parts.push('The host has assigned some of your night actions. On those nights you cannot choose or change the assigned action.');
  return parts.join('\n\n');
}
function populateIdentityEditor(role) {
  if(!$('recognitionDisguise')){
    const box=document.createElement('div');box.className='advanced-body';box.id='identityEditor';
    box.innerHTML='<label>Recognition disguise<select id="recognitionDisguise"></select></label><label><input id="knowsDisguise" type="checkbox"> Player knows their disguise</label><p class="muted tiny">Recognition shows this identity. Investigations use the true identity. Disguised players do not automatically learn their supposed teammates.</p><label>Bestow Ability: available gifts<select id="bestowPool" multiple size="7" aria-label="Available abilities to bestow"></select></label><p class="muted tiny">Leave all unselected to allow every ability except Bestow Ability and None.</p>';
    $('roleVisibility').parentElement.appendChild(box);
  }
  const select=$('recognitionDisguise');select.replaceChildren(new Option('No disguise',''));
  sortedRoles(state.roles.filter(r=>r.id!==role?.id)).forEach(r=>select.add(new Option(`${r.title} · ${labelOrientation(r.orientation)}`,r.id)));
  select.value=role?.recognitionRoleId||'';$('knowsDisguise').checked=role?.knowsDisguise!==false;
  const pool=$('bestowPool');pool.replaceChildren();
  Object.entries(NIGHT_ACTIONS).filter(([id])=>id!=='none'&&id!=='bestowAbility'&&!NIGHT_REACTION_ACTIONS.has(id)).forEach(([id,a])=>{const o=new Option(a.label,id);o.selected=role?.bestowPool?.includes(id)||false;pool.add(o);});
}
function identityEditorSettings(){return {recognitionRoleId:$('recognitionDisguise')?.value||null,knowsDisguise:$('knowsDisguise')?.checked!==false,bestowPool:[...($('bestowPool')?.selectedOptions||[])].map(o=>o.value)};}

function hostAbilityAssignment(actor) {
  if(state.mode!=='manual')return null;
  const assignment=hostSettings(actor).abilitySchedule?.[state.round];
  if(nightActionFor(actor)==='hater' && hostSettings(actor).haterTarget!=null)return {action:'hater',value:hostSettings(actor).haterTarget};
  return assignment && assignment.action===nightActionFor(actor) ? assignment : null;
}
function hostAssignmentChoices(actor,action,setup=false){
  if(EXTRA_ABILITIES[action]){
    const choices=extraChoices(actor,action);
    if(setup && EXTRA_ABILITIES[action].dead)choices.targets=state.players.filter(p=>p.id!==actor.id&&!p.removed&&canAbilityTarget(p)).map(p=>({id:String(p.id),name:p.name}));
    return choices;
  }
  if(isLimitedInvestigation(action))return {targets:limitedInvestigationChoices(actor,action),secondary:[]};
  const targets=(setup?state.players:action==='doctor'||action==='janitor'?(state.night.round1Players||[]).filter(p=>!p.alive&&!p.removed&&!p.fakeDeathReturnRound):validAbilityTargets(actor,roleOf(actor))).filter(p=>!p.removed&&canAbilityTarget(p));
  return {targets:targets.map(p=>({id:String(p.id),name:p.name})),secondary:['framer','changeRole'].includes(action)?sortedRoles().filter(r=>action!=='changeRole'||!roleHasSpecialId(r,'judge')||!playersAlive().some(isJudge)).map(r=>({id:r.id,name:r.title})):[],noTarget:['none','gambler','hater'].includes(action)||isPassiveAbility(action)};
}
function hostAssignedValue(actor,secondStep=false){
  const setting=hostAbilityAssignment(actor);if(!setting)return null;
  const action=setting.action;
  if(setting.skip)return 'skip';
  if(!isPassiveAbility(action)&&actionUsesLeft(actor,roleOf(actor))<=0)return 'skip';
  if(EXTRA_ABILITIES[action]){
    if(!EXTRA_ABILITIES[action].noTarget&&!isPassiveAbility(action)&&(setting.value==null||setting.value===''))return 'skip';
    const value=JSON.stringify({targetId:Number(setting.value),second:setting.second||'',text:setting.text||''});
    try{parseExtraChoice(actor,action,value);return value;}catch{return 'skip';}
  }
  if(action==='hater')return 'haterAssign';
  if(isPassiveAbility(action)||action==='none')return 'ack';
  const choices=hostAssignmentChoices(actor,action);
  if(!choices.targets.some(p=>String(p.id)===String(setting.value)))return 'skip';
  if(choices.secondary.length && !choices.secondary.some(o=>o.id===setting.second))return 'skip';
  if(['framer','changeRole'].includes(action)&&!choices.secondary.length)return 'skip';
  if(action==='changeRole'&&playerOf(setting.value)?.roleId===setting.second)return 'skip';
  return String(secondStep?setting.second:setting.value);
}
function renderExpandedHostSetup(){
  [...$('hostPlayerSettings').children].forEach((details,index)=>{
    const player=state.players[index];if(!player)return;
    const config=player.hostSetup ||= {}, body=details.querySelector('.advanced-body');
    const label=document.createElement('label');label.textContent='Personal challenge (private, lasts the whole game)';
    const challenge=document.createElement('textarea');challenge.maxLength=500;challenge.placeholder='For example: speak in a subtle Icelandic accent';challenge.value=config.challenge||'';challenge.oninput=()=>{config.challenge=challenge.value;};label.appendChild(challenge);body.appendChild(label);
    if(state.mode!=='manual'||!roleOf(player))return;
    const baseAction=roleActiveNightAction(roleOf(player));
    if(['none','seer','hater','signalReceiver'].includes(baseAction)||isPassiveAbility(baseAction)){
      const note=document.createElement('p');note.className='muted tiny';note.textContent='This ability has no player-selected action. Its available assignments are shown above.';body.appendChild(note);return;
    }
    const section=document.createElement('details');section.className='advanced-panel';
    const heading=document.createElement('summary');heading.textContent=`Host-assigned ${NIGHT_ACTIONS[baseAction]?.label||baseAction} by night`;section.appendChild(heading);
    const rows=document.createElement('div');rows.className='advanced-body';section.appendChild(rows);
    const schedule=config.abilitySchedule ||= {};
    function addRow(night){
      const action=baseAction==='gambler'?(config.gamblerSchedule?.[night]||'none'):baseAction;
      const row=document.createElement('div');row.className='host-night-row';row.dataset.night=night;
      const title=document.createElement('strong');title.textContent=`Night ${night}`;row.appendChild(title);
      if(baseAction==='gambler'){
        const ability=document.createElement('select');ability.setAttribute('aria-label',`Night ${night} Gambler ability`);ability.add(new Option('Choose the Gambler ability first','none'));gamblerAbilityPool().forEach(id=>ability.add(new Option(NIGHT_ACTIONS[id]?.label||id,id)));ability.value=action;
        ability.onchange=()=>{(config.gamblerSchedule ||= {})[night]=ability.value;delete schedule[night];renderHostSetup();};row.appendChild(ability);
      }
      const mode=document.createElement('select');mode.setAttribute('aria-label',`Night ${night} control`);mode.add(new Option('Player chooses',''));mode.add(new Option('Host assigns','assign'));mode.add(new Option('Do not use ability','skip'));row.appendChild(mode);
      const controls=document.createElement('div');controls.className='grid2';row.appendChild(controls);
      const setting=schedule[night]?.action===action?schedule[night]:{};mode.value=setting.action?(setting.skip?'skip':'assign'):'';
      const choices=hostAssignmentChoices(player,action,true);
      function picker(title,options,value){const wrap=document.createElement('label');wrap.textContent=title;const select=document.createElement('select');select.add(new Option('Choose',''));options.forEach(o=>select.add(new Option(o.name,String(o.id))));select.value=value??'';wrap.appendChild(select);controls.appendChild(wrap);return select;}
      const target=choices.noTarget?null:picker('Assigned target',choices.targets,setting.value);
      const second=choices.secondary.length?picker('Assigned choice',choices.secondary,setting.second):null;
      let text;
      if(choices.text){const wrap=document.createElement('label');wrap.textContent='Assigned message';text=document.createElement('textarea');text.maxLength=500;text.value=setting.text||'';wrap.appendChild(text);controls.appendChild(wrap);}
      const save=()=>{controls.hidden=mode.value!=='assign';if(!mode.value)delete schedule[night];else schedule[night]={action,skip:mode.value==='skip',value:target?.value||'',second:second?.value||'',text:text?.value||''};};
      [mode,target,second,text].filter(Boolean).forEach(field=>field.addEventListener(field===text?'input':'change',save));controls.hidden=mode.value!=='assign';rows.appendChild(row);
    }
    let last=Math.max(1,...[...Object.keys(schedule),...Object.keys(baseAction==='gambler'?config.gamblerSchedule||{}:{})].map(Number).filter(n=>n>0&&n<=1000));for(let n=1;n<=last;n++)addRow(n);
    const add=document.createElement('button');add.type='button';add.className='ghost';add.textContent='Add night';add.onclick=()=>addRow(++last);rows.appendChild(add);
    const note=document.createElement('p');note.className='muted tiny';note.textContent='Assignments remove the player’s choice. An invalid target or option skips the action. Normal protection, blocking and use limits still apply.';rows.appendChild(note);body.appendChild(section);
  });
}

function recordTimelineEvent(text,playerIds=[]){
  if(state.phase==='setup')return;
  (state.timeline ||= []).push({round:state.round,phase:state.phase,text:String(text),playerIds});
}
function recordTimelinePrivate(id,message){
  if(!message||state.phase!=='night')return;
  const el=document.createElement('div');el.innerHTML=String(message).replace(/<br\s*\/?\s*>/gi,'\n');
  const text=el.textContent?.trim();if(!text)return;
  const key=`${id}:${text}`,seen=state.night.timelineRecorded ||= [];
  if(seen.includes(key))return;seen.push(key);
  recordTimelineEvent(`${playerOf(id)?.name||'Player'} — ${text}`,[id]);
}
function timelineHtml(events,players){
  const names=players.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
  let previous='';
  const rows=events.map(e=>{const group=`${e.phase==='night'?'Night':e.phase==='day'?'Day':e.phase==='handoff'?'Assignments':'Game over'} ${e.round}`;const title=group===previous?'':`<h4>${escapeHtml(group)}</h4>`;previous=group;return `<div class="timeline-entry" data-players="${escapeHtml((e.playerIds||[]).join(','))}">${title}<p>${escapeHtml(e.text)}</p></div>`;}).join('');
  return `<details class="advanced-panel game-timeline" open><summary>Game timeline</summary><div class="advanced-body"><label>Follow a player<select class="timeline-filter"><option value="">Everyone</option>${names}</select></label><div>${rows||'<p>No events recorded for this saved game.</p>'}</div></div></details>`;
}
function showGameTimeline(container,events,players){
  container.querySelector('.game-timeline')?.remove();container.insertAdjacentHTML('beforeend',timelineHtml(events,players));
  container.querySelector('.timeline-filter').onchange=event=>{
    const value=event.target.value;
    container.querySelectorAll('.timeline-entry').forEach(row=>{row.hidden=!!value&&!row.dataset.players.split(',').includes(value)&&!players.some(p=>String(p.id)===value&&row.textContent.includes(p.name));});
  };
}

function installCustomisation(){
  const originalHostSetup=renderHostSetup;
  renderHostSetup=function(){
    const key=d=>(d.parentElement.closest('details')?.querySelector('summary')?.textContent||'')+'/'+d.querySelector('summary')?.textContent;
    const open=new Set([...$('hostPlayerSettings').querySelectorAll('details[open]')].map(key));
    originalHostSetup();renderExpandedHostSetup();
    $('hostPlayerSettings').querySelectorAll('details').forEach(d=>{if(open.has(key(d)))d.open=true;});
  };
  const originalIntel=specialRoleIntelHtml;
  specialRoleIntelHtml=function(player){const text=privateCustomisationText(player);return originalIntel(player)+(text?`<div class="intel-card personal-challenge" style="white-space:pre-wrap">${escapeHtml(text)}</div>`:'');};
  const originalStandard=renderStandardAction;
  renderStandardAction=function(actor,role,living){
    if(!hostAbilityAssignment(actor))return originalStandard(actor,role,living);
    const value=hostAssignedValue(actor);
    $('nightPrompt').textContent=value==='skip'?'The host’s assignment cannot be used tonight, or the host chose to skip. You cannot choose an alternative.':'Your ability has been assigned by the host. You cannot choose or change it.';
    $('nightActionArea').appendChild(actionButton('Continue with host assignment','hostAssigned',()=>setChoiceAndContinue(actor,value)));
  };
  const originalChoice=setChoiceAndContinue;
  setChoiceAndContinue=function(actor,value){if(hostAbilityAssignment(actor))value=hostAssignedValue(actor);return originalChoice(actor,value);};
  function restrictLocal(actor){
    if(!actor?.alive||!hostAbilityAssignment(actor))return;
    const n=state.night,action=nightActionFor(actor),second=n.framerRoleChooserId===actor.id||n.roleChangeActorId===actor.id;
    if(!second && !['doctor','janitor'].includes(action))return;
    if(findPendingAttacksFor(actor.id).length||newReactionTurn(actor))return;
    const area=$('nightActionArea'),buttons=[...area.querySelectorAll('button[data-choice-value]')];
    if(!buttons.length||buttons.some(b=>/Acknowledge/.test(b.textContent)))return;
    const value=hostAssignedValue(actor,second);
    const selected=buttons.find(b=>b.dataset.choiceValue===value)||buttons.find(b=>b.dataset.choiceValue==='doctorSkip');
    area.replaceChildren();$('nightPrompt').textContent='The host assigned this ability. You cannot choose or change it.';
    area.appendChild(actionButton(selected?'Continue with host assignment':'Assigned option unavailable — continue','hostAssigned',()=>{if(selected)selected.click();else {n.framerRoleChooserId=null;n.roleChangeActorId=null;n.roleChangeTargetId=null;completeNightTurn();}}));
  }
  const originalUpdate=updateNight;updateNight=function(){const result=originalUpdate();const n=state.night;restrictLocal((n.round===2?n.reactionQueue:n.queue)?.[n.index]);return result;};
  const originalReaction=renderReactionTurn;renderReactionTurn=function(actor){originalReaction(actor);restrictLocal(actor);};
  const originalPayload=onlinePrivatePayloadFor;
  onlinePrivatePayloadFor=function(player){
    const payload=originalPayload(player);payload.customisationText=privateCustomisationText(player);
    if(payload.specialIntel?.type==='henchman')payload.specialIntel.policemen=state.players.filter(p=>visibleTo(player,p)&&roleHasSpecialId(recognitionRoleOf(p),'policeman')).map(p=>p.name);
    const turn=payload.turn,setting=hostAbilityAssignment(player);
    if(setting && turn && ((turn.type==='nightRound1' && turn.action!=='proposedPlan')||(['doctor','janitor'].includes(turn.action)&&turn.type==='reaction'))){
      // Preserve the real action type for the server; only the acknowledgement is sent by the player.
      turn.hostAssigned=true;turn.prompt='The host assigned your ability. You cannot choose or change it.';
      turn.options=[{id:'hostAssigned',name:'Continue with host assignment'}];delete turn.extraForm;
    }
    return payload;
  };
  const originalRound1=handleOnlineNightRound1;
  handleOnlineNightRound1=async function(actor,value,actionType,uid=null,commandId=null){
    if(hostAbilityAssignment(actor)&&actionType!=='proposedPlan'&&!proposedPlanningTurn(actor)){
      const second=state.night.framerRoleChooserId===actor.id||state.night.roleChangeActorId===actor.id;
      value=['doctor','janitor'].includes(nightActionFor(actor))?'ack':hostAssignedValue(actor,second);actionType=second?(nightActionFor(actor)==='framer'?'framerRoleChoice':'changeRoleChoice'):nightActionFor(actor);
      if(second && value==='skip'){
        state.night.framerRoleChooserId=null;state.night.roleChangeActorId=null;state.night.roleChangeTargetId=null;
        state.night.round1Submitted[actor.id]=true;ackOnlineCommand(uid,commandId,true,'Host assignment unavailable; ability skipped.');await publishOnlineRoom();await maybeFinishOnlineRound1();return;
      }
    }
    return originalRound1(actor,String(value),actionType,uid,commandId);
  };
  const originalOnlineReaction=handleOnlineNightReaction;
  handleOnlineNightReaction=async function(actor,value,uid=null,commandId=null){
    if(actor.alive && hostAbilityAssignment(actor)&&['doctor','janitor'].includes(nightActionFor(actor))&&!findPendingAttacksFor(actor.id).length&&!newReactionTurn(actor)&&!state.night.onlineAckNeeded){
      const assigned=hostAssignedValue(actor);
      if(assigned==='skip' && nightActionFor(actor)==='janitor'){
        setPrivateResult(actor.id,'The host assigned no available inspection.');state.night.onlineAckNeeded=true;ackOnlineCommand(uid,commandId,true,'Inspection skipped.');await publishOnlineRoom();return;
      }
      value=assigned;
    }
    return originalOnlineReaction(actor,String(value),uid,commandId);
  };
  const originalRenderOnline=renderOnlinePrivate;
  renderOnlinePrivate=function(...args){originalRenderOnline(...args);const text=online.private?.customisationText;if(text){const el=document.createElement('div');el.className='intel-card personal-challenge';el.style.whiteSpace='pre-wrap';el.textContent=text;$('onlineRoleBox').appendChild(el);}};
  const originalAssign=assignRoles;assignRoles=function(...args){const result=originalAssign(...args);if(result!==false){state.timeline=[];state.players.forEach(p=>{const r=roleOf(p);state.timeline.push({round:1,phase:'handoff',playerIds:[p.id],text:`${p.name} was assigned ${r?.title||'Unknown'} (${labelOrientation(r?.orientation)}).`});});}return result;};
  const originalRecord=recordNightAction;recordNightAction=function(actor,action,targetId=null,extra={}){originalRecord(actor,action,targetId,extra);if(!actor)return;const ids=extra.targetIds||[targetId].filter(id=>id!=null);const choice=extra.framedRoleId||extra.newRoleId;recordTimelineEvent(`${actor.name} selected ${NIGHT_ACTIONS[action]?.label||action}${ids.length?' → '+ids.map(id=>playerOf(id)?.name||'departed player').join(', '):''}${choice?' as '+(state.roles.find(r=>r.id===choice)?.title||choice):''}.`,[actor.id,...ids]);};
  const originalNotice=extraNotice;extraNotice=function(id,message){originalNotice(id,message);recordTimelinePrivate(id,message);};
  const originalPrivate=setPrivateResult;setPrivateResult=function(id,message){originalPrivate(id,message);recordTimelinePrivate(id,message);};
  const originalResult=showNightResult;showNightResult=function(message){originalResult(message);const n=state.night,actor=(n?.round===2?n.reactionQueue:n?.queue)?.[n.index];if(actor)recordTimelinePrivate(actor.id,message);};
  const originalAlive=setPlayerAlive;setPlayerAlive=function(player,alive,...args){const before=player?.alive;originalAlive(player,alive,...args);if(player&&before!==player.alive)recordTimelineEvent(`${player.name} ${player.alive?'returned to life':'died'}.`,[player.id]);};
  const originalEnd=endGame;endGame=function(result){originalEnd(result);showGameTimeline($('winCard'),state.timeline||[],state.players);};
  const originalSnapshot=onlinePublicSnapshot;onlinePublicSnapshot=function(){const pub=originalSnapshot();if(state.phase==='gameover')pub.timeline=state.timeline||[];return pub;};
  const originalOnlineEnd=renderOnlineGameOver;renderOnlineGameOver=function(pub){originalOnlineEnd(pub);showGameTimeline($('onlineGameOver'),pub.timeline||[],pub.players||[]);};
  const originalPhase=setPhase;setPhase=function(...args){document.body.dataset.gamePhase=state.phase;return originalPhase(...args);};
  const originalPublicRender=renderOnlinePublic;renderOnlinePublic=function(...args){document.body.dataset.gamePhase=online.public?.phase||state.phase;return originalPublicRender(...args);};
  renderHostSetup();
}
