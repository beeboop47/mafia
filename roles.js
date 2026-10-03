const DEFAULT_ROLES = [
  {
    id: 'bodyguard', title: 'Bodyguard', orientation: 'good',
    description: 'Defend a chosen player from attacks.',
    visibility: 'nobody', nightAction: 'protect', nightReaction: 'none', randomEnabled: false, randomCount: 1
  },
  {
    id: 'citizen', title: 'Citizen', orientation: 'good',
    description: 'You are a Citizen. Figure out which of you are the Mafia and help the good side eliminate every evil player.',
    visibility: 'nobody', nightAction: 'none'
  },
  {
    id: 'detective', title: 'Detective', orientation: 'good',
    description: 'Each night, choose one living player and learn whether their orientation is good, neutral, or evil. The answer is truthful.',
    visibility: 'nobody', nightAction: 'inspectOrientation'
  },
  {
    id: 'doctor', title: 'Doctor', orientation: 'good',
    description: 'During night reactions, you may choose one player killed that night and revive them. You may revive exactly once per game, or choose not to revive anyone tonight.',
    visibility: 'nobody', nightAction: 'doctor'
  },
  {
    id: 'escapist', title: 'Escapist', orientation: 'good',
    description: 'If the Mafia target you, you get a chance to escape by literally running away from the Mafia. You have 15 seconds to survive the kill.',
    visibility: 'nobody', nightAction: 'none', nightReaction: 'escape'
  },
  {
    id: 'janitor', title: 'Janitor', orientation: 'good',
    description: 'During the night reactions, while cleaning up a body, choose one player killed that night and learn their exact role.',
    visibility: 'nobody', nightAction: 'janitor'
  },
  {
    id: 'joker', title: 'Joker', orientation: 'good',
    description: 'When you are targeted by a night kill, you and the perpetrator play a best-of-3 Rock, Paper, Scissors. The game decides who survives the encounter.',
    visibility: 'nobody', nightAction: 'none', nightReaction: 'rps'
  },
  {
    id: 'lookout', title: 'Lookout', orientation: 'good',
    description: 'Track a player to learn who they visited and which ability they used that night.',
    visibility: 'nobody', nightAction: 'track', nightReaction: 'none', randomEnabled: false, randomCount: 1
  },
  {
    id: 'monkey', title: 'Monkey', orientation: 'good',
    description: 'If you are targeted by a night kill, you may make a loud sound or otherwise openly confront your perpetrator directly before the result is resolved.',
    visibility: 'nobody', nightAction: 'none', nightReaction: 'monkey'
  },
  {
    id: 'peacemaker', title: 'Peacemaker', orientation: 'good',
    description: 'Each night, you may use your team kill to attempt to kill one player. Any other Peacemaker shares the same team kill, so only one Peacemaker can use it per night.',
    visibility: 'nobody', nightAction: 'teamKill'
  },
  {
    id: 'policeman', specialId: 'policeman', title: 'Policeman', orientation: 'good',
    description: 'When you first reveal this role, you are assigned one permanent intelligence target and learn that player’s exact role and alignment. You may hint at what you know, but you must never directly claim that you are the Policeman. Your intelligence is repeated privately every night.',
    visibility: 'nobody', nightAction: 'none', randomEnabled: false, randomCount: 1
  },
  {
    id: 'scapegoat', title: 'Scapegoat', orientation: 'good',
    description: 'If the Mafia successfully target you, you may transfer that attempted kill to a living player on either side of you once per game.',
    visibility: 'nobody', nightAction: 'none', nightReaction: 'scapegoat'
  },
  {
    id: 'seer', title: 'Seer', orientation: 'good',
    description: 'Each night, see the exact role of one random living player other than yourself.',
    visibility: 'nobody', nightAction: 'seer'
  },
  {
    id: 'traitor', title: 'Traitor', orientation: 'good',
    description: 'If the Mafia target you, you join the Mafia instead of dying. Your orientation becomes evil from that point onward.',
    visibility: 'evil', nightAction: 'none', nightReaction: 'traitor'
  },
  {
    id: 'framer', title: 'Framer', orientation: 'neutral',
    description: 'At the beginning of the night, choose any player, including yourself. That player chooses any role for the night. Detectives and Seers will treat that player as their chosen role.',
    visibility: 'nobody', nightAction: 'framer'
  },
  {
    id: 'gambler', title: 'Gambler', orientation: 'neutral',
    description: 'Every night, you receive a completely random night ability. Use whatever ability you are given that night.',
    visibility: 'nobody', nightAction: 'gambler'
  },
  {
    id: 'jester', specialId: 'jester', title: 'Jester', orientation: 'neutral',
    description: 'Try to get voted out by the Citizens during the day. You win immediately when the town votes you out.',
    visibility: 'nobody', nightAction: 'none', winCondition: 'votedOut'
  },
  {
    id: 'leader', title: 'Leader', orientation: 'neutral',
    description: 'Each night, choose a living player and permanently replace their role with another role from the library. Their allegiance, visibility, ability and special win condition all become those of the new role.',
    visibility: 'nobody', nightAction: 'changeRole', randomEnabled: false, randomCount: 1
  },
  {
    id: 'persuader', title: 'Persuader', orientation: 'neutral',
    description: 'Each night, convince one living player that they should step away from the next day\'s vote. That player cannot vote the next day.',
    visibility: 'nobody', nightAction: 'silence'
  },
  {
    id: 'serial_killer', specialId: 'serial_killer', title: 'Serial Killer', orientation: 'neutral',
    description: 'Each night, choose one living player to kill.',
    visibility: 'nobody', nightAction: 'kill'
  },
  {
    id: 'anaesthetist', title: 'Anaesthetist', orientation: 'evil',
    description: 'Drug a player with anaesthesia to prevent them using their ability that night.',
    visibility: 'evil', nightAction: 'roleblock', nightReaction: 'none', randomEnabled: false, randomCount: 1
  },
  {
    id: 'godfather', specialId: 'godfather', title: 'Godfather', orientation: 'evil',
    description: 'Coordinate with your evil subordinates to kill. Your evil team shares one team kill per night; any living evil player can submit the team kill and only one is used.',
    visibility: 'evil', nightAction: 'teamKill'
  },
  {
    id: 'hacker', title: 'Hacker', orientation: 'evil',
    description: 'Each night, hack one living player so they appear to be a different role for that night. Detectives and Seers will treat that player as the hacked role until morning.',
    visibility: 'evil', nightAction: 'framer'
  },
  {
    id: 'hater', title: 'Hater', orientation: 'evil',
    description: 'At the beginning of the first night, you are assigned a random player as your target for the entire game. If that target is voted out during the day, the evil side immediately wins.',
    visibility: 'evil', nightAction: 'hater', winCondition: 'sideWhenTargetVotedOut'
  },
  {
    id: 'henchman', specialId: 'henchman', title: 'Henchman', orientation: 'evil',
    description: 'If a Policeman is in the game, you and the Policeman recognise each other. You may pressure the Policeman in real life and try to make them act or speak the way you want, but normal game rules still apply.',
    visibility: 'evil', nightAction: 'none', randomEnabled: false, randomCount: 1
  },
  {
    id: 'mafia', title: 'Mafia', orientation: 'evil',
    description: 'You are a Mafia member. You have no special ability, but you are part of the evil side.',
    visibility: 'evil', nightAction: 'none'
  }
];

// Legacy saves may identify a special role by its original role ID.
const SPECIAL_ROLE_IDS = new Set(['policeman', 'henchman', 'godfather', 'jester', 'serial_killer']);
function specialRoleId(role) {
  if (!role) return 'default';
  if (SPECIAL_ROLE_IDS.has(role.specialId)) return role.specialId;
  if ((role.specialId == null || role.specialId === '') && SPECIAL_ROLE_IDS.has(role.id)) return role.id;
  return 'default';
}
function roleHasSpecialId(role, id) { return specialRoleId(role) === id; }
