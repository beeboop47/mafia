// Judge authority belongs to the special role, independently of its night ability.
function isJudge(player) {
  return !!player && roleHasSpecialId(roleOf(player), 'judge');
}

function canAbilityTarget(player) {
  return !!player && !player.removed && !isJudge(player);
}

function dayJudge() {
  return playersAlive().find(isJudge) || null;
}

function dayDecisionReady() {
  const judge = dayJudge();
  if (judge) {
    const choice = state.day.votes[judge.id];
    return choice === 'skip' || (isChosen(choice) && validDayTarget(judge, choice));
  }
  return playersAlive().every(p => p.silenced || isChosen(state.day.votes[p.id]));
}

function judgePresenceText() {
  return dayJudge() ? 'A Judge is present. Only the Judge may skip voting or choose who is voted out. A verdict against a Good player eliminates the Judge too. No ability can target the Judge.' : '';
}

function announceJudgePresence() {
  const judge = dayJudge();
  const previous = state.judgeAnnouncedId;
  if (judge && previous !== judge.id) addLog(judgePresenceText(), 'public');
  state.judgeAnnouncedId = judge?.id ?? null;
}

function renderJudgeDay(judge, area) {
  const box = document.createElement('div');
  box.className = 'target-card';
  box.innerHTML = `<strong>${escapeHtml(judge.name)} — Judge</strong><div class="muted tiny" style="margin-top:5px">Discuss together, then the Judge alone chooses a verdict.</div>`;
  const select = document.createElement('select');
  select.style.marginTop = '6px';
  select.appendChild(new Option('Choose a verdict', ''));
  select.appendChild(new Option('Skip — eliminate nobody', 'skip'));
  playersAlive().filter(p => validDayTarget(judge, p.id)).forEach(p => select.appendChild(new Option(`Vote out ${p.name}`, p.id)));
  select.value = isChosen(state.day.votes[judge.id]) ? state.day.votes[judge.id] : '';
  select.addEventListener('change', event => {
    const value = event.target.value;
    const targetId = value === '' ? null : Number(value);
    state.day.votes = {};
    state.day.votes[judge.id] = value === 'skip' ? 'skip' : targetId != null && validDayTarget(judge, targetId) ? targetId : null;
    updateDayResolveButton();
  });
  box.appendChild(select);
  area.appendChild(box);
  $('dayResult').innerHTML = '';
  updateDayResolveButton();
}

function applyJudgeVerdict() {
  const judge = dayJudge();
  if (!judge || state.phase !== 'day' || state.day.judgeResolved || !dayDecisionReady()) return null;
  const choice = state.day.votes[judge.id];
  state.day.judgeResolved = true;
  state.day.secondBallot = false;
  state.day.tiedCandidates = [];
  if (choice === 'skip') {
    addLog('The Judge skipped voting; nobody was eliminated.', 'public');
    return {skipped: true, judgeId: judge.id};
  }
  const out = playerOf(choice);
  const role = roleOf(out);
  setPlayerAlive(out, false);
  out.eliminatedByVote = true;
  addLog(`${out.name} was voted out by the Judge.`, 'public');
  const mistaken = role?.orientation === 'good';
  if (mistaken) {
    setPlayerAlive(judge, false, true);
    judge.eliminatedByVote = true;
    addLog(`${judge.name}, the Judge, was voted out alongside ${out.name} for choosing a Good player. Ordinary voting returns.`, 'public');
  }
  return {skipped: false, judgeId: judge.id, outId: out.id, mistaken};
}
