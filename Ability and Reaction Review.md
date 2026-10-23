# Ability and reaction review

Reviewed the complete selectable catalogue for target/option validation, spent uses, effect lifetime, useful outcomes, host assignment, identity provenance and reaction-order dependence. See [Customisation Guide](Customisation%20Guide.md) for the changes and setup instructions. This is a rules review with regression coverage, not a claim of balanced playtesting for every custom combination.

## Abilities

Host assignment uses the same validation and resolution as player selections. Passive abilities have no player choice to override. Existing targeting, blocking, use limits and investigations remain enforced.

| Ability | Category | Current rule |
|---|---|---|
| Inspect Reaction | Investigative | Learn a player’s current night reaction. |
| Trace Allegiance | Investigative | Learn a player’s allegiance at the start of tonight. |
| Check Protection | Investigative | Learn whether a player received attack protection tonight. |
| Find Interference | Investigative | Learn whether a player’s ability or reaction was blocked tonight. |
| Compare Visitors | Investigative | Learn whether anyone visited both chosen players tonight. |
| Examine Remains | Investigative | Learn the ability a dead player had immediately before their most recent death. |
| Forge Reaction | Deceitful | Choose the reaction Inspect Reaction will report for a player tonight. |
| Swap Reports | Deceitful | Swap two players’ ordinary role and allegiance investigation reports tonight. |
| False Protection | Deceitful | Make Check Protection report protection for a player. Grants no protection. |
| Conceal Visitor | Deceitful | Choose a visitor, then a destination. Hide that visit from ordinary investigations tonight. |
| Forge Interference | Deceitful | Make Find Interference report a roleblock without actually blocking the player. |
| Plant Evidence | Deceitful | Ordinary role and allegiance investigations report this player’s identity from the start of tonight. |
| Exchange Abilities | Transformative | Permanently swap two players’ night abilities. |
| Exchange Reactions | Transformative | Permanently swap two players’ night reactions. |
| Borrow Reaction | Transformative | Use a chosen player’s reaction on the following night only. If they have no usable reaction, keep your own. Target menus do not reveal hidden powers. |
| Temporary Conversion | Transformative | Once per game: change a player’s allegiance for the following night. Reverts at dawn before win checks. |
| Restore Identity | Transformative | Once per game: restore a player’s originally dealt role, allegiance, ability and reaction. Spent uses remain spent. |
| Bestow Ability | Transformative | Once per game: choose another player and an ability to permanently grant them, replacing theirs. You retain your spent Bestow Ability. |
| Piercing Attack | Offensive | Once per game: attack through ordinary protection. Reactions still apply. |
| Ambush | Offensive | Attack a player only if they made a recorded visit tonight. |
| Sabotage | Offensive | Stop a player’s active Defensive ability tonight. |
| Jam Investigation | Offensive | Withhold a player’s active Investigative results tonight. Their visits still occur. |
| Delayed Strike | Offensive | Mark a player for an attack next night. They are privately warned. |
| Exhaust Reaction | Offensive | If this player successfully uses a reaction tonight, disable it next night. |
| Single Ward | Defensive | Cancel the first attack against a player tonight. |
| Sanctuary | Defensive | Protect another player from attacks and prevent their active ability tonight. |
| Secure Information | Defensive | Protect a player’s investigation results from deceit tonight. |
| Guard Reaction | Defensive | Prevent a player’s reaction being blocked or changed tonight. |
| Reserve Shield | Defensive | Give a player a shield against their first attack next night. |
| Second Chance | Defensive | Once per game: revive this living player at dawn if they die tonight. |
| Visitor Counter | Passive | Automatically learn the number of distinct visitors to you tonight. |
| Change Awareness | Passive | Automatically learn which parts of your identity changed tonight. |
| Block Awareness | Passive | Automatically learn whether your ability or reaction was blocked tonight. |
| Faction Memory | Passive | During your regular night turn, learn how many players already dead at the start of tonight shared your starting allegiance. |
| First Contact | Passive | Once per game, learn the name of one randomly selected visitor on your first night receiving visits. |
| Deception Alarm | Passive | Automatically learn whether a deceitful investigation effect was applied to you tonight. |
| Signed Letter | Miscellaneous | Send a living player a private message signed with your name, delivered on their regular night turn. |
| Private Question | Miscellaneous | Send a living player a private question on their regular night turn. Ask them to answer during the day in person; they need not tell the truth. |
| Public Notice | Miscellaneous | Write an anonymous message to display publicly at dawn, even if you die. |
| Recognition Link | Miscellaneous | Privately introduce two players to each other by name, without revealing identities. |
| Shared Note | Miscellaneous | Send the same anonymous private note to two different living players on their regular night turns. |
| Pass the Token | Miscellaneous | Give a player a visible token at dawn. The holder may pass it on later nights. Grants no protection or information. |
| Receive a truthful hint | Passive | Receive one random truthful hint during your normal night reaction turn. It describes information available so far tonight. Deceitful abilities cannot tamper with the hint. |
| Hide Allegiance | Deceitful | Choose a player to appear Neutral to allegiance investigations tonight. |
| Fake Visit | Deceitful | Choose a player and the visitor destination that Track should report tonight. |
| Hide Activity | Deceitful | Hide a player from Track and Check Activity tonight. |
| Fake Activity | Deceitful | Choose a player to make Check Activity report that they used an ability tonight, even if they did nothing. This does not invent visits for Track. Hide Activity overrides this effect. |
| Reverse Comparison | Deceitful | Reverse comparison results involving this player tonight. Two reversed players cancel each other out. |
| Swap Roles | Transformative | Choose two players to exchange their roles just before reactions. |
| Change Allegiance | Transformative | Choose a player and their new permanent allegiance. |
| Change Ability | Transformative | Choose a player and their new permanent night ability. |
| Change Reaction | Transformative | Choose a player and their new permanent night reaction. |
| Copy Ability | Transformative | Copy a player's ability for the following night only. None or Copy Ability cannot be copied; retain your own ability instead. Target menus do not reveal hidden powers. Your allegiance and reaction stay the same. |
| Block Reaction | Offensive | Disable a player's night reaction tonight. |
| Force Answer | Offensive | Choose a player and a yes/no question they must answer truthfully tomorrow in real life. Do not directly ask their role or allegiance. |
| Block Harm | Defensive | Protect a player from kills, silence, roleblock and Block Reaction tonight. |
| Take Attack | Defensive | Take attacks aimed at a chosen player tonight. Your own reaction applies. Each attack is redirected only once. |
| Remove Silence | Defensive | Cancel silence on a chosen player for the coming day. |
| Prevent Changes | Defensive | Prevent changes to a player's role, allegiance, ability and reaction tonight. |
| Random Allegiance | Passive | Automatically learn a random other living player's allegiance during reactions. |
| Detect Attack | Passive | Automatically learn whether anyone attempted to attack you tonight, without learning who. |
| Survive Once | Passive | Automatically survive the first night attack that would kill you. Once per game. |
| Resist Silence | Passive | Automatically resist silence. |
| Resist Changes | Passive | Automatically resist changes to your role, allegiance, ability and reaction. |
| Send Note | Miscellaneous | Send an anonymous private note to a living player, delivered during night reactions. |
| Reveal Yourself | Miscellaneous | Choose a living player to privately learn your true role and allegiance during night reactions. |
| Read Last Night | Miscellaneous | Choose a player. During your regular night turn, learn whether they died during the preceding night, including if subsequently revived. |
| Send Signal | Miscellaneous | Choose a player and a gesture or phrase for them to use tomorrow in real life. They will privately receive your name and signal during reactions. |
| Compare players | Investigative | Compare two players to see if they're on different teams. |
| Exclude allegiance | Investigative | Exclude allegiance |
| Check activity | Investigative | Check activity |
| Inspect orientation | Investigative | Each night, choose one living player and learn whether their orientation is good, neutral, or evil. The answer is truthful. |
| Track a player | Investigative | Track a player to learn who they visited and which ability they used that night. |
| Reveal a killed player's exact role | Investigative | During the night reactions, while cleaning up a body, choose one player killed that night and learn their exact role. |
| Frame a player | Deceitful | At the beginning of the night, frame any player so they appear to be a different role for that night. Investigators will perceive that player as the chosen role. |
| Change a player's role permanently | Transformative | Each night, choose a living player and permanently replace their role with another role from the library. Their allegiance, visibility, ability and special win condition all become those of the new role. |
| Team kill | Offensive | Each night, you may use your team kill to attempt to kill one player. Any other Peacemaker shares the same team kill, so only one Peacemaker can use it per night. |
| Kill | Offensive | Kill independently during the night. |
| Roleblock a player | Offensive | Drug a player with anaesthesia to prevent them using their ability that night. |
| Silence a player | Offensive | Each night, convince one living player that they should step away from the next day's vote. That player cannot vote the next day. |
| Protect a player | Defensive | Defend a chosen player from attacks. |
| Doctor revive | Defensive | During night reactions, you may choose one player killed that night and revive them. You may revive exactly once per game, or choose not to revive anyone tonight. |
| Random Role Reveal | Passive | Each night, see the exact role of one random living player other than yourself. |
| Assign Target | Miscellaneous | At the beginning of the first night, you are assigned a random player as your target for the entire game. If that target is voted out during the day, the evil side immediately wins. |
| Random ability each night | Miscellaneous | Every night, you receive a completely random night ability. Use whatever ability you are given that night. |

## Night reactions

All six categories still have six entries. Snapshot clues and preceding-night visit checks avoid reliance on later turns. Scheduled effects start before the following night's first action. Redirection still requires a valid destination, and a single survival/redirect does not cancel unrelated attacks. Retaliatory effects that allow the attack to continue remain meaningful through their effect on the attacker or a public announcement; informational survival reactions now keep their holder alive to use the clue.

| Reaction | Category | Current rule |
|---|---|---|
| Redirect a night attack | Redirective | If the Mafia successfully target you, you may transfer that attempted kill to a living player on either side of you once per game. |
| Escape challenge | Defensive | If the Mafia target you, you get a chance to escape by literally running away from the Mafia. You have 15 seconds to survive the kill. |
| Confront the attacker | Retaliatory | If you are targeted by a night kill, you may make a loud sound or otherwise openly confront your perpetrator directly before the result is resolved. |
| Rock, Paper, Scissors | Defensive | When you are targeted by a night kill, you and the perpetrator play a best-of-3 Rock, Paper, Scissors. The game decides who survives the encounter. |
| Join the Mafia when attacked | Transformative | If the Mafia target you, you join the Mafia instead of dying. Your orientation becomes evil from that point onward. |
| Return to Sender | Redirective | Once per game: redirect to the attacker. |
| Blind Deflection | Redirective | Once per game: redirect to a random other player, excluding the attacker. |
| Decoy Trail | Redirective | Once per game: redirect to your secretly nominated decoy. |
| Follow the Footsteps | Redirective | Redirect to another destination your attacker visited on the preceding night, if still available. No destination exists on Night 1. |
| Visitor Diversion | Redirective | Once per game: redirect to a random available player who visited you on the preceding night, excluding the attacker. No prior visitors exist on Night 1. |
| Brace | Defensive | Once per game: stop this attack and lose your next night’s active ability. |
| Safety in Numbers | Defensive | Stop this attack if someone other than its attacker visited you on the preceding night. No prior visitors exist on Night 1. |
| Feign Death | Defensive | Once per game: stop this attack; lose your next ability and be silenced tomorrow. |
| Bargain for Life | Defensive | Ask your attacker to spare you in exchange for being silenced tomorrow. |
| Break Their Reaction | Retaliatory | Once per game: disable your attacker’s night reaction on the following night. The original attack continues. |
| Expose Assailant | Retaliatory | Learn the attacker’s role. If you die tonight, announce that role without naming them. |
| Mark Assailant | Retaliatory | Once per game: publicly name the attacker at dawn if you die. |
| Disarm Assailant | Retaliatory | Your attacker loses their next night’s active ability. This attack continues. |
| Shatter Defences | Retaliatory | Your attacker cannot benefit from ordinary protection or single-use shields next night. This attack continues. |
| Mirror Allegiance | Transformative | Once per game: stop this attack and adopt your attacker’s allegiance. |
| Steal Their Weapon | Transformative | Once per game: stop this attack, permanently gain the ability that generated it, and lose this reaction. |
| Defensive Awakening | Transformative | Once per game: stop this attack, gain Protect and lose this reaction. |
| Vengeful Awakening | Transformative | Once per game: stop this attack, gain Kill and lose this reaction. |
| Shed Identity | Transformative | Once per game: stop this attack, become a Citizen, and lose your ability and reaction. Retain your allegiance. |
| Identify Assailant | Investigative | Immediately learn the attacker’s name during this reaction. Once per game: stop this attack and receive this clue. |
| Read the Weapon | Investigative | Immediately learn the exact ability that generated this attack during this reaction. Once per game: stop this attack and receive this clue. |
| Read Their Reaction | Investigative | Immediately learn your attacker’s reaction recorded when the attack was created. Once per game: stop this attack and receive this clue. |
| Read Their Ability | Investigative | Immediately learn your attacker’s night ability at the start of tonight. Once per game: stop this attack and receive this clue. |
| Read Their Origins | Investigative | Immediately learn your attacker’s exact role at the start of tonight. Once per game: stop this attack and receive this clue. |
| Read Their Past | Investigative | Immediately learn whether the attacker’s allegiance changed between the start of tonight and this attack. Reveal both allegiances only if they differ. Once per game: stop this attack and receive this clue. |
| Lingering Frame | Deceitful | Choose a role. On the following night, ordinary role investigations of your attacker report that role. Applies before anyone acts; does not stop this attack. |
| Stained Colours | Deceitful | Choose an allegiance. On the following night, ordinary allegiance investigations of your attacker report it. Applies before anyone acts; does not stop this attack. |
| Planted Trail | Deceitful | Choose a player from the reaction roster. On the following night, Track reports your attacker visiting that player. Creates no real visit; does not stop this attack. |
| Clean Getaway | Deceitful | Once per game: stop this attack, then hide your own activity and visits from ordinary investigations on the following night. Actual effects remain. |
| False Double | Deceitful | Once per game: stop this attack, then appear as your attacker’s recorded role and allegiance to ordinary investigations on the following night. Your actual identity does not change. |
| Witness Confusion | Deceitful | On the following night, invert shared-visitor investigations involving your attacker. Two affected subjects cancel out. Does not stop this attack. |

## Practical constraints retained

- Reactions based on the preceding night have no evidence on Night 1. This is explicit in their prompts.
- Death/availability can still make a previously nominated target unavailable. This is different from using an incomplete list of tonight's future actions.
- Investigations of activity/visits in narrator mode retain their existing information handling; this change does not introduce a new reporting phase.
- Prevent Changes and reaction protection can prevent transformations. No successful transformation is promised when its normal restrictions block it.
- Recognition disguises do not override investigations, actual faction membership or truthful signals.
- Private communications and in-person challenges depend on the host/player following the displayed instruction; the app does not claim to verify physical behaviour.
