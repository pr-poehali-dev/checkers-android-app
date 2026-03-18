import React, { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
type IconName = string;

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "menu" | "game" | "settings" | "rating" | "stats" | "rules";
type PieceColor = "white" | "black";
type Difficulty = "beginner" | "easy" | "medium" | "hard" | "master";

interface Piece {
  id: number;
  color: PieceColor;
  isKing: boolean;
  row: number;
  col: number;
}

interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  captured?: { row: number; col: number };
}

interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  bestWinStreak: number;
  currentStreak: number;
}

interface Settings {
  difficulty: Difficulty;
  playerColor: PieceColor;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  showHints: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Новичок",
  easy: "Легкий",
  medium: "Средний",
  hard: "Сложный",
  master: "Мастер",
};

const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  beginner: 1,
  easy: 2,
  medium: 3,
  hard: 4,
  master: 6,
};

const RATING_DATA = [
  { name: "Гроссмейстер_99", score: 2850, wins: 342, difficulty: "Мастер", avatar: "🏆" },
  { name: "ШашечныйКороль", score: 2640, wins: 287, difficulty: "Мастер", avatar: "👑" },
  { name: "Стратег", score: 2410, wins: 231, difficulty: "Сложный", avatar: "⚡" },
  { name: "ЧёрныйФерзь", score: 2280, wins: 198, difficulty: "Сложный", avatar: "🔥" },
  { name: "АтакующийСтиль", score: 2100, wins: 167, difficulty: "Средний", avatar: "🎯" },
  { name: "Тактик64", score: 1950, wins: 143, difficulty: "Средний", avatar: "🛡" },
  { name: "НовыйЧемпион", score: 1820, wins: 112, difficulty: "Легкий", avatar: "🌟" },
  { name: "Игрок777", score: 1650, wins: 89, difficulty: "Легкий", avatar: "💎" },
];

// ─── Game Logic ───────────────────────────────────────────────────────────────
function initBoard(): Piece[] {
  const pieces: Piece[] = [];
  let id = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) pieces.push({ id: id++, color: "black", isKing: false, row, col });
        else if (row > 4) pieces.push({ id: id++, color: "white", isKing: false, row, col });
      }
    }
  }
  return pieces;
}

function getPieceAt(pieces: Piece[], row: number, col: number): Piece | null {
  return pieces.find(p => p.row === row && p.col === col) || null;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getCaptures(piece: Piece, pieces: Piece[]): Move[] {
  const moves: Move[] = [];
  const dirs = piece.isKing
    ? [[-1,-1],[-1,1],[1,-1],[1,1]]
    : piece.color === "white" ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];

  for (const [dr, dc] of dirs) {
    if (piece.isKing) {
      for (let d = 1; d < 7; d++) {
        const mr = piece.row + dr * d, mc = piece.col + dc * d;
        if (!inBounds(mr, mc)) break;
        const mid = getPieceAt(pieces, mr, mc);
        if (mid) {
          if (mid.color !== piece.color) {
            for (let l = 1; d + l < 8; l++) {
              const tr = piece.row + dr*(d+l), tc = piece.col + dc*(d+l);
              if (!inBounds(tr, tc) || getPieceAt(pieces, tr, tc)) break;
              moves.push({ fromRow: piece.row, fromCol: piece.col, toRow: tr, toCol: tc, captured: { row: mr, col: mc } });
            }
          }
          break;
        }
      }
    } else {
      const mr = piece.row + dr, mc = piece.col + dc;
      const tr = piece.row + dr*2, tc = piece.col + dc*2;
      if (inBounds(tr, tc)) {
        const mid = getPieceAt(pieces, mr, mc);
        if (mid && mid.color !== piece.color && !getPieceAt(pieces, tr, tc)) {
          moves.push({ fromRow: piece.row, fromCol: piece.col, toRow: tr, toCol: tc, captured: { row: mr, col: mc } });
        }
      }
    }
  }
  return moves;
}

function getSimpleMoves(piece: Piece, pieces: Piece[]): Move[] {
  const moves: Move[] = [];
  const dirs = piece.isKing
    ? [[-1,-1],[-1,1],[1,-1],[1,1]]
    : piece.color === "white" ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  for (const [dr, dc] of dirs) {
    if (piece.isKing) {
      for (let d = 1; d < 8; d++) {
        const tr = piece.row + dr*d, tc = piece.col + dc*d;
        if (!inBounds(tr, tc) || getPieceAt(pieces, tr, tc)) break;
        moves.push({ fromRow: piece.row, fromCol: piece.col, toRow: tr, toCol: tc });
      }
    } else {
      const tr = piece.row + dr, tc = piece.col + dc;
      if (inBounds(tr, tc) && !getPieceAt(pieces, tr, tc))
        moves.push({ fromRow: piece.row, fromCol: piece.col, toRow: tr, toCol: tc });
    }
  }
  return moves;
}

function hasMustCapture(pieces: Piece[], color: PieceColor): boolean {
  return pieces.filter(p => p.color === color).some(p => getCaptures(p, pieces).length > 0);
}

function getMovesForPiece(piece: Piece, pieces: Piece[], mustCap: boolean): Move[] {
  const caps = getCaptures(piece, pieces);
  if (caps.length > 0 || mustCap) return caps;
  return getSimpleMoves(piece, pieces);
}

function getAllMoves(pieces: Piece[], color: PieceColor): Move[] {
  const mustCap = hasMustCapture(pieces, color);
  return pieces.filter(p => p.color === color).flatMap(p => getMovesForPiece(p, pieces, mustCap));
}

function applyMove(pieces: Piece[], move: Move): Piece[] {
  let updated = pieces.map(p => {
    if (p.row === move.fromRow && p.col === move.fromCol) {
      const isKing = p.isKing
        || (p.color === "white" && move.toRow === 0)
        || (p.color === "black" && move.toRow === 7);
      return { ...p, row: move.toRow, col: move.toCol, isKing };
    }
    return p;
  });
  if (move.captured) {
    updated = updated.filter(p => !(p.row === move.captured!.row && p.col === move.captured!.col));
  }
  return updated;
}

// ─── AI ───────────────────────────────────────────────────────────────────────
function evaluate(pieces: Piece[], aiColor: PieceColor): number {
  let score = 0;
  const opp: PieceColor = aiColor === "black" ? "white" : "black";
  for (const p of pieces) {
    const val = (p.isKing ? 3 : 1) * 10;
    const center = (3.5 - Math.abs(p.col - 3.5)) * 0.3;
    const adv = (p.color === "black" ? p.row : 7 - p.row) * 0.2;
    score += p.color === aiColor ? val + center + adv : -(val + center + adv);
  }
  return score;
}

function minimax(pieces: Piece[], depth: number, alpha: number, beta: number, maxing: boolean, aiColor: PieceColor): number {
  const color: PieceColor = maxing ? aiColor : (aiColor === "black" ? "white" : "black");
  const moves = getAllMoves(pieces, color);
  if (depth === 0 || moves.length === 0) return evaluate(pieces, aiColor);
  if (maxing) {
    let best = -Infinity;
    for (const m of moves) {
      best = Math.max(best, minimax(applyMove(pieces, m), depth-1, alpha, beta, false, aiColor));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      best = Math.min(best, minimax(applyMove(pieces, m), depth-1, alpha, beta, true, aiColor));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function getBestMove(pieces: Piece[], aiColor: PieceColor, depth: number): Move | null {
  const moves = getAllMoves(pieces, aiColor);
  if (!moves.length) return null;
  if (depth <= 1) return moves[Math.floor(Math.random() * moves.length)];
  let best = moves[0], bestVal = -Infinity;
  for (const m of moves) {
    const v = minimax(applyMove(pieces, m), depth-1, -Infinity, Infinity, false, aiColor);
    if (v > bestVal) { bestVal = v; best = m; }
  }
  return best;
}

// ─── Components ───────────────────────────────────────────────────────────────

function MenuScreen({ onNav, stats }: { onNav: (s: Screen) => void; stats: GameStats }) {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-6 py-10 animate-fade-in">
      <div className="text-center pt-8">
        <div className="text-7xl animate-float mb-3">♟</div>
        <h1 className="font-montserrat font-black text-5xl text-gradient mb-1 tracking-tight">ШАШКИ</h1>
        <p className="text-muted-foreground font-rubik text-xs tracking-widest uppercase">Классическая игра</p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {[
          { label: "Побед", value: stats.wins, icon: "Trophy" },
          { label: "Игр", value: stats.gamesPlayed, icon: "Gamepad2" },
          { label: "Серия", value: stats.currentStreak, icon: "Zap" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <Icon name={s.icon as IconName} size={18} className="mx-auto mb-1 text-orange-400" />
            <div className="font-montserrat font-bold text-xl text-white">{s.value}</div>
            <div className="font-rubik text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button className="btn-primary text-lg" onClick={() => onNav("game")}>
          Новая игра
        </button>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Настройки", icon: "Settings", screen: "settings" as Screen },
            { label: "Рейтинг", icon: "Crown", screen: "rating" as Screen },
            { label: "Статистика", icon: "BarChart2", screen: "stats" as Screen },
            { label: "Правила", icon: "BookOpen", screen: "rules" as Screen },
          ].map(btn => (
            <button
              key={btn.label}
              className="btn-secondary text-sm flex items-center justify-center gap-2"
              onClick={() => onNav(btn.screen)}
            >
              <Icon name={btn.icon as IconName} size={16} className="text-orange-400" />
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground text-xs font-rubik">v1.0 · Шашки Pro</p>
    </div>
  );
}

function GameScreen({
  settings,
  onNav,
  onGameEnd,
}: {
  settings: Settings;
  onNav: (s: Screen) => void;
  onGameEnd: (r: "win" | "loss" | "draw") => void;
}) {
  const [pieces, setPieces] = useState<Piece[]>(initBoard);
  const [selected, setSelected] = useState<Piece | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>("white");
  const [lastMove, setLastMove] = useState<{ fr: number; fc: number; tr: number; tc: number } | null>(null);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [moveCount, setMoveCount] = useState(0);
  const [thinking, setThinking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aiColor: PieceColor = settings.playerColor === "white" ? "black" : "white";

  const checkEnd = useCallback((p: Piece[], turn: PieceColor): boolean => {
    if (!getAllMoves(p, turn).length || !p.some(x => x.color === turn)) {
      const result = turn === settings.playerColor ? "loss" : "win";
      setStatus(result === "win" ? "won" : "lost");
      onGameEnd(result);
      return true;
    }
    return false;
  }, [settings.playerColor, onGameEnd]);

  useEffect(() => {
    if (currentTurn !== aiColor || status !== "playing") return;
    setThinking(true);
    timerRef.current = setTimeout(() => {
      const move = getBestMove(pieces, aiColor, DIFFICULTY_DEPTH[settings.difficulty]);
      if (move) {
        const np = applyMove(pieces, move);
        setLastMove({ fr: move.fromRow, fc: move.fromCol, tr: move.toRow, tc: move.toCol });
        setPieces(np);
        setMoveCount(m => m + 1);
        if (!checkEnd(np, settings.playerColor)) setCurrentTurn(settings.playerColor);
      }
      setThinking(false);
    }, 500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentTurn, aiColor, pieces, settings, status, checkEnd]);

  const handleCellClick = (row: number, col: number) => {
    if (currentTurn !== settings.playerColor || status !== "playing" || thinking) return;

    const moveTarget = possibleMoves.find(m => m.toRow === row && m.toCol === col);
    if (moveTarget && selected) {
      const np = applyMove(pieces, moveTarget);
      setLastMove({ fr: selected.row, fc: selected.col, tr: row, tc: col });
      setPieces(np);
      setSelected(null);
      setPossibleMoves([]);
      setMoveCount(m => m + 1);
      if (!checkEnd(np, aiColor)) setCurrentTurn(aiColor);
      return;
    }

    const clickedPiece = getPieceAt(pieces, row, col);
    if (clickedPiece && clickedPiece.color === settings.playerColor) {
      const mustCap = hasMustCapture(pieces, settings.playerColor);
      const moves = getMovesForPiece(clickedPiece, pieces, mustCap);
      setSelected(clickedPiece);
      setPossibleMoves(moves);
      return;
    }

    setSelected(null);
    setPossibleMoves([]);
  };

  const reset = () => {
    setPieces(initBoard());
    setSelected(null);
    setPossibleMoves([]);
    setCurrentTurn("white");
    setLastMove(null);
    setStatus("playing");
    setMoveCount(0);
    setThinking(false);
  };

  const isLast = (r: number, c: number) =>
    lastMove && ((lastMove.fr === r && lastMove.fc === c) || (lastMove.tr === r && lastMove.tc === c));

  const playerCount = pieces.filter(p => p.color === settings.playerColor).length;
  const aiCount = pieces.filter(p => p.color === aiColor).length;

  return (
    <div className="flex flex-col min-h-screen px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onNav("menu")} className="glass rounded-xl p-2 text-muted-foreground hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <div className="text-center">
          <div className="font-montserrat font-bold text-sm">
            {status === "playing" ? (
              currentTurn === settings.playerColor
                ? <span className="text-green-400">Ваш ход</span>
                : <span className="text-orange-400 flex items-center gap-1 justify-center">
                    {thinking && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block" />}
                    Думает...
                  </span>
            ) : status === "won" ? "🎉 Победа!" : "😔 Поражение"}
          </div>
          <div className="text-muted-foreground text-xs">Ход {moveCount + 1} · {DIFFICULTY_LABELS[settings.difficulty]}</div>
        </div>
        <button onClick={reset} className="glass rounded-xl p-2 text-muted-foreground hover:text-orange-400 transition-colors">
          <Icon name="RotateCcw" size={20} />
        </button>
      </div>

      {/* AI row */}
      <div className="glass rounded-2xl p-3 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center text-lg">🤖</div>
          <div>
            <div className="font-montserrat font-bold text-xs text-white">Компьютер</div>
            <div className="text-xs text-muted-foreground">{DIFFICULTY_LABELS[settings.difficulty]}</div>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm
          ${aiColor === "black" ? "bg-gray-900 border-gray-600 text-white" : "bg-amber-100 border-amber-400 text-gray-900"}`}>
          {aiCount}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center py-1">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            width: "min(88vw, 380px)",
            height: "min(88vw, 380px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 0 3px hsl(25 95% 60% / 0.25)",
          }}
        >
          {Array.from({ length: 64 }, (_, idx) => {
            const row = Math.floor(idx / 8);
            const col = idx % 8;
            const isDark = (row + col) % 2 === 1;
            const piece = getPieceAt(pieces, row, col);
            const isSel = selected?.row === row && selected?.col === col;
            const isPoss = possibleMoves.some(m => m.toRow === row && m.toCol === col);
            const wasLast = isLast(row, col);

            let bg = "";
            if (!isDark) bg = "background: hsl(35 40% 75%)";
            else if (isSel) bg = "background: hsl(25 95% 50% / 0.5); box-shadow: inset 0 0 0 3px hsl(25 95% 60%)";
            else if (isPoss) bg = "background: hsl(160 70% 40% / 0.4); box-shadow: inset 0 0 0 2px hsl(160 70% 50% / 0.6)";
            else if (wasLast) bg = "background: hsl(45 100% 60% / 0.2)";
            else bg = "background: hsl(25 30% 28%)";

            return (
              <div
                key={idx}
                style={{ [bg.split(":")[0].trim()]: bg.split(":").slice(1).join(":").trim(), aspectRatio: "1", position: "relative" } as React.CSSProperties}
                className="flex items-center justify-center cursor-pointer transition-all duration-100"
                onClick={() => handleCellClick(row, col)}
              >
                {isPoss && isDark && !piece && (
                  <div className="w-3 h-3 rounded-full bg-green-400/70 animate-pulse" />
                )}
                {piece && (
                  <div
                    className={`rounded-full flex items-center justify-center transition-all duration-200 select-none
                      ${isSel ? "scale-110" : "hover:scale-105 active:scale-95"}
                      ${piece.color === "white"
                        ? "bg-gradient-to-br from-amber-100 to-amber-300 border-2 border-amber-400"
                        : "bg-gradient-to-br from-gray-700 to-gray-950 border-2 border-gray-500"}
                    `}
                    style={{
                      width: "74%", height: "74%",
                      boxShadow: piece.color === "white"
                        ? "0 3px 10px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.7)"
                        : "0 3px 10px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.1)",
                    }}
                  >
                    {piece.isKing && <span className="text-xs leading-none" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>♛</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player row */}
      <div className="glass rounded-2xl p-3 mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 border-2 border-orange-400 flex items-center justify-center text-lg">🎮</div>
          <div>
            <div className="font-montserrat font-bold text-xs text-white">Вы</div>
            <div className="text-xs text-muted-foreground">{settings.playerColor === "white" ? "Белые" : "Чёрные"}</div>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm
          ${settings.playerColor === "black" ? "bg-gray-900 border-gray-600 text-white" : "bg-amber-100 border-amber-400 text-gray-900"}`}>
          {playerCount}
        </div>
      </div>

      {/* Game over */}
      {status !== "playing" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-3xl p-8 text-center max-w-xs mx-4 animate-bounce-in">
            <div className="text-6xl mb-4">{status === "won" ? "🏆" : "😔"}</div>
            <h2 className="font-montserrat font-black text-3xl text-gradient mb-2">
              {status === "won" ? "Победа!" : "Поражение"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6 font-rubik">
              {status === "won" ? "Отличная игра! Вы победили компьютер." : "Не расстраивайтесь, попробуйте ещё раз!"}
            </p>
            <div className="flex gap-3">
              <button className="btn-primary flex-1 text-sm py-3" onClick={reset}>Ещё раз</button>
              <button className="btn-secondary flex-1 text-sm py-3" onClick={() => onNav("menu")}>Меню</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsScreen({ settings, onUpdate, onBack }: {
  settings: Settings;
  onUpdate: (s: Partial<Settings>) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen px-5 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="glass rounded-xl p-2 text-muted-foreground hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <h1 className="font-montserrat font-black text-2xl text-gradient">Настройки</h1>
      </div>

      <div className="space-y-4">
        {/* Difficulty */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Sword" size={18} className="text-orange-400" />
            <span className="font-montserrat font-bold text-white">Сложность</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {(["beginner","easy","medium","hard","master"] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => onUpdate({ difficulty: d })}
                className={`rounded-xl py-2 px-1 text-xs font-montserrat font-semibold transition-all duration-200
                  ${settings.difficulty === d ? "bg-orange-500 text-gray-900 scale-105" : "glass text-muted-foreground hover:text-white"}`}
              >
                {DIFFICULTY_LABELS[d].slice(0, 4)}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs mt-3 text-center">
            Выбрано: <span className="text-orange-400 font-semibold">{DIFFICULTY_LABELS[settings.difficulty]}</span>
          </p>
        </div>

        {/* Color */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Palette" size={18} className="text-orange-400" />
            <span className="font-montserrat font-bold text-white">Цвет фигур</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["white","black"] as PieceColor[]).map(color => (
              <button
                key={color}
                onClick={() => onUpdate({ playerColor: color })}
                className={`rounded-xl p-3 flex items-center gap-3 transition-all duration-200
                  ${settings.playerColor === color ? "bg-orange-500/20 border border-orange-500" : "glass"}`}
              >
                <div className={`w-8 h-8 rounded-full border-2
                  ${color === "white" ? "bg-amber-100 border-amber-400" : "bg-gray-900 border-gray-600"}`} />
                <span className="font-montserrat font-semibold text-sm text-white">
                  {color === "white" ? "Белые" : "Чёрные"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Sliders" size={18} className="text-orange-400" />
            <span className="font-montserrat font-bold text-white">Параметры</span>
          </div>
          {[
            { key: "showHints" as keyof Settings, label: "Подсказки ходов", icon: "Lightbulb" },
            { key: "animationsEnabled" as keyof Settings, label: "Анимации", icon: "Sparkles" },
            { key: "soundEnabled" as keyof Settings, label: "Звуки", icon: "Volume2" },
          ].map(opt => (
            <div key={opt.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={opt.icon as IconName} size={16} className="text-muted-foreground" />
                <span className="font-rubik text-sm text-white">{opt.label}</span>
              </div>
              <button
                onClick={() => onUpdate({ [opt.key]: !settings[opt.key] })}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings[opt.key] ? "bg-orange-500" : "bg-gray-700"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-sm ${settings[opt.key] ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RatingScreen({ onBack, stats }: { onBack: () => void; stats: GameStats }) {
  const playerScore = Math.max(0, stats.wins * 100 - stats.losses * 30);
  const allEntries = [...RATING_DATA, { name: "Вы", score: playerScore, wins: stats.wins, difficulty: "—", avatar: "🎮" }]
    .sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col min-h-screen px-5 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="glass rounded-xl p-2 text-muted-foreground hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <h1 className="font-montserrat font-black text-2xl text-gradient">Рейтинг</h1>
      </div>

      <div className="glass-strong rounded-2xl p-4 mb-4 flex items-center gap-4 glow-orange">
        <div className="text-4xl">🎮</div>
        <div className="flex-1">
          <div className="font-montserrat font-black text-base text-white">Вы</div>
          <div className="text-muted-foreground text-sm">{stats.wins} побед · {stats.gamesPlayed} игр</div>
        </div>
        <div className="text-right">
          <div className="font-montserrat font-black text-2xl text-gradient">{playerScore}</div>
          <div className="text-muted-foreground text-xs">очков</div>
        </div>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pb-4">
        {allEntries.map((entry, i) => {
          const isMe = entry.name === "Вы";
          return (
            <div key={entry.name} className={`rounded-2xl p-3 flex items-center gap-3 ${isMe ? "bg-orange-500/20 border border-orange-500/40" : "glass"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-montserrat font-black text-xs flex-shrink-0
                ${i === 0 ? "bg-yellow-400 text-gray-900" : i === 1 ? "bg-gray-300 text-gray-900" : i === 2 ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"}`}>
                {i + 1}
              </div>
              <div className="text-xl">{entry.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className={`font-montserrat font-bold text-sm truncate ${isMe ? "text-orange-400" : "text-white"}`}>{entry.name}</div>
                <div className="text-muted-foreground text-xs">{entry.wins} побед · {entry.difficulty}</div>
              </div>
              <div className="font-montserrat font-black text-base text-white flex-shrink-0">{entry.score}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsScreen({ stats, onBack }: { stats: GameStats; onBack: () => void }) {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  return (
    <div className="flex flex-col min-h-screen px-5 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="glass rounded-xl p-2 text-muted-foreground hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <h1 className="font-montserrat font-black text-2xl text-gradient">Статистика</h1>
      </div>

      <div className="glass-strong rounded-3xl p-6 mb-5 flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(230 15% 18%)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(25 95% 60%)" strokeWidth="8"
              strokeDasharray={`${winRate * 2.51} 251`} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-montserrat font-black text-xl text-white">{winRate}%</span>
          </div>
        </div>
        <div>
          <div className="font-montserrat font-black text-lg text-white">Процент побед</div>
          <div className="text-muted-foreground text-sm mt-1">{stats.wins}П / {stats.losses}Пор / {stats.draws}Н</div>
          {stats.gamesPlayed === 0 && <p className="text-muted-foreground text-xs mt-2">Сыграйте первую игру!</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Побед", value: stats.wins, icon: "Trophy", color: "text-yellow-400" },
          { label: "Поражений", value: stats.losses, icon: "X", color: "text-red-400" },
          { label: "Ничьих", value: stats.draws, icon: "Minus", color: "text-blue-400" },
          { label: "Всего игр", value: stats.gamesPlayed, icon: "Gamepad2", color: "text-orange-400" },
          { label: "Лучшая серия", value: stats.bestWinStreak, icon: "Flame", color: "text-orange-500" },
          { label: "Тек. серия", value: stats.currentStreak, icon: "Zap", color: "text-green-400" },
        ].map(item => (
          <div key={item.label} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Icon name={item.icon as IconName} size={20} className={item.color} />
            </div>
            <div>
              <div className="font-montserrat font-black text-xl text-white">{item.value}</div>
              <div className="text-muted-foreground text-xs">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesScreen({ onBack }: { onBack: () => void }) {
  const rules = [
    { title: "Начало игры", icon: "PlayCircle", text: "Каждый игрок начинает с 12 шашками на тёмных клетках трёх первых рядов. Белые ходят первыми." },
    { title: "Ход шашки", icon: "ArrowUpRight", text: "Обычная шашка ходит по диагонали вперёд на одну клетку." },
    { title: "Взятие", icon: "Crosshair", text: "Если вражеская шашка стоит по диагонали, а следующая клетка свободна — нужно перепрыгнуть и снять её. Взятие обязательно!" },
    { title: "Дамка", icon: "Crown", text: "Шашка, достигшая последнего ряда соперника, становится дамкой. Дамка ходит на любое расстояние по диагонали в любом направлении." },
    { title: "Серия взятий", icon: "Zap", text: "Если после взятия можно прыгнуть ещё — это обязательно. За один ход можно снять несколько шашек." },
    { title: "Победа", icon: "Trophy", text: "Побеждает тот, кто снимет все шашки соперника или лишит его возможности ходить." },
  ];
  return (
    <div className="flex flex-col min-h-screen px-5 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="glass rounded-xl p-2 text-muted-foreground hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <h1 className="font-montserrat font-black text-2xl text-gradient">Правила</h1>
      </div>
      <div className="space-y-3 flex-1">
        {rules.map((r, i) => (
          <div key={r.title} className="glass rounded-2xl p-4 flex gap-3" style={{ animationDelay: `${i*60}ms` }}>
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name={r.icon as IconName} size={18} className="text-orange-400" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-white text-sm mb-1">{r.title}</h3>
              <p className="font-rubik text-muted-foreground text-sm leading-relaxed">{r.text}</p>
            </div>
          </div>
        ))}
        <div className="glass-strong rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🇷🇺</div>
          <h3 className="font-montserrat font-bold text-white mb-1">Русские шашки</h3>
          <p className="text-muted-foreground text-sm font-rubik">Классические правила на доске 8×8</p>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
const DEF_SETTINGS: Settings = {
  difficulty: "medium",
  playerColor: "white",
  soundEnabled: true,
  animationsEnabled: true,
  showHints: true,
};

const DEF_STATS: GameStats = {
  wins: 0, losses: 0, draws: 0,
  gamesPlayed: 0, bestWinStreak: 0, currentStreak: 0,
};

function load<T>(key: string, fallback: T): T {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; }
  catch { return fallback; }
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [settings, setSettings] = useState<Settings>(() => load("cks_settings", DEF_SETTINGS));
  const [stats, setStats] = useState<GameStats>(() => load("cks_stats", DEF_STATS));

  useEffect(() => { localStorage.setItem("cks_settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem("cks_stats", JSON.stringify(stats)); }, [stats]);

  const updateSettings = (p: Partial<Settings>) => setSettings(prev => ({ ...prev, ...p }));

  const handleGameEnd = (result: "win" | "loss" | "draw") => {
    setStats(prev => {
      const wins = prev.wins + (result === "win" ? 1 : 0);
      const losses = prev.losses + (result === "loss" ? 1 : 0);
      const draws = prev.draws + (result === "draw" ? 1 : 0);
      const gamesPlayed = prev.gamesPlayed + 1;
      const currentStreak = result === "win" ? prev.currentStreak + 1 : 0;
      const bestWinStreak = Math.max(prev.bestWinStreak, currentStreak);
      return { ...prev, wins, losses, draws, gamesPlayed, currentStreak, bestWinStreak };
    });
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden" style={{ fontFamily: "'Rubik', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-orange-500/5 blur-3xl animate-float" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      {screen === "menu" && <MenuScreen onNav={setScreen} stats={stats} />}
      {screen === "game" && <GameScreen settings={settings} onNav={setScreen} onGameEnd={handleGameEnd} />}
      {screen === "settings" && <SettingsScreen settings={settings} onUpdate={updateSettings} onBack={() => setScreen("menu")} />}
      {screen === "rating" && <RatingScreen onBack={() => setScreen("menu")} stats={stats} />}
      {screen === "stats" && <StatsScreen stats={stats} onBack={() => setScreen("menu")} />}
      {screen === "rules" && <RulesScreen onBack={() => setScreen("menu")} />}
    </div>
  );
}