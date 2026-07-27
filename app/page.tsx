"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Screen = "menu" | "cpu" | "multiplayer" | "rules" | "tutorial" | "settings" | "table";
type Difficulty = "Easy" | "Medium" | "Hard";
type Suit = "♠" | "♥" | "♦" | "♣";
type Phase = "Preflop" | "Flop" | "Turn" | "River" | "Showdown";
type Card = { rank: string; suit: Suit };
type Player = {
  name: string;
  chips: number;
  cards: Card[];
  folded: boolean;
  action: string;
  color: "blue" | "red" | "green";
};

const suits: Suit[] = ["♠", "♥", "♦", "♣"];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const phaseOrder: Phase[] = ["Preflop", "Flop", "Turn", "River", "Showdown"];

const makeDeck = () =>
  suits
    .flatMap((suit) => ranks.map((rank) => ({ rank, suit })))
    .sort(() => Math.random() - 0.5);

const rankValue = (rank: string) => ranks.indexOf(rank) + 2;

function fiveCardScore(cards: Card[]) {
  const values = cards.map((card) => rankValue(card.rank)).sort((a, b) => b - a);
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((card) => card.suit === cards[0].suit);
  const uniques = [...new Set(values)];
  if (uniques[0] === 14) uniques.push(1);
  let straightHigh = 0;
  for (let index = 0; index <= uniques.length - 5; index += 1) {
    if (uniques[index] - uniques[index + 4] === 4) straightHigh = uniques[index];
  }

  if (flush && straightHigh) return [8, straightHigh];
  if (groups[0][1] === 4) return [7, groups[0][0], groups[1][0]];
  if (groups[0][1] === 3 && groups[1][1] === 2) return [6, groups[0][0], groups[1][0]];
  if (flush) return [5, ...values];
  if (straightHigh) return [4, straightHigh];
  if (groups[0][1] === 3)
    return [3, groups[0][0], ...groups.slice(1).map(([value]) => value).sort((a, b) => b - a)];
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const pairs = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    return [2, ...pairs, groups.find(([, count]) => count === 1)?.[0] ?? 0];
  }
  if (groups[0][1] === 2)
    return [1, groups[0][0], ...groups.slice(1).map(([value]) => value).sort((a, b) => b - a)];
  return [0, ...values];
}

function compareScore(a: number[], b: number[]) {
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) - (b[index] ?? 0);
  }
  return 0;
}

function bestHand(cards: Card[]) {
  let best = [-1];
  for (let a = 0; a < cards.length - 4; a += 1)
    for (let b = a + 1; b < cards.length - 3; b += 1)
      for (let c = b + 1; c < cards.length - 2; c += 1)
        for (let d = c + 1; d < cards.length - 1; d += 1)
          for (let e = d + 1; e < cards.length; e += 1) {
            const score = fiveCardScore([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (compareScore(score, best) > 0) best = score;
          }
  return best;
}

const handNames = [
  "High card",
  "One pair",
  "Two pair",
  "Three of a kind",
  "Straight",
  "Flush",
  "Full house",
  "Four of a kind",
  "Straight flush",
];

function CardView({ card, hidden = false, small = false }: { card?: Card; hidden?: boolean; small?: boolean }) {
  if (!card || hidden) {
    return (
      <div className={`playing-card card-back ${small ? "small" : ""}`} aria-label="Face-down card">
        <span>G</span>
      </div>
    );
  }
  const red = card.suit === "♥" || card.suit === "♦";
  return (
    <div className={`playing-card ${red ? "red-suit" : ""} ${small ? "small" : ""}`} aria-label={`${card.rank} of ${card.suit}`}>
      <span className="card-rank">{card.rank}</span>
      <span className="card-suit">{card.suit}</span>
    </div>
  );
}

function Logo() {
  return (
    <div className="logo" aria-label="Gambl Poker">
      <span className="logo-mark"><i>G</i><b>♠</b></span>
      <span className="logo-copy"><b>GAMBL</b><small>POKER</small></span>
    </div>
  );
}

const rankGuide = [
  ["01", "Royal flush", "A K Q J 10 · same suit"],
  ["02", "Straight flush", "Five in sequence · same suit"],
  ["03", "Four of a kind", "Four cards · same rank"],
  ["04", "Full house", "Three of a kind + a pair"],
  ["05", "Flush", "Five cards · same suit"],
  ["06", "Straight", "Five cards in sequence"],
  ["07", "Three of a kind", "Three cards · same rank"],
  ["08", "Two pair", "Two different pairs"],
  ["09", "One pair", "Two cards · same rank"],
  ["10", "High card", "Your highest card plays"],
];

const tutorialSteps = [
  {
    phase: "Preflop",
    title: "Start with your two cards.",
    body: "You hold A♠ K♠ — one of the strongest starting hands. The blinds have created a pot, and it’s your turn to act.",
    board: [] as Card[],
  },
  {
    phase: "Flop",
    title: "Read the first three community cards.",
    body: "Q♠ J♠ 4♦ gives you a royal-flush draw. You can already make Ace-high, but a ten of spades would complete the best hand in poker.",
    board: [
      { rank: "Q", suit: "♠" as Suit },
      { rank: "J", suit: "♠" as Suit },
      { rank: "4", suit: "♦" as Suit },
    ],
  },
  {
    phase: "Turn",
    title: "The turn changes everything.",
    body: "10♠ lands. You now have a royal flush: A, K, Q, J, 10, all spades. Strong hands still benefit from smart bet sizing.",
    board: [
      { rank: "Q", suit: "♠" as Suit },
      { rank: "J", suit: "♠" as Suit },
      { rank: "4", suit: "♦" as Suit },
      { rank: "10", suit: "♠" as Suit },
    ],
  },
  {
    phase: "River",
    title: "One final community card.",
    body: "The river is 2♥. Your royal flush is unchanged. This is the final betting round, so decide how much value you can win.",
    board: [
      { rank: "Q", suit: "♠" as Suit },
      { rank: "J", suit: "♠" as Suit },
      { rank: "4", suit: "♦" as Suit },
      { rank: "10", suit: "♠" as Suit },
      { rank: "2", suit: "♥" as Suit },
    ],
  },
  {
    phase: "Showdown",
    title: "Build the best five-card hand.",
    body: "At showdown, players reveal their cards. Your A♠ K♠ joins Q♠ J♠ 10♠ on the board. Royal flush — the pot is yours.",
    board: [
      { rank: "Q", suit: "♠" as Suit },
      { rank: "J", suit: "♠" as Suit },
      { rank: "4", suit: "♦" as Suit },
      { rank: "10", suit: "♠" as Suit },
      { rank: "2", suit: "♥" as Suit },
    ],
  },
];

function AppButton({
  children,
  className = "",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button className={`app-button ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [soundOn, setSoundOn] = useState(true);
  const [hintsOn, setHintsOn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<Phase>("Preflop");
  const [pot, setPot] = useState(30);
  const [handNumber, setHandNumber] = useState(1);
  const [board, setBoard] = useState<Card[]>([]);
  const [fullBoard, setFullBoard] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [dealerMessage, setDealerMessage] = useState("Call 20, raise to 60, or fold?");
  const [resolving, setResolving] = useState(false);
  const [result, setResult] = useState("");
  const audioRef = useRef<AudioContext | null>(null);

  const playTone = (kind: "click" | "chip" | "deal" | "win") => {
    if (!soundOn || typeof window === "undefined") return;
    const AudioCtx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const audio = audioRef.current ?? new AudioCtx();
    audioRef.current = audio;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    const notes = { click: 280, chip: 760, deal: 180, win: 523 };
    oscillator.type = kind === "win" ? "triangle" : kind === "chip" ? "sine" : "square";
    oscillator.frequency.setValueAtTime(notes[kind], now);
    if (kind === "win") oscillator.frequency.exponentialRampToValueAtTime(1046, now + 0.22);
    else oscillator.frequency.exponentialRampToValueAtTime(Math.max(notes[kind] * 0.72, 80), now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "win" ? 0.11 : 0.045, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "win" ? 0.28 : 0.14));
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + (kind === "win" ? 0.3 : 0.16));
  };

  const go = (next: Screen) => {
    playTone("click");
    setScreen(next);
  };

  const startHand = (newSession = false, nextHandNumber = handNumber) => {
    const deck = makeDeck();
    const previous = players;
    const startingChips = newSession || previous.length === 0 ? [1000, 1000, 1000] : previous.map((player) => player.chips);
    const dealerIndex = (nextHandNumber - 1) % 3;
    const smallBlindIndex = (dealerIndex + 1) % 3;
    const bigBlindIndex = (dealerIndex + 2) % 3;
    const blindFor = (index: number) => index === smallBlindIndex ? 10 : index === bigBlindIndex ? 20 : 0;
    const actionFor = (index: number) => index === dealerIndex ? "Dealer" : index === smallBlindIndex ? "Small blind · 10" : "Big blind · 20";
    const nextPlayers: Player[] = [
      { name: "You", chips: Math.max(0, startingChips[0] - blindFor(0)), cards: [deck[0], deck[3]], folded: false, action: actionFor(0), color: "blue" },
      { name: "Nora", chips: Math.max(0, startingChips[1] - blindFor(1)), cards: [deck[1], deck[4]], folded: false, action: actionFor(1), color: "red" },
      { name: "Marco", chips: Math.max(0, startingChips[2] - blindFor(2)), cards: [deck[2], deck[5]], folded: false, action: actionFor(2), color: "green" },
    ];
    setPlayers(nextPlayers);
    setFullBoard(deck.slice(6, 11));
    setBoard([]);
    setPot(30);
    setPhase("Preflop");
    setDealerMessage("Call 20, raise to 60, or fold?");
    setResult("");
    setResolving(false);
    playTone("deal");
    setScreen("table");
  };

  const openCpuTable = () => {
    playTone("deal");
    setHandNumber(1);
    startHand(true, 1);
  };

  const cpuChoice = (player: Player) => {
    const high = Math.max(...player.cards.map((card) => rankValue(card.rank)));
    const pair = player.cards[0].rank === player.cards[1].rank;
    const madeHand = board.length >= 3 ? bestHand([...player.cards, ...board])[0] : pair ? 1 : 0;
    const roll = Math.random();
    if (difficulty === "Easy") return roll > 0.84 ? "Raises" : "Calls";
    if (difficulty === "Medium") {
      if (!pair && high < 9 && roll < 0.24) return "Folds";
      return madeHand >= 1 || high >= 12 ? (roll > 0.45 ? "Raises" : "Calls") : "Calls";
    }
    if (madeHand === 0 && high < 10 && roll < 0.38) return "Folds";
    return madeHand >= 1 || high >= 13 ? (roll > 0.3 ? "Raises" : "Calls") : roll > 0.18 ? "Calls" : "Raises";
  };

  const resolveShowdown = (updated: Player[], updatedPot: number) => {
    const active = updated.filter((player) => !player.folded);
    if (active.length === 1) {
      const winner = active[0];
      const next = updated.map((player) => player.name === winner.name ? { ...player, chips: player.chips + updatedPot, action: "Wins" } : player);
      setPlayers(next);
      setResult(`${winner.name} wins ${updatedPot} chips — everyone else folded.`);
      setDealerMessage(`${winner.name} takes the pot. Deal the next hand?`);
      setPot(0);
      playTone("win");
      return;
    }
    const ranked = active
      .map((player) => ({ player, score: bestHand([...player.cards, ...fullBoard]) }))
      .sort((a, b) => compareScore(b.score, a.score));
    const best = ranked[0].score;
    const winners = ranked.filter((entry) => compareScore(entry.score, best) === 0);
    const share = Math.floor(updatedPot / winners.length);
    const winnerNames = winners.map((entry) => entry.player.name);
    const next = updated.map((player) =>
      winnerNames.includes(player.name) ? { ...player, chips: player.chips + share, action: "Wins" } : player,
    );
    setPlayers(next);
    const label = handNames[best[0]];
    setResult(`${winnerNames.join(" & ")} ${winners.length > 1 ? "split" : "wins"} ${updatedPot} chips with ${label}.`);
    setDealerMessage(`${winnerNames.join(" & ")} takes the pot. Deal the next hand?`);
    setPot(0);
    playTone("win");
  };

  const takeAction = (action: "Fold" | "Call" | "Raise" | "All-In") => {
    if (resolving || phase === "Showdown") return;
    playTone(action === "Fold" ? "click" : "chip");
    setResolving(true);
    const playerCost = action === "All-In"
      ? players[0].chips
      : action === "Raise"
        ? (phase === "Preflop" ? 60 : 40)
        : action === "Call" && phase === "Preflop" ? 20 : 0;
    let nextPot = pot + playerCost;
    let updated = players.map((player, index) =>
      index === 0
        ? {
            ...player,
            chips: Math.max(0, player.chips - playerCost),
            folded: action === "Fold",
            action: action === "Call"
              ? (phase === "Preflop" ? "Calls · 20" : "Checks")
              : action === "Raise"
                ? (phase === "Preflop" ? "Raises · 60" : "Bets · 40")
                : action === "All-In" ? `All-in · ${playerCost}` : "Folds",
          }
        : { ...player, action: "Thinking…" },
    );
    setPlayers(updated);
    setPot(nextPot);

    window.setTimeout(() => {
      updated = updated.map((player, index) => {
        if (index === 0) return player;
        let choice = cpuChoice(player);
        if (action === "All-In" && choice === "Raises") choice = "Calls";
        const cost = action === "All-In"
          ? choice === "Calls" ? Math.min(playerCost, player.chips) : 0
          : choice === "Raises" ? (phase === "Preflop" ? 60 : 40) : choice === "Calls" ? (phase === "Preflop" ? 20 : 0) : 0;
        nextPot += cost;
        return { ...player, folded: choice === "Folds", chips: Math.max(0, player.chips - cost), action: choice };
      });
      setPlayers(updated);
      setPot(nextPot);

      const active = updated.filter((player) => !player.folded);
      const currentIndex = phaseOrder.indexOf(phase);
      if (active.length === 1) {
        setPhase("Showdown");
        setBoard(fullBoard);
        resolveShowdown(updated, nextPot);
      } else if (action === "Fold") {
        setPhase("Showdown");
        setBoard(fullBoard);
        resolveShowdown(updated, nextPot);
      } else if (currentIndex >= 3) {
        setPhase("Showdown");
        setBoard(fullBoard);
        resolveShowdown(updated, nextPot);
      } else {
        const nextPhase = phaseOrder[currentIndex + 1];
        setPhase(nextPhase);
        setBoard(fullBoard.slice(0, nextPhase === "Flop" ? 3 : nextPhase === "Turn" ? 4 : 5));
        setPlayers(updated.map((player, index) => !player.folded ? { ...player, action: index === 0 ? "Your turn" : "Waiting" } : player));
        setDealerMessage(nextPhase === "Flop" ? "Check the flop. Check, bet 40, or fold?" : `The ${nextPhase.toLowerCase()} is down. Check, bet 40, or fold?`);
        setResolving(false);
        playTone("deal");
      }
    }, reducedMotion ? 180 : 900);
  };

  const nextHand = () => {
    const next = handNumber + 1;
    setHandNumber(next);
    startHand(false, next);
  };

  const createRoom = () => {
    playTone("chip");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    setRoomCode(Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(""));
    setCopied(false);
  };

  const copyRoom = async () => {
    if (!roomCode) return;
    await navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    playTone("click");
  };

  const shownBoard = useMemo(() => Array.from({ length: 5 }, (_, index) => board[index]), [board]);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
  }, [reducedMotion]);

  return (
    <main className={`game-shell screen-${screen}`}>
      <header className="topbar">
        <button className="brand-button" onClick={() => go("menu")} aria-label="Return to main menu">
          <Logo />
        </button>
        <div className="top-actions">
          {screen !== "menu" && (
            <button className="text-button" onClick={() => go("menu")}>
              <span aria-hidden="true">←</span> Main menu
            </button>
          )}
          <button className="icon-button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "Mute casino sounds" : "Turn on casino sounds"}>
            {soundOn ? "♪" : "×"}
          </button>
        </div>
      </header>

      {screen === "menu" && (
        <section className="menu-screen">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Texas hold&apos;em · No account needed</p>
            <h1>Sit down.<br /><em>Own the pot.</em></h1>
            <p className="hero-subtitle">Read the table, make your move, and outplay the room. Every card. Every tell. Every chip.</p>
          </div>

          <div className="mode-grid">
            <button className="mode-card cpu-card" onClick={() => go("cpu")}>
              <span className="mode-top"><span className="mode-icon">♠</span><span className="status-pill">Instant play</span></span>
              <span className="mode-copy"><small>Solo table</small><strong>Play vs. CPU</strong><span>Choose your challenge and take on two sharp rivals.</span></span>
              <span className="mode-footer">Choose difficulty <b>→</b></span>
            </button>
            <button className="mode-card multiplayer-card" onClick={() => go("multiplayer")}>
              <span className="mode-top"><span className="mode-icon">♣</span><span className="status-pill green">Room code</span></span>
              <span className="mode-copy"><small>Private table</small><strong>Multiplayer</strong><span>Create a room code or join friends at their table.</span></span>
              <span className="mode-footer">Open the lobby <b>→</b></span>
            </button>
          </div>

          <nav className="utility-grid" aria-label="Learn and configure">
            <button onClick={() => go("rules")}><span className="utility-icon blue">?</span><span><b>How to play</b><small>Rules & hand rankings</small></span><i>→</i></button>
            <button onClick={() => { setTutorialIndex(0); go("tutorial"); }}><span className="utility-icon gold">♦</span><span><b>Guided tutorial</b><small>Play a practice hand</small></span><i>→</i></button>
            <button onClick={() => go("settings")}><span className="utility-icon red">⚙</span><span><b>Settings</b><small>Sound, hints & motion</small></span><i>→</i></button>
          </nav>

          <footer className="menu-footer"><span><i className="live-dot" /> Tables open</span><span>GAMBL Casino Collection</span></footer>
        </section>
      )}

      {screen === "cpu" && (
        <section className="panel-screen narrow-panel">
          <div className="section-heading">
            <p className="eyebrow"><span /> Solo table</p>
            <h2>Choose your table.</h2>
            <p>Three players. 1,000 chips each. Blinds start at 10 / 20.</p>
          </div>
          <div className="difficulty-list">
            {(["Easy", "Medium", "Hard"] as Difficulty[]).map((level) => (
              <button key={level} className={difficulty === level ? "selected" : ""} onClick={() => { setDifficulty(level); playTone("click"); }}>
                <span className={`difficulty-badge ${level.toLowerCase()}`}>{level === "Easy" ? "♣" : level === "Medium" ? "♦" : "♠"}</span>
                <span><b>{level}</b><small>{level === "Easy" ? "Relaxed calls, rare bluffs" : level === "Medium" ? "Balanced strategy, reads the board" : "Tight, aggressive, pressure-heavy"}</small></span>
                <i>{difficulty === level ? "✓" : ""}</i>
              </button>
            ))}
          </div>
          <AppButton className="primary full" onClick={openCpuTable}>Take your seat <span>→</span></AppButton>
        </section>
      )}

      {screen === "multiplayer" && (
        <section className="panel-screen lobby-panel">
          <div className="section-heading">
            <p className="eyebrow"><span /> Private multiplayer</p>
            <h2>Bring your table together.</h2>
            <p>Create a private room or enter the six-character code from your host.</p>
          </div>
          <div className="lobby-grid">
            <article>
              <div className="panel-icon green">＋</div>
              <h3>Create a room</h3>
              <p>Host a private table and share one simple code.</p>
              {roomCode ? (
                <div className="room-result">
                  <small>Your room code</small>
                  <strong>{roomCode}</strong>
                  <button onClick={copyRoom}>{copied ? "Copied!" : "Copy code"}</button>
                  <p className="waiting"><i /> Waiting for players…</p>
                </div>
              ) : (
                <AppButton className="secondary full" onClick={createRoom}>Create private room</AppButton>
              )}
            </article>
            <article>
              <div className="panel-icon blue">→</div>
              <h3>Join a room</h3>
              <p>Enter the code exactly as it appears.</p>
              <label className="code-field">
                <span>Room code</span>
                <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="ABC123" maxLength={6} />
              </label>
              <AppButton className="primary full" disabled={joinCode.length !== 6} onClick={() => setDealerMessage("This room is waiting for its host.")}>Join table</AppButton>
            </article>
          </div>
          <p className="lobby-note"><span>◎</span> Room lobby preview is ready. Live remote synchronization is the next multiplayer milestone.</p>
        </section>
      )}

      {screen === "rules" && (
        <section className="panel-screen rules-panel">
          <div className="section-heading split-heading">
            <div><p className="eyebrow"><span /> Quick reference</p><h2>How to play.</h2></div>
            <p>Make the best five-card hand from your two private cards and the five shared cards — or win by making everyone else fold.</p>
          </div>
          <div className="rules-grid">
            <article className="rounds-card">
              <h3>The four betting rounds</h3>
              {[
                ["1", "Preflop", "Receive two private cards."],
                ["2", "Flop", "Three community cards appear."],
                ["3", "Turn", "A fourth card joins the board."],
                ["4", "River", "The final card and final bets."],
              ].map(([number, name, copy]) => <div key={name}><b>{number}</b><span><strong>{name}</strong><small>{copy}</small></span></div>)}
              <p><b>Actions</b> Check when no bet is owed. Call to match, raise to increase, or fold to leave the hand.</p>
            </article>
            <article className="rank-card">
              <h3>Hand rankings</h3>
              <div className="rank-list">
                {rankGuide.map(([number, name, copy]) => <div key={name}><span>{number}</span><b>{name}</b><small>{copy}</small></div>)}
              </div>
            </article>
          </div>
        </section>
      )}

      {screen === "tutorial" && (
        <section className="panel-screen tutorial-panel">
          <div className="tutorial-progress">
            {tutorialSteps.map((step, index) => <span key={step.phase} className={index <= tutorialIndex ? "active" : ""}><i>{index + 1}</i><b>{step.phase}</b></span>)}
          </div>
          <div className="tutorial-stage">
            <div className="tutorial-table">
              <div className="mini-pot">POT <b>{tutorialIndex * 40 + 30}</b></div>
              <div className="tutorial-board">
                {Array.from({ length: 5 }, (_, index) => <CardView key={index} card={tutorialSteps[tutorialIndex].board[index]} hidden={!tutorialSteps[tutorialIndex].board[index]} />)}
              </div>
              <div className="tutorial-hand"><CardView card={{ rank: "A", suit: "♠" }} /><CardView card={{ rank: "K", suit: "♠" }} /></div>
            </div>
            <article className="tutorial-copy">
              <p className="eyebrow"><span /> Step {tutorialIndex + 1} of 5 · {tutorialSteps[tutorialIndex].phase}</p>
              <h2>{tutorialSteps[tutorialIndex].title}</h2>
              <p>{tutorialSteps[tutorialIndex].body}</p>
              <div className="tip-box"><b>Dealer tip</b><span>{tutorialIndex === 0 ? "Position matters: acting later gives you more information." : tutorialIndex === 4 ? "Only your best five cards count — not all seven." : "Keep watching both the board and your opponents’ actions."}</span></div>
              <div className="tutorial-actions">
                <AppButton className="ghost" disabled={tutorialIndex === 0} onClick={() => setTutorialIndex((index) => Math.max(0, index - 1))}>Back</AppButton>
                {tutorialIndex < tutorialSteps.length - 1 ? (
                  <AppButton className="primary" onClick={() => { setTutorialIndex((index) => index + 1); playTone("deal"); }}>Continue <span>→</span></AppButton>
                ) : (
                  <AppButton className="primary" onClick={() => go("cpu")}>Choose a table <span>→</span></AppButton>
                )}
              </div>
            </article>
          </div>
        </section>
      )}

      {screen === "settings" && (
        <section className="panel-screen settings-panel">
          <div className="section-heading">
            <p className="eyebrow"><span /> Preferences</p>
            <h2>Make the table yours.</h2>
            <p>Your choices are kept for this visit.</p>
          </div>
          <div className="settings-list">
            <label><span><b>Casino sounds</b><small>Cards, chips, buttons, and winning tones</small></span><input type="checkbox" checked={soundOn} onChange={(event) => setSoundOn(event.target.checked)} /><i /></label>
            <label><span><b>In-game hints</b><small>Show simple advice when it&apos;s your turn · Off by default</small></span><input type="checkbox" checked={hintsOn} onChange={(event) => setHintsOn(event.target.checked)} /><i /></label>
            <label><span><b>Reduce motion</b><small>Shorten card and table animations</small></span><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /><i /></label>
          </div>
          <AppButton className="primary full" onClick={() => go("menu")}>Save & return</AppButton>
        </section>
      )}

      {screen === "table" && players.length > 0 && (
        <section className="table-screen">
          <div className="table-meta">
            <span>Hand #{String(handNumber).padStart(2, "0")}</span>
            <b>{difficulty} table</b>
            <span>Blinds 10 / 20</span>
          </div>
          <div className="poker-table">
            <div className={`seat seat-left ${players[1].folded ? "folded" : ""}`}>
              <div className="avatar red-avatar">N</div>
              <div className="seat-copy"><b>{players[1].name}</b><span><i className="chip red-chip" /> {players[1].chips}</span><small>{players[1].action}</small></div>
              <div className="cpu-cards"><CardView card={players[1].cards[0]} hidden={phase !== "Showdown"} small /><CardView card={players[1].cards[1]} hidden={phase !== "Showdown"} small /></div>
            </div>
            <div className={`seat seat-right ${players[2].folded ? "folded" : ""}`}>
              <div className="cpu-cards"><CardView card={players[2].cards[0]} hidden={phase !== "Showdown"} small /><CardView card={players[2].cards[1]} hidden={phase !== "Showdown"} small /></div>
              <div className="avatar green-avatar">M</div>
              <div className="seat-copy"><b>{players[2].name}</b><span><i className="chip green-chip" /> {players[2].chips}</span><small>{players[2].action}</small></div>
            </div>

            <div className="center-table">
              <div className="phase-line"><span>{phase}</span><i /></div>
              <div className="board-cards">
                {shownBoard.map((card, index) => card ? <CardView key={index} card={card} /> : <div key={index} className="card-slot" aria-label="Empty community card position" />)}
              </div>
              <div className="pot-display"><span className="chip gold-chip" /><small>Total pot</small><b>{pot}</b></div>
            </div>

            <div className={`player-seat ${players[0].folded ? "folded" : ""}`}>
              <div className="player-cards"><CardView card={players[0].cards[0]} /><CardView card={players[0].cards[1]} /></div>
              <div className="player-info">
                <div className="avatar blue-avatar">Y</div>
                <div className="seat-copy"><b>You</b><span><i className="chip blue-chip" /> {players[0].chips}</span></div>
              </div>
            </div>
          </div>

          <div className="decision-dock" aria-live="polite">
            <div className="dealer-question">
              <span className="dealer-tag">Dealer asks</span>
              <strong>{dealerMessage}</strong>
              {resolving && <small className="answering-line"><i /> Nora and Marco are answering…</small>}
              {hintsOn && phase !== "Showdown" && <small>Hint: Strong pairs and high connected cards can support a raise. Folding protects your stack.</small>}
              {result && <small className="result-line">{result}</small>}
            </div>
            {phase !== "Showdown" ? (
              <div className="bet-actions">
                <AppButton className="fold-action" onClick={() => takeAction("Fold")} disabled={resolving}>Fold</AppButton>
                <AppButton className="call-action" onClick={() => takeAction("Call")} disabled={resolving}>{phase === "Preflop" ? "Call 20" : "Check"}</AppButton>
                <AppButton className="raise-action" onClick={() => takeAction("Raise")} disabled={resolving}>{phase === "Preflop" ? "Raise 60" : "Bet 40"}</AppButton>
                <AppButton className="all-in-action" onClick={() => takeAction("All-In")} disabled={resolving}>All-in</AppButton>
              </div>
            ) : (
              <div className="bet-actions">
                <AppButton className="fold-action" onClick={() => go("menu")}>Leave table</AppButton>
                <AppButton className="raise-action wide" onClick={nextHand}>Deal next hand</AppButton>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
