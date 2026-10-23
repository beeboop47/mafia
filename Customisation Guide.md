# Host customisation

In Manual mode, assign a player's role first. Their host settings then show that role's ability controls. Personal challenges remain available in every assignment mode.

## Assigning night actions

Expand **Host-assigned [ability] by night** under the player. Each night can be left as **Player chooses**, set to **Host assigns**, or set to **Do not use ability**. Add nights as needed.

Host assignments include targets, both targets for comparison/swap abilities, the false role for Framer, the replacement role for Change Role, new abilities/reactions/allegiances, and message text. Doctor and Janitor assignments refer to players who actually died that night. Gambler can have both its rolled ability and that ability's choices assigned.

On an assigned night the player gets a notice naming the assigned ability, target(s), secondary choice and message, plus a Continue button. They are not warned about future assignments during the initial role reveal. They cannot pick another target, option or message. Online submissions are checked against the host's assignment. Invalid targets/options skip the action rather than allowing a substitute. Normal blocking, protection, target restrictions and spent-use limits still apply. Assignments are tied to the named ability; a later transformation to a different ability does not reuse an unrelated old choice.

Seer, Signal Receiver and Hater retain their existing dedicated controls. A host-assigned Hater target also removes the player's option to decline recording it. Passive abilities already have no player-selected action. Unconfigured future nights retain the usual rules.

## Personal challenges

Type a private challenge under any player's host settings. It appears as **Your personal challenge**, without identifying who assigned it, with that player's private role information during handoff and night turns, and throughout their online private view. It remains attached to the player for the entire game, including through role changes and revival. It is not shown to other players or put in the public log. The app displays the instruction; the host judges completion in person.

## Policeman intelligence

Both the setup picker and actual assignment prefer a target whose role the Policeman does not already recognise. A configured recognised target cannot bypass this restriction. If every eligible player is already recognised, the restriction is relaxed so the Policeman still gets an assignment. Judge targeting restrictions remain in force.

## Recognition disguises

The role editor has a **Recognition disguise** and **Player knows their disguise** option. The built-in **Undercover** role is Good but is recognised as Mafia by Evil players.

An alive Good Undercover turns a normal Evil victory into a Good victory, including the final-two safeguard and ordinary Evil parity. Merely knowing their identity does not cancel this win. Other special role victories retain their existing precedence. Disabling normal side-win checks still disables parity checks; the final-two safeguard remains active. The role editor exposes this Undercover win trait for custom roles too.

Evil must get the Undercover voted out or eliminate them through the usual game mechanics. There is no dedicated counter-role or hunting action.

Recognition and host recognition links show the disguise. Ordinary role/allegiance investigations use the real identity, subject to their usual framing or other investigation effects; truthful Signal Receiver clues always use truth. Unlocked dead spectators and the end-of-game reveal see the real role.

The wearer sees their true role and allegiance. With **Player knows their disguise** on, they also see exactly what others recognise them as. With it off, that automatic explanation is hidden. Write the role's description accordingly if you want the disguise to remain a secret.

Recognition is directional. Disguised players do not automatically discover faction members or special contacts through the disguise; explicit host recognition links can grant that knowledge. Publicly visible identities remain public. Disguised players do not join the supposed faction's shared narrator turn. A recognition disguise changes the information shown by the app, not what someone can observe in the room.

## Bestow Ability

Once per game, choose another living player and a permitted ability to grant them permanently, replacing their current ability. The giver keeps Bestow Ability with its use spent. It cannot grant itself or None. Configure permitted gifts in the role editor; no selection allows the full valid pool. Spent uses belonging to the recipient remain spent.

## End-of-game timeline

After the game ends, open **Game timeline** below the final reveal. It records assignments, selected actions and targets, private results, transformations, deaths, revivals, protection/attack reports and public voting outcomes. Selections are described as selections; they do not imply success. Later events record outcomes. Filter by player to follow their story.

The timeline is withheld from shared online state until game over. Host recovery saves retain it privately. Old saved games cannot reconstruct events that were never recorded. In-person behaviour and unsubmitted decisions cannot be reconstructed by the app.

## Reaction review changes

- All six Investigative reactions are now once per game: cancel the triggering attack and reveal their clue immediately on the existing reaction turn. Multiple attacks can still kill the holder. No clue is postponed until dawn.
- Steal Their Weapon and Vengeful Awakening now cancel their triggering attack, grant their new ability, and remove themselves. Both are once per game, so their benefit does not require a separate survival ability.
- Clean Getaway now cancels its triggering attack and hides the owner's activity/visits from ordinary investigations on the following night. False Double cancels the triggering attack and makes the owner appear as their attacker's recorded role/allegiance on the following night. Both are once per game.
- Follow the Footsteps, Visitor Diversion and Safety in Numbers use the preceding night's completed real visits, never a partial list from the current night. They have no previous-night evidence on Night 1. This removes their dependence on current player order.
- The other scheduled deceitful reactions still apply before anyone acts on the following night. Lingering Frame's choice is made on the existing attack reaction prompt.
- Copy Ability cannot copy None or another Copy Ability. Borrow Reaction cannot borrow an absent or already-spent reaction. Unusable copies leave the owner's existing power intact and explain the failure privately. Target menus still include all otherwise valid players, so availability does not leak hidden powers before a choice.
- Every category still contains six night reactions. Player order, the existing turn structure and the delayed dead-player role reveal are preserved.

## Visual changes

The interface now includes a subtle village illustration, a moon motif on private night cards, short card entrances, button feedback, and day/night colour transitions. Reduced-motion preferences disable the animations. Effects never automatically reveal private information.
