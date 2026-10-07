// Проверка логики: node selfcheck.js — правила, спецфишки, покраска, бот проходит все уровни.
// node selfcheck.js --calibrate — таблица ходов на уровень по боту (вставить в levels.js как MOVES).
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const ctx = {}; vm.createContext(ctx);
for (const f of ['levels.js', 'logic.js']) vm.runInContext(fs.readFileSync(__dirname + '/' + f, 'utf8'), ctx);
const { RL, LV } = ctx, N = RL.N;
const P = (c, sp = '') => ({ id: Math.random(), c, sp });
const board = rows => rows.map(r => r.split('').map(ch => ch === '*' ? P(-1, 'pal') : P(+ch)));
// 1. группы и спецфишки
const g1 = RL.groups(board(['00012345', '12345012', '23450123', '34501234', '45012345', '50123450', '01234501', '12345012']));
assert(g1.length === 1 && g1[0].cells.length === 3 && RL.specialOf(g1[0]) === '', 'ряд из 3');
const L = RL.groups(board(['00034545', '01213434', '01245454', '34512121', '45123232', '12341414', '23452525', '34513131']));
assert(L.length === 1 && L[0].cells.length === 5 && RL.specialOf(L[0]) === 'blot', 'уголок → клякса: ' + JSON.stringify(L.map(g => g.cells)));
assert(RL.specialOf({ len: 4, h: true, v: false }) === 'row' && RL.specialOf({ len: 4, h: false, v: true }) === 'col' && RL.specialOf({ len: 5, h: true }) === 'pal', 'кисть/палитра');
console.log('✓ ряды, уголок → клякса, 4 → кисть, 5 → палитра');
// 2. ход без ряда отменяется; покраска — только нужным цветом и только под рядом
const lv = { palette: 'RYB', target: Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => y === 0 ? (x < 4 ? 0 : 1) : -1)) };
const S = RL.newGame(lv, 5);
assert(!RL.groups(S.B).length && RL.hasMove(S.B), 'начальное поле: ряды или нет ходов');
S.B = board(['01022121', '10121212', '21212121', '12121212', '21212121', '12121212', '21212121', '12121212']);
const ids = S.B.flat().map(p => p.id).join();
assert(RL.move(S, [0, 1], [0, 2]) === null && S.B.flat().map(p => p.id).join() === ids && S.moves === 0, 'ход без ряда не отменён');
const r = RL.move(S, [1, 0], [1, 1]);                                           // 0 0 0 в верхнем ряду — красит x 0..2 (нужен цвет 0)
assert(r && r[0].paint.filter(p => !p[3]).length === 3 && S.painted[0][0] && S.painted[0][2] && S.moves === 1, 'покраска рядом: ' + JSON.stringify(r && r[0].paint));
assert(S.painted[0][3] && r[0].paint.some(p => p[0] === 3 && p[3]) && !S.painted[0][4], 'краска не растеклась на соседа того же цвета или растеклась на чужой цвет');
console.log('✓ ход без ряда отменяется; ряд красит нужные клетки под собой, краска растекается на соседа того же цвета (и не дальше)');
// 3. кисть красит весь ряд своим цветом, где он нужен
const K = RL.newGame(lv, 9);
K.B = board(['11110000', '12121212', '21212121', '12121212', '21212121', '12121212', '21212121', '12121212']);
K.B[0][0].sp = 'row';                                                           // кисть цвета 1 в верхнем ряду, ряд 1111 её запускает
K.B[0][4] = P(2); K.B[1][4] = P(1);
const kr = RL.move(K, [4, 0], [4, 1]);
assert(kr && kr[0].fx.some(f => f.t === 'row') && K.painted[0].slice(4).every(Boolean) && kr[0].clear.length >= N, 'кисть: ' + JSON.stringify(kr && kr[0].fx));
console.log('✓ кисть срабатывает в ряду и красит весь ряд');
// 4. бот проходит каждый уровень; ходы — по боту
const CAL = process.argv.includes('--calibrate'), table = [];
for (let i = 0; i < LV.PICS.length; i++) {
  const l = LV.levelOf(i), res = [];
  for (let s = 1; s <= (CAL ? 16 : 3); s++) {
    const G = RL.newGame(l, s * 7919 + i);
    while (!RL.won(G) && G.moves < 300) { const m = RL.bestMove(G, G.moves + 1); assert(m, `уровень ${i + 1}: нет хода`); RL.move(G, m[0], m[1]); }
    assert(RL.won(G), `уровень ${i + 1} «${l.name}»: бот не закрасил за 300 ходов`);
    res.push(G.moves);
  }
  res.sort((u, v) => u - v);
  table.push({ name: l.name, cells: l.target.flat().filter(t => t >= 0).length, colors: l.palette.length, med: res[res.length >> 1], p75: res[Math.floor(res.length * 0.75)] });
}
if (CAL) { for (const t of table) console.log(`${t.name.padEnd(14)} клеток ${t.cells}, цветов ${t.colors}: медиана ${t.med}, 75% — ${t.p75}`);
  console.log('MOVES = ' + JSON.stringify(table.map(t => Math.ceil(t.med * 1.8 + 6)))); }   // от медианы: у сложных картин большой разброс; человек медленнее жадного бота
console.log(`✓ бот закрашивает все ${table.length} картин (медиана ходов ${table.map(t => t.med).join(', ')})`);
assert(LV.MOVES.length === LV.PICS.length, 'таблица ходов не совпадает с картинами');
console.log('ВСЁ ОК');
