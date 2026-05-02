/**
 * SEED DE PRODUCCION - Diego Bar App
 * Carga todos los datos del menu en la base de datos de Render.
 * Solo inserta si la tabla esta vacia (no sobrescribe).
 */
const db = require('./db');

console.log('Iniciando seed de produccion...');

const mesasExistentes = db.prepare('SELECT COUNT(*) as count FROM mesas').get();
if (mesasExistentes.count === 0) {
  const insertMesa = db.prepare(`INSERT INTO mesas (numero, sector) VALUES (?, ?)`);
  const run = db.transaction(() => {
    [[1,'Adentro'],[2,'Adentro'],[3,'Adentro'],[4,'Adentro'],
     [5,'Patio'],[6,'Patio'],[7,'Patio'],
     [8,'Deck (Calle)'],[9,'Deck (Calle)'],[10,'Deck (Calle)']]
    .forEach(([n,s]) => insertMesa.run(n, s));
  });
  run();
  console.log('10 mesas insertadas');
}

const catsExistentes = db.prepare('SELECT COUNT(*) as count FROM categorias').get();
if (catsExistentes.count === 0) {
  const ins = db.prepare(`INSERT INTO categorias (nombre, icono, orden) VALUES (?, ?, ?)`);
  const run = db.transaction(() => {
    [
      ['Nuestras Birras','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_BIIRAS%20ESTILOS.png',1],
      ['HAPPY HOUR','https://cdn-icons-png.freepik.com/128/4856/4856714.png',2],
      ['Gin 1907','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/iconos_VF_v2_CLASICOS.png',3],
      ['Papas del Chef','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_PAPAS%20DEL%20CHEF.png',4],
      ['Entrantes','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_ENTRANTES.png',5],
      ['Pizzas','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_PIZZA.png',6],
      ['Burgers','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_BURGER.png',7],
      ['Milanesas','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_MILANESAS.png',8],
      ['Sandwiches','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/CARTA%20IPAGE_SANDWICHS.png',9],
      ['Wraps & Ensaladas','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_ENSALADAS.png',10],
      ['Cocina','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_COCINA.png',11],
      ['Menu Infantil','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_MENU%20INFANTIL.png',12],
      ['Menu sin TACC','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_SIN%20TACC.png',13],
      ['Postres','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_POSTRES.png',14],
      ['Bebidas sin Alcohol','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_BEBIDAS%20SIN%20ALCOHOL.png',15],
      ['Tragos Clasicos','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/iconos_VF_v2_CLASICOS.png',16],
      ['Caribenos','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/iconos_VF_v2_CARIBENOS.png',17],
      ['Frozens','https://ipage.ar/cartaonline/css_personalizado/gluck/iconos/STICKERS__ICONOS_VERDE_BIIRAS%20ESTILOS.png',18]
    ].forEach(([n,i,o]) => ins.run(n, i, o));
  });
  run();
  console.log('18 categorias insertadas');
}

const prodsExistentes = db.prepare('SELECT COUNT(*) as count FROM productos').get();
if (prodsExistentes.count === 0) {
  const ins = db.prepare(`INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria_id) VALUES (?, ?, ?, ?, ?)`);

  // URLs de imagenes correctas por tipo de producto
  const beer    = 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800'; // cerveza artesanal
  const gin     = 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800'; // gin tonic
  const papas   = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800'; // papas fritas
  const pizza   = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'; // pizza
  const burger  = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'; // burger
  const mila    = 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800'; // milanesa
  const sandwich= 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800';  // sandwich
  const wrap    = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800'; // wrap
  const ensalada= 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800'; // ensalada
  const pasta   = 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800'; // pasta
  const postre  = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800'; // postre
  const bebida  = 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=800'; // bebidas
  const trago   = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800'; // tragos
  const nachos  = 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800'; // nachos
  const rabas   = 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800'; // calamares
  const langos  = 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800';   // langostinos
  const mozza   = 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=800'; // mozzarella sticks
  const choco   = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800'; // volcan chocolate
  const torta   = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800'; // chocotorta
  const frozen  = 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800'; // frozen drinks
  const mojito  = 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800';   // cocktail verde
  const fernet  = 'https://images.unsplash.com/photo-1585625236574-9d6e6700f1e4?w=800'; // fernet

  const run = db.transaction(() => [
    // Birras (1)
    ['RETRIEVER GOLDEN ALE','Rubia, ligera, refrescante.',5000,beer,1],
    ['FARO IRISH RED','Roja, caramelizada, maltosa.',5500,beer,1],
    ['HONEY','Rubia con miel natural.',5500,beer,1],
    ['ROBUST PORTER','Negra, cafe y chocolate.',5500,'https://images.unsplash.com/photo-1486947799489-3fabdd7d32a6?w=800',1],
    ['IPA TEMPLO DORADO','Lupulada y citrica.',6500,beer,1],
    ['MAJESTAD SESSION IPA','Aromatica y suave.',6500,beer,1],
    ['HOMERO WITBIER','Trigo, naranja y especias.',5500,beer,1],
    ['WEE HEAVY KM 213','Corpulenta y dulce.',6400,'https://images.unsplash.com/photo-1486947799489-3fabdd7d32a6?w=800',1],
    // Happy Hour (2)
    ['HH - PINTA GOLDEN','Especial 18 a 21hs.',3500,beer,2],
    ['HH - PINTA IRISH/HONEY/PORTER','Especial 18 a 21hs.',3800,beer,2],
    // Gin (3)
    ['GIN CLASSIC LEMON','Con limon.',9000,gin,3],
    ['GIN PEPINO','Con pepino fresco.',9000,gin,3],
    ['GIN MARACUYA','Con maracuya.',9500,gin,3],
    ['GIN FRUTOS ROJOS','Con frutos rojos.',9500,gin,3],
    // Papas (4)
    ['PAPAS GLUCK','Cheddar, salsa Gluck y panceta.',19000,papas,4],
    ['PAPAS RUSTICAS','Con alioli casero.',16000,papas,4],
    ['PULLED MEAT EXTREMAS','Carne desmechada y queso.',24000,'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800',4],
    // Entrantes (5)
    ['NACHOS CON QUESO','Triangulos de maiz.',12000,nachos,5],
    ['TEQUENOS x6','Masa rellena de queso.',14000,mozza,5],
    ['BASTONCITOS DE MUZZARELLA','Fritos con salsa pomodoro.',15000,mozza,5],
    ['RABAS A LA ROMANA','Anillos de calamar.',21000,rabas,5],
    ['LANGOSTINOS REBOZADOS','Con salsa alioli.',19000,langos,5],
    // Pizzas (6)
    ['MUZZARELLA','Salsa de tomate y muzzarella.',21000,pizza,6],
    ['NAPOLITANA','Tomate, ajo y muzzarella.',24000,pizza,6],
    ['FUGAZZETTA','Cebolla y muzzarella.',25000,pizza,6],
    // Burgers (7)
    ['OKLAHOMA SMASH','Doble carne, smash cebolla.',22000,burger,7],
    ['LE BLUE','Queso azul y rucula.',24000,burger,7],
    ['AMERICANA','Cheddar, panceta, huevo.',24000,burger,7],
    ['BOMBA','Triple carne y cheddar.',26000,burger,7],
    // Milanesas (8)
    ['A CABALLO','Con huevos fritos.',22000,mila,8],
    ['NAPOLITANA MIL','Jamon y muzzarella.',22000,mila,8],
    ['SUIZA','Queso suizo gratinado.',24000,mila,8],
    ['NALGONA','Panceta y huevos.',24000,mila,8],
    // Sandwiches (9)
    ['BONDIOLA AL DISCO','En pan frances.',18000,sandwich,9],
    ['POLLO CRISPY','Pollo rebozado.',17000,sandwich,9],
    ['VEGGIE SANDWICH','Vegetales asados.',16000,sandwich,9],
    // Wraps (10)
    ['WRAP DE POLLO','Con vegetales.',15000,wrap,10],
    ['WRAP VEGGIE','Con humus.',14000,wrap,10],
    ['ENSALADA CAESAR','Pollo y parmesano.',15000,ensalada,10],
    // Cocina (11)
    ['SORRENTINOS DE JAMON Y QUESO','Salsa a eleccion.',18000,pasta,11],
    ['TALLARINES AL HUEVO','Con bolognesa.',16000,pasta,11],
    // Menu Infantil (12)
    ['MILANESITA CON PAPAS','Porcion infantil.',12000,mila,12],
    ['HAMBURGUESITA','Con queso.',11000,burger,12],
    // Sin TACC (13)
    ['PIZZA SIN TACC','Apta celiacos.',23000,pizza,13],
    ['LOMITO SIN TACC','Apto celiacos.',21000,sandwich,13],
    // Postres (14)
    ['VOLCAN DE CHOCOLATE','Con helado.',8500,choco,14],
    ['CHOCOTORTA','En frasco.',7500,torta,14],
    // Bebidas (15)
    ['COCA COLA 500ML','Original o Zero.',4500,bebida,15],
    ['AGUA MINERAL','Con o sin gas.',3800,bebida,15],
    ['LIMONADA CASERA','Menta y jengibre.',5000,bebida,15],
    // Tragos clasicos (16)
    ['FERNET BRANCA','Con Coca.',8500,fernet,16],
    ['CAMPARI TONIC','Con naranja o tonica.',8000,trago,16],
    ['NEGRONI','Gin, vermut y campari.',9000,trago,16],
    // Caribenos (17)
    ['MOJITO','Ron y menta.',9500,mojito,17],
    ['CAIPIROSKA','Vodka y lima.',9000,trago,17],
    ['MARGARITA','Tequila y triple sec.',9500,trago,17],
    // Frozens (18)
    ['DAIQUIRI FROZEN','Frutilla o durazno.',9500,frozen,18],
    ['MARGARITA FROZEN','Limon o frutilla.',9800,frozen,18],
  ].forEach(args => ins.run(...args)));
  run();
  console.log('57 productos insertados con imagenes correctas');
}

console.log('Seed de produccion completado!');
