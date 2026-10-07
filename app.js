'use strict';
// Раскраска для Ани — отрисовка, касания, звук, окна. Логика — logic.js (RL), картины — levels.js (LV).
(() => {
const { N, newGame, move, need, won, bestMove } = RL;
const $ = id => document.getElementById(id);
const ls = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const shade = (h, k) => '#' + h.slice(1).match(/\w\w/g).map(x => { const v = parseInt(x, 16); return Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k).toString(16).padStart(2, '0'); }).join('');

// ─── цветы: у каждого цвета своя форма (различимы и без цвета) ───
const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i * 360 / n)).join('');
const FLOWER = {
  R: (c, d, l) => `<circle r="40" fill="${d}"/><circle r="35" fill="${c}"/>`                        // роза: бутон со спиралью
    + `<path d="M2 -20 A19 19 0 1 1 -19 4 A13 13 0 1 0 6 -12 A7 7 0 1 1 -5 -3" fill="none" stroke="${d}" stroke-width="5.5" stroke-linecap="round"/><circle cx="-14" cy="-16" r="6" fill="${l}" opacity=".55"/>`,
  Y: (c, d) => ring(14, a => `<ellipse cx="0" cy="-29" rx="8" ry="16" fill="${c}" stroke="${d}" stroke-width="1.5" transform="rotate(${a})"/>`)   // подсолнух
    + `<circle r="19" fill="#7a4a1e"/><circle r="19" fill="none" stroke="#5a3412" stroke-width="3"/>` + ring(8, a => `<circle cx="0" cy="-9" r="2.4" fill="#a8702e" transform="rotate(${a})"/>`),
  B: (c, d) => ring(9, a => `<path d="M0 -10 L-9 -40 L-3 -33 L0 -44 L3 -33 L9 -40 Z" fill="${c}" stroke="${d}" stroke-width="2" stroke-linejoin="round" transform="rotate(${a})"/>`)   // василёк
    + `<circle r="13" fill="#2a3f8f"/>` + ring(6, a => `<circle cx="0" cy="-7" r="2.5" fill="#8fb6ff" transform="rotate(${a})"/>`),
  P: (c, d) => ring(5, a => `<circle cx="0" cy="-21" r="19" fill="${c}" stroke="${d}" stroke-width="2" transform="rotate(${a})"/>`)   // фиалка
    + `<circle r="11" fill="#ffd84a" stroke="#e0a020" stroke-width="2"/>`,
  K: (c, d, l) => ring(5, a => `<path d="M0 -6 C-22 -16 -20 -42 -6 -42 L0 -34 L6 -42 C20 -42 22 -16 0 -6 Z" fill="${c}" stroke="${d}" stroke-width="2" transform="rotate(${a})"/>`)   // сакура
    + `<circle r="10" fill="${l}"/>` + ring(5, a => `<circle cx="0" cy="-12" r="2.6" fill="#e0457f" transform="rotate(${a + 36})"/>`),
  G: (c, d, l) => ring(4, a => `<path d="M0 -2 C-26 -8 -22 -40 -6 -36 C-2 -35 0 -30 0 -26 C0 -30 2 -35 6 -36 C22 -40 26 -8 0 -2 Z" fill="${c}" stroke="${d}" stroke-width="2" transform="rotate(${a + 45})"/>`)   // клевер
    + ring(4, a => `<path d="M0 -6 L0 -26" stroke="${l}" stroke-width="2.5" transform="rotate(${a + 45})"/>`),
  O: (c, d, l) => ring(16, a => `<ellipse cx="0" cy="-30" rx="9" ry="12" fill="${d}" transform="rotate(${a})"/>`)   // календула
    + ring(12, a => `<ellipse cx="0" cy="-20" rx="9" ry="11" fill="${c}" transform="rotate(${a + 15})"/>`) + `<circle r="12" fill="${l}"/><circle r="12" fill="none" stroke="${d}" stroke-width="2.5"/>`,
};
const SPEC = {                                                                       // инструменты поверх цветка
  row: `<rect x="-47" y="-7" width="94" height="14" rx="7" fill="#fff" opacity=".9"/><rect x="-47" y="-3" width="94" height="6" rx="3" fill="#ffd84a"/>`,
  col: `<rect x="-7" y="-47" width="14" height="94" rx="7" fill="#fff" opacity=".9"/><rect x="-3" y="-47" width="6" height="94" rx="3" fill="#ffd84a"/>`,
  blot: `<circle r="45" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="7 7"/><circle cx="34" cy="-30" r="6" fill="#fff"/><circle cx="-36" cy="28" r="5" fill="#fff"/>`,
};
function pieceSVG(p) {
  if (p.sp === 'pal') return `<svg viewBox="-62 -62 124 124"><path d="M-40 6 C-44 -32 32 -44 40 -8 C46 14 20 10 18 24 C16 38 -38 42 -40 6 Z" fill="#f4dbb0" stroke="#b8894a" stroke-width="3"/>`
    + `<circle cx="-14" cy="20" r="6" fill="#fffaf3" stroke="#b8894a" stroke-width="2"/>` + pal.map((k, i) => `<circle cx="${[-22, -6, 12, 26, -24][i % 5]}" cy="${[-8, -22, -22, -6, 6][i % 5]}" r="7" fill="${LV.COLORS[k]}"/>`).join('') + '</svg>';
  const k = pal[p.c], c = LV.COLORS[k];
  return `<svg viewBox="-62 -62 124 124">${FLOWER[k](c, shade(c, -0.28), shade(c, 0.45))}${SPEC[p.sp] || ''}</svg>`;
}

// ─── звук: колокольчик через мягкую реверберацию (как в «Шариках»), у каждого цвета своя нота ───
let ac = null, out = null, rev = null;
const soundOn = () => ls('rk_sound') !== '0';
function audio() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    out = ac.createGain(); out.gain.value = soundOn() ? 0.9 : 0; out.connect(ac.destination);
    rev = ac.createConvolver(); const len = ac.sampleRate * 2.4, b = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    rev.buffer = b; const wet = ac.createGain(); wet.gain.value = 0.3; rev.connect(wet); wet.connect(out);
  }
  if (ac.state === 'suspended') ac.resume();
}
function bell(f, t = 0, dur = 1.2, v = 0.18) {
  if (!ac || !isFinite(f)) return; const t0 = ac.currentTime + t, g = ac.createGain();
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  for (const [m, a] of [[1, 1], [2.001, 0.25], [3.01, 0.07]]) { const o = ac.createOscillator(), k = ac.createGain(); o.frequency.value = f * m; k.gain.value = a; o.connect(k); k.connect(g); o.start(t0); o.stop(t0 + dur + 0.05); }
  g.connect(out); g.connect(rev);
}
const NOTE = { R: 523.25, Y: 587.33, B: 659.25, P: 783.99, K: 880, G: 1046.5, O: 1174.66 };
for (const ev of ['pointerup', 'touchend']) addEventListener(ev, audio, { passive: true });

// ─── состояние ───
let L = Math.max(0, +ls('rk_level') || 0), cur = L, own = -1, lv, S, pal, budget, extra, busy = false, sel = null, cs = 40, idleT = 0;   // own — номер своей картины (−1 — кампания)
const mine = () => { try { return JSON.parse(ls('rk_mine') || '[]'); } catch (e) { return []; } };   // свои картины: [{name, rows, moves}]
const stars = (() => { try { return JSON.parse(ls('rk_stars') || '{}'); } catch (e) { return {}; } })();
const board = $('board'), pcs = new Map(), cells = [];

function layout() {
  const top = $('bar').getBoundingClientRect().bottom, H = innerHeight - top - 52 - 80 - parseFloat(getComputedStyle($('app')).paddingBottom);   // от панели; 80 — котики внизу
  cs = Math.floor(Math.min(innerWidth - 24, 520, H) / N);
  board.style.width = board.style.height = cs * N + 'px';
  for (const c of cells) { c.el.style.left = c.x * cs + 2 + 'px'; c.el.style.top = c.y * cs + 2 + 'px'; c.el.style.width = c.el.style.height = cs - 4 + 'px'; }
  for (const [, el] of pcs) { el.style.width = el.style.height = cs + 'px'; place(el, +el.dataset.x, +el.dataset.y); }
}
addEventListener('resize', layout);
function place(el, x, y) { el.dataset.x = x; el.dataset.y = y; el.style.transform = `translate(${x * cs}px,${y * cs}px)`; }
function makePiece(p) { const el = document.createElement('div'); el.className = 'pc'; el.innerHTML = pieceSVG(p); el.style.width = el.style.height = cs + 'px'; board.appendChild(el); pcs.set(p.id, el); return el; }
function cellLook(x, y) {                                                           // клетка холста
  const t = S.target[y][x], el = cells[y * N + x].el, c = t >= 0 ? LV.COLORS[pal[t]] : null;
  el.classList.toggle('done', t >= 0 && S.painted[y][x]);
  el.style.background = t < 0 ? 'transparent' : S.painted[y][x] ? c : `${c}5c`;
  el.style.boxShadow = t >= 0 && !S.painted[y][x] ? `inset 0 0 0 2px ${c}b0` : '';   // рамка цвета: «сюда нужна эта краска»
}
function drawPic(cv, rows, painted, ghost) {                                        // картина 8×8 в canvas (галерея, образец, итог)
  const g = cv.getContext('2d'); g.clearRect(0, 0, 8, 8);
  rows.forEach((r, y) => r.split('').forEach((k, x) => { if (k === '.') return;
    g.globalAlpha = painted && !painted[y][x] ? 0.25 : ghost ? 0.35 : 1; g.fillStyle = ghost ? '#c9b7c9' : LV.COLORS[k]; g.fillRect(x, y, 1, 1); }));
  g.globalAlpha = 1;
}

// ─── уровень ───
const start = i => startLevel(LV.levelOf(i), i, -1);
function startLevel(level, i, j) {
  cur = i; own = j; lv = level; pal = lv.palette; budget = lv.moves; extra = 0; sel = null;
  S = newGame(lv, Date.now() % 1e9);
  board.innerHTML = ''; pcs.clear(); cells.length = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const el = document.createElement('div'); el.className = 'cell'; board.appendChild(el); cells.push({ x, y, el }); }
  layout();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { cellLook(x, y); place(makePiece(S.B[y][x]), x, y); }
  drawPic($('goal'), lv.rows);
  $('lvl').textContent = j >= 0 ? `Моя картина · ${lv.name}` : i < LV.PICS.length ? `Картина ${i + 1} из ${LV.PICS.length} · ${lv.name}` : `${lv.name} · свободная игра`;
  hud(); poke();
  if (Math.random() < 0.4) setTimeout(() => say(someCat(), phrase('start', lv.name), 2400), 600);   // котик иногда объявляет картину
  if (j < 0 && i === 2 && !ls('rk_intro')) { ls('rk_intro', 1); $('intro').hidden = false; }
}
function hud() {
  const tot = lv.target.flat().filter(t => t >= 0).length, left = tot - need(S);
  $('moves').textContent = Math.max(0, budget + extra - S.moves);
  $('prog').firstElementChild.style.width = (left / tot * 100) + '%';
  $('progT').textContent = `Закрашено ${left} из ${tot}`;
}

// ─── ввод: свайп или два касания ───
let down = null;
board.addEventListener('pointerdown', e => {
  if (busy) return; audio(); poke();
  const r = board.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / cs), y = Math.floor((e.clientY - r.top) / cs);
  if (x < 0 || y < 0 || x >= N || y >= N) return;
  down = { x, y, cx: e.clientX, cy: e.clientY };
});
board.addEventListener('pointermove', e => {
  if (!down || busy) return;
  const dx = e.clientX - down.cx, dy = e.clientY - down.cy;
  if (Math.hypot(dx, dy) < cs * 0.35) return;
  const b = Math.abs(dx) > Math.abs(dy) ? [down.x + Math.sign(dx), down.y] : [down.x, down.y + Math.sign(dy)], a = [down.x, down.y];
  down = null; select(null);
  if (b[0] >= 0 && b[1] >= 0 && b[0] < N && b[1] < N) turn(a, b);
});
board.addEventListener('pointerup', () => {
  if (!down || busy) return; const a = [down.x, down.y]; down = null;
  if (sel && Math.abs(sel[0] - a[0]) + Math.abs(sel[1] - a[1]) === 1) { const s = sel; select(null); turn(s, a); }
  else select(sel && sel[0] === a[0] && sel[1] === a[1] ? null : a);
});
function select(a) {
  if (sel) pcs.get(S.B[sel[1]][sel[0]].id)?.classList.remove('sel');
  sel = a; if (sel) { pcs.get(S.B[sel[1]][sel[0]].id)?.classList.add('sel'); bell(1568, 0, 0.12, 0.05); }
}

// ─── ход и анимация по раундам ───
async function turn(a, b) {
  busy = true; clearHint();
  const ea = pcs.get(S.B[a[1]][a[0]].id), eb = pcs.get(S.B[b[1]][b[0]].id);
  place(ea, b[0], b[1]); place(eb, a[0], a[1]);
  await wait(190);
  const rounds = move(S, a, b);
  if (!rounds) { place(ea, a[0], a[1]); place(eb, b[0], b[1]); bell(220, 0, 0.25, 0.07); await wait(190); busy = false; return; }
  let combo = 0, bornSp = '';
  for (const R of rounds) {
    if (R.born && R.born.length && !bornSp) bornSp = R.born[0].sp;   // котик заметит новый инструмент
    if (R.shuffle) { await reshuffle(); continue; }
    await playRound(R, combo++);
  }
  hud(); busy = false; poke();
  if (combo >= 3) { const c = someCat(); purr(); happy(c); say(c, phrase('combo')); }
  else if (bornSp) { const c = someCat(); happy(c); say(c, phrase(bornSp)); }
  if (won(S)) return finish();
  if (budget + extra - S.moves <= 0) $('out').hidden = false;
}
async function playRound(R, combo) {
  for (const f of R.fx) effect(f);
  const col = R.clear.length ? colorAt(R) : null;
  for (const c of R.clear) { const el = pcs.get(c.id); if (el) { el.classList.add('out'); el.style.transform += ' scale(.3)'; } }
  if (col) bell(NOTE[col] * (combo ? Math.pow(2, Math.min(combo, 4) / 6) : 1), 0, 1.0, 0.16);
  if (R.fx.length) { bell(1046.5, 0, 1.4, 0.12); bell(1318.5, 0.08, 1.6, 0.12); }
  await wait(170);
  for (const c of R.clear) { const el = pcs.get(c.id); if (el) { el.remove(); pcs.delete(c.id); } }
  R.paint.forEach(([x, y, , spr], i) => setTimeout(() => { cellLook(x, y); const el = cells[y * N + x].el; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    if (i < 6) bell(NOTE[pal[S.target[y][x]]] * 2, 0, 0.5, 0.04); }, (spr ? 160 : 0) + i * 12));
  const born = new Set(R.born.map(n => n.id));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const p = R.after[y][x]; let el = pcs.get(p.id);
    if (!el) { el = makePiece(p);
      if (born.has(p.id)) { el.classList.add('born'); place(el, x, y); }
      else { el.style.transition = 'none'; place(el, x, y - R.spawn[x] - 0.5); void el.offsetWidth; el.style.transition = ''; place(el, x, y); }
    } else place(el, x, y);
  }
  hud();
  await wait(260);
}
function colorAt(R) { const p = R.clear.find(q => q.c >= 0); return p ? pal[p.c] : null; }
function effect(f) {
  const el = document.createElement('div'), c = f.c >= 0 ? LV.COLORS[pal[f.c]] : '#fff';
  el.className = 'fx'; el.style.background = `${c}aa`;
  if (f.t === 'row') Object.assign(el.style, { left: '0px', top: f.y * cs + cs * 0.3 + 'px', width: N * cs + 'px', height: cs * 0.4 + 'px' });
  else if (f.t === 'col') Object.assign(el.style, { left: f.x * cs + cs * 0.3 + 'px', top: '0px', width: cs * 0.4 + 'px', height: N * cs + 'px' });
  else if (f.t === 'blot') Object.assign(el.style, { left: (f.x - 1) * cs + 'px', top: (f.y - 1) * cs + 'px', width: cs * 3 + 'px', height: cs * 3 + 'px' });
  else Object.assign(el.style, { left: (f.x - 2) * cs + 'px', top: (f.y - 2) * cs + 'px', width: cs * 5 + 'px', height: cs * 5 + 'px', background: 'radial-gradient(circle,#fff,#ff8fc8aa,#9b6bdc00 70%)' });
  board.appendChild(el); setTimeout(() => el.remove(), 520);
  for (let i = 0; i < 10; i++) { const s = document.createElement('div'); s.className = 'spark';
    Object.assign(s.style, { left: f.x * cs + cs / 2 + 'px', top: f.y * cs + cs / 2 + 'px', background: i % 2 ? '#fff' : c });
    s.style.setProperty('--dx', (Math.random() - 0.5) * cs * 3 + 'px'); s.style.setProperty('--dy', (Math.random() - 0.5) * cs * 3 + 'px');
    board.appendChild(s); setTimeout(() => s.remove(), 650); }
}
async function reshuffle() {
  $('tip').textContent = 'Ходов нет — перемешиваю 🌸';
  for (const [, el] of pcs) el.style.opacity = 0;
  await wait(250);
  for (const [, el] of pcs) el.remove(); pcs.clear();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const el = makePiece(S.B[y][x]); place(el, x, y); el.classList.add('born'); }
  await wait(400); $('tip').textContent = '';
}

// ─── подсказка: 9 с без дела — подсвечиваю ход, который красит больше всего ───
let hintIds = [];
function clearHint() { for (const id of hintIds) pcs.get(id)?.classList.remove('hint'); hintIds = []; }
let idle2 = 0;
function poke() { clearTimeout(idleT); clearTimeout(idle2); clearHint();
  idle2 = setTimeout(() => { if (!busy && $('start').hidden && !won(S)) say(someCat(), phrase('idle')); }, 25000);   // долго без хода — котик зовёт
  idleT = setTimeout(() => { if (busy || !$('start').hidden || won(S)) return;
  const m = bestMove(S, 7); if (!m) return; hintIds = m.map(([x, y]) => S.B[y][x].id); for (const id of hintIds) pcs.get(id)?.classList.add('hint'); }, 9000); }

// ─── котики внизу: мурлыкают, если погладить, и подсказывают ход; радуются каскадам и готовой картине ───
const cats = [$('cat1'), $('cat2')];
{ // рыжий — копия светлого: свой мех, полоски на лбу, без бантика
  const sv = cats[0].querySelector('svg').cloneNode(true);
  sv.querySelector('radialGradient').id = 'kfur2'; sv.querySelectorAll('[fill="url(#kfur)"]').forEach(e => { e.setAttribute('fill', 'url(#kfur2)'); e.setAttribute('stroke', '#e0a274'); });
  [...sv.querySelectorAll('stop')].forEach((s, i) => s.setAttribute('stop-color', ['#fff6ea', '#ffdcb5', '#f7b47c'][i]));
  sv.querySelectorAll('circle[fill="#ff5c9e"], path[stroke="#d63a7d"]:not(.tongue)').forEach(e => e.remove());
  sv.querySelector('.eo').insertAdjacentHTML('beforebegin', '<path d="M178 84 Q190 98 186 112 M200 78 V106 M222 84 Q210 98 214 112" fill="none" stroke="#ee9a5a" stroke-width="8" stroke-linecap="round"/>');
  sv.style.transform = 'scaleX(-1)'; cats[1].prepend(sv); }                      // смотрит в другую сторону
function purr() {                                                                  // мурлыканье: низкий шум, пульсирующий ~24 раза в секунду
  if (!ac) return; const n = Math.floor(ac.sampleRate * 0.9), b = ac.createBuffer(1, n, ac.sampleRate), x = b.getChannelData(0); let w = 0;
  for (let i = 0; i < n; i++) { w = (w + 0.02 * (Math.random() * 2 - 1)) / 1.02; x[i] = w * 3.5 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 24 * i / ac.sampleRate)) * Math.sin(Math.PI * i / n); }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = 400; g.gain.value = 0.5;
  s.connect(f); f.connect(g); g.connect(out); s.start();
}
function hearts(el) { const r = el.getBoundingClientRect();
  for (let k = 0; k < 3; k++) { const h = document.createElement('span'); h.className = 'heart'; h.textContent = '💗';
    Object.assign(h.style, { left: r.left + r.width * (0.15 + k * 0.25) + 'px', top: r.top + 'px', animationDelay: k * 0.15 + 's' });
    document.body.appendChild(h); setTimeout(() => h.remove(), 1800); } }
function happy(el, ms = 1600) { el.classList.add('happy'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('happy'), ms); }
function say(el, t, ms = 2200) { const b = el.querySelector('.bub'); b.textContent = t; b.classList.add('on'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), ms); }
// фразы котиков: по поводу, случайно, без повтора подряд
const PHR = {
  hint: ['Вот сюда! 🐾', 'Может, сюда? 😺', 'Мяу, смотри! ✨', 'Попробуй здесь 🌸', 'Вот тут красиво будет 🎨', 'Сюда, сюда! 🐾'],
  combo: ['Мрр, красиво! 💕', 'Ух ты, сколько краски! 🎨', 'Красота! 🌸', 'Вот это да! ✨', 'Мур-мур 💜', 'Так держать! 😻'],
  row: ['Ого, кисть! 🖌', 'Кисточка! 🖌', 'Теперь целый ряд! 🖌'], col: ['Ого, кисть! 🖌', 'Кисточка! 🖌', 'Теперь целый столбик! 🖌'],
  blot: ['Клякса! 💦', 'Ой, клякса! 💦', 'Брызги! 💦'], pal: ['Палитра! 🎨', 'Вся палитра! 🎨', 'Мяу, палитра! 🎨'],
  win: ['Шедевр! 🖼', 'Повесим на стену! 😻', 'Какая красота! 💕', 'Браво! 👏', 'Мур, нравится! 💜', 'Лучшая картина! 🌸'],
  more: ['Ничего, дорисуем! 💪', 'Ещё чуть-чуть! 🌸', 'Почти готово! ✨'],
  idle: ['Погладь меня 🐾', 'Мрр… 😴', 'Мяу? 😺', 'Я тут, если что 🐾'],
  start: n => [`Нарисуем «${n}»? 🎨`, `О, «${n}»! 😺`, `Давай «${n}»! 🌸`] };
let lastPhr = '';
function phrase(kind, arg) { const a = typeof PHR[kind] === 'function' ? PHR[kind](arg) : PHR[kind]; let p;
  do p = a[Math.floor(Math.random() * a.length)]; while (p === lastPhr && a.length > 1); return (lastPhr = p); }
const someCat = () => cats[Math.floor(Math.random() * 2)];
function catJump(el) { el.classList.remove('jump'); void el.offsetWidth; el.classList.add('jump'); }
cats.forEach(el => el.addEventListener('pointerdown', e => {
  e.preventDefault(); audio(); purr(); hearts(el); happy(el); catJump(el);
  if (busy || won(S) || !$('start').hidden) return;
  clearHint(); const m = bestMove(S, 7); if (!m) return;                         // подсказка: ход, который красит больше всего
  hintIds = m.map(([x, y]) => S.B[y][x].id); for (const id of hintIds) pcs.get(id)?.classList.add('hint');
  say(el, phrase('hint'));
}));

// ─── итог картины ───
async function finish() {
  busy = true;
  for (const [, el] of pcs) { el.style.transition = 'transform .6s ease-in, opacity .6s'; el.style.transform += ' translateY(-40px) scale(.4)'; el.style.opacity = 0; }
  [0, 4, 7, 12].forEach((s, k) => bell(NOTE.R * Math.pow(2, s / 12), k * 0.12, 1.8, 0.14));
  cats.forEach(c => { happy(c, 3000); hearts(c); catJump(c); say(c, phrase('win'), 2600); }); purr();
  await wait(700);
  const left = budget + extra - S.moves, st = extra > 0 ? 1 : left >= budget * 0.25 ? 3 : 2;
  if (own < 0) {
    if (cur < LV.PICS.length) stars[cur] = Math.max(stars[cur] || 0, st);
    ls('rk_stars', JSON.stringify(stars));
    if (cur === L) { L++; ls('rk_level', L); }
  }
  drawPic($('winPic'), lv.rows);
  setTimeout(() => alive($('winPic'), lv), 350);                                 // картина оживает
  prepShare(lv.rows, lv.name);
  $('stars').textContent = '★'.repeat(st) + '☆'.repeat(3 - st);
  $('winT').textContent = own >= 0 ? `Твоя картина «${lv.name}» готова! 🎨` : cur === LV.PICS.length - 1 ? 'Галерея собрана! 💐' : `Картина «${lv.name}» готова!`;
  $('winInfo').textContent = extra > 0 ? 'Дорисовала с дополнительными ходами — тоже считается!' : `Осталось ходов: ${left}`;
  $('win').hidden = false; busy = false;
}
// ─── живая картина: движение (CSS) или смена кадров — моргание (цвет глаз → цвет век), взмах крыльев (крайние столбцы) ───
function alive(cv, level) {
  const a = LV.ANIM[level.name] || 'beat', t = Array.isArray(a) ? a[0] : a, rows = level.rows;
  cv.classList.remove('a-sway', 'a-beat', 'a-bob', 'a-spin', 'a-twinkle', 'a-fly'); void cv.offsetWidth;
  if (t === 'blink' || t === 'flap') {
    const f2 = t === 'flap' ? rows.map(r => '.' + r.slice(1, 7) + '.') : rows.map(r => r.split(a[1]).join(a[2]));
    const plan = t === 'flap' ? [180, 180, 180, 180, 180, 180, 180, 180] : [700, 160, 500, 160];   // мс до смены кадра
    let k = 0; const step = () => { if (k >= plan.length || $('win').hidden) return drawPic(cv, rows); drawPic(cv, k % 2 ? rows : f2); setTimeout(step, plan[k++]); };
    if (t === 'flap') cv.classList.add('a-bob');
    setTimeout(step, t === 'flap' ? 0 : 500);
  } else cv.classList.add('a-' + t);
}
// ─── поделиться картиной: открытка PNG через меню «Поделиться» iPhone (Web Share с файлом), где его нет — скачать.
// iPhone открывает меню только сразу после нажатия — поэтому открытку готовлю заранее, когда открывается окно ───
let shareFile = null;
function prepShare(rows, name) {
  shareFile = null; const W = 1080, c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, W, W); bg.addColorStop(0, '#d2bdff'); bg.addColorStop(0.55, '#a988ea'); bg.addColorStop(1, '#c3a6ff');
  g.fillStyle = bg; g.fillRect(0, 0, W, W);
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.shadowColor = 'rgba(70,30,120,.35)'; g.shadowBlur = 40; g.shadowOffsetY = 14; g.fillStyle = '#fffaf3'; rr(170, 110, 740, 740, 44); g.fill();
  g.shadowColor = 'transparent'; const s = 80, ox = 220, oy = 160;
  rows.forEach((r, y) => r.split('').forEach((k, x) => { if (k !== '.') { g.fillStyle = LV.COLORS[k]; g.fillRect(ox + x * s, oy + y * s, s, s); } }));
  g.textAlign = 'center'; g.fillStyle = '#3f2160'; g.font = '800 58px -apple-system, "SF Pro Rounded", "Segoe UI", sans-serif'; g.fillText(`«${name}»`, W / 2, 950);
  g.fillStyle = '#4a2a70'; g.font = '600 38px -apple-system, "Segoe UI", sans-serif'; g.fillText('Раскраска для Ани 🌸', W / 2, 1018);
  const fname = name.replace(/[\\/:*?"<>|]/g, '').trim() || 'Картина';
  c.toBlob(b => { if (b) shareFile = new File([b], `${fname}.png`, { type: 'image/png' }); }, 'image/png');
}
async function share() {
  if (!shareFile) return;
  if (navigator.canShare && navigator.canShare({ files: [shareFile] })) { try { await navigator.share({ files: [shareFile] }); } catch (e) { /* закрыла меню — ничего */ } return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(shareFile); a.download = shareFile.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
$('winShare').onclick = share;
$('mcShare').onclick = share;
$('next').onclick = () => { $('win').hidden = true; start(L); };
$('more').onclick = () => { extra += 5; $('out').hidden = true; hud(); bell(NOTE.K, 0, 1, 0.14); const c = someCat(); happy(c); say(c, phrase('more')); };
$('introGo').onclick = () => { $('intro').hidden = true; };

// ─── галерея: нарисованные — в цвете, следующие — силуэтом ───
function gallery() {
  const done = Object.keys(stars).length;
  $('galSub').textContent = `Нарисовано ${Math.min(done, LV.PICS.length)} из ${LV.PICS.length}`;
  $('grid').innerHTML = LV.PICS.map(([n], i) => `<div class="g${i > L ? ' no' : ''}${i === cur ? ' cur' : ''}" data-i="${i}"><canvas width="8" height="8"></canvas>`
    + `<span>${i <= L ? n : '?'}</span><span>${stars[i] ? '★'.repeat(stars[i]) : ''}</span></div>`).join('');
  [...$('grid').children].forEach(g => { const i = +g.dataset.i; drawPic(g.querySelector('canvas'), LV.PICS[i][1], null, !stars[i]); });
  const m = mine();
  $('mine').innerHTML = m.map((p, j) => `<div class="g" data-j="${j}"><canvas width="8" height="8"></canvas><span></span></div>`).join('') + '<div class="g" data-j="-1"><div class="plus">＋</div><span>Нарисовать свою</span></div>';
  m.forEach((p, j) => { const g = $('mine').children[j]; drawPic(g.querySelector('canvas'), p.rows); g.querySelector('span').textContent = p.name; });   // название — текстом: введено вручную
  $('gallery').hidden = false;
}
$('mine').onclick = e => { const g = e.target.closest('.g'); if (!g) return; const j = +g.dataset.j; if (j < 0) openEditor(-1); else mineCard(j); };
let mcIdx = -1;
function mineCard(j) { mcIdx = j; const p = mine()[j]; $('mcT').textContent = p.name; drawPic($('mcPic'), p.rows); prepShare(p.rows, p.name); $('gallery').hidden = true; $('mineCard').hidden = false; }
$('mcPlay').onclick = () => { const p = mine()[mcIdx]; $('mineCard').hidden = true; startLevel(LV.levelFrom(p.name, p.rows, 0, p.moves), cur, mcIdx); };
$('mcEdit').onclick = () => { $('mineCard').hidden = true; openEditor(mcIdx); };
$('mcDel').onclick = () => { if (!confirm('Удалить эту картину?')) return; const m = mine(); m.splice(mcIdx, 1); ls('rk_mine', JSON.stringify(m)); $('mineCard').hidden = true; gallery(); };
$('mcBack').onclick = () => { $('mineCard').hidden = true; gallery(); };

// ─── мастерская: своя картина 8×8 → уровень (ходы считает бот, как у картин кампании) ───
let edRows = [], edColor = 'K', edIdx = -1, edDown = false;
function openEditor(j) {
  edIdx = j; const m = mine();
  edRows = j >= 0 ? m[j].rows.map(r => r.split('')) : Array.from({ length: N }, () => Array(N).fill('.'));
  $('edName').value = j >= 0 ? m[j].name : ''; $('edErr').textContent = '';
  $('ed').innerHTML = edRows.map((r, y) => r.map((k, x) => `<i data-x="${x}" data-y="${y}"></i>`).join('')).join('');
  [...$('ed').children].forEach(el => edLook(el)); edPal();
  $('gallery').hidden = true; $('editor').hidden = false;
}
function edLook(el) { const k = edRows[+el.dataset.y][+el.dataset.x]; el.style.background = k === '.' ? '' : LV.COLORS[k]; }
function edPal() { $('edPal').innerHTML = (LV.KEYS + '.').split('').map(k => `<button class="sw${k === edColor ? ' sel' : ''}" data-k="${k}" aria-label="${k === '.' ? 'Ластик' : 'Цвет'}" style="${k === '.' ? '' : 'background:' + LV.COLORS[k]}">${k === '.' ? '✕' : ''}</button>`).join(''); }
$('edPal').onclick = e => { const b = e.target.closest('.sw'); if (!b) return; edColor = b.dataset.k; edPal(); bell(k2n(edColor), 0, 0.5, 0.08); };
const k2n = k => NOTE[k] || 440;
function edPaint(e) { const t = document.elementFromPoint(e.clientX, e.clientY); if (!t || t.parentElement !== $('ed')) return;
  const x = +t.dataset.x, y = +t.dataset.y; if (edRows[y][x] === edColor) return; edRows[y][x] = edColor; edLook(t); if (edColor !== '.') bell(k2n(edColor) * 2, 0, 0.3, 0.04); }
$('ed').addEventListener('pointerdown', e => { e.preventDefault(); audio(); edDown = true; edPaint(e); });
$('ed').addEventListener('pointermove', e => { if (edDown) edPaint(e); });
addEventListener('pointerup', () => { edDown = false; });
$('edClear').onclick = () => { edRows = edRows.map(r => r.map(() => '.')); [...$('ed').children].forEach(el => edLook(el)); };
$('edCancel').onclick = () => { $('editor').hidden = true; gallery(); };
$('edOk').onclick = () => {
  const rows = edRows.map(r => r.join('')), n = rows.join('').replace(/\./g, '').length;
  if (n < 6) { $('edErr').textContent = 'Нарисуй хотя бы 6 клеток'; return; }
  const m = mine(), name = $('edName').value.trim().slice(0, 20) || `Моя картина ${edIdx >= 0 ? edIdx + 1 : m.length + 1}`;
  $('edErr').textContent = 'Считаю ходы…';
  setTimeout(() => {                                                            // дать надписи показаться: бот считает до секунды
    const level = LV.levelFrom(name, rows, 0), moves = RL.movesFor(level), p = { name, rows, moves };
    const j = edIdx >= 0 ? edIdx : m.length; m[j] = p; ls('rk_mine', JSON.stringify(m));
    $('editor').hidden = true; startLevel(LV.levelFrom(name, rows, 0, moves), cur, j);
  }, 30);
};
$('grid').onclick = e => { const g = e.target.closest('.g'); if (!g) return; const i = +g.dataset.i;
  if (i > L) { $('galSub').textContent = 'Эта картина откроется позже'; return; }
  $('gallery').hidden = true; $('win').hidden = true; start(i); };
$('gal').onclick = gallery;
$('winGal').onclick = () => { $('win').hidden = true; start(L); gallery(); };
$('galBack').onclick = () => { $('gallery').hidden = true; };
$('snd').onclick = () => { audio(); const on = !soundOn(); ls('rk_sound', on ? '1' : '0'); if (out) out.gain.value = on ? 0.9 : 0; $('snd').classList.toggle('off', !on); };
$('snd').classList.toggle('off', !soundOn());

// ─── старт: букет из цветов ───
{ const b = $('bouquet'), keys = 'KRYPBOGK'.split(''); pal = keys;
  keys.forEach((k, i) => { const el = document.createElement('div'); el.className = 'pc';
    el.innerHTML = pieceSVG({ c: i, sp: '' }); const a = (i / keys.length) * Math.PI * 2, r = 0.32;
    Object.assign(el.style, { width: '27%', height: '36%', left: `${36.5 + Math.cos(a) * r * 100}%`, top: `${32 + Math.sin(a) * r * 110}%`, transform: `rotate(${i * 23}deg)` }); b.appendChild(el); }); }
$('startBtn').onclick = () => { audio(); $('start').hidden = true; start(L); [0, 4, 7].forEach((s, k) => bell(NOTE.K * Math.pow(2, s / 12) / 2, k * 0.12, 1.4, 0.14)); };
$('home').onclick = () => { $('start').hidden = false; };

// ─── игра на экране «Домой». На iPhone Сафари стирает данные сайта, если его 7 дней не открывать; у приложения с иконки — нет.
// Но у такого приложения на iPhone своя память, не общая с Сафари, — номер картины переносим вручную (звёзды и свои картины не переносятся) ───
const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (!standalone && matchMedia('(pointer: coarse)').matches) $('a2hs').hidden = false;
if (standalone && !ls('rk_level')) $('moveBtn').hidden = false;
$('a2hs').onclick = () => { $('a2hsText').innerHTML = ios
  ? `<ol class="steps"><li>Внизу Сафари нажми «Поделиться» — квадрат со стрелкой ⬆️.</li><li>Пролистай вниз и выбери «На экран „Домой“», потом «Добавить».</li><li>Дальше открывай игру с иконки «Раскраска».</li></ol>`
    + `<p>У приложения на iPhone своя память, поэтому прогресс нужно перенести: в приложении нажми «Перенести прогресс» и введи <b>${L + 1}</b>. Свои картины рисуй уже в приложении.</p>`
  : `<ol class="steps"><li>Нажми меню браузера ⋮.</li><li>Выбери «Добавить на главный экран» или «Установить приложение».</li><li>Дальше открывай игру с иконки «Раскраска» — прогресс останется тот же.</li></ol>`;
  $('a2hsCard').hidden = false; };
$('a2hsOk').onclick = () => { $('a2hsCard').hidden = true; };
$('moveBtn').onclick = () => { $('moveCard').hidden = false; };
$('moveNo').onclick = () => { $('moveCard').hidden = true; };
$('moveGo').onclick = () => { const n = Math.floor(+$('moveIn').value); if (!(n >= 1 && n <= 999)) { $('moveIn').focus(); return; }
  L = n - 1; ls('rk_level', L); $('moveCard').hidden = true; $('moveBtn').hidden = true; };
if (/[?&]debug/.test(location.search)) window.RK = { S: () => S, turn, card: () => shareFile };                // для проверок: ?debug
// офлайн и «на экран Домой»; при возврате в игру — проверить новую версию и перезагрузиться (уровень хранится в localStorage)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(reg => document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); })).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had) location.reload(); });
}
})();
