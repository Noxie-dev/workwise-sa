import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();

function fail(message) {
  console.error(`check failed: ${message}`);
  process.exit(1);
}

function assertExists(relativePath, description) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`missing ${description} at ${relativePath}`);
  }
}

function assertNotExists(relativePath, description) {
  const fullPath = path.join(rootDir, relativePath);
  if (fs.existsSync(fullPath)) {
    fail(`unexpected ${description} at ${relativePath}`);
  }
}

async function main() {
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  if (typeof packageJson.packageManager !== "string" || !packageJson.packageManager.startsWith("pnpm@")) {
    fail("package.json must declare pnpm as the package manager");
  }

  assertExists("pnpm-lock.yaml", "pnpm lockfile");
  assertNotExists("package-lock.json", "root npm lockfile");
  assertExists("eslint.config.js", "ESLint flat config");

  try {
    await import(path.join(rootDir, "eslint.config.js"));
  } catch (error) {
    fail(
      `eslint.config.js could not be loaded: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }

  console.log("check passed");
}

main();
