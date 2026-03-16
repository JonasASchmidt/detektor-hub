/**
 * Prisma seed — fills the database with realistic demo data.
 * Run with:  npx prisma db seed
 */

import { PrismaClient, FindingStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Tag categories + tags
// ---------------------------------------------------------------------------

const CATEGORIES = [
  {
    name: "Münzen",
    tags: [
      { name: "Römerzeit",     color: "#b45309", icon: "Coins" },
      { name: "Mittelalter",   color: "#92400e", icon: "Coins" },
      { name: "Frühe Neuzeit", color: "#78350f", icon: "Coins" },
      { name: "Moderne",       color: "#713f12", icon: "Coins" },
      { name: "Antike",        color: "#ca8a04", icon: "Coins" },
    ],
  },
  {
    name: "Fibeln & Schmuck",
    tags: [
      { name: "Fibel",     color: "#7c3aed", icon: "Gem" },
      { name: "Ring",      color: "#6d28d9", icon: "Gem" },
      { name: "Anhänger",  color: "#5b21b6", icon: "Gem" },
      { name: "Kette",     color: "#4c1d95", icon: "Gem" },
      { name: "Brosche",   color: "#a78bfa", icon: "Gem" },
    ],
  },
  {
    name: "Werkzeuge & Geräte",
    tags: [
      { name: "Messer",    color: "#059669", icon: "Wrench" },
      { name: "Schlüssel", color: "#047857", icon: "Wrench" },
      { name: "Beschlag",  color: "#065f46", icon: "Wrench" },
      { name: "Nagel",     color: "#064e3b", icon: "Wrench" },
      { name: "Schnalle",  color: "#10b981", icon: "Wrench" },
    ],
  },
  {
    name: "Militaria",
    tags: [
      { name: "Uniformknopf",    color: "#1d4ed8", icon: "Shield" },
      { name: "Abzeichen",       color: "#1e40af", icon: "Shield" },
      { name: "Patronenhülse",   color: "#1e3a8a", icon: "Shield" },
      { name: "Gürtelschnalle",  color: "#2563eb", icon: "Shield" },
    ],
  },
  {
    name: "Keramik & Glas",
    tags: [
      { name: "Terra Sigillata", color: "#dc2626", icon: "GlassWater" },
      { name: "Steinzeug",       color: "#b91c1c", icon: "GlassWater" },
      { name: "Glasperle",       color: "#991b1b", icon: "GlassWater" },
    ],
  },
  {
    name: "Diverse",
    tags: [
      { name: "Blei",      color: "#6b7280", icon: "Box" },
      { name: "Spielzeug", color: "#374151", icon: "Box" },
      { name: "Unbekannt", color: "#1f2937", icon: "Box" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

const DETECTORS = [
  { name: "Equinox 800", company: "Minelab",  url: "https://www.minelab.com/equinox-800" },
  { name: "Garrett ACE 400", company: "Garrett", url: "https://www.garrett.com/garrett-ace-400" },
  { name: "Deus II",     company: "XP",       url: "https://www.xpmetaldetectors.com/deus-ii" },
  { name: "Impact",      company: "Nokta",    url: "https://www.noktadetectors.com/impact" },
];

// ---------------------------------------------------------------------------
// Demo user findings (Max Sondler)
// ---------------------------------------------------------------------------

interface FindingSeed {
  name: string;
  latitude: number;
  longitude: number;
  status: FindingStatus;
  reported: boolean;
  dating: string;
  dating_from: number;
  dating_to: number;
  depth?: number;
  weight?: number;
  description?: string;
  tags: string[];
}

const DEMO_FINDINGS: FindingSeed[] = [
  {
    name: "Denar des Marc Aurel",
    latitude: 51.3396, longitude: 12.3713,
    status: "COMPLETED", reported: true,
    dating: "161–180 n. Chr.", dating_from: 161, dating_to: 180,
    depth: 18, weight: 3.1,
    description: "Silberdenar, Vorderseite: Portrait des Marc Aurel, Rückseite: Victoria.",
    tags: ["Römerzeit"],
  },
  {
    name: "Mittelalterlicher Pfennig",
    latitude: 51.05, longitude: 13.74,
    status: "COMPLETED", reported: false,
    dating: "13. Jahrhundert", dating_from: 1200, dating_to: 1299,
    depth: 12, weight: 0.9,
    description: "Einseitiger Brakteat, stark oxidiert.",
    tags: ["Mittelalter"],
  },
  {
    name: "Bronzefibel",
    latitude: 51.12, longitude: 13.60,
    status: "COMPLETED", reported: true,
    dating: "2.–3. Jh. n. Chr.", dating_from: 100, dating_to: 300,
    depth: 8, weight: 14.5,
    description: "Gut erhaltene Kniefibel aus Bronze mit Emaileinlage.",
    tags: ["Fibel", "Römerzeit"],
  },
  {
    name: "Eisernes Messer",
    latitude: 51.48, longitude: 11.97,
    status: "COMPLETED", reported: false,
    dating: "Mittelalter", dating_from: 900, dating_to: 1400,
    depth: 22, weight: 85,
    description: "Fragmentiertes Eisenmesser, Griff fehlt.",
    tags: ["Messer", "Mittelalter"],
  },
  {
    name: "Uniformknopf Preußen",
    latitude: 52.52, longitude: 13.40,
    status: "COMPLETED", reported: false,
    dating: "19. Jahrhundert", dating_from: 1815, dating_to: 1871,
    depth: 6, weight: 4.2,
    description: "Messingknopf mit preußischem Adler.",
    tags: ["Uniformknopf"],
  },
  {
    name: "Silberring",
    latitude: 51.89, longitude: 10.41,
    status: "COMPLETED", reported: true,
    dating: "14.–15. Jh.", dating_from: 1300, dating_to: 1500,
    depth: 9, weight: 7.8,
    description: "Glatter Silberring, leichte Kerben an der Außenseite.",
    tags: ["Ring"],
  },
  {
    name: "Römische Bronzemünze (Follis)",
    latitude: 50.93, longitude: 11.59,
    status: "COMPLETED", reported: false,
    dating: "4. Jh. n. Chr.", dating_from: 300, dating_to: 400,
    depth: 14, weight: 4.8,
    tags: ["Römerzeit"],
  },
  {
    name: "Schlüssel, gotisch",
    latitude: 51.74, longitude: 14.33,
    status: "COMPLETED", reported: false,
    dating: "15.–16. Jh.", dating_from: 1400, dating_to: 1600,
    depth: 17, weight: 32,
    description: "Eisenschlüssel mit kleeblattartigem Bart, gut erhalten.",
    tags: ["Schlüssel"],
  },
  {
    name: "Bleigewicht",
    latitude: 51.21, longitude: 14.02,
    status: "COMPLETED", reported: false,
    dating: "Unbekannt", dating_from: 1000, dating_to: 2000,
    depth: 5, weight: 120,
    description: "Konisches Bleigewicht, Zweck unklar.",
    tags: ["Blei"],
  },
  {
    name: "Terra-Sigillata-Fragment",
    latitude: 51.60, longitude: 12.89,
    status: "COMPLETED", reported: false,
    dating: "1.–2. Jh. n. Chr.", dating_from: 50, dating_to: 200,
    depth: 25,
    description: "Mehrere Scherben mit Reliefdekor. Wahrscheinlich Drag. 37.",
    tags: ["Terra Sigillata"],
  },
  {
    name: "Frühmittelalterliche Gürtelschnalle",
    latitude: 51.30, longitude: 12.13,
    status: "COMPLETED", reported: true,
    dating: "6.–8. Jh.", dating_from: 500, dating_to: 800,
    depth: 11, weight: 28,
    description: "Bronzeschnalle mit Dornbeschlag, Merowingisch.",
    tags: ["Schnalle"],
  },
  {
    name: "Patronenhülse 7,92 mm",
    latitude: 51.84, longitude: 12.24,
    status: "DRAFT", reported: false,
    dating: "20. Jahrhundert", dating_from: 1939, dating_to: 1945,
    depth: 3,
    description: "Mauser-Patronenhülse aus dem Zweiten Weltkrieg.",
    tags: ["Patronenhülse"],
  },
  {
    name: "Keltische Potinmünze",
    latitude: 48.14, longitude: 11.58,
    status: "COMPLETED", reported: true,
    dating: "2.–1. Jh. v. Chr.", dating_from: -200, dating_to: -1,
    depth: 19, weight: 2.6,
    description: "Kleine Potinmünze, Bildtyp Büschelquinar.",
    tags: ["Antike"],
  },
  {
    name: "Messinganhänger, herzförmig",
    latitude: 50.78, longitude: 10.92,
    status: "COMPLETED", reported: false,
    dating: "17.–18. Jh.", dating_from: 1600, dating_to: 1800,
    depth: 7, weight: 5.1,
    description: "Votivanhänger aus Messing, wohl religiösen Ursprungs.",
    tags: ["Anhänger"],
  },
  {
    name: "Silbermünze Taler",
    latitude: 51.45, longitude: 12.05,
    status: "COMPLETED", reported: false,
    dating: "1650", dating_from: 1650, dating_to: 1650,
    depth: 16, weight: 28.7,
    description: "Sächsischer Taler, Johann Georg II., gut lesbare Prägung.",
    tags: ["Frühe Neuzeit"],
  },
];

// ---------------------------------------------------------------------------
// Jonas user findings — detailed records with descriptions
// ---------------------------------------------------------------------------

interface DetailedFindingSeed extends FindingSeed {
  diameter?: number;
  description_front?: string;
  description_back?: string;
  foundAt: Date;
}

const JONAS_FINDINGS: DetailedFindingSeed[] = [
  {
    name: "Aucissa-Fibel aus Bronze",
    latitude: 51.3562, longitude: 12.4108,
    status: "COMPLETED", reported: true,
    dating: "1.–2. Jh. n. Chr.", dating_from: 1, dating_to: 200,
    depth: 6.0, weight: 18.2, diameter: 42.0,
    description: "Vollständig erhaltene Aucissa-Fibel aus Bronze. Der Bügel ist leicht gewölbt und trägt eine umlaufende Rippenzier. Das Scharnier mit Nadelrast ist noch funktionsfähig. Patina olivgrün, stellenweise bräunlich.",
    description_front: "Halbkreisförmiger Bügel mit zentraler Rippe, Inschrift \"AVCISSA\" schwach lesbar.",
    description_back: "Nadelrast und Spiralmechanismus vollständig erhalten, leichte Korrosion an der Spirale.",
    tags: ["Fibel", "Römerzeit"],
    foundAt: new Date("2025-04-12"),
  },
  {
    name: "Mittelalterlicher Fingerring",
    latitude: 50.9278, longitude: 11.5891,
    status: "COMPLETED", reported: false,
    dating: "13.–14. Jh.", dating_from: 1200, dating_to: 1399,
    depth: 4.0, weight: 6.8, diameter: 19.0,
    description: "Schlichter Goldring mit ovalem Wulst. Innen glatt, außen mit feiner Punzierung. Ringweite entspricht etwa Größe 54. Keine Inschrift erkennbar, möglicherweise als Ehering getragen.",
    description_front: "Ovaler, glatter Reif aus Goldlegierung mit leicht abgeplatteter Außenfläche.",
    description_back: "Innenfläche poliert, keine Gravur. Minimale Gebrauchsspuren.",
    tags: ["Ring", "Mittelalter"],
    foundAt: new Date("2025-06-03"),
  },
  {
    name: "Preußischer Uniformknopf (Landwehr)",
    latitude: 52.3745, longitude: 13.1092,
    status: "COMPLETED", reported: true,
    dating: "1813–1866", dating_from: 1813, dating_to: 1866,
    depth: 5.0, weight: 4.5, diameter: 24.0,
    description: "Messingknopf der preußischen Landwehr mit geprägtem Adler und Umschrift. Auf der Rückseite Herstellerstempel \"WILH. SCHÜLER / BERLIN\". Sehr guter Erhaltungszustand, Vergoldungsreste sichtbar.",
    description_front: "Vorderseite: Preußischer Adler mit Landwehrkreuz auf der Brust, Umschrift \"MIT GOTT FÜR KÖNIG UND VATERLAND\".",
    description_back: "Öse intakt, Herstellerstempel \"WILH. SCHÜLER / BERLIN\" gut lesbar.",
    tags: ["Uniformknopf"],
    foundAt: new Date("2024-10-19"),
  },
  {
    name: "Eiserne Pfeilspitze",
    latitude: 51.8432, longitude: 12.6701,
    status: "COMPLETED", reported: false,
    dating: "Hochmittelalter", dating_from: 1000, dating_to: 1300,
    depth: 22.0, weight: 38.0,
    description: "Dreiflügelige Pfeilspitze aus Eisen, stark korrodiert. Tülle teilweise erhalten, Schaft fehlt. Typ entspricht mittelalterlichen Armbrustbolzen. Fundtiefe ungewöhnlich hoch – möglicherweise durch Pflugschicht verlagert.",
    tags: ["Mittelalter"],
    foundAt: new Date("2025-02-08"),
  },
  {
    name: "Bronzeanhänger mit Eberkopf",
    latitude: 48.2134, longitude: 11.7823,
    status: "COMPLETED", reported: false,
    dating: "1.–3. Jh. n. Chr.", dating_from: 1, dating_to: 300,
    depth: 9.0, weight: 12.4, diameter: 31.0,
    description: "Zoomorpher Anhänger in Form eines stilisierten Eberkopfes. Gussnaht sichtbar, Augen ursprünglich wohl mit Emaille eingelegt (Vertiefungen vorhanden). Öse oben zum Aufhängen. Verbreitet als Amuletttyp in der römischen Kaiserzeit.",
    description_front: "Eberkopf von vorn, markante Hauerzähne, Rillen zur Andeutung des Fells.",
    description_back: "Öse intakt, Gussnaht auf Mittelachse, Rückseite flach und undekoriert.",
    tags: ["Anhänger", "Antike"],
    foundAt: new Date("2024-07-27"),
  },
  {
    name: "Sächsischer Silbergroschen (1697)",
    latitude: 51.0504, longitude: 13.7373,
    status: "COMPLETED", reported: true,
    dating: "1697", dating_from: 1697, dating_to: 1697,
    depth: 13.0, weight: 3.2, diameter: 27.0,
    description: "Silbergroschen Kurfürst Friedrich August I. (der Starke), Jahrgang 1697. Münzstätte Dresden (Münzzeichen ILH). Vorderseite: Geharnischtes Brustbild mit Lorbeerkranz nach rechts. Rückseite: Kursächsisches Wappen im Barockrahmen. Erhaltung: ss (sehr schön).",
    description_front: "Geharnischtes Brustbild Friedrich Augusts I. nach rechts, Umschrift: \"FRID·AUG·D·G·DUX·SAX·\".",
    description_back: "Kursächsisches Vollwappen, Umschrift: \"ILH·ANNO·1697\", Wert \"1 GROS\" im Abschnitt.",
    tags: ["Frühe Neuzeit"],
    foundAt: new Date("2025-01-15"),
  },
  {
    name: "Gotischer Schlüssel",
    latitude: 51.9862, longitude: 14.1234,
    status: "DRAFT", reported: false,
    dating: "15.–16. Jh.", dating_from: 1400, dating_to: 1599,
    depth: 19.0, weight: 41.0,
    description: "Eisenschlüssel mit kleeblattförmigem Griffring und einfachem Bart. Gesamtlänge ca. 9 cm. Schaft gerade, rund. Bart einseitig, L-förmig. Stark von Rost befallen, Bart jedoch erkennbar. Ob der Schlüssel zu einer bekannten Schlosskonstruktion passt, ist noch zu prüfen.",
    tags: ["Schlüssel", "Mittelalter"],
    foundAt: new Date("2024-11-30"),
  },
  {
    name: "Blaue Glasperle (Merowingerzeit)",
    latitude: 51.4821, longitude: 11.9634,
    status: "COMPLETED", reported: false,
    dating: "6.–7. Jh. n. Chr.", dating_from: 500, dating_to: 700,
    depth: 3.0, weight: 2.1, diameter: 11.0,
    description: "Opake blaue Glasperle, gedrückt-kugelförmig. Lochkanal intakt, Wandstärke gleichmäßig. Oberfläche glatt, leichte Irisierung durch Verwitterung. Typ verbreitet in merowingerzeitlichen Frauengräbern als Halsschmuck.",
    tags: ["Glasperle"],
    foundAt: new Date("2025-05-22"),
  },
  {
    name: "Bleibulle mit Stempeldruck",
    latitude: 51.6123, longitude: 12.8934,
    status: "DRAFT", reported: false,
    dating: "Mittelalter–Frühe Neuzeit", dating_from: 1100, dating_to: 1600,
    depth: 7.0, weight: 15.3, diameter: 22.0,
    description: "Runde Bleibulle, beidseitig gestempelt. Durchmesser ca. 22 mm. Beide Seiten zeigen kreisförmige Stempelabdrücke, die Details sind durch Korrosion schwer lesbar. Möglicherweise Handelsplombe oder Tuchsiegel. Weitere Untersuchung erforderlich.",
    tags: ["Blei"],
    foundAt: new Date("2024-09-14"),
  },
  {
    name: "Gürtelschnalle mit Tierkopfenden",
    latitude: 50.7823, longitude: 10.9134,
    status: "COMPLETED", reported: false,
    dating: "17.–18. Jh.", dating_from: 1600, dating_to: 1800,
    depth: 11.0, weight: 28.7, diameter: 47.0,
    description: "Ovale Gürtelschnalle aus Bronze mit plastischen Tierkopfenden (stilisierte Drachenköpfe) am Rahmen. Dorn vollständig erhalten. Auf der Rückseite Reste einer Eisenspange zur Lederbefestigung. Typisches Exemplar aus der Frühen Neuzeit, verbreitet im mitteleuropäischen Raum.",
    description_front: "Ovaler Rahmen mit zwei stilisierten Drachenköpfen an den Seiten, Dorn zentral.",
    description_back: "Reste der Eisenspange für Ledergurt, Korrosionsspuren.",
    tags: ["Gürtelschnalle", "Frühe Neuzeit"],
    foundAt: new Date("2025-03-07"),
  },
  {
    name: "Keltische Silbermünze (Büschelquinar)",
    latitude: 48.5231, longitude: 12.1582,
    status: "COMPLETED", reported: true,
    dating: "2.–1. Jh. v. Chr.", dating_from: -200, dating_to: -50,
    depth: 16.0, weight: 1.8, diameter: 14.0,
    description: "Kleiner Silberquinar des keltischen Typs \"Büschelquinar\". Vorderseite: abstraktes Kopfbild, büschelartige Haarlinie. Rückseite: Pferd nach rechts springend, darunter Torques. Gewicht 1,8 g entspricht dem normalen Typ. Selten und gut erhalten für diesen Fundtyp.",
    description_front: "Abstraktes Kopfbild mit büschelartigem Haar, teilweise dezentriert geprägt.",
    description_back: "Springendes Pferd nach rechts, darunter Torques-Symbol, Punzen im Hintergrund.",
    tags: ["Antike"],
    foundAt: new Date("2024-08-11"),
  },
];

// ---------------------------------------------------------------------------
// Sample Cloudinary public IDs (built-in demo assets in every Cloudinary account)
// ---------------------------------------------------------------------------

const SAMPLE_PUBLIC_IDS = [
  "cld-sample",
  "cld-sample-2",
  "cld-sample-3",
  "cld-sample-4",
  "cld-sample-5",
];

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

const ZONES = [
  {
    name: "Äcker Norden",
    description: "Ackerfläche nördlich des Ortes, Genehmigung liegt vor.",
    geoJson: JSON.stringify({
      type: "Polygon",
      coordinates: [[[12.35, 51.37], [12.42, 51.37], [12.42, 51.41], [12.35, 51.41], [12.35, 51.37]]],
    }),
  },
  {
    name: "Waldrand Süd",
    description: "Streifen am Waldrand, max. 50 m ins Feld.",
    geoJson: JSON.stringify({
      type: "Polygon",
      coordinates: [[[13.70, 51.02], [13.78, 51.02], [13.78, 51.07], [13.70, 51.07], [13.70, 51.02]]],
    }),
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Starting seed …");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Users
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@detektorhub.de" },
    update: {},
    create: { email: "demo@detektorhub.de", name: "Max Sondler", password: passwordHash, role: "USER" },
  });

  const jonasUser = await prisma.user.upsert({
    where: { email: "jonas.a.schmidt@gmail.com" },
    update: { role: "ADMIN" },
    create: { email: "jonas.a.schmidt@gmail.com", name: "JonasASchmidt", password: passwordHash, role: "ADMIN" },
  });

  const roschlUser = await prisma.user.upsert({
    where: { email: "roschl@detektorhub.de" },
    update: { role: "ADMIN" },
    create: { email: "roschl@detektorhub.de", name: "Roschl", password: passwordHash, role: "ADMIN" },
  });

  console.log(`  ✓ Users: ${demoUser.email}, ${jonasUser.email}, ${roschlUser.email}`);

  // 2. Tag categories + tags
  const tagMap: Record<string, string> = {};

  for (const cat of CATEGORIES) {
    const category = await prisma.tagCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });

    for (const t of cat.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: t.name },
        update: {},
        create: { name: t.name, color: t.color, icon: t.icon, categoryId: category.id },
      });
      tagMap[t.name] = tag.id;
    }
  }
  console.log(`  ✓ ${CATEGORIES.length} Kategorien, ${Object.keys(tagMap).length} Tags`);

  // 3. Detectors
  const detectorMap: Record<string, string> = {};
  for (const d of DETECTORS) {
    const existing = await prisma.detector.findFirst({ where: { name: d.name, company: d.company } });
    const detector = existing ?? await prisma.detector.create({ data: d });
    detectorMap[d.name] = detector.id;
  }
  console.log(`  ✓ ${DETECTORS.length} Detektoren`);

  // 4. Zones (for demo user)
  const zoneIds: string[] = [];
  for (const z of ZONES) {
    await prisma.zone.deleteMany({ where: { name: z.name, userId: demoUser.id } });
    const zone = await prisma.zone.create({
      data: { name: z.name, description: z.description, userId: demoUser.id },
    });
    await prisma.$executeRaw`UPDATE "Zone" SET geometry = ST_GeomFromGeoJSON(${z.geoJson}) WHERE id = ${zone.id}`;
    zoneIds.push(zone.id);
  }
  console.log(`  ✓ ${ZONES.length} Zonen`);

  // 5. Field sessions (for demo user)
  const equinoxId = detectorMap["Equinox 800"];
  await prisma.fieldSession.deleteMany({ where: { userId: demoUser.id } });

  const session1 = await prisma.fieldSession.create({
    data: { name: "Frühjahrsbegehung Nordfeld", description: "Erste Begehung nach der Schneeschmelze. Boden noch leicht feucht.", namingScheme: "{date}-Nordfeld-{n:03}", dateFrom: new Date("2025-03-15"), dateTo: new Date("2025-03-15"), userId: demoUser.id, zoneId: zoneIds[0], detectorId: equinoxId },
  });
  const session2 = await prisma.fieldSession.create({
    data: { name: "Herbstbegehung Waldrand", description: "Gute Bedingungen nach dem Regen, Boden locker.", namingScheme: "Waldrand-{n:03}", dateFrom: new Date("2024-10-20"), dateTo: new Date("2024-10-21"), userId: demoUser.id, zoneId: zoneIds[1], detectorId: detectorMap["Deus II"] },
  });
  const session3 = await prisma.fieldSession.create({
    data: { name: "Spontanbegehung Stoppelfeld", description: "Kurzfristige Erlaubnis erhalten, 3 Stunden.", dateFrom: new Date("2025-01-08"), userId: demoUser.id, detectorId: equinoxId },
  });
  console.log("  ✓ 3 Begehungen");

  // 6. Demo user findings (delete comments first — no cascade on finding)
  await prisma.comment.deleteMany({ where: { finding: { userId: demoUser.id } } });
  await prisma.comment.deleteMany({ where: { finding: { userId: jonasUser.id } } });
  await prisma.image.deleteMany({ where: { userId: demoUser.id } });
  await prisma.image.deleteMany({ where: { userId: jonasUser.id } });
  await prisma.finding.deleteMany({ where: { userId: demoUser.id } });

  const sessionAssignment = [
    session1.id, session1.id, session1.id, session1.id,
    session2.id, session2.id, session2.id, session2.id,
    session3.id, session3.id,
    null, null, null, null, null,
  ];

  for (let i = 0; i < DEMO_FINDINGS.length; i++) {
    const f = DEMO_FINDINGS[i];
    const tagIds = f.tags.map((name) => tagMap[name]).filter(Boolean);
    const finding = await prisma.finding.create({
      data: {
        name: f.name, latitude: f.latitude, longitude: f.longitude,
        status: f.status, reported: f.reported,
        dating: f.dating, dating_from: f.dating_from, dating_to: f.dating_to,
        depth: f.depth, weight: f.weight, description: f.description,
        foundAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
        userId: demoUser.id,
        fieldSessionId: sessionAssignment[i] ?? null,
        tags: tagIds.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      },
    });
    const image = await prisma.image.create({
      data: {
        publicId: SAMPLE_PUBLIC_IDS[i % SAMPLE_PUBLIC_IDS.length],
        userId: demoUser.id,
        findingId: finding.id,
        title: f.name,
      },
    });
    await prisma.finding.update({ where: { id: finding.id }, data: { thumbnailId: image.id } });
  }
  console.log(`  ✓ ${DEMO_FINDINGS.length} Demo-Funde (Max Sondler)`);

  // 7. Jonas user findings
  // (comments and images already deleted above)
  await prisma.finding.deleteMany({ where: { userId: jonasUser.id } });

  for (let i = 0; i < JONAS_FINDINGS.length; i++) {
    const f = JONAS_FINDINGS[i];
    const tagIds = f.tags.map((name) => tagMap[name]).filter(Boolean);
    const finding = await prisma.finding.create({
      data: {
        name: f.name, latitude: f.latitude, longitude: f.longitude,
        status: f.status, reported: f.reported,
        dating: f.dating, dating_from: f.dating_from, dating_to: f.dating_to,
        depth: f.depth, weight: f.weight, diameter: f.diameter,
        description: f.description,
        description_front: f.description_front ?? null,
        description_back: f.description_back ?? null,
        foundAt: f.foundAt,
        userId: jonasUser.id,
        tags: tagIds.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      },
    });
    const image = await prisma.image.create({
      data: {
        publicId: SAMPLE_PUBLIC_IDS[i % SAMPLE_PUBLIC_IDS.length],
        userId: jonasUser.id,
        findingId: finding.id,
        title: f.name,
      },
    });
    await prisma.finding.update({ where: { id: finding.id }, data: { thumbnailId: image.id } });
  }
  console.log(`  ✓ ${JONAS_FINDINGS.length} Funde (Jonas)`);

  // 8. Comments on completed findings
  const commentSeeds: { findingName: string; authorEmail: string; text: string }[] = [
    {
      findingName: "Aucissa-Fibel aus Bronze",
      authorEmail: "demo@detektorhub.de",
      text: "Sehr schöner Fund! Die Inschrift \"AVCISSA\" deutet auf eine gallische Werkstatt hin. Ich habe ein fast identisches Stück aus der Gegend um Trier – gleiche Rippenzier am Bügel.",
    },
    {
      findingName: "Aucissa-Fibel aus Bronze",
      authorEmail: "demo@detektorhub.de",
      text: "Das Scharniersystem ist bei diesem Typ ungewöhnlich gut erhalten. Hast du die Fundtiefe notiert? Bei meinem Exemplar lag sie bei nur 4 cm.",
    },
    {
      findingName: "Mittelalterlicher Fingerring",
      authorEmail: "demo@detektorhub.de",
      text: "Der Wulst erinnert mich an Ringe aus dem Rheinland, 13. Jh. – könnte ein Händlerring sein. Lohnt sich eine Materialanalyse, um den Goldgehalt zu bestimmen.",
    },
    {
      findingName: "Keltische Silbermünze (Büschelquinar)",
      authorEmail: "demo@detektorhub.de",
      text: "Büschelquinare aus diesem Raum sind selten. Hast du den Fund schon dem LDA gemeldet? Wäre interessant für die Verbreitungskarte.",
    },
    {
      findingName: "Sächsischer Silbergroschen (1697)",
      authorEmail: "demo@detektorhub.de",
      text: "ILH steht für Johann Lorenz Holländer, Münzwardein in Dresden. Der Jahrgang 1697 ist weniger häufig als 1693–1695. Schöner Erhaltungszustand!",
    },
    {
      findingName: "Denar des Marc Aurel",
      authorEmail: "jonas.a.schmidt@gmail.com",
      text: "Toller Fund! Die Victoriamotiv-Rückseite ist typisch für die frühen Jahre Marc Aurels. Wo genau hast du den Denar gefunden – Acker oder Waldrand?",
    },
    {
      findingName: "Bronzefibel",
      authorEmail: "jonas.a.schmidt@gmail.com",
      text: "Kniefibeln mit Emaileinlage kommen in Sachsen öfter vor, meistens aus dem 2. Jh. Die Grünpatina sieht sehr stabil aus – gut für die Langzeitlagerung.",
    },
    {
      findingName: "Uniformknopf Preußen",
      authorEmail: "jonas.a.schmidt@gmail.com",
      text: "Preußische Landwehrknöpfe – immer ein schöner Fund. Ich habe eine Sammlung davon, aber das Vergoldungsreste sind bei meinen Exemplaren meist stärker abgerieben.",
    },
    {
      findingName: "Frühmittelalterliche Gürtelschnalle",
      authorEmail: "jonas.a.schmidt@gmail.com",
      text: "Merowingische Schnallen mit Dornbeschlag sind selten in gutem Zustand. Wurde der Fund dem zuständigen Landesamt gemeldet? Das wäre meldepflichtig.",
    },
    {
      findingName: "Bleigewicht",
      authorEmail: "jonas.a.schmidt@gmail.com",
      text: "Konische Bleigewichte dieses Typs werden oft als Fischernetzsenkbleie oder Waaggewichte interpretiert. Das Gewicht von 120 g passt gut zu einem Handelsgewicht.",
    },
  ];

  let commentCount = 0;
  for (const cs of commentSeeds) {
    const author = await prisma.user.findUnique({ where: { email: cs.authorEmail }, select: { id: true } });
    const finding = await prisma.finding.findFirst({ where: { name: cs.findingName }, select: { id: true } });
    if (author && finding) {
      await prisma.comment.create({
        data: { userId: author.id, findingId: finding.id, text: cs.text },
      });
      commentCount++;
    }
  }
  console.log(`  ✓ ${commentCount} Kommentare`);

  await prisma.user.updateMany({
    where: { email: { in: ["jonas.a.schmidt@gmail.com", "roschl@detektorhub.de"] } },
    data: { role: "ADMIN" },
  });

  console.log("\n✅ Seed abgeschlossen!");
  console.log("   demo@detektorhub.de  / password123  (Max Sondler)");
  console.log("   jonas.a.schmidt@gmail.com / password123  (Jonas, ADMIN)");
  console.log("   roschl@detektorhub.de / password123  (Roschl, ADMIN)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
