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
// Findings — scattered across central Germany
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
  tags: string[]; // tag names
}

const FINDINGS: FindingSeed[] = [
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
    status: "DRAFT", reported: false,
    dating: "Unbekannt", dating_from: 1000, dating_to: 2000,
    depth: 5, weight: 120,
    description: "Konisches Bleigewicht, Zweck unklar.",
    tags: ["Blei"],
  },
  {
    name: "Terra-Sigillata-Fragment",
    latitude: 51.60, longitude: 12.89,
    status: "DRAFT", reported: false,
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
// Zones (GeoJSON polygons, simple rectangles around session areas)
// ---------------------------------------------------------------------------

const ZONES = [
  {
    name: "Äcker Norden",
    description: "Ackerfläche nördlich des Ortes, Genehmigung liegt vor.",
    // Simple polygon around Leipzig north area
    geoJson: JSON.stringify({
      type: "Polygon",
      coordinates: [[
        [12.35, 51.37], [12.42, 51.37], [12.42, 51.41], [12.35, 51.41], [12.35, 51.37],
      ]],
    }),
  },
  {
    name: "Waldrand Süd",
    description: "Streifen am Waldrand, max. 50 m ins Feld.",
    geoJson: JSON.stringify({
      type: "Polygon",
      coordinates: [[
        [13.70, 51.02], [13.78, 51.02], [13.78, 51.07], [13.70, 51.07], [13.70, 51.02],
      ]],
    }),
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Starting seed …");

  // 1. Test user
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@detektorhub.de" },
    update: {},
    create: {
      email: "demo@detektorhub.de",
      name: "Max Sondler",
      password: passwordHash,
      role: "USER",
    },
  });
  console.log(`  ✓ User: ${user.email}`);

  // 2. Tag categories + tags
  const tagMap: Record<string, string> = {}; // tag name → id

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
        create: {
          name: t.name,
          color: t.color,
          icon: t.icon,
          categoryId: category.id,
        },
      });
      tagMap[t.name] = tag.id;
    }
  }
  console.log(`  ✓ ${CATEGORIES.length} Kategorien, ${Object.keys(tagMap).length} Tags`);

  // 3. Detectors
  const detectorMap: Record<string, string> = {};
  for (const d of DETECTORS) {
    const existing = await prisma.detector.findFirst({
      where: { name: d.name, company: d.company },
    });
    const detector = existing ?? await prisma.detector.create({ data: d });
    detectorMap[d.name] = detector.id;
  }
  console.log(`  ✓ ${DETECTORS.length} Detektoren`);

  // 4. Zones (raw SQL for PostGIS geometry)
  const zoneIds: string[] = [];
  for (const z of ZONES) {
    // Upsert-like: delete if exists, then create
    await prisma.zone.deleteMany({ where: { name: z.name, userId: user.id } });
    const zone = await prisma.zone.create({
      data: { name: z.name, description: z.description, userId: user.id },
    });
    await prisma.$executeRaw`
      UPDATE "Zone"
      SET geometry = ST_GeomFromGeoJSON(${z.geoJson})
      WHERE id = ${zone.id}
    `;
    zoneIds.push(zone.id);
  }
  console.log(`  ✓ ${ZONES.length} Zonen`);

  // 5. Field sessions
  const equinoxId = detectorMap["Equinox 800"];

  await prisma.fieldSession.deleteMany({ where: { userId: user.id } });

  const session1 = await prisma.fieldSession.create({
    data: {
      name: "Frühjahrsbegehung Nordfeld",
      description: "Erste Begehung nach der Schneeschmelze. Boden noch leicht feucht.",
      dateFrom: new Date("2025-03-15"),
      dateTo: new Date("2025-03-15"),
      userId: user.id,
      zoneId: zoneIds[0],
      detectorId: equinoxId,
    },
  });

  const session2 = await prisma.fieldSession.create({
    data: {
      name: "Herbstbegehung Waldrand",
      description: "Gute Bedingungen nach dem Regen, Boden locker.",
      dateFrom: new Date("2024-10-20"),
      dateTo: new Date("2024-10-21"),
      userId: user.id,
      zoneId: zoneIds[1],
      detectorId: detectorMap["Deus II"],
    },
  });

  const session3 = await prisma.fieldSession.create({
    data: {
      name: "Spontanbegehung Stoppelfeld",
      description: "Kurzfristige Erlaubnis erhalten, 3 Stunden.",
      dateFrom: new Date("2025-01-08"),
      userId: user.id,
      detectorId: equinoxId,
    },
  });

  console.log("  ✓ 3 Begehungen");

  // 6. Findings
  await prisma.finding.deleteMany({ where: { userId: user.id } });

  const sessionAssignment = [
    session1.id, session1.id, session1.id, session1.id, // first 4 in session1
    session2.id, session2.id, session2.id, session2.id, // next 4 in session2
    session3.id, session3.id,                           // 2 in session3
    null, null, null, null, null,                       // rest unassigned
  ];

  for (let i = 0; i < FINDINGS.length; i++) {
    const f = FINDINGS[i];
    const tagIds = (f.tags ?? [])
      .map((name) => tagMap[name])
      .filter(Boolean);

    await prisma.finding.create({
      data: {
        name: f.name,
        latitude: f.latitude,
        longitude: f.longitude,
        status: f.status,
        reported: f.reported,
        dating: f.dating,
        dating_from: f.dating_from,
        dating_to: f.dating_to,
        depth: f.depth,
        weight: f.weight,
        description: f.description,
        foundAt: new Date(
          Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
        ),
        userId: user.id,
        fieldSessionId: sessionAssignment[i] ?? null,
        tags: tagIds.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      },
    });
  }
  console.log(`  ✓ ${FINDINGS.length} Funde`);

  console.log("\n✅ Seed abgeschlossen!");
  console.log("   Login: demo@detektorhub.de / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
