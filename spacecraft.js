/* =====================================================================
   SONDAS Y NAVES ESPACIALES HUMANAS — datos reales (NASA / ESA / JAXA)
   ===================================================================== */

const SPACECRAFT = [

  // ===== ESPACIO INTERESTELAR =====
  {
    id: "voyager1", name: "Voyager 1",
    type: "Sonda interestelar", agency: "NASA",
    launched: "5 sep 1977", status: "Activa",
    solarDist_AU: 167.0, driftPerYear_AU: 3.59, angle_deg: 253,
    color: 0xffffff,
    fact: "La nave humana mas lejana del Sol. En 2012 cruzo la heliopausa y entro en el espacio interestelar. Su señal tarda mas de 23 horas en llegar a la Tierra a la velocidad de la luz."
  },
  {
    id: "voyager2", name: "Voyager 2",
    type: "Sonda interestelar", agency: "NASA",
    launched: "20 ago 1977", status: "Activa",
    solarDist_AU: 139.0, driftPerYear_AU: 3.15, angle_deg: 289,
    color: 0xdddddd,
    fact: "Unica nave en haber sobrevolado los cuatro gigantes: Jupiter (1979), Saturno (1981), Urano (1986) y Neptuno (1989). Cruzo la heliopausa en 2018."
  },
  {
    id: "pioneer10", name: "Pioneer 10",
    type: "Sonda interestelar (inactiva)", agency: "NASA",
    launched: "2 mar 1972", status: "Inactiva",
    solarDist_AU: 133.0, driftPerYear_AU: 2.54, angle_deg: 82,
    color: 0x888888,
    fact: "Primera nave en cruzar el cinturon de asteroides y sobrevolar Jupiter. Lleva una placa de oro con un mensaje para posibles civilizaciones extraterrestres. Señal perdida en 2003."
  },
  {
    id: "pioneer11", name: "Pioneer 11",
    type: "Sonda interestelar (inactiva)", agency: "NASA",
    launched: "5 abr 1973", status: "Inactiva",
    solarDist_AU: 95.0, driftPerYear_AU: 2.40, angle_deg: 335,
    color: 0x888888,
    fact: "Primera nave en sobrevolar Saturno y fotografiar sus anillos de cerca (1979). Señal perdida en 1995. Viaja en direccion opuesta a Voyager 1."
  },
  {
    id: "newhorizons", name: "New Horizons",
    type: "Sonda interplanetaria", agency: "NASA",
    launched: "19 ene 2006", status: "Activa",
    solarDist_AU: 58.0, driftPerYear_AU: 3.55, angle_deg: 17,
    color: 0xccccff,
    fact: "Primera mision a Pluton (julio 2015), revelando sus montañas de hielo y llanuras de nitrogeno. Tambien sobrevo Arrokoth (2019), el objeto mas lejano explorado de cerca."
  },

  // ===== SONDAS SOLARES =====
  {
    id: "parker", name: "Parker Solar Probe",
    type: "Sonda solar", agency: "NASA",
    launched: "12 ago 2018", status: "Activa",
    parent: "sol", a_AU: 0.065, period_years: 0.209,
    color: 0xff7700,
    fact: "La nave mas rapida jamas construida: ha alcanzado 690.000 km/h. Vuela a solo 6,1 millones de km del Sol estudiando su corona y el origen del viento solar."
  },
  {
    id: "solarorbiter", name: "Solar Orbiter",
    type: "Sonda solar", agency: "ESA / NASA",
    launched: "10 feb 2020", status: "Activa",
    parent: "sol", a_AU: 0.32, period_years: 0.62,
    color: 0xffaa33,
    fact: "Primera mision en fotografiar los polos del Sol. Descubrio pequeñas llamaradas solares llamadas 'hogueras'. Mision conjunta ESA-NASA."
  },

  // ===== EN TRANSITO A MERCURIO =====
  {
    id: "bepicolombo", name: "BepiColombo",
    type: "Sonda a Mercurio", agency: "ESA / JAXA",
    launched: "20 oct 2018", status: "En transito",
    parent: "sol", a_AU: 0.39, period_years: 0.243,
    color: 0xbbbbbb,
    fact: "Mision conjunta ESA-JAXA hacia Mercurio. Realiza sobrevuelos gravitacionales de Venus y Mercurio para frenar. Llegara a orbita de Mercurio en diciembre de 2025."
  },

  // ===== ORBITA DE VENUS =====
  {
    id: "akatsuki", name: "Akatsuki",
    type: "Orbiter de Venus", agency: "JAXA",
    launched: "20 may 2010", status: "Activa",
    parent: "venus", a_km: 13000, period_days: 10.8,
    color: 0xffe599,
    fact: "Sonda japonesa que estudia el clima de Venus. Tras fallar su insercion orbital en 2010, logro entrar en orbita en 2015 usando propulsores auxiliares."
  },

  // ===== ORBITA DE LA TIERRA =====
  {
    id: "iss", name: "ISS",
    type: "Estacion espacial", agency: "NASA / ESA / ROSCOSMOS / JAXA / CSA",
    launched: "20 nov 1998", status: "Activa",
    parent: "tierra", a_km: 6779, period_days: 0.06272,
    color: 0xccddff,
    fact: "La mayor estructura ensamblada en el espacio. Orbita la Tierra cada 90 minutos a 27.600 km/h. Habitada de forma continua desde noviembre del año 2000."
  },
  {
    id: "hubble", name: "Hubble",
    type: "Telescopio espacial", agency: "NASA / ESA",
    launched: "24 abr 1990", status: "Activo",
    parent: "tierra", a_km: 6918, period_days: 0.06747,
    color: 0x88aaff,
    fact: "El telescopio espacial mas influyente. Mas de 1,5 millones de observaciones. Ha contribuido a medir la expansion acelerada del universo y a calcular la edad del cosmos."
  },
  {
    id: "jwst", name: "James Webb",
    type: "Telescopio espacial", agency: "NASA / ESA / CSA",
    launched: "25 dic 2021", status: "Activo",
    parent: "tierra", a_km: 1500000, period_days: 365.25,
    color: 0xaaddff,
    fact: "El telescopio mas potente construido. Opera en infrarrojo y ha fotografiado galaxias de hace 13.600 millones de años. Su espejo hexagonal mide 6,5 metros de diametro."
  },
  {
    id: "euclid", name: "Euclid",
    type: "Telescopio espacial", agency: "ESA",
    launched: "1 jul 2023", status: "Activo",
    parent: "tierra", a_km: 1510000, period_days: 365.25,
    color: 0xbbaaff,
    fact: "Telescopio europeo que mapea la geometria del universo oscuro. Estudiara mas de 1.500 millones de galaxias para comprender la energia y la materia oscura."
  },

  // ===== ORBITA DE MARTE =====
  {
    id: "odyssey", name: "Mars Odyssey",
    type: "Orbiter de Marte", agency: "NASA",
    launched: "7 abr 2001", status: "Activo",
    parent: "marte", a_km: 3793, period_days: 0.0817,
    color: 0xff8855,
    fact: "El satelite artificial mas longevo en orbita de Marte. Detecto hidrogeno bajo la superficie, indicando presencia de hielo de agua. Lleva mas de 23 años operativo."
  },
  {
    id: "marsexpress", name: "Mars Express",
    type: "Orbiter de Marte", agency: "ESA",
    launched: "2 jun 2003", status: "Activo",
    parent: "marte", a_km: 10107, period_days: 0.431,
    color: 0xff6633,
    fact: "Primera mision interplanetaria de la ESA. Detecto depositos de hielo de agua bajo el polo sur marciano y cartografio la superficie con alta resolucion."
  },
  {
    id: "mro", name: "MRO",
    type: "Orbiter de Marte", agency: "NASA",
    launched: "12 ago 2005", status: "Activo",
    parent: "marte", a_km: 4000, period_days: 0.121,
    color: 0xff9966,
    fact: "Mars Reconnaissance Orbiter: ha enviado mas datos cientificos que todas las demas misiones marcianas juntas. Su camara HiRISE capta objetos de 25 cm en la superficie."
  },
  {
    id: "maven", name: "MAVEN",
    type: "Orbiter de Marte", agency: "NASA",
    launched: "18 nov 2013", status: "Activo",
    parent: "marte", a_km: 6200, period_days: 0.296,
    color: 0xffaa77,
    fact: "Estudia como Marte perdio su atmosfera. El viento solar erosiona la ionosfera marciana a razon de 100 gramos por segundo, proceso que ha durado miles de millones de años."
  },
  {
    id: "hope", name: "Hope (Al-Amal)",
    type: "Orbiter de Marte", agency: "UAE Space Agency",
    launched: "19 jul 2020", status: "Activa",
    parent: "marte", a_km: 20000, period_days: 0.96,
    color: 0xff5500,
    fact: "Primera mision espacial de los Emiratos Arabes Unidos y la primera de un pais arabe. Estudia el clima global de Marte durante un año marciano completo (687 dias terrestres)."
  },
  {
    id: "tianwen1", name: "Tianwen-1",
    type: "Orbiter de Marte", agency: "CNSA",
    launched: "23 jul 2020", status: "Activo",
    parent: "marte", a_km: 26500, period_days: 1.28,
    color: 0xff4400,
    fact: "Primera mision china a Marte. Incluyo un orbiter, un lander y el rover Zhurong. China se convirtio en el segundo pais en operar un rover en Marte."
  },
  {
    id: "curiosity", name: "Curiosity",
    type: "Rover marciano", agency: "NASA",
    launched: "26 nov 2011", status: "Activo",
    parent: "marte", a_km: 3389.5, period_days: 1.026, onSurface: true,
    color: 0xcc7744,
    fact: "Rover nuclear explorando el crater Gale desde 2012. Confirmo que Marte tuvo condiciones habitables en el pasado. Lleva un laser para vaporizar rocas y analizarlas."
  },
  {
    id: "perseverance", name: "Perseverance",
    type: "Rover marciano", agency: "NASA",
    launched: "30 jul 2020", status: "Activo",
    parent: "marte", a_km: 3389.5, period_days: 1.026, onSurface: true,
    color: 0xdd8855,
    fact: "Recoge muestras de roca marciana para traerlas a la Tierra en una futura mision. Porta el helicoptero Ingenuity, el primer vuelo motorizado en otro planeta (abril 2021)."
  },

  // ===== CINTURON DE ASTEROIDES =====
  {
    id: "dawn", name: "Dawn",
    type: "Orbiter de Ceres (inactiva)", agency: "NASA",
    launched: "27 sep 2007", status: "Inactiva",
    parent: "sol", a_AU: 2.77, period_years: 4.6,
    color: 0x888888,
    fact: "Primera nave en orbitar dos cuerpos extraterrestres distintos: el asteroide Vesta (2011) y el planeta enano Ceres (2015). Descubrio manchas brillantes de sal en Ceres. Señal perdida en 2018."
  },

  // ===== ORBITA DE JUPITER =====
  {
    id: "juno", name: "Juno",
    type: "Orbiter de Jupiter", agency: "NASA",
    launched: "5 ago 2011", status: "Activo",
    parent: "jupiter", a_km: 4200000, period_days: 38,
    color: 0xddbb88,
    fact: "Estudia el interior, campo magnetico y atmosfera de Jupiter. Descubrio que su nucleo no es solido sino 'difuso'. Ha realizado numerosos sobrevuelos de las lunas galileanas."
  },

];
