# PRD: Poker (Texas Hold'em — CPU + Multiplayer)

## 1. Overview
A Texas Hold'em poker game playable two ways: solo against CPU opponents with selectable difficulty, or multiplayer against other players via a room-code system — mirroring the mode structure used in [[blackjack-game]].

## 2. Game Modes

### 2.1 Vs. CPU
Player selects a difficulty before starting a session:

| Difficulty | Behavior |
|---|---|
| **Easy** | Loose/predictable play — plays a wide range of starting hands, minimal bluffing, mostly calls/checks. |
| **Medium** | Follows solid, standard strategy — reasonable starting-hand selection, position awareness, occasional bluffing. |
| **Hard** | Plays optimally — tight/aggressive strategy, pot-odds-aware betting, bluffing and hand-reading based on betting patterns and board texture. |

- Difficulty is selectable from the menu/lobby before a session starts (and re-selectable between sessions).
- Single player at a table with one or more CPU opponents.

### 2.2 Multiplayer (Room Code)
- A player creates a room and receives a shareable room code.
- Other players join the same table by entering that code.
- All joined players play at a shared table (standard multiplayer poker format), acting in turn order around the table.
- Players see each other's bets, chip stacks, and actions in real time (hole cards stay private until showdown).

### 2.3 How to Play (Menu)
- A dedicated **How to Play** entry in the menu, separate from Play vs. CPU / Play Multiplayer.
- Walks through the official rules from Section 4 in player-friendly language: hand rankings, betting rounds, positions, and actions.
- Accessible from the main menu at any time.

### 2.4 Tutorial (Menu)
- A dedicated **Tutorial** entry that teaches a new player how to play, separate from How to Play (a reference) and separate from a real game.
- Walks the player through an actual practice hand step by step — preflop, flop, turn, river, showdown — explaining what's happening and why at each step.
- A guided teaching mode, not a scored game.

### 2.5 Hints (In-Game)
- Simple hints during actual gameplay.
- Toggleable from the menu/settings.
- Off by default.

## 3. Flow
1. **Menu / Lobby**
   - Play vs. CPU (choose difficulty)
   - Play Multiplayer → Create Room (get code) or Join Room (enter code)
   - How to Play
   - Tutorial (guided practice hand)
   - Settings (includes Hints toggle)
2. **Table / Blinds**
   - Small blind and big blind posted by the two players left of the dealer button.
3. **Preflop**
   - Each player is dealt two private hole cards.
   - Betting round starting with the player left of the big blind.
4. **Flop**
   - Three community cards are dealt face up.
   - Betting round starting with the first active player left of the dealer button.
5. **Turn**
   - A fourth community card is dealt.
   - Betting round.
6. **River**
   - A fifth community card is dealt.
   - Final betting round.
7. **Showdown**
   - Remaining players reveal hole cards; best 5-card hand (from hole cards + community cards) wins the pot.
   - If only one player remains (all others folded), that player wins the pot without a showdown.
8. **Next Hand**
   - Dealer button moves one seat clockwise; blinds are posted again; repeat.

## 4. Official Rules

### 4.1 Objective
Win chips by having the best 5-card hand at showdown, or by being the last player remaining after all others fold.

### 4.2 The Deck
- Standard 52-card deck, no jokers.

### 4.3 Blinds
- The player immediately left of the dealer button posts the **small blind**; the next player posts the **big blind** (typically double the small blind).
- Blinds ensure there's always something to play for each hand.

### 4.4 Hole Cards & Community Cards
- Each player receives **2 private hole cards**.
- Over the course of a hand, **5 community cards** are dealt face up in the middle of the table (3-1-1: flop, turn, river).
- Players make the best possible 5-card hand using any combination of their 2 hole cards and the 5 community cards.

### 4.5 Betting Actions
On their turn, a player may:
- **Fold** — forfeit the hand and any further claim to the pot.
- **Check** — pass the action without betting (only valid if no bet is owed).
- **Call** — match the current bet.
- **Bet / Raise** — put in chips, increasing the amount others must match to stay in.
- **All-In** — bet all remaining chips.

### 4.6 Betting Rounds
- Four betting rounds per hand: preflop, flop, turn, river.
- A round ends when all active players have either matched the current bet or folded.

### 4.7 Hand Rankings (highest to lowest)
1. **Royal Flush** — A, K, Q, J, 10, all the same suit.
2. **Straight Flush** — five sequential cards, same suit.
3. **Four of a Kind** — four cards of the same rank.
4. **Full House** — three of a kind plus a pair.
5. **Flush** — five cards of the same suit, not sequential.
6. **Straight** — five sequential cards, mixed suits.
7. **Three of a Kind** — three cards of the same rank.
8. **Two Pair** — two separate pairs.
9. **One Pair** — two cards of the same rank.
10. **High Card** — no other hand made; highest card plays.
- Ties are broken by kicker cards; if hands are fully identical in rank, the pot is split.

### 4.8 Showdown
- After the river betting round, remaining players reveal their hole cards in turn order (typically starting with the last aggressor, or the player left of the dealer if no bets were made).
- The best 5-card hand wins the pot. Ties split the pot evenly.

## 5. Open Questions
- Table size — how many total seats (CPU + multiplayer)?
- Starting chip stack and blind levels — fixed, or increasing over time (tournament-style)?
- Cash game (rebuy anytime) or tournament (elimination when out of chips)?
- Time limit per action (to prevent stalling), especially in multiplayer?
- Can CPU players fill empty seats in a multiplayer room?
- Do chip stacks persist between sessions, or reset each time?
- Format for How to Play — static text/diagrams, or interactive walkthrough?
- Is the Tutorial a fixed scripted hand, or randomized each time?
- Can a player skip/exit the Tutorial partway through?
- Any chat/emote functionality for multiplayer rooms?
