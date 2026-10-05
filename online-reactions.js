// Online two-device reactions. The host owns timing, choices and outcomes.
let onlineDuelHostTimer = null;
let onlineDuelClientTimer = null;
let onlineDuelClient = null;
function onlineDuelNow() { return Date.now() + Number(online.serverTimeOffset || 0); }
function stopOnlineDuels() {
  clearTimeout(onlineDuelHostTimer); clearInterval(onlineDuelClientTimer);
  onlineDuelHostTimer = onlineDuelClientTimer = null;
  onlineDuelClient = null;
}
function ensureOnlineDuel() {
  clearTimeout(onlineDuelHostTimer);
  onlineDuelHostTimer = null;
  const n = state.night;
  if (state.phase !== 'night' || n.round !== 2 || n.onlineAckNeeded) return;
  const target = onlineCurrentNightActor();
  const attack = target && findPendingAttacksFor(target.id)[0];
  const action = target && nightReactionFor(target);
  if (!attack || !['escape','rps'].includes(action)) { n.onlineDuel = null; return; }
  if (!n.onlineDuel) {
    const attacker = playerOf(attack.attackerId);
    if (!attacker || attacker.removed || attacker.id === target.id) return;
    n.onlineDuelSequence = (n.onlineDuelSequence || 0) + 1;
    n.onlineDuel = {id:`${state.round}:${n.index}:${n.onlineDuelSequence}`, action,
      targetId:target.id, attackerId:attacker.id, round:1, ready:{}, counts:{}, choices:{}, scores:{}, lastRound:'', startAt:0, endAt:0};
  }
  const duel = n.onlineDuel;
  // Firebase omits empty maps; restore them before handling a rejoined host.
  duel.ready ||= {}; duel.counts ||= {}; duel.choices ||= {}; duel.scores ||= {};
  if (duel.action === 'escape' && duel.endAt) {
    onlineDuelHostTimer = setTimeout(() => finishOnlineEscape(duel.id, duel.round).catch(console.error), Math.max(0, duel.endAt + 1500 - onlineDuelNow()));
  }
}
function onlineDuelPayload(player) {
  const duel = state.night?.onlineDuel;
  if (state.phase !== 'night' || !duel || ![duel.targetId,duel.attackerId].includes(player.id)) return null;
  const opponent = playerOf(player.id === duel.targetId ? duel.attackerId : duel.targetId);
  // Opponent choices stay host-private until both choices have been submitted.
  return {type:'duel',action:duel.action,id:duel.id,round:duel.round,opponent:opponent?.name || 'Opponent',
    ready:!!duel.ready?.[player.id],submitted:!!duel.choices?.[player.id],
    count:duel.counts?.[player.id] || 0,startAt:duel.startAt,endAt:duel.endAt,
    yourScore:duel.scores?.[player.id] || 0,opponentScore:duel.scores?.[opponent?.id] || 0,lastRound:duel.lastRound || ''};
}
async function resolveOnlineDuel(duel, targetWon, summary) {
  if (state.night.onlineDuel !== duel) return;
  const target = playerOf(duel.targetId), attacker = playerOf(duel.attackerId);
  const attack = findPendingAttacksFor(target.id).find(a => a.attackerId === duel.attackerId);
  state.night.onlineDuel = null;
  clearTimeout(onlineDuelHostTimer);
  if (!attack) { await publishOnlineRoom(); return; }
  removePendingAttack(attack);
  if (duel.action === 'escape') target.escaped = targetWon;
  if (!targetWon) setPlayerAlive(target,false);
  const result = `${summary} ${targetWon ? `${target.name} survived.` : `${target.name} was killed.`}`;
  addLog(result);
  setPrivateResult(target.id,result);
  if (attacker) setPrivateResult(attacker.id,result);
  await onlineCompleteReactiveOrAdvance(target);
}
async function finishOnlineEscape(id, round) {
  const duel = state.night?.onlineDuel;
  if (!online.isHost || state.phase !== 'night' || !duel || duel.id !== id || duel.round !== round || !duel.endAt || onlineDuelNow() < duel.endAt + 1500) return;
  const targetCount = duel.counts[duel.targetId] || 0, attackerCount = duel.counts[duel.attackerId] || 0;
  if (targetCount === attackerCount) {
    duel.round++; duel.ready={}; duel.counts={}; duel.startAt=duel.endAt=0;
    duel.lastRound=`Tied at ${targetCount} taps each. Ready up for another 15-second contest.`;
    bumpOnlineVersion(); await publishOnlineRoom(); return;
  }
  await resolveOnlineDuel(duel,targetCount > attackerCount,`Escape contest: ${playerOf(duel.targetId).name} ${targetCount} taps; ${playerOf(duel.attackerId).name} ${attackerCount} taps.`);
}
async function handleOnlineDuelCommand(actor, value, uid, commandId) {
  const duel = state.night?.onlineDuel;
  const reject = async message => { ackOnlineCommand(uid,commandId,false,message); await publishOnlineRoom(); };
  if (!duel || !value || typeof value !== 'object' || value.id !== duel.id || value.round !== duel.round || ![duel.targetId,duel.attackerId].includes(actor.id)) return reject('This contest is no longer available to you.');
  duel.ready ||= {}; duel.counts ||= {}; duel.choices ||= {}; duel.scores ||= {};
  if (duel.action === 'escape') {
    if (value.kind === 'ready' && !duel.startAt) {
      duel.ready[actor.id]=true;
      if (duel.ready[duel.targetId] && duel.ready[duel.attackerId]) {
        duel.startAt=onlineDuelNow()+3000; duel.endAt=duel.startAt+15000;
      }
    } else if (value.kind === 'taps') {
      const now=onlineDuelNow(), count=Number(value.count);
      if (!duel.startAt || now < duel.startAt || now > duel.endAt+1500 || !Number.isInteger(count) || count < (duel.counts[actor.id] || 0) || count > Math.ceil(Math.min(15000,now-duel.startAt)/1000)*100) return reject('That tap count is outside the active contest.');
      duel.counts[actor.id]=count;
    } else return reject('That contest action is unavailable.');
  } else {
    if (value.kind !== 'choice' || !['rock','paper','scissors'].includes(value.choice) || duel.choices[actor.id]) return reject('Choose once per round: Rock, Paper or Scissors.');
    duel.choices[actor.id]=value.choice;
    const targetChoice=duel.choices[duel.targetId], attackerChoice=duel.choices[duel.attackerId];
    if (targetChoice && attackerChoice) {
      const beats={rock:'scissors',paper:'rock',scissors:'paper'};
      const winner=targetChoice===attackerChoice ? null : beats[targetChoice]===attackerChoice ? duel.targetId : duel.attackerId;
      if (winner !== null) duel.scores[winner]=(duel.scores[winner] || 0)+1;
      duel.lastRound=`${playerOf(duel.targetId).name}: ${targetChoice}. ${playerOf(duel.attackerId).name}: ${attackerChoice}. ${winner===null ? 'Tie — replay this round.' : `${playerOf(winner).name} wins the round.`}`;
      if (winner !== null && duel.scores[winner] === 2) {
        ackOnlineCommand(uid,commandId,true,'Match resolved.');
        await resolveOnlineDuel(duel,winner===duel.targetId,`Rock, Paper, Scissors: ${duel.scores[duel.targetId] || 0}–${duel.scores[duel.attackerId] || 0}. ${duel.lastRound}`);
        return;
      }
      duel.round++; duel.choices={};
    }
  }
  ackOnlineCommand(uid,commandId,true,'Contest action recorded.');
  bumpOnlineVersion(); await publishOnlineRoom();
}
async function sendOnlineDuelAction(turn, kind, extra={}) {
  try {
    const {dbMod}=online.api;
    const ref=dbMod.push(dbMod.ref(online.db,`rooms/${online.roomCode}/commands`));
    await dbMod.set(ref,{uid:online.uid,seatId:online.seatId,type:'action',createdAt:Date.now(),
      payload:{turnType:'duel',actionType:'duel',version:Number(online.public?.version || 0),value:{id:turn.id,round:turn.round,kind,...extra}}});
  } catch { $('onlineActionPrompt').textContent='Could not send the contest action. Check your connection and try again.'; }
}
function renderOnlineDuel(area,turn) {
  const key=`${turn.id}:${turn.round}`;
  if (onlineDuelClient?.key !== key) onlineDuelClient={key,count:turn.count || 0,sent:turn.count || 0,lastSentAt:0,finished:false};
  const client=onlineDuelClient;
  client.count=Math.max(client.count,turn.count || 0);
  $('onlineActionTitle').textContent=turn.action==='escape' ? 'Escape contest' : 'Rock, Paper, Scissors';
  if (turn.action==='rps') {
    $('onlineActionPrompt').textContent=`Against ${turn.opponent}. First to win two rounds wins; ties replay. Score: ${turn.yourScore}–${turn.opponentScore}. ${turn.lastRound}`;
    if (turn.submitted) area.textContent='Choice locked. Waiting for your opponent.';
    else for (const choice of ['rock','paper','scissors']) {
      const button=actionButton(choice[0].toUpperCase()+choice.slice(1),choice,()=>{
        [...area.querySelectorAll('button')].forEach(b=>b.disabled=true);
        sendOnlineDuelAction(turn,'choice',{choice});
      });
      area.appendChild(button);
    }
    return;
  }
  if (!turn.startAt) {
    $('onlineActionPrompt').textContent=`Against ${turn.opponent}. Tap/click faster for 15 seconds. Both players must be ready. ${turn.lastRound}`;
    if (turn.ready) area.textContent='Ready. Waiting for your opponent.';
    else area.appendChild(actionButton('Ready','duelReady',event=>sendOnlineDuelAction(turn,'ready')));
    return;
  }
  const status=document.createElement('div'); status.className='notice'; status.setAttribute('aria-live','off');
  const button=document.createElement('button'); button.type='button'; button.className='action-btn';
  button.textContent='TAP / CLICK'; button.style.cssText='min-height:130px;font-size:28px;touch-action:manipulation;user-select:none';
  area.appendChild(status); area.appendChild(button);
  const tap=()=>{
    const now=onlineDuelNow();
    if (now>=turn.startAt && now<turn.endAt) { client.count++; status.textContent=`${Math.ceil((turn.endAt-now)/1000)} seconds · ${client.count} taps`; }
  };
  button.addEventListener('pointerdown',event=>{ if (event.button===0) { event.preventDefault(); tap(); } });
  button.addEventListener('click',event=>{ if (event.detail===0) tap(); });
  const tick=()=>{
    if (online.private?.turn?.id !== turn.id || online.private?.turn?.round !== turn.round || online.public?.phase !== 'night') { clearInterval(onlineDuelClientTimer); return; }
    const now=onlineDuelNow();
    button.disabled=now<turn.startAt || now>=turn.endAt;
    status.textContent=now<turn.startAt ? `Starting in ${Math.ceil((turn.startAt-now)/1000)}…` : now>=turn.endAt ? `Finished · ${client.count} taps. Waiting for the result…` : `${Math.ceil((turn.endAt-now)/1000)} seconds · ${client.count} taps`;
    if (now>=turn.startAt && ((!client.finished && now>=turn.endAt) || (client.count!==client.sent && now-client.lastSentAt>=300))) {
      client.sent=client.count; client.lastSentAt=now;
      if(now>=turn.endAt)client.finished=true;
      sendOnlineDuelAction(turn,'taps',{count:client.count});
    }
  };
  onlineDuelClientTimer=setInterval(tick,100); tick();
}
