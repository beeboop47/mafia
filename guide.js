// Public reference material only: never read player assignments or night results.
let guideSection = 'roles';
const GUIDE_ABILITIES = {
  none:'You have no active night power. You still discuss and vote during the day.',
  compare:'Choose two players to learn whether they share an allegiance. You do not learn which allegiance.',
  exclude:'Choose a player to learn one allegiance they do not belong to.',
  audit:'Choose a player to learn whether they used a night ability, without learning the ability or target.',
  inspectOrientation:'Choose a living player to learn whether they are Good, Neutral, or Evil. Ordinary results can be affected by deception.',
  track:'Choose a player to learn whom they visited and which ability they used. This reports the action, not whether it succeeded.',
  janitor:'During night reactions, choose someone killed that night and learn their exact role.',
  framer:'Choose a player and a false role. Ordinary investigations see that false identity for the night; the real role does not change.',
  changeRole:'Choose a player and a replacement role. Their role, allegiance, ability, and reaction change permanently.',
  teamKill:'Choose a player to attack. Players sharing this team kill get one attack between them each night.',
  kill:'Choose one living player to attack. Protection and night reactions may stop or change the attack.',
  roleblock:'Choose a player to stop their night ability for this night.',
  silence:'Choose a player to stop them voting during the next day.',
  protect:'Choose a player to protect from ordinary attacks tonight. This does not bring a dead player back.',
  doctor:'Once per game, during night reactions, revive one player killed that night. You may save this power for a later night.',
  seer:'Automatically learn the exact role of a random other living player each night.',
  hater:'Receive one permanent target on the first night. Getting that target voted out completes your special win condition.',
  gambler:'Receive a random ability each night. Your choices depend on the ability you roll.'
};
const GUIDE_REACTIONS = {
  none:'You have no night reaction. Attacks are resolved using any other protection or effects in play.',
  scapegoat:'Once per game, redirect an attack against you to a living neighbour in the seating order.',
  escape:'When attacked, play a timed escape challenge against the attacker. Winning lets you escape that attack.',
  monkey:'When attacked, openly confront the attacker before the result is resolved. This does not automatically protect you.',
  rps:'When attacked, play best-of-three Rock, Paper, Scissors against the attacker to decide who survives.',
  traitor:'When attacked, join Evil instead of dying from that attack.'
};
function guideCatalog(section) {
  if(section==='roles') {
    const roles=new Map(DEFAULT_ROLES.map(r=>[r.id,r]));
    for(const role of state.roles)roles.set(role.id,role);
    return [...roles.values()].map(role=>({name:role.title,category:labelOrientation(role.orientation),
      description:role.description||'A custom role. Its powers are listed below.',
      extra:[`Ability: ${NIGHT_ACTIONS[roleActiveNightAction(role)]?.label||'None'}.`,
        `Reaction: ${NIGHT_REACTIONS[roleNightReaction(role)]?.label||'None'}.`,
        role.orientation==='neutral'?(normalizedWinCondition(role)==='votedOut'?'Goal: get voted out. Simply surviving is not a victory.':'Goal: survive to the end. You can win personally alongside either faction.'):
          `Goal: help ${labelOrientation(role.orientation)} win.`,
        normalizedWinCondition(role)==='sideWhenTargetVotedOut'?'Special goal: get your assigned target voted out.':'']
        .filter(Boolean).join(' ')}));
  }
  if(section==='abilities')return [
    {name:'None',category:'No ability',description:GUIDE_ABILITIES.none},
    ...Object.entries(NIGHT_ACTIONS).filter(([id])=>!NIGHT_REACTION_ACTIONS.has(id)).map(([id,spec])=>({
      name:spec.label,category:spec.category||'Miscellaneous',description:spec.prompt||GUIDE_ABILITIES[id]||spec.label
    }))
  ];
  return [{name:'None',category:'No reaction',description:GUIDE_REACTIONS.none},
    ...Object.entries(NIGHT_REACTIONS).map(([id,spec])=>({name:spec.label,category:spec.category,
      description:GUIDE_REACTIONS[id]||reactionDescription(id)}))];
}
function renderGuide(resetCategory=false) {
  const entries=guideCatalog(guideSection).sort((a,b)=>a.name.localeCompare(b.name));
  const category=$('guideCategory');
  if(resetCategory){
    category.replaceChildren(new Option('All categories',''));
    [...new Set(entries.map(e=>e.category))].sort().forEach(name=>category.appendChild(new Option(name,name)));
  }
  document.querySelectorAll('[data-guide-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.guideTab===guideSection)));
  $('guideIntro').textContent={
    roles:'These are role definitions, including your customisations—not a list of roles assigned in this game. Recognition and investigations are different: a disguise can fool recognition without changing the true role.',
    abilities:'Choose a target when your night turn asks you to. Passive abilities work automatically. A host-assigned choice replaces your choice for that night. Role settings may limit targets and uses.',
    reactions:'Reactions happen when you are attacked. Stopping one attack does not always protect against other attacks that night. Once-per-game powers stay spent after revival. Expand an entry to see its effect.'
  }[guideSection];
  const query=$('guideSearch').value.trim().toLowerCase();
  const filtered=entries.filter(e=>(!category.value||category.value===e.category)&&`${e.name} ${e.category} ${e.description} ${e.extra||''}`.toLowerCase().includes(query));
  const kind=guideSection==='roles'?'role':guideSection==='abilities'?'ability':'night reaction';
  $('guideCount').textContent=`${filtered.length} ${filtered.length===1?kind:guideSection==='abilities'?'abilities':kind+'s'}`;
  $('guideEntries').replaceChildren();
  for(const entry of filtered){
    const card=document.createElement('details');card.className='guide-entry';
    const heading=document.createElement('summary'),name=document.createElement('strong'),tag=document.createElement('span');
    name.textContent=entry.name;tag.textContent=entry.category;tag.className='muted tiny';heading.append(name,tag);card.appendChild(heading);
    const text=document.createElement('p');text.textContent=entry.description;card.appendChild(text);
    if(entry.extra){const extra=document.createElement('p');extra.textContent=entry.extra;extra.className='muted tiny';card.appendChild(extra);}
    $('guideEntries').appendChild(card);
  }
  if(!filtered.length){const text=document.createElement('p');text.textContent='No matches. Try another search or category.';$('guideEntries').appendChild(text);}
}
function openGameGuide(){renderGuide(true);$('gameGuide').showModal();$('guideSearch').focus();}
