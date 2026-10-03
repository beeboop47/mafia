# Mafia Playbook

This playbook is written for this version of your Mafia game, including custom roles, reaction-round deaths, delayed dead-player role reveals, framing/hacking, role changes, team kills, and side-win logic.

## Core Principles

### Information Wins Games

Most games are decided by who controls the information economy. Exact role info is stronger than alignment info, alignment info is stronger than behavior reads, and behavior reads are still valuable when role info is distorted by Framer, Hacker, Leader, or social pressure.

Good players should build information chains without exposing every power role too early. Evil players should pollute those chains, force premature claims, and create conflicting stories. Neutral players should identify which side benefits their personal win condition and avoid being treated as an obvious loose end.

### Timing Matters

Night actions resolve in stages. Protection, roleblocks, framing, role changes, kills, and investigative results interact through timing. A successful role change now affects investigative results immediately. A Framer or Hacker can make investigative roles see false role information for that night. A dead player does not get the full role list until they have stayed dead into a later round.

### Votes Are Pressure, Not Just Eliminations

Day voting is the public battlefield. Even failed votes reveal alliances, hesitation, fake certainty, and who is willing to protect whom. Good should use votes to create commitments. Evil should use votes to split good players into rival theories. Neutrals should use votes to look useful without becoming too predictable.

## General Team Strategy

### Playing Effective Good

Good should aim to narrow the world, not solve it all at once. Start by asking who has mechanical information, who has behavioral information, and who is suspiciously avoiding either.

Good players should avoid forcing every role to claim immediately. A full claim wall can help evil choose kills and fake believable stories. Instead, use soft pressure: ask for target logic, ask whether someone has a useful result, and let power roles decide whether the value of revealing outweighs the danger.

Good should protect information roles, but not blindly. A fake Detective claim can waste Doctor protection. A fake Seer claim can anchor the town around bad information. Cross-check claims against night deaths, known role interactions, and who benefits from a specific elimination.

Good counters evil by watching voting patterns. Evil teammates often avoid being the first or last vote on each other unless forced. Solo evil often pushes simpler narratives and avoids creating too many public obligations. Neutral chaos roles may look suspicious without actually being evil, so Good should distinguish "dangerous" from "evil."

### Playing Effective Evil Teammate

Evil teammates win by managing suspicion as a group. Do not all defend each other. Do not all attack the same target too eagerly. Spread your social positions so one evil player can survive if another is exposed.

Use the shared evil team kill carefully. Killing the loudest good player is not always best. Sometimes killing a quiet confirmed role, a protected-looking player, or someone who can connect two pieces of information is stronger.

Evil should manufacture plausible worlds. If a Detective finds evil, suggest Framer/Hacker interference, bad target choice, or neutral threat. If a Seer finds an exact role, decide whether to discredit the Seer, kill them, or let them live so they look suspicious later.

Evil should coordinate around visibility. Evil-visible roles can recognize each other, but overusing that trust can create patterns. If one evil player is under pressure, another evil player should sometimes apply mild pressure too. Total loyalty looks fake.

### Playing Effective Solo Evil

Solo evil needs patience. You usually cannot openly lead every vote or kill every obvious threat without becoming the center of the game. Your goal is to let Good and team Evil damage each other while you stay necessary.

You should identify protectors, investigators, and swing voters. Kill or discredit the roles that can mechanically expose you. Keep chaotic neutrals alive if they distract town, but remove them if their win condition can end the game before yours.

Do not look too clean. A player with perfect reads and no enemies becomes suspicious. It is often better to be "usefully imperfect" than obviously optimal.

### Playing Effective Neutral

Neutral roles should ask: "Do I need to survive, die, be voted out, change the board, or hide?" Your play should serve that answer.

Do not default to helping Good. Good will often eliminate neutrals once Evil is under control. Do not default to helping Evil either, because Evil may kill you once you are no longer useful. Trade information, create leverage, and stay hard to classify.

Neutrals are strongest when they can make both sides hesitate. If Good thinks you might help catch Evil, and Evil thinks you might derail Good, you get more time.

## Role Playbooks

### Citizen

**Goal:** Help Good eliminate every evil player.

**Strategy:** Citizens are not powerless. You are free to apply pressure without risking a special ability. Track claims, votes, timing, and contradictions. Since you have no night action, your job is to build public structure during the day.

**Counters:** Evil will often call active Citizens "too loud" or "trying to lead." Do not let that stop you, but avoid tunneling one person so hard that evil can hide behind your push.

**Synergies:** Citizens pair well with Detective and Seer by giving them public cover. You can push suspicion in a direction that lets an investigator stay hidden until they have enough results.

### Detective

**Goal:** Learn alignments and turn them into safe eliminations.

**Strategy:** Investigate players whose alignment will clarify multiple relationships. A result on a central, defended, or controversial player is better than a result on someone everyone already suspects.

**Counters:** Framer and Hacker can distort what you see. Leader can change a role before your result resolves. If a result seems impossible, do not instantly assume your result is useless; instead, ask what night interference would explain it.

**Synergies:** Doctor can keep you alive after a reveal. Watch and Track-style roles, if custom-added, help validate your target logic. Citizen pressure can force reactions before you reveal.

### Seer

**Goal:** Learn exact roles and use that precision to solve the setup.

**Strategy:** Exact role info is powerful, but your target is random. Treat each result as a puzzle piece, not a full solution. If you find a dangerous role, decide whether revealing helps more than it exposes you.

**Counters:** Framer and Hacker can make your exact role result false for that night. Leader can make the new role real before your result. If you see a surprising role, consider whether it was altered or framed.

**Synergies:** Janitor can confirm dead roles. Detective can combine alignment with exact-role results. Doctor protection is very valuable once you have a strong result.

### Doctor

**Goal:** Revive one player killed that night, once per game.

**Strategy:** Your revive is strongest when it restores a confirmed or high-value player. Do not automatically revive the first death if the dead player is likely evil, neutral, or bait. Saving the revive can be correct.

**Counters:** Evil can kill low-value targets to bait your one-time revive. Roleblock can stop you. If multiple players die, choosing the wrong revive may swing the game.

**Synergies:** Reviving an investigator can preserve key information. Reviving a publicly trusted player can restore Good's voting power. Reviving a player before dead-spectator information unlocks prevents them returning with the full role list.

### Janitor

**Goal:** Inspect a body killed that night and learn their exact role.

**Strategy:** Use your information to verify claims around night deaths. If someone claimed a role and died, you can confirm or expose that claim. You do not always need to reveal immediately; sometimes holding the info catches a liar later.

**Counters:** If no one dies, you get little value. If multiple bodies exist, choosing which one to inspect matters. Evil may kill a less relevant target to reduce the value of your inspection.

**Synergies:** Works well with Seer and Detective by confirming whether their target worlds make sense. Also helps Good understand whether a killed player was a lost power role, a neutral threat, or evil.

### Policeman

**Goal:** Use permanent private intel without directly claiming Policeman.

**Strategy:** You know one player's exact role and alignment when assigned. Since you cannot directly claim Policeman, use indirect pressure. Ask your intel target questions only their role would answer poorly. Hint through voting and suspicion rather than saying the source.

**Counters:** Henchman recognizes you, which creates social danger. If you are too obvious, Evil can pressure, silence socially, or kill you. If you are too subtle, your information may never matter.

**Synergies:** Citizens can amplify your pressure without knowing why. Detective and Seer can later validate the world you are hinting toward. Doctor can preserve you if your hints become obvious.

### Scapegoat

**Goal:** Redirect a night kill targeting you to an adjacent living player once per game.

**Strategy:** Your value depends on seating order. Pay attention to who is beside you as players die. If targeted, redirecting can remove a suspicious neighbor or protect yourself at the cost of chaos.

**Counters:** Evil may avoid attacking you if they suspect your role. Bad adjacency can force you to redirect into a good player or decline and die.

**Synergies:** Works well when Good has publicly arranged suspicion around your neighbors. Can punish Evil if an evil player is adjacent when you are attacked.

### Peacemaker

**Goal:** Use a Good team kill to remove threats.

**Strategy:** You are dangerous and easy to misread. Your kill can help Good, but a bad kill is devastating. Use public discussion to choose a target with broad suspicion unless you have a strong private reason.

**Counters:** Evil can frame your kill as evil behavior. Roleblock and protection can stop your impact. Killing a Jester can lose the game if the Jester needs votes rather than night death, depending on win rules.

**Synergies:** Detective or Seer results can guide your kill. Doctor can repair a mistake only if the death occurs that night and the revive is available.

### Escapist

**Goal:** Survive a Mafia attack through the escape challenge.

**Strategy:** Your role is a deterrent if suspected, but strongest when Evil attacks you unknowingly. Socially, you can play a little more boldly than fragile Good roles because you have a survival chance.

**Counters:** Non-kill eliminations and day votes bypass your ability. If Evil knows your role, they may vote you out or use role manipulation instead.

**Synergies:** Works well with Good pressure roles because you can draw a kill and survive, wasting Evil's night.

### Monkey

**Goal:** If targeted by a night kill, openly confront the attacker before dying.

**Strategy:** You are a trap. Your death can expose or strongly imply the attacker. Try to make yourself look like a valuable kill target without making your role obvious.

**Counters:** Day votes bypass you. Evil may avoid killing you if suspected. If the confrontation creates ambiguous social evidence, Evil may talk their way out.

**Synergies:** Good can use your confrontation as a launch point for the next day's vote. Detective and Seer can prioritize anyone implicated by your death.

### Joker

**Goal:** If targeted by a night kill, resolve survival through Rock, Paper, Scissors.

**Strategy:** Like Escapist, you punish attacks by making the outcome uncertain. You can afford slightly more visible Good play than a normal power role.

**Counters:** Day votes bypass your ability. Evil may choose safer targets if they suspect you.

**Synergies:** If you survive, Good gains a strong clue that someone tried to kill you. Pair that with voting patterns to find who wanted you gone.

### Traitor

**Goal:** Begin Good, but join Evil if Mafia targets you.

**Strategy:** Early on, play like Good because you are Good until converted. But understand your value as a conversion trap. If converted, immediately reassess your old reads and use your Good credibility carefully.

**Counters:** Good may distrust you if your role is revealed. Evil may avoid targeting you if they suspect the role and do not want the social complications.

**Synergies:** As Good, you can absorb an attack without dying. As Evil, you bring prior Good credibility and knowledge of Good discussions.

### Jester

**Goal:** Get voted out during the day.

**Strategy:** You need suspicion, but not the wrong kind. Look suspicious enough to be voted, not so obviously Jester that everyone refuses. Contradictions, odd defenses, and selective aggression work better than yelling "vote me."

**Counters:** Night kills deny your win. Good may identify you and avoid voting you. Evil may keep you alive as a distraction or kill you if you become too dangerous.

**Synergies:** Framer, Hacker, and confusing investigative results can make your fake suspiciousness look real. Evil pressure can accidentally help you, but relying on Evil is risky.

### Framer

**Goal:** Make a player appear as a chosen role for the night.

**Strategy:** You control investigative confusion. Frame likely investigation targets, not random players. Framing yourself can create a false alibi; framing someone else can make Detective or Seer results point the wrong way.

**Counters:** If investigators suspect framing, they may delay revealing or cross-check results. Janitor and future role reveals can expose inconsistencies.

**Synergies:** Strong with Jester, Leader, Hacker, and any role that benefits from false role worlds. Can make Evil look Good, Good look Evil, or Neutral look like a bigger threat.

### Gambler

**Goal:** Use a random night ability each night.

**Strategy:** Flexibility is your strength. Each morning, think about what your rolled ability implies for your public story. You may need to explain inconsistent behavior because your power changes.

**Counters:** Randomness makes planning difficult. Good and Evil may both distrust you because your claims can sound convenient.

**Synergies:** You can fill missing functions in the setup: kill, investigate, protect, frame, silence, or disrupt depending on the roll. Track your rolls carefully.

### Persuader

**Goal:** Silence one living player so they cannot vote the next day.

**Strategy:** Remove a key vote at the exact moment it matters. Silencing a confirmed Good player, a loud leader, or a swing voter can reshape the day.

**Counters:** If the same player benefits from repeated silences, Good can infer your agenda. Silencing a suspicious player may accidentally help them avoid accountable voting.

**Synergies:** Works well with Evil pushes and Neutral endgames. Also pairs with vote-splitting strategies where one missing vote changes the outcome.

### Leader

**Goal:** Permanently change a living player's role.

**Strategy:** This is one of the most disruptive roles. You can remove dangerous abilities, create new threats, or change allegiances. Because successful changes apply before investigative results, you can also reshape what investigators truthfully see.

**Counters:** Roleblock stops you. Protection-like effects may affect whether your action succeeds depending on setup rules. If you change someone too obviously, the table may identify you as the source.

**Synergies:** Framer/Hacker can create confusion around whether a role result is fake or newly real. Detective and Seer results become more complicated but can validate your changes after they happen.

### Serial Killer

**Goal:** Kill each night and survive as a solo threat.

**Strategy:** Let Good and Evil fight while you remove players who can expose or control you. Avoid killing only Good power roles if that makes Evil too strong. Avoid killing only Evil if Good will then solve you.

**Counters:** Investigators, roleblocks, and vote consolidation are dangerous. Once the table believes a solo killer exists, unexplained deaths become evidence against you.

**Synergies:** Framer and Hacker confusion helps hide your kills. Persuader-style vote disruption can create endgame openings.

### Hater

**Goal:** Have your assigned target voted out so Evil wins.

**Strategy:** Your target is your win lever. Push suspicion gradually so your target's vote-out looks natural. If you tunnel them too hard, people may notice the agenda.

**Counters:** If your target becomes confirmed Good or socially trusted, your path gets harder. If they die at night instead of by vote, your special win condition is wasted.

**Synergies:** Evil teammates can help build suspicion on your target. Framer/Hacker can create mechanical doubt. Persuader can remove votes that would save your target.

### Godfather

**Goal:** Coordinate the Evil team kill and guide Evil strategy.

**Strategy:** You are the team's strategic center. Choose kills that remove information, not just loud voices. Let other evil players take some public positions so you do not become the obvious coordinator.

**Counters:** Detective, Seer, Policeman, and role interactions can expose your network. If every evil action benefits one player, Good may find you through patterns.

**Synergies:** Works with Hacker to corrupt investigations, Hater to steer votes, Mafia as cover, and Henchman as social pressure against Policeman.

### Hacker

**Goal:** Make a living player appear as a different role for the night.

**Strategy:** Like Framer, but Evil-aligned. Use hacking to protect Evil from investigators or create false cases on Good. Choose targets likely to be inspected.

**Counters:** Repeatedly impossible results can reveal that hacking exists. If Good waits for multiple results before acting, single-night hacks lose power.

**Synergies:** Excellent with Godfather and Hater. Can also help a Jester look genuinely suspicious if that benefits Evil's vote plan.

### Mafia

**Goal:** Support Evil and survive.

**Strategy:** You have no special ability, so your weapons are voting, claims, and positioning. Be useful enough not to be eliminated, but not so dominant that Good investigates you.

**Counters:** You are vulnerable to direct role and alignment checks. If Evil teammates fall, your voting record becomes dangerous.

**Synergies:** You can take heat away from stronger Evil roles or act as the "reasonable" evil teammate who survives after flashier roles are exposed.

### Henchman

**Goal:** Recognize the Policeman and use that pressure for Evil.

**Strategy:** The Policeman connection is powerful social leverage. You can pressure them indirectly, bait them into revealing too much, or make their hints look manipulative.

**Counters:** If you push the Policeman too obviously, Good may identify you. If Policeman's intel gets validated, your connection becomes dangerous.

**Synergies:** Works well with Godfather and Hacker. Hacker can muddy the truth while Henchman attacks the credibility or freedom of the Policeman.

## Counterplay Reference

### Against Investigators

Use Framer/Hacker effects, kill confirmed information roles, force early claims, and create worlds where true results still have multiple explanations.

### Against Killers

Track who benefits from each death. Protect or revive players with useful information. Use roleblocks on likely killers. Avoid letting solo killers hide behind Evil-team suspicion.

### Against Vote Manipulation

Watch missing votes, silenced players, and sudden bandwagons. If a key player cannot vote, ask who benefits from that absence.

### Against Role Changes

Treat role claims as time-sensitive. A claim that was true yesterday may not be true tonight. Investigative results after a successful role change should be read as seeing the new role, not the old one.

### Against Framing and Hacking

Do not build the whole game on one result. Confirm through multiple nights, voting behavior, deaths, and whether the target was likely to be investigated.

## Practical Table Habits

Keep a simple notes list: claims, claimed targets, vote positions, death timing, and who defended whom. Separate facts from theories. "Detective saw X as Evil" is a fact; "X is Evil" may still be a theory if framing or hacking exists.

When you accuse, include a reason that can be tested. When you defend, avoid defending someone so hard that you become tied to their flip. When you are unsure, say what would change your mind; that makes it harder for Evil to paint you as stubborn or opportunistic.

The best players are not always the loudest. The best players create situations where other people have to reveal their priorities.
