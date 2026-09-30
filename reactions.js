// Night reactions are loaded before abilities and roles.
const EXTRA_REACTIONS = Object.freeze({});

const NIGHT_REACTIONS = Object.freeze({
  scapegoat: {label:'Redirect a night attack', category:'Redirective'},
  escape: {label:'Escape challenge', category:'Defensive'},
  monkey: {label:'Confront the attacker', category:'Retaliatory'},
  rps: {label:'Rock, Paper, Scissors', category:'Defensive'},
  traitor: {label:'Join the Mafia when attacked', category:'Transformative'},
  ...EXTRA_REACTIONS
});

const NIGHT_REACTION_ACTIONS = new Set(Object.keys(NIGHT_REACTIONS));

// The built-in reactions are handled in index.html.
function prepareNewReactions() {}
function newReactionTurn() { return null; }
function renderNewReaction() { return false; }
function resolveNewReaction() { return ''; }
function settleUnhandledExtraAttacks() {}
function publishReactionAnnouncements() {}
