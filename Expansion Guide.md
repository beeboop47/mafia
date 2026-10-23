# Ability and reaction expansion

The role editor includes 42 additional abilities and 31 additional reactions. All six reaction categories contain six reactions each (36 total). Existing role assignments and saved role IDs remain compatible; changed choices display their replacement names automatically.

## Night timing

- Private results are shown during existing night turns. There is no private dawn-results phase, no extra report turn, and no change to the configured player queue.
- The six Deceitful reactions schedule effects for the following night. Effects apply before anyone acts, remain active for that night, then expire. Clean Getaway and False Double also cancel their triggering attack once per game; the other four allow the attack to resolve. Scheduled effects can persist even if their owner died.
- Simultaneous scheduled disguises use stable seat IDs: the lowest source seat ID wins each conflicting field. Secure Information bypasses their reports; Signal Receiver continues using the truth. Actual roles, allegiances and visits are unchanged.
- Investigative reactions cancel the triggering attack once per game and reveal fixed facts immediately during the holder’s reaction. A separate attack can still kill them. No future-night events are predicted or awaited.
- Follow the Footsteps, Visitor Diversion and Safety in Numbers use the preceding night's completed visits, not an incomplete record of the current night. There is no preceding-night evidence on Night 1.
- Break Their Reaction and Shatter Defences affect the attacker on the following night, independently of turn order. They do not create counterattack turns or private dawn results.
- One-use limits remain spent through role or ability changes. A new game resets them. Redirected attacks cannot be redirected again.
- Piercing Attack bypasses ordinary protection and shields; reactions and Survive Once still apply.
- Private Question is answered in person during the day. It does not add an app reply turn. Signed Letter and Shared Note deliver normal night notices. Public notices, token ownership and ordinary death announcements remain public at dawn. Second Chance and Temporary Conversion still resolve their automatic public-state changes then.
- Interactive attack contests and causal redirections retain their existing encounter rules. Their player queue is not reorganized.

## Replacements

| Previous choice | Replacement |
|---|---|
| Counterframe | Lingering Frame |
| False Colours | Stained Colours |
| Plant an Escape Route | Planted Trail |
| Erase Your Footprints | Clean Getaway |
| Borrow Their Face | False Double |
| Scramble the Witnesses | Witness Confusion |
| Trace Their Steps | Read Their Reaction |
| Count the Threats | Read Their Ability |
| Witness Search | Read Their Origins |
| Last Shot | Break Their Reaction |
| Death Echo | Faction Memory |
| Predict Death | Read Last Night |
| Dead Letter | Signed Letter |
| Sealed Reply | Private Question |
| Contingency Note | Shared Note |

## New abilities

### Investigative

| Ability | Effect |
|---|---|
| Inspect Reaction | Learn a player’s current night reaction. |
| Trace Allegiance | Learn a player’s allegiance at the start of tonight. |
| Check Protection | Learn whether a player received attack protection tonight. |
| Find Interference | Learn whether a player’s ability or reaction was blocked tonight. |
| Compare Visitors | Learn whether anyone visited both chosen players tonight. |
| Examine Remains | Learn the ability a dead player had immediately before their most recent death. |

### Deceitful

| Ability | Effect |
|---|---|
| Forge Reaction | Choose the reaction Inspect Reaction will report for a player tonight. |
| Swap Reports | Swap two players’ ordinary role and allegiance investigation reports tonight. |
| False Protection | Make Check Protection report protection for a player. Grants no protection. |
| Conceal Visitor | Choose a visitor, then a destination. Hide that visit from ordinary investigations tonight. |
| Forge Interference | Make Find Interference report a roleblock without actually blocking the player. |
| Plant Evidence | Ordinary role and allegiance investigations report this player’s identity from the start of tonight. |

### Transformative

| Ability | Effect |
|---|---|
| Exchange Abilities | Permanently swap two players’ night abilities. |
| Exchange Reactions | Permanently swap two players’ night reactions. |
| Borrow Reaction | Use a chosen player’s reaction on the following night only. |
| Temporary Conversion | Once per game: change a player’s allegiance for the following night. Reverts at dawn before win checks. |
| Restore Identity | Once per game: restore a player’s originally dealt role, allegiance, ability and reaction. Spent uses remain spent. |
| Bestow Ability | Once per game: choose another player and a permitted ability to grant them permanently. You retain your spent Bestow Ability. Configure the gift pool in the role editor. |

### Offensive

| Ability | Effect |
|---|---|
| Piercing Attack | Once per game: attack through ordinary protection. Reactions still apply. |
| Ambush | Attack a player only if they made a recorded visit tonight. |
| Sabotage | Stop a player’s active Defensive ability tonight. |
| Jam Investigation | Withhold a player’s active Investigative results tonight. Their visits still occur. |
| Delayed Strike | Mark a player for an attack next night. They are privately warned. |
| Exhaust Reaction | If this player successfully uses a reaction tonight, disable it next night. |

### Defensive

| Ability | Effect |
|---|---|
| Single Ward | Cancel the first attack against a player tonight. |
| Sanctuary | Protect another player from attacks and prevent their active ability tonight. |
| Secure Information | Protect a player’s investigation results from deceit tonight. |
| Guard Reaction | Prevent a player’s reaction being blocked or changed tonight. |
| Reserve Shield | Give a player a shield against their first attack next night. |
| Second Chance | Once per game: revive this living player at dawn if they die tonight. |

### Passive

| Ability | Effect |
|---|---|
| Visitor Counter | Automatically learn the number of distinct visitors to you tonight. |
| Change Awareness | Automatically learn which parts of your identity changed tonight. |
| Block Awareness | Automatically learn whether your ability or reaction was blocked tonight. |
| Faction Memory | During your regular night turn, learn how many players already dead at the start of tonight shared your starting allegiance. |
| First Contact | Once per game, learn the name of one randomly selected visitor on your first night receiving visits. |
| Deception Alarm | Automatically learn whether a deceitful investigation effect was applied to you tonight. |

### Miscellaneous

| Ability | Effect |
|---|---|
| Signed Letter | Send a living player a private message signed with your name, delivered on their regular night turn. |
| Private Question | Send a living player a private question on their regular night turn. Ask them to answer during the day in person; they need not tell the truth. |
| Public Notice | Write an anonymous message to display publicly at dawn, even if you die. |
| Recognition Link | Privately introduce two players to each other by name, without revealing identities. |
| Shared Note | Send the same anonymous private note to two different living players on their regular night turns. |
| Pass the Token | Give a player a visible token at dawn. The holder may pass it on later nights. Grants no protection or information. |

### Updated historical ability

**Read Last Night** (formerly Predict Death): choose a player and learn during your regular night turn whether they died during the preceding night, including if later revived.

## New reactions

### Investigative

| Reaction | Effect |
|---|---|
| Identify Assailant | Once per game: stop this attack and immediately learn the attacker’s name. |
| Read the Weapon | Once per game: stop this attack and immediately learn the exact ability that generated it. |
| Read Their Reaction | Once per game: stop this attack and learn the attacker’s reaction recorded when the attack was created. |
| Read Their Ability | Once per game: stop this attack and learn the attacker’s night ability at the start of tonight. |
| Read Their Origins | Once per game: stop this attack and learn the attacker’s exact role at the start of tonight. |
| Read Their Past | Once per game: stop this attack and learn whether the attacker’s allegiance changed between the start of tonight and this attack. Reveal both allegiances only if they differ. |

### Deceitful

| Reaction | Effect |
|---|---|
| Lingering Frame | Choose a role. On the following night, ordinary role investigations of your attacker report that role. Applies before anyone acts; does not stop this attack. |
| Stained Colours | Choose an allegiance. On the following night, ordinary allegiance investigations of your attacker report it. Applies before anyone acts; does not stop this attack. |
| Planted Trail | Choose a player from the reaction roster. On the following night, Track reports your attacker visiting that player. Creates no real visit; does not stop this attack. |
| Clean Getaway | Once per game: stop this attack, then hide your own activity and visits from ordinary investigations on the following night. Actual effects remain. |
| False Double | Once per game: stop this attack, then appear as your attacker’s recorded role and allegiance to ordinary investigations on the following night. Your actual identity does not change. |
| Witness Confusion | On the following night, invert shared-visitor investigations involving your attacker. Two affected subjects cancel out. Does not stop this attack. |

### Defensive

| Reaction | Effect |
|---|---|
| Brace | Once per game: stop this attack and lose your next night’s active ability. |
| Safety in Numbers | Stop this attack if another player, excluding the attacker, visited you on the preceding night. |
| Feign Death | Once per game: stop this attack; lose your next ability and be silenced tomorrow. |
| Bargain for Life | Ask your attacker to spare you in exchange for being silenced tomorrow. |

### Retaliatory

| Reaction | Effect |
|---|---|
| Break Their Reaction | Once per game: disable your attacker’s night reaction on the following night. The original attack continues. |
| Expose Assailant | Learn the attacker’s role. If you die tonight, announce that role without naming them. |
| Mark Assailant | Once per game: publicly name the attacker at dawn if you die. |
| Disarm Assailant | Your attacker loses their next night’s active ability. This attack continues. |
| Shatter Defences | Your attacker cannot benefit from ordinary protection or single-use shields next night. This attack continues. |

### Transformative

| Reaction | Effect |
|---|---|
| Mirror Allegiance | Once per game: stop this attack and adopt your attacker’s allegiance. |
| Steal Their Weapon | Once per game: stop this attack, gain the ability that generated it, and lose this reaction. |
| Defensive Awakening | Once per game: stop this attack, gain Protect and lose this reaction. |
| Vengeful Awakening | Once per game: stop this attack, gain Kill and lose this reaction. |
| Shed Identity | Once per game: stop this attack, become a Citizen, and lose your ability and reaction. Retain your allegiance. |

### Redirective

| Reaction | Effect |
|---|---|
| Return to Sender | Once per game: redirect to the attacker. |
| Blind Deflection | Once per game: redirect to a random other player, excluding the attacker. |
| Decoy Trail | Once per game: redirect to your secretly nominated decoy. |
| Follow the Footsteps | Redirect to another destination your attacker visited on the preceding night, if still available. |
| Visitor Diversion | Once per game: redirect to a random available player who visited you on the preceding night, excluding the attacker. |
