/* =====================================================================
   DATOS REALES DEL SISTEMA SOLAR
   ---------------------------------------------------------------------
   Fuentes de referencia: NASA Planetary Fact Sheet / IAU.
   - mass_kg ............ masa en kilogramos
   - radius_km .......... radio ecuatorial medio en km
   - gravity ............ gravedad superficial en m/s^2
   - a_AU ............... semieje mayor de la orbita en Unidades Astronomicas
                          (distancia media al Sol). El Sol = 0.
   - eccentricity ....... excentricidad de la orbita (0 = circulo perfecto)
   - orbital_velocity ... velocidad orbital media en km/s
   - orbital_period ..... periodo orbital (texto legible)
   - rotation_period .... periodo de rotacion sobre su eje (texto legible)
   - axial_tilt ......... inclinacion del eje en grados
   - mean_temp_C ........ temperatura media en grados Celsius
   - moons .............. numero de satelites conocidos
   - color .............. color base para el render
   - fact ............... dato curioso
   ===================================================================== */

const SUN_MASS_KG = 1.98892e30; // masa del Sol (para convertir a masas solares)
const AU_KM = 1.495978707e8;    // 1 Unidad Astronomica en km

const BODIES = [
  {
    id: "sol",
    name: "Sol",
    type: "Estrella (enana amarilla, tipo G2V)",
    mass_kg: 1.98892e30,
    radius_km: 696340,
    gravity: 274.0,
    a_AU: 0,
    eccentricity: 0,
    orbital_velocity: 0,
    orbital_period: "—",
    rotation_period: "25.4 dias (ecuador)",
    axial_tilt: 7.25,
    mean_temp_C: 5505,            // temperatura de la superficie (fotosfera)
    moons: 0,
    color: 0xffcc33,
    emissive: true,
    fact: "Contiene el 99.86% de toda la masa del Sistema Solar. En su nucleo se fusionan 600 millones de toneladas de hidrogeno por segundo."
  },
  {
    id: "mercurio",
    name: "Mercurio",
    type: "Planeta rocoso (terrestre)",
    mass_kg: 3.3011e23,
    radius_km: 2439.7,
    gravity: 3.70,
    a_AU: 0.387098,
    eccentricity: 0.2056,
    orbital_velocity: 47.36,
    orbital_period: "88 dias",
    rotation_period: "58.6 dias",
    axial_tilt: 0.034,
    mean_temp_C: 167,
    moons: 0,
    color: 0x9c9c9c,
    fact: "Es el planeta mas pequeño y el mas cercano al Sol. Su dia (amanecer a amanecer) dura 176 dias terrestres, mas que su propio año."
  },
  {
    id: "venus",
    name: "Venus",
    type: "Planeta rocoso (terrestre)",
    mass_kg: 4.8675e24,
    radius_km: 6051.8,
    gravity: 8.87,
    a_AU: 0.723332,
    eccentricity: 0.0068,
    orbital_velocity: 35.02,
    orbital_period: "224.7 dias",
    rotation_period: "243 dias (retrogrado)",
    axial_tilt: 177.36,
    mean_temp_C: 464,
    moons: 0,
    color: 0xe6c27a,
    fact: "El planeta mas caliente del sistema por su efecto invernadero de CO2. Gira al reves: en Venus el Sol sale por el oeste."
  },
  {
    id: "tierra",
    name: "Tierra",
    type: "Planeta rocoso (terrestre)",
    mass_kg: 5.97237e24,
    radius_km: 6371.0,
    gravity: 9.807,
    a_AU: 1.000000,
    eccentricity: 0.0167,
    orbital_velocity: 29.78,
    orbital_period: "365.25 dias",
    rotation_period: "23h 56m",
    axial_tilt: 23.44,
    mean_temp_C: 15,
    moons: 1,
    satellites: [
      { id: "luna", name: "Luna", radius_km: 1737.4, a_km: 384400, period_days: 27.3217, gravity: 1.62, mass_kg: 7.342e22, color: 0x9a9a9a, tex: "luna", fact: "El unico satelite de la Tierra y el quinto mayor del sistema. Se aleja de nosotros unos 3.8 cm cada año." }
    ],
    color: 0x2a6fdb,
    fact: "El unico mundo conocido con vida. El 71% de su superficie es agua liquida y su atmosfera es 78% nitrogeno y 21% oxigeno."
  },
  {
    id: "marte",
    name: "Marte",
    type: "Planeta rocoso (terrestre)",
    mass_kg: 6.4171e23,
    radius_km: 3389.5,
    gravity: 3.71,
    a_AU: 1.523679,
    eccentricity: 0.0934,
    orbital_velocity: 24.07,
    orbital_period: "687 dias",
    rotation_period: "24h 37m",
    axial_tilt: 25.19,
    mean_temp_C: -65,
    moons: 2,
    satellites: [
      { id: "fobos", name: "Fobos", radius_km: 11.27, a_km: 9376, period_days: 0.31891, color: 0x8a7d70, fact: "Orbita tan cerca de Marte que sale y se pone dos veces al dia. Caera sobre el planeta dentro de unos 50 millones de años." },
      { id: "deimos", name: "Deimos", radius_km: 6.2, a_km: 23463, period_days: 1.26244, color: 0x9b8e80, fact: "La luna mas pequeña y exterior de Marte; su gravedad es tan debil que un humano podria casi saltar y escapar de ella." }
    ],
    color: 0xc1440e,
    fact: "El 'planeta rojo' por el oxido de hierro de su suelo. Alberga el Monte Olimpo, el volcan mas alto conocido (22 km, casi 3 veces el Everest)."
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "Gigante gaseoso",
    mass_kg: 1.8982e27,
    radius_km: 69911,
    gravity: 24.79,
    a_AU: 5.2044,
    eccentricity: 0.0489,
    orbital_velocity: 13.07,
    orbital_period: "11.86 años",
    rotation_period: "9h 56m",
    axial_tilt: 3.13,
    mean_temp_C: -110,
    moons: 95,
    satellites: [
      { id: "metis", name: "Metis", radius_km: 21.5, a_km: 128000, period_days: 0.2948, color: 0x8a8278, fact: "La luna mas interior de Jupiter; orbita en menos de 7 horas, mas rapido de lo que Jupiter rota." },
      { id: "amaltea", name: "Amaltea", radius_km: 83.5, a_km: 181400, period_days: 0.498, color: 0x9a5a4a, fact: "De color rojizo y forma de patata; uno de los objetos mas rojos del sistema solar." },
      { id: "tebe", name: "Tebe", radius_km: 49.3, a_km: 221900, period_days: 0.6745, color: 0x8a7a6a, fact: "Pequeña luna interior irregular, descubierta por la sonda Voyager 1 en 1979." },
      { id: "io", name: "Ío", radius_km: 1821.6, a_km: 421700, period_days: 1.769, gravity: 1.796, mass_kg: 8.93e22, color: 0xd8c25a, fact: "El cuerpo con mas actividad volcanica del sistema solar: cientos de volcanes expulsan azufre a gran altura." },
      { id: "europa", name: "Europa", radius_km: 1560.8, a_km: 671034, period_days: 3.551, gravity: 1.314, mass_kg: 4.80e22, color: 0xcdb892, fact: "Bajo su corteza de hielo se cree que esconde un oceano de agua liquida con mas agua que toda la Tierra." },
      { id: "ganimedes", name: "Ganímedes", radius_km: 2634.1, a_km: 1070412, period_days: 7.155, gravity: 1.428, mass_kg: 1.48e23, color: 0x9a8c78, fact: "La luna mas grande del sistema solar, mayor incluso que el planeta Mercurio. Tiene su propio campo magnetico." },
      { id: "calisto", name: "Calisto", radius_km: 2410.3, a_km: 1882709, period_days: 16.689, gravity: 1.235, mass_kg: 1.08e23, color: 0x6f6256, fact: "Uno de los cuerpos con mas crateres del sistema solar; su superficie apenas ha cambiado en 4000 millones de años." },
      { id: "himalia", name: "Himalia", radius_km: 67, a_km: 11461000, period_days: 250.56, color: 0x8a8278, fact: "Luna irregular y lejana, probablemente un asteroide capturado por la gravedad de Jupiter." }
    ],
    color: 0xc9a679,
    fact: "El planeta mas grande: cabrian 1300 Tierras en su interior. Su Gran Mancha Roja es una tormenta mas grande que la Tierra activa desde hace siglos."
  },
  {
    id: "saturno",
    name: "Saturno",
    type: "Gigante gaseoso",
    mass_kg: 5.6834e26,
    radius_km: 58232,
    gravity: 10.44,
    a_AU: 9.5826,
    eccentricity: 0.0565,
    orbital_velocity: 9.68,
    orbital_period: "29.46 años",
    rotation_period: "10h 33m",
    axial_tilt: 26.73,
    mean_temp_C: -140,
    moons: 146,
    satellites: [
      { id: "mimas", name: "Mimas", radius_km: 198.2, a_km: 185539, period_days: 0.942, color: 0xcfcfca, fact: "Su enorme crater Herschel le da aspecto de la 'Estrella de la Muerte' de Star Wars." },
      { id: "encelado", name: "Encélado", radius_km: 252.1, a_km: 237948, period_days: 1.370, color: 0xe9eef0, fact: "Expulsa geiseres de agua helada desde su polo sur; es uno de los objetos mas reflectantes del sistema solar." },
      { id: "tetis", name: "Tetis", radius_km: 531.1, a_km: 294619, period_days: 1.888, color: 0xd6d6d2, fact: "Mundo helado surcado por Ithaca Chasma, un gran cañon de mas de 2000 km de longitud." },
      { id: "dione", name: "Dione", radius_km: 561.4, a_km: 377396, period_days: 2.737, color: 0xc9c9c2, fact: "Tiene acantilados de hielo brillante que de lejos parecen tenues lineas blancas." },
      { id: "rea", name: "Rea", radius_km: 763.8, a_km: 527108, period_days: 4.518, color: 0xa9a39a, fact: "La segunda mayor luna de Saturno: un mundo helado y completamente cubierto de crateres." },
      { id: "titan", name: "Titán", radius_km: 2574.7, a_km: 1221870, period_days: 15.945, gravity: 1.352, mass_kg: 1.345e23, color: 0xc79a4e, fact: "La unica luna con atmosfera densa. Tiene lagos y rios de metano liquido en su superficie." },
      { id: "hiperion", name: "Hiperión", radius_km: 135, a_km: 1481009, period_days: 21.28, color: 0xb09a78, fact: "Tiene aspecto esponjoso y gira de forma caotica, sin un eje de rotacion estable." },
      { id: "japeto", name: "Jápeto", radius_km: 734.5, a_km: 3560820, period_days: 79.32, color: 0x8a7a64, fact: "Tiene un hemisferio oscuro y otro brillante, como una bola en blanco y negro." },
      { id: "febe", name: "Febe", radius_km: 106.5, a_km: 12947918, period_days: 550.31, retro: true, color: 0x4a463f, fact: "Orbita muy lejos y al reves (retrograda); seguramente es un objeto capturado del cinturon de Kuiper." }
    ],
    color: 0xe3c16f,
    ring: { inner: 1.2, outer: 2.3, color: 0xcdba8f },
    fact: "Famoso por sus anillos de hielo y roca, que se extienden 280.000 km pero apenas tienen 10-20 metros de grosor. Es tan poco denso que flotaria en agua."
  },
  {
    id: "urano",
    name: "Urano",
    type: "Gigante helado",
    mass_kg: 8.6810e25,
    radius_km: 25362,
    gravity: 8.69,
    a_AU: 19.2184,
    eccentricity: 0.0457,
    orbital_velocity: 6.80,
    orbital_period: "84 años",
    rotation_period: "17h 14m (retrogrado)",
    axial_tilt: 97.77,
    mean_temp_C: -195,
    moons: 28,
    satellites: [
      { id: "puck", name: "Puck", radius_km: 81, a_km: 86004, period_days: 0.762, color: 0x6e655c, fact: "Pequeña luna interior de forma casi esferica, descubierta por la Voyager 2 en 1985." },
      { id: "miranda", name: "Miranda", radius_km: 235.8, a_km: 129390, period_days: 1.413, color: 0x9a948c, fact: "Pese a su pequeño tamaño tiene un relieve extremo, con acantilados de hasta 20 km de altura." },
      { id: "ariel", name: "Ariel", radius_km: 578.9, a_km: 190900, period_days: 2.520, color: 0xb0a9a2, fact: "La superficie mas brillante y joven del sistema de Urano, surcada por largos cañones." },
      { id: "umbriel", name: "Umbriel", radius_km: 584.7, a_km: 266000, period_days: 4.144, color: 0x837d76, fact: "La luna mas oscura de Urano, cubierta por un material antiguo y poco reflectante." },
      { id: "titania", name: "Titania", radius_km: 788.4, a_km: 435910, period_days: 8.706, color: 0xa39a90, fact: "La mayor luna de Urano, con enormes cañones de hasta 1600 km de longitud." },
      { id: "oberon", name: "Oberón", radius_km: 761.4, a_km: 583520, period_days: 13.463, color: 0x968d84, fact: "La luna grande mas exterior de Urano, repleta de crateres muy antiguos." },
      { id: "sycorax", name: "Sycorax", radius_km: 75, a_km: 12179000, period_days: 1288, retro: true, color: 0x7a5a4a, fact: "Luna irregular y lejana de orbita retrograda; la mayor de las lunas capturadas de Urano." }
    ],
    color: 0x9fe3e8,
    ring: { inner: 1.5, outer: 2.0, color: 0x6f8f96 },
    fact: "Gira 'tumbado' con el eje a casi 98 grados, probablemente por un impacto colosal. Sus polos reciben mas luz solar que su ecuador."
  },
  {
    id: "neptuno",
    name: "Neptuno",
    type: "Gigante helado",
    mass_kg: 1.02413e26,
    radius_km: 24622,
    gravity: 11.15,
    a_AU: 30.110,
    eccentricity: 0.0113,
    orbital_velocity: 5.43,
    orbital_period: "164.8 años",
    rotation_period: "16h 6m",
    axial_tilt: 28.32,
    mean_temp_C: -200,
    moons: 16,
    satellites: [
      { id: "despina", name: "Despina", radius_km: 75, a_km: 52526, period_days: 0.335, color: 0x6b6660, fact: "Pequeña luna interior que ayuda a dar forma a los tenues anillos de Neptuno." },
      { id: "galatea", name: "Galatea", radius_km: 88, a_km: 61953, period_days: 0.4287, color: 0x6b6660, fact: "Luna pastora cuya gravedad confina los arcos del anillo exterior de Neptuno." },
      { id: "larisa", name: "Larisa", radius_km: 97, a_km: 73548, period_days: 0.5547, color: 0x6b6660, fact: "Luna interior alargada e irregular, observada de cerca por la Voyager 2." },
      { id: "proteo", name: "Proteo", radius_km: 210, a_km: 117647, period_days: 1.122, color: 0x6b6660, fact: "Uno de los cuerpos no esfericos mas grandes del sistema solar; tan oscuro que tardo mucho en descubrirse." },
      { id: "triton", name: "Tritón", radius_km: 1353.4, a_km: 354759, period_days: 5.877, gravity: 0.779, mass_kg: 2.14e22, color: 0xc9b8b0, retro: true, fact: "Orbita al reves que la rotacion de Neptuno (retrogrado). Seguramente fue capturado del cinturon de Kuiper." },
      { id: "nereida", name: "Nereida", radius_km: 170, a_km: 5513818, period_days: 360.13, color: 0x9a948c, fact: "Tiene una de las orbitas mas excentricas del sistema solar: su distancia a Neptuno varia enormemente." }
    ],
    color: 0x3e54e3,
    fact: "El planeta mas lejano y ventoso: sus vientos alcanzan los 2100 km/h. Fue el primero descubierto por calculo matematico antes que por observacion."
  }
];
