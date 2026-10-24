A website to play Mafia pass-and-play with friends.

## Publishing changes to GitHub

Double-click **Publish.cmd** in this folder to check the website scripts, run the game tests, commit the intended project files and push to `https://github.com/beeboop47/mafia.git` on `main`. If Git asks you to sign in, use the GitHub account with write access to that repository. Successful uploads report **Published successfully**. A failed test or a newer remote history stops publishing; the script never force-pushes or overwrites local files to resolve a conflict.

To run the checks without staging, committing or uploading, run `powershell -NoProfile -ExecutionPolicy RemoteSigned -File .\Publish.ps1 -CheckOnly`. To use your own commit message, run `powershell -NoProfile -ExecutionPolicy RemoteSigned -File .\Publish.ps1 -Message "Describe your update"`.

Git, Node.js and GitHub write access are required. The script uses your installed Git credential manager; credentials are not stored in these scripts. The local `Fallback (DO NOT TOUCH).html`, environment files and temporary test output are excluded. Publishing runs only when you launch it; there is no background watcher. Website deployment follows the repository's existing hosting configuration.

Host-assigned actions for every active ability, private personal challenges, recognition disguises (including Undercover), and an end-of-game timeline are described in the [Customisation Guide](Customisation%20Guide.md). The [Ability and Reaction Review](Ability%20and%20Reaction%20Review.md) lists the complete current catalogue and review decisions.

## Ability and reaction expansion

The role editor includes 42 additional abilities and 31 additional reactions. All six reaction categories have six choices each (36 reactions total), including Investigative and Deceitful. See [Expansion Guide](Expansion%20Guide.md) for effects, limits, timing, private replies, bargains, and visible tokens. These choices work in offline, narrated and online games.

Private results are delivered during existing night turns, with no private dawn-results phase or changes to player order. Order-dependent reactions have been replaced: the six Deceitful reactions apply before anyone acts on the following night; Investigative reactions reveal fixed historical facts immediately. Break Their Reaction replaces Last Shot; Shatter Defences also applies next night. See the guide for the full replacement list, including former dawn-only abilities.

## Signal Receiver and Judge

**Signal Receiver (Good)** has the selectable passive ability **Receive a truthful hint**. One private signal arrives during night reactions on the Receiver's turn in the normal configured reaction order. Its 20 hint families cover allegiance counts, individual allegiances, roles, current abilities/reactions, activity, visits, targets, attacks, survival/protection, blocking, deception, transformations, deaths/revivals, comparisons, groups, living roster neighbours, round statistics, connections between actions, private communications and personal clues. Hints are a snapshot as of that turn: later deaths, revivals or other reactions may change the situation. Death-prediction results are excluded because dawn has not happened yet. Hints are a snapshot as of that turn: later deaths, revivals or other reactions may change the situation. Death-prediction results are excluded because dawn has not happened yet. Hints use true roles and actual recorded events; framing, hidden allegiance/activity, fake visits/activity and reversed comparisons cannot tamper with them. Passive abilities do not count as visits. Use and success are distinguished, times are explicit, exact reveals are less common, and recent exact repeats are avoided. Notes' text is not revealed. The ability also works on custom roles and through Gambler, copying or ability changes.

**Judge (Good)** is a unique special role. Everyone is told a Judge is present. The Judge cannot be targeted by any ability, including friendly abilities, random information assignments, either target of a two-player ability, transformations and redirected attacks. While a living Judge is present, only their verdict counts: skip, or vote out one other living player. Voting out a player whose actual allegiance is Good eliminates both that player and the Judge as voted-out players; ordinary voting resumes the following day. An Evil or Neutral verdict leaves the Judge alive, and existing special win conditions still apply. The Judge shares the Good side's normal win/loss conditions. These rules apply to offline, narrator and online games; online authority is enforced by the host.

## Online night reactions

Escape is a two-device tapping contest between the target and attacker. Both select Ready, a three-second countdown begins, then each gets 15 seconds to tap the large button (or left-click). The host compares totals; the target survives if they have more taps. A tie restarts the contest. The room clock synchronizes the window, and the host allows 1.5 seconds for final counts to arrive.

Rock, Paper, Scissors takes place on each participant's device. Choices lock privately until both have chosen; the host scores each round. First to two wins, with tied rounds replayed. The target survives a match win and dies on a match loss, as in the previous reaction rules.

Confrontation immediately announces the attacker and victim to the entire room. Joining the Mafia and redirecting an attack retain their existing choices. These changes apply only to online mode.

This is a very personally-crafted website, it may not suit your style, but it comes with the ability to create, delete and edit roles to your heart's content.

# Made with Generative AI (ChatGPT).

## Narrator night order

Offline narrator games keep the original synthesized day birds and use a bundled suburban night recording with distant traffic, background hum and insects. The recording is softened and its ends overlap for smooth looping; day/night transitions crossfade over three seconds. Separate mute and volume controls work independently of the spoken narrator. Sound stops outside day/night play and while the page is hidden. Other modes keep the original appearance and sound. See [audio credits](assets/audio/CREDITS.md) for the recording's source and license.

Narrator mode orders turns by their current ability:

Each night begins with “Mafia, open your eyes” for all living Evil players. They coordinate until they select **Finish Mafia discussion**, then close their eyes. Roles wake individually for their abilities in the order below. Special Evil roles keep their own abilities and win conditions; passive Henchmen have no separate ability turn. Ordinary Mafia and Godfather share one kill, led by an unblocked Godfather when available. Special roles are unique; ordinary Mafia and Citizens may repeat.

1. Protection from harm and changes.
2. Roleblocks.
3. Role, allegiance, ability and reaction changes, plus copying an ability for the next night.
4. Protection, attack interception, reaction blocking and deception.
5. Silence, messages, signals and death predictions.
6. The Mafia's shared kill, then other killers. Each attack and any required reaction resolve before the next regular turn.
7. Janitor body inspections, then Doctor revivals.
8. Investigations. Track and Check Activity choices are collected here, with their results and private notices delivered after all choices.

Equal priorities use roster order. Gambler uses the priority of its assigned ability. Role changes refresh the remaining queue, including newly active Citizens, but a player who already acted or had their turn skipped does not get another regular action. Blocking one Mafia member leaves an unblocked member able to submit the shared kill; blocking every member stops it.

Private information results (including Seer, investigations, Hater targets, Janitor inspections and end-of-night reports) wait for **Acknowledge & continue** in narrator mode. There is no reading timeout. Kill and team-kill confirmations still progress automatically.

Narrator mode silently skips blocked or unavailable ability turns. Doctor and Janitor stay asleep when there is no body from that night; a Doctor who has spent their revival also stays asleep. Normal spoken announcements queue in order so a closing announcement cannot cut off the matching wake prompt.

## Neutral endgames

Neutrals earn personal survival victories alongside the faction result; they do not replace it. Detective and Gambler voting Hater out produces a Good faction victory plus Gambler's personal survival victory. Surviving eligible Neutrals can also win personally alongside Evil. Dead or removed Neutrals do not qualify. Jester must be voted out and retains its special victory precedence; surviving is insufficient.

With normal side checks enabled, surviving Neutrals do not prevent Good winning after Evil is eliminated, or Evil winning after Good is eliminated. The always-on final-two safeguard remains active even if normal side checks are disabled, including Undercover's existing exception. If only Neutrals remain, the end screen lists their personal victories without awarding a faction victory. Offline and online end screens show personal winners separately, and host recovery saves preserve the result.
