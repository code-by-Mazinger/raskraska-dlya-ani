'use strict';
// Картины для раскраски: 8×8, буква — цвет, точка — свободная клетка (красить не нужно).
// R роза (красный), Y подсолнух (жёлтый), B василёк (синий), P фиалка (фиолетовый), K сакура (розовый), G клевер (зелёный), O календула (оранжевый)
const COLORS = { R: '#e8435a', Y: '#ffc93a', B: '#4a90e2', P: '#9b6bdc', K: '#ff8fc8', G: '#4cbf6a', O: '#ff9a3c' };
const KEYS = 'RYBPKGO';
const PICS = [
  ['Сердечко', ['........', '.KK..KK.', 'KKKKKKKK', 'KKKKKKKK', '.KKKKKK.', '..KKKK..', '...KK...', '........']],
  ['Солнышко', ['...Y....', '.Y.YY.Y.', '..YOOY..', 'YYOOOOYY', 'YYOOOOYY', '..YOOY..', '.Y.YY.Y.', '....Y...']],
  ['Тюльпан', ['..R..R..', '..RRRR..', '.RRRRRR.', '.RRRRRR.', '..RRRR..', '...GG...', '.G.GG.G.', '..GGGG..']],
  ['Ромашка', ['...KK...', '..KKKK..', 'KKKYYKKK', 'KKYYYYKK', 'KKYYYYKK', 'KKKYYKKK', '..KKKK..', '...KK...']],
  ['Вишенки', ['.....GG.', '....GG..', '...G..G.', '..G...G.', '.RR..RR.', 'RRRR.RRR', 'RRRR.RRR', '.RR...R.']],
  ['Луна и звезда', ['..YYY...', '.YY.....', 'YY....O.', 'YY...OOO', 'YY....O.', '.YY.....', '..YYY...', '........']],
  ['Яблоко', ['....OG..', '...O.GG.', '.RRRRRR.', 'RRRRRRRR', 'RRRRRRRR', 'RRRRRRRR', '.RRRRRR.', '..RR.RR.']],
  ['Зонтик', ['...PP...', '.PPPPPP.', 'PPPPPPPP', 'PKPKPKPK', '...O....', '...O....', '...O.O..', '....O...']],
  ['Грибок', ['..RRRR..', '.RYRRYR.', 'RRRRRRRR', 'RYRRRRYR', '...OO...', '...OO...', '..OOOO..', '........']],
  ['Рыбка', ['........', '...BBB..', '..BBBBB.', 'OBBBBYBB', 'OOBBBBBB', 'OBBBBBB.', '...BBB..', '........']],
  ['Домик', ['...OO...', '..OOOO..', '.OOOOOO.', 'OOOOOOOO', '.YYYYYY.', '.YBYYBY.', '.YYOOYY.', '.YYOOYY.']],
  ['Котик', ['O......O', 'OO....OO', 'OOOOOOOO', 'OGOOOOGO', 'OOOKKOOO', '.OOOOOO.', '..OOOO..', '........']],
  ['Клубника', ['..G..G..', '...GG...', '.RRRRRR.', 'RRYRRYRR', 'RRRRRRRR', '.RYRRYR.', '..RRRR..', '...RR...']],
  ['Ёлочка', ['...Y....', '...GG...', '..GGGG..', '...GG...', '..GGGG..', '.GGGGGG.', 'GGGGGGGG', '...OO...']],
  ['Кораблик', ['...Y....', '...YY...', '...YYY..', '...YYYY.', '...O....', 'OOOOOOOO', '.OOOOOO.', 'BBBBBBBB']],
  ['Улитка', ['........', '..OOOO..', '.OO..OO.', '.O.OO.O.', '.OO.O.O.', '..OOOO.Y', 'YYYYYYYY', '........']],
  ['Капкейк', ['...R....', '..KKK...', '.KKKKK..', 'KKKKKKK.', 'OOOOOOOO', '.OYOYOY.', '.OYOYOY.', '..OOOO..']],
  ['Бабочка', ['PP....PP', 'PKP..PKP', 'PPPOOPPP', '.PPOOPP.', '.PPOOPP.', 'PPPOOPPP', 'PKP..PKP', 'PP....PP']],
  ['Радуга', ['........', '..RRRR..', '.RYYYYR.', 'RYGGGGYR', 'YGB..BGY', 'GB....BG', 'B......B', '........']]];

// Ходы на картину: по боту (node selfcheck.js --calibrate: медиана × 1,8 + 6 — человек медленнее жадного бота)
const MOVES = [15, 19, 23, 17, 19, 15, 30, 32, 28, 37, 42, 46, 48, 48, 48, 44, 35, 82, 50];
// Уровень i: картина, цвета фишек (цвета картины + «лишние» до 4), ходы
function levelOf(i) {
  const [name, rows] = PICS[i % PICS.length], used = [...new Set(rows.join('').replace(/\./g, ''))];
  // цветов фишек: на первых шести картинах 4 (на трёх каскады красят всё сами), дальше 5; больше — только если столько в картине.
  // Пятый цвет вводится плавно: сначала он редкий (вес 0,25), к последней картине — наравне с остальными (сложность растёт без ступеньки)
  const k = Math.max(used.length, i < 6 ? 4 : 5), extra = KEYS.split('').filter(c => !used.includes(c));
  const palette = used.concat(extra.slice(0, Math.max(0, k - used.length)));
  const ew = i < 6 ? 1 : Math.min(1, 0.25 + (i - 6) * 0.06), weights = palette.map((c, j) => j < Math.max(used.length, 4) ? 1 : ew);
  return { name, rows, palette, weights, moves: MOVES[i % PICS.length], target: rows.map(r => r.split('').map(c => c === '.' ? -1 : palette.indexOf(c))) };
}
globalThis.LV = { COLORS, KEYS, PICS, MOVES, levelOf };
