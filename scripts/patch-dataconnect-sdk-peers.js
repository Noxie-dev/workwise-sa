import fs from "node:fs";
import path from "node:path";

const GENERATED_JS_DIR = path.resolve(process.cwd(), "dataconnect-generated/js");
const FIREBASE_12_RANGE = "^12.0.0";

function patchPeerRange(range) {
  if (!range) return null;
  if (range.includes(FIREBASE_12_RANGE)) return range;
  return `${range} || ${FIREBASE_12_RANGE}`;
}

function patchConnectorPackage(packageJsonPath) {
  const raw = fs.readFileSync(packageJsonPath, "utf8");
  const pkg = JSON.parse(raw);
  const peerDeps = pkg.peerDependencies;

  if (!peerDeps || typeof peerDeps.firebase !== "string") {
    return { changed: false, reason: "no firebase peer dependency" };
  }

  const nextRange = patchPeerRange(peerDeps.firebase);
  if (!nextRange || nextRange === peerDeps.firebase) {
    return { changed: false, reason: "already includes firebase 12" };
  }

  const previousRange = peerDeps.firebase;
  pkg.peerDependencies.firebase = nextRange;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);

  return { changed: true, previousRange, nextRange, name: pkg.name || path.basename(path.dirname(packageJsonPath)) };
}

function main() {
  if (!fs.existsSync(GENERATED_JS_DIR)) {
    console.error(`Missing generated SDK directory: ${GENERATED_JS_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(GENERATED_JS_DIR, { withFileTypes: true });
  let patched = 0;
  let checked = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const packageJsonPath = path.join(GENERATED_JS_DIR, entry.name, "package.json");
    if (!fs.existsSync(packageJsonPath)) continue;

    checked += 1;
    const result = patchConnectorPackage(packageJsonPath);

    if (result.changed) {
      patched += 1;
      console.log(`Patched ${result.name}: firebase peer ${result.previousRange} -> ${result.nextRange}`);
    } else {
      console.log(`Skipped ${entry.name}: ${result.reason}`);
    }
  }

  if (checked === 0) {
    console.error(`No generated connector package.json files found under ${GENERATED_JS_DIR}`);
    process.exit(1);
  }

  console.log(`Checked ${checked} generated connector package(s); patched ${patched}.`);
}

main();
