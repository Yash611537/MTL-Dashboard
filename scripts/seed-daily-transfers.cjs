/**
 * Seeds the Daily-Transfer-Data Firestore collection from the provided CSV.
 *
 * Usage (from project root):
 *   export FIREBASE_CREDENTIALS_PATH=./mytronlabs-firebase-adminsdk-fbsvc-541fb29dae.json
 *   node scripts/seed-daily-transfers.cjs
 *
 * Or rely on .env line FIREBASE_CREDENTIALS_PATH (loaded below if dotenv exists).
 */

const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = /^([^#=]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile();

const admin = require("firebase-admin");

const CSV = `Date on the packet,DATE OF TRANSFER,FACTORY NAME,WEIGHT IN GRAM,NO. OF SD CARDS,AVERAGE USABLE HOURS - MTL,AVERAGE USABLE HOURS - CLIENT,DEVICES TAKEN FROM OFFICE,DEVICES DEPLOYED IN FACTORY,HEADSET MISSING,MISSING SD CARDS OUT OF DDIF,Empty SD Cards
25/03/2026,26/03/2026,RA FASHIONS UNIT-1,,226,3.4h,1018.1,239,228,,2,
25/03/2026,30/03/2026,PRABANZAN INDUSTRIES,,,,,,,,,
26/03/2026,27/03/2026,PRABANZAN INDUSTRIES,,107,,,135,112,,5,
26/03/2026,27/03/2026,HINDUPUR,,106,,197.93,225,108,,,
26/03/2026,27/03/2026,RA FASHIONS,,215,,,225,220,1,5,
27/03/2026,28/03/2026,RA FASHIONS,,,123,,224,215,,,
28/03/2026,30/03/2026,RA APPARELS,,,,,225,204,,,
28/03/2026,,SURAT,45,,,,,,,,
30/03/2026,31/03/2026,RA FASHIONS UNIT-2,20,80,4.3h,,90,80,,3,
30/03/2026,,RA FASHIONS UNIT-1,51,200,,,225,205,,5,
30/03/2026,31/03/2026,DJY TEXTILES,22,86,,,106,89,1,3,
31/03/2026,,RA FASHIONS UNIT-2,18,67,,,90,71,,4,
31/03/2026,01/04/2026,RA FASHIONS UNIT-1,54,206,3.268300971,,225,207,,1,17
01/03/2026,,SMS Creation,28,Approx 100,,,100,84,,3,
02/03/2026,,,54,"200 [PORTER]",,,,,,,
03/03/2026,,,154,600,,,185,,,,`;

function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      result.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

function dmyToIso(s) {
  const t = (s ?? "").trim();
  if (!t) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function parseIntOpt(s) {
  const t = (s ?? "").trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function parseFloatOpt(s) {
  const t = (s ?? "").trim();
  if (!t) return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function parseNoSd(s) {
  const t = (s ?? "").trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  return t;
}

function rowToDoc(cols) {
  return {
    date_on_packet: dmyToIso(cols[0]),
    date_of_transfer: dmyToIso(cols[1]),
    factory_name: (cols[2] ?? "").trim() || null,
    weight_in_gram: parseIntOpt(cols[3]),
    no_of_sd_cards: parseNoSd(cols[4]),
    average_usable_hours_mtl: (cols[5] ?? "").trim() || null,
    average_usable_hours_client: parseFloatOpt(cols[6]),
    devices_taken_from_office: parseIntOpt(cols[7]),
    devices_deployed_in_factory: parseIntOpt(cols[8]),
    headset_missing: parseIntOpt(cols[9]),
    missing_sd_cards_out_of_ddif: parseIntOpt(cols[10]),
    empty_sd_cards: parseIntOpt(cols[11]),
  };
}

async function main() {
  const credPath =
    process.env.FIREBASE_CREDENTIALS_PATH ||
    path.join(process.cwd(), "mytronlabs-firebase-adminsdk-fbsvc-541fb29dae.json");

  if (!fs.existsSync(credPath)) {
    console.error("Missing service account JSON. Set FIREBASE_CREDENTIALS_PATH or place the file at:");
    console.error(credPath);
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(credPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(sa),
    });
  }

  const db = admin.firestore();
  const collectionName =
    process.env.NEXT_PUBLIC_FIRESTORE_DAILY_TRANSFERS_COLLECTION || "Daily-Transfer-Data";
  const ref = db.collection(collectionName);

  const lines = CSV.split(/\r?\n/).filter((l) => l.length > 0);
  const dataLines = lines.slice(1);

  let added = 0;
  for (const line of dataLines) {
    const cols = parseCSVLine(line);
    while (cols.length < 12) cols.push("");
    const doc = rowToDoc(cols);
    await ref.add(doc);
    added += 1;
    console.log("Added:", doc.factory_name ?? "(no factory)", doc.date_on_packet);
  }

  console.log(`\nDone. Wrote ${added} documents to "${collectionName}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
