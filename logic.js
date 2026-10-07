'use strict';
// Раскраска для Ани — логика без отрисовки (её же гоняет selfcheck.js в Node).
// Поле N×N цветов над холстом. Собранный ряд (3+) красит клетки под собой своим цветом — только там, где по картине нужен
// именно он; закрашенное остаётся. Цель — закрасить всю картину. Спецфишки — инструменты художника:
// 4 в ряд — кисть (красит весь ряд или столбец), уголок Г/Т — клякса (3×3), 5 в ряд — палитра (поменять с цветком: все цветы этого цвета).
// Краска растекается: ряд красит и соседние клетки, которым нужен его цвет (на 1 клетку) — одинокие «последние клетки» не мучают.
const N = 8;
let UID = 1;
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 >>> 0; let t = a;
  t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const piece = (c, sp = '') => ({ id: UID++, c, sp });                         // c — номер цвета в палитре уровня; у палитры c = -1
function pick(S) { let x = S.r() * S.W; for (let j = 0; j < S.k; j++) { x -= S.w[j]; if (x < 0) return j; } return S.k - 1; }   // цвет с весами уровня
const at = (B, [x, y]) => B[y][x];
const adj = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
function swap(B, a, b) { const t = B[a[1]][a[0]]; B[a[1]][a[0]] = B[b[1]][b[0]]; B[b[1]][b[0]] = t; }

function newGame(level, seed) {
  const r = rng(seed), k = level.palette.length, w = level.weights || Array.from(level.palette, () => 1), B = [], S0 = { r, k, w, W: w.reduce((a, b) => a + b, 0) };
  for (let y = 0; y < N; y++) { B.push([]);
    for (let x = 0; x < N; x++) { let c;
      do c = pick(S0); while ((x >= 2 && B[y][x - 1].c === c && B[y][x - 2].c === c) || (y >= 2 && B[y - 1][x].c === c && B[y - 2][x].c === c));
      B[y].push(piece(c)); } }
  const S = { ...S0, B, target: level.target, painted: level.target.map(row => row.map(t => t < 0)), moves: 0 };
  if (!hasMove(B)) shuffle(S);
  return S;
}
const need = S => S.painted.flat().filter(p => !p).length;                     // сколько клеток ещё не закрашено
const won = S => need(S) === 0;

// Ряды 3+ одного цвета, пересекающиеся — в одну группу (так видны уголки Г/Т)
function groups(B) {
  const runs = [];
  for (let d = 0; d < 2; d++) for (let i = 0; i < N; i++) for (let j = 0; j < N;) {
    const p = d ? B[j][i] : B[i][j], c = p ? p.c : -1; let e = j + 1;
    while (e < N && c >= 0) { const q = d ? B[e][i] : B[i][e]; if (!q || q.c !== c) break; e++; }
    if (c >= 0 && e - j >= 3) runs.push({ c, h: !d, len: e - j, cells: Array.from({ length: e - j }, (_, k) => d ? [i, j + k] : [j + k, i]) });
    j = e;
  }
  const gs = [];
  for (const r of runs) {
    const hit = gs.filter(g => g.c === r.c && r.cells.some(([x, y]) => g.key.has(x + ',' + y)));
    const g = { c: r.c, h: r.h, v: !r.h, len: r.len, cells: [], key: new Set() };
    for (const o of hit.concat([r])) { g.h = g.h || o.h; g.v = g.v || o.v; g.len = Math.max(g.len, o.len);
      for (const [x, y] of o.cells) if (!g.key.has(x + ',' + y)) { g.key.add(x + ',' + y); g.cells.push([x, y]); } }
    for (const o of hit) gs.splice(gs.indexOf(o), 1);
    gs.push(g);
  }
  return gs;
}
const specialOf = g => g.len >= 5 ? 'pal' : g.h && g.v ? 'blot' : g.len === 4 ? (g.h ? 'row' : 'col') : '';

function hasMove(B) {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const a = [x, y], b = [x + dx, y + dy]; if (b[0] >= N || b[1] >= N) continue;
    if (at(B, a).sp === 'pal' || at(B, b).sp === 'pal') return true;
    swap(B, a, b); const ok = groups(B).length > 0; swap(B, a, b);
    if (ok) return true;
  }
  return false;
}
function shuffle(S) {                                                           // ходов нет — перемешать цвета (фишки остаются те же)
  const all = S.B.flat();
  for (let t = 0; t < 200; t++) {
    const cs = all.map(p => p.c);
    for (let i = cs.length - 1; i > 0; i--) { const j = Math.floor(S.r() * (i + 1)); [cs[i], cs[j]] = [cs[j], cs[i]]; }
    all.forEach((p, i) => { p.c = cs[i]; });
    if (!groups(S.B).length && hasMove(S.B)) return;
  }
  all.forEach(p => { if (p.sp !== 'pal') p.c = pick(S); });
}

// Ход: поменять a и b. null — хода нет (обмен без ряда). Иначе раунды для анимации:
// { clear: [{id,x,y,c}], paint: [[x,y,c,растеклась?]], born: [{id,x,y,c,sp}], fx: [{t,x,y,c}], spawn: [новых в столбце], after: поле }.
function move(S, a, b) {
  const B = S.B;
  if (!adj(a, b)) return null;
  const pa = at(B, a), pb = at(B, b);
  swap(B, a, b);
  const pal = pa.sp === 'pal' ? { at: b, with: pb } : pb.sp === 'pal' ? { at: a, with: pa } : null;   // где теперь палитра и с чем её поменяли
  let gs = groups(B);
  if (!pal && !gs.length) { swap(B, a, b); return null; }
  S.moves++;
  const rounds = [];
  for (let first = true; ; first = false) {
    const mark = new Map(), queue = [], fx = [], born = [], R = { clear: [], paint: [], born, fx };
    const hit = (x, y, c) => { if (x < 0 || y < 0 || x >= N || y >= N || !B[y][x]) return; const k = x + ',' + y;   // клетку могут задеть несколько цветов
      if (!mark.has(k)) { mark.set(k, { x, y, cs: new Set() }); queue.push(k); } if (c >= 0) mark.get(k).cs.add(c); };
    if (first && pal) {                                                         // палитра: все цветы цвета партнёра (две палитры — всё поле)
      const col = pal.with.sp === 'pal' ? -2 : pal.with.c;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const q = B[y][x]; if (q.sp !== 'pal' && (col === -2 || q.c === col)) hit(x, y, q.c); }
      at(B, pal.at).sp = 'used'; hit(pal.at[0], pal.at[1], -1);
      if (pal.with.sp === 'pal') { const o = pal.at === b ? a : b; pal.with.sp = 'used'; hit(o[0], o[1], -1); }   // вторая палитра тоже уходит
      fx.push({ t: 'pal', x: pal.at[0], y: pal.at[1], c: col });
    }
    for (const g of gs) {
      for (const [x, y] of g.cells) hit(x, y, g.c);
      const sp = specialOf(g);
      if (sp) { const p0 = (first && g.cells.find(([x, y]) => (x === a[0] && y === a[1]) || (x === b[0] && y === b[1]))) || g.cells[g.cells.length >> 1];
        born.push({ x: p0[0], y: p0[1], c: sp === 'pal' ? -1 : g.c, sp }); }
    }
    for (let i = 0; i < queue.length; i++) {                                    // спецфишка под ударом срабатывает (цепочки)
      const m = mark.get(queue[i]), p = B[m.y][m.x];
      if (p.sp === 'row') { fx.push({ t: 'row', x: m.x, y: m.y, c: p.c }); for (let x = 0; x < N; x++) hit(x, m.y, p.c); }
      else if (p.sp === 'col') { fx.push({ t: 'col', x: m.x, y: m.y, c: p.c }); for (let y = 0; y < N; y++) hit(m.x, y, p.c); }
      else if (p.sp === 'blot') { fx.push({ t: 'blot', x: m.x, y: m.y, c: p.c }); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) hit(m.x + dx, m.y + dy, p.c); }
      else if (p.sp === 'pal') {                                                // палитра под ударом: самый частый цвет на поле
        const cnt = {}; for (const q of B.flat()) if (q && q.c >= 0) cnt[q.c] = (cnt[q.c] || 0) + 1;
        const col = +Object.keys(cnt).sort((u, v) => cnt[v] - cnt[u])[0];
        fx.push({ t: 'pal', x: m.x, y: m.y, c: col });
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (B[y][x] && B[y][x].c === col) hit(x, y, col);
      }
      p.sp = p.sp ? 'used' : '';
    }
    for (const m of mark.values()) {
      const t = S.target[m.y][m.x];                                             // покраска: если среди задевших цветов есть нужный по картине
      if (t >= 0 && m.cs.has(t) && !S.painted[m.y][m.x]) { S.painted[m.y][m.x] = true; R.paint.push([m.x, m.y, t]); }
      R.clear.push({ id: B[m.y][m.x].id, x: m.x, y: m.y, c: B[m.y][m.x].c }); B[m.y][m.x] = null;
    }
    for (const m of mark.values()) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {   // краска растекается от ряда на соседей, которым нужен его цвет (на 1 клетку)
      const u = m.x + dx, v = m.y + dy, t = u >= 0 && v >= 0 && u < N && v < N ? S.target[v][u] : -1;
      if (t >= 0 && m.cs.has(t) && !S.painted[v][u]) { S.painted[v][u] = true; R.paint.push([u, v, t, 1]); }
    }
    for (const n of born) { const q = piece(n.c, n.sp); n.id = q.id; B[n.y][n.x] = q; }   // спецфишка встаёт на место ряда
    R.spawn = fall(S);
    R.after = S.B.map(r => r.map(p => ({ ...p })));                              // поле после раунда — для анимации по раундам
    rounds.push(R);
    gs = groups(B);
    if (!gs.length) break;
  }
  if (!hasMove(B)) { shuffle(S); rounds.push({ shuffle: true }); }
  return rounds;
}
function fall(S) {                                                              // падение и досыпание сверху; вернёт число новых в каждом столбце
  const B = S.B, spawn = [];
  for (let x = 0; x < N; x++) { let w = N - 1;
    for (let y = N - 1; y >= 0; y--) if (B[y][x]) { if (y !== w) { B[w][x] = B[y][x]; B[y][x] = null; } w--; }
    spawn.push(w + 1);
    for (let y = w; y >= 0; y--) B[y][x] = piece(pick(S));
  }
  return spawn;
}

// Подсказка и бот: ход, который красит больше всего клеток (проверяется на копии поля), иначе — любой
function clone(S, seed) { return { B: S.B.map(r => r.map(p => p && { ...p })), r: rng(seed), k: S.k, w: S.w, W: S.W, target: S.target, painted: S.painted.map(r => r.slice()), moves: S.moves }; }
function bestMove(S, seed = 1) {
  let best = null, bs = -1, before = need(S);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const a = [x, y], b = [x + dx, y + dy]; if (b[0] >= N || b[1] >= N) continue;
    const C = clone(S, seed); if (!move(C, a, b)) continue;
    const sc = before - need(C) + C.r() * 0.5;                                  // равные — случайно
    if (sc > bs) { bs = sc; best = [a, b]; }
  }
  return best;
}

globalThis.RL = { N, rng, newGame, move, groups, hasMove, need, won, bestMove, specialOf };
