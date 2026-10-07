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
  ['Радуга', ['........', '..RRRR..', '.RYYYYR.', 'RYGGGGYR', 'YGB..BGY', 'GB....BG', 'B......B', '........']],
  // 20–40: цветы, животные, еда, праздничное
  ['Подсолнух', ['.Y.YY.Y.', 'YYYYYYYY', '.YYOOYY.', 'YYOOOOYY', '.YYOOYY.', 'YYYYYYYY', '.Y.GG.Y.', '...GG...']],
  ['Пчёлка', ['.BB..BB.', '.BBBBBB.', '..YPYP..', '.YYPYPY.', 'YYYPYPYY', '.YYPYPY.', '..YPYP..', '........']],
  ['Мороженое', ['...R....', '..KKKK..', '.KKKKKK.', '.KKKKKK.', '.OOOOOO.', '..OOOO..', '...OO...', '...OO...']],
  ['Божья коровка', ['..P..P..', '...PP...', '.RRPPRR.', 'RPRPPRPR', 'RRRPPRRR', 'RPRPPRPR', '.RRPPRR.', '..RRRR..']],
  ['Роза', ['..RRRR..', '.RRKRRR.', '.RKRRKR.', '.RRRKRR.', '..RRRR..', '...GG.G.', '.GGGGG..', '...GG...']],
  ['Цыплёнок', ['...YY...', '..YYYY..', '..YPYY..', '..YYYOO.', '.YYYYY..', 'YYYYYYY.', '.YYYYY..', '..O..O..']],
  ['Арбуз', ['........', 'RRRRRRRR', 'RPRRRPRR', '.RRPRRR.', '.GRRRRG.', '..GGGG..', '........', '........']],
  ['Подарок', ['..Y..Y..', '...YY...', 'RRRYYRRR', 'YYYYYYYY', 'RRRYYRRR', 'RRRYYRRR', 'RRRYYRRR', 'RRRYYRRR']],
  ['Кит', ['..B.B...', '...B....', '.BBBBB..', 'BBBBYBB.', 'BBBBBBBB', 'BBBBBBB.', '.BBBBB.B', '......BB']],
  ['Морковка', ['....G.G.', '.....GG.', '....OO..', '...OOO..', '..OOO...', '.OOO....', 'OOO.....', 'OO......']],
  ['Звёздочка', ['...YY...', '...YY...', 'YYYYYYYY', '.YYOOYY.', '..YOOY..', '.YYYYYY.', '.YY..YY.', 'YY....YY']],
  ['Кактус', ['...K....', '..GGG...', 'G.GGG..G', 'GGGGG.GG', '..GGGGG.', '..GGG...', '.OOOOOO.', '..OOOO..']],
  ['Пончик', ['..OOOO..', '.OKKKKO.', 'OKYKKBKO', 'OKK..KKO', 'OKK..KKO', 'OKBKKYKO', '.OKKKKO.', '..OOOO..']],
  ['Сова', ['.O....O.', '.OOOOOO.', 'OYYOOYYO', 'OYPOOPYO', 'OOOYYOOO', '.OOOOOO.', '.OOOOOO.', '..Y..Y..']],
  ['Воздушные шарики', ['.RR..BB.', 'RRRRBBBB', 'RRRRBBBB', '.RR..BB.', '..K..K..', '...K.K..', '....K...', '....K...']],
  ['Лягушка', ['.GG..GG.', 'GYGGGGYG', 'GGGGGGGG', 'GKGGGGKG', 'GGRRRRGG', '.GGGGGG.', '.G.GG.G.', 'GG....GG']],
  ['Корона', ['........', 'Y..YY..Y', 'YY.YY.YY', 'YYYYYYYY', 'YRYYBYRY', 'YYYYYYYY', 'YYYYYYYY', '........']],
  ['Ёжик', ['.O.O.O..', 'OOOOOO..', 'OOOOOYY.', 'OOOOYPYY', 'OOOOYYYP', '.OOOOYY.', '..Y...Y.', '........']],
  ['Какао', ['..K..K..', '.K..K...', 'OOOOOO..', 'OPPPPOO.', 'OOOOOO.O', 'OOOOOO.O', 'OOOOOOO.', '.OOOO...']],
  ['Ракета', ['...RR...', '..RKKR..', '..KBBK..', '..KKKK..', '..KKKK..', '.RKKKKR.', 'RR.OO.RR', '...YY...']],
  ['Букет', ['RR.KK.YY', 'RR.KK.YY', '.G.PP.G.', '..GPPG..', '...GG...', '..GGGG..', '.GGGGGG.', '..GGGG..']]];

// Живая картина в окне победы: как двигается (sway — качается, beat — пульсирует, bob — покачивается вверх-вниз, spin — крутится,
// twinkle — мерцает, fly — улетает и возвращается, flap — машет крыльями, [blink, глаза, веки] — моргает)
const ANIM = { 'Сердечко': 'beat', 'Солнышко': 'spin', 'Тюльпан': 'sway', 'Ромашка': 'spin', 'Вишенки': 'sway', 'Луна и звезда': 'twinkle', 'Яблоко': 'beat',
  'Зонтик': 'sway', 'Грибок': 'beat', 'Рыбка': 'bob', 'Домик': 'twinkle', 'Котик': ['blink', 'G', 'O'], 'Клубника': 'beat', 'Ёлочка': 'twinkle', 'Кораблик': 'sway',
  'Улитка': 'bob', 'Капкейк': 'beat', 'Бабочка': 'flap', 'Радуга': 'twinkle', 'Подсолнух': 'sway', 'Пчёлка': 'bob', 'Мороженое': 'beat', 'Божья коровка': 'bob',
  'Роза': 'sway', 'Цыплёнок': ['blink', 'P', 'Y'], 'Арбуз': 'beat', 'Подарок': 'beat', 'Кит': 'bob', 'Морковка': 'sway', 'Звёздочка': 'twinkle', 'Кактус': 'sway',
  'Пончик': 'spin', 'Сова': ['blink', 'P', 'O'], 'Воздушные шарики': 'bob', 'Лягушка': ['blink', 'Y', 'G'], 'Корона': 'twinkle', 'Ёжик': 'bob', 'Какао': 'bob',
  'Ракета': 'fly', 'Букет': 'sway' };

// Ходы на картину: по боту (node selfcheck.js --calibrate: медиана × 1,8 + 6 — человек медленнее жадного бота)
const MOVES = [15, 19, 23, 17, 19, 15, 30, 24, 28, 30, 37, 33, 35, 50, 71, 41, 44, 50, 35, 39, 32, 28, 51, 32, 44, 37, 73, 44, 48, 80, 53, 46, 48, 30, 66, 46, 35, 51, 44, 41];
// Уровень из картинки: цвета фишек — цвета картины + «лишние»; i — номер для сложности (своя картина — как первые, i = 0).
// На первых шести картинах 4 цвета фишек (на трёх каскады красят всё сами), дальше 5; больше — только если столько в картине.
// Пятый цвет вводится плавно: сначала он редкий (вес 0,25), дальше чаще, но не выше 0,6 — поздние картины сложнее, но не затянуты.
function levelFrom(name, rows, i, moves) {
  const used = [...new Set(rows.join('').replace(/\./g, ''))];
  const k = Math.max(used.length, i < 6 ? 4 : 5), extra = KEYS.split('').filter(c => !used.includes(c));
  const palette = used.concat(extra.slice(0, Math.max(0, k - used.length)));
  const ew = i < 6 ? 1 : Math.min(0.6, 0.25 + (i - 6) * 0.03), weights = palette.map((c, j) => j < Math.max(used.length, 4) ? 1 : ew);
  return { name, rows, palette, weights, moves, target: rows.map(r => r.split('').map(c => c === '.' ? -1 : palette.indexOf(c))) };
}
const levelOf = i => levelFrom(PICS[i % PICS.length][0], PICS[i % PICS.length][1], i, MOVES[i % PICS.length]);
globalThis.LV = { COLORS, KEYS, PICS, MOVES, ANIM, levelOf, levelFrom };
