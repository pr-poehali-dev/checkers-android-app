import React, { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Screen, Settings, DIFFICULTY_LABELS, DIFFICULTY_DEPTH, Piece, Move, PieceColor } from "@/types/game";
import {
  initBoard,
  getPieceAt,
  getMovesForPiece,
  hasMustCapture,
  getAllMoves,
  applyMove,
  getBestMove,
} from "@/lib/checkers";

interface GameBoardProps {
  settings: Settings;
  onNav: (s: Screen) => void;
  onGameEnd: (r: "win" | "loss" | "draw") => void;
}

export function GameBoard({ settings, onNav, onGameEnd }: GameBoardProps) {
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
      {/* Top bar */}
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

      {/* Game over overlay */}
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
