import { Piece, Move, PieceColor } from "@/types/game";

export function initBoard(): Piece[] {
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

export function getPieceAt(pieces: Piece[], row: number, col: number): Piece | null {
  return pieces.find(p => p.row === row && p.col === col) || null;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function getCaptures(piece: Piece, pieces: Piece[]): Move[] {
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

export function hasMustCapture(pieces: Piece[], color: PieceColor): boolean {
  return pieces.filter(p => p.color === color).some(p => getCaptures(p, pieces).length > 0);
}

export function getMovesForPiece(piece: Piece, pieces: Piece[], mustCap: boolean): Move[] {
  const caps = getCaptures(piece, pieces);
  if (caps.length > 0 || mustCap) return caps;
  return getSimpleMoves(piece, pieces);
}

export function getAllMoves(pieces: Piece[], color: PieceColor): Move[] {
  const mustCap = hasMustCapture(pieces, color);
  return pieces.filter(p => p.color === color).flatMap(p => getMovesForPiece(p, pieces, mustCap));
}

export function applyMove(pieces: Piece[], move: Move): Piece[] {
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

export function getBestMove(pieces: Piece[], aiColor: PieceColor, depth: number): Move | null {
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
