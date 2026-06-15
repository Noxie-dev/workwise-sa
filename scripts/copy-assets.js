import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const rootDir = process.cwd();
const publicDir = join(rootDir, "public");
const clientPublicDir = join(rootDir, "client", "public");
const sourceImagesDir = join(publicDir, "images");
const targetImagesDir = join(clientPublicDir, "images");

const optionalRootFiles = new Set(["site.webmanifest"]);
const optionalRootExtensions = new Set([".png", ".ico", ".svg"]);

let copiedCount = 0;

function copyEntry(source, target) {
  cpSync(source, target, { recursive: true });
  copiedCount += 1;
}

mkdirSync(clientPublicDir, { recursive: true });
mkdirSync(targetImagesDir, { recursive: true });

if (existsSync(sourceImagesDir)) {
  for (const entry of readdirSync(sourceImagesDir)) {
    if (entry.startsWith(".")) {
      continue;
    }

    copyEntry(join(sourceImagesDir, entry), join(targetImagesDir, entry));
  }
}

if (existsSync(publicDir)) {
  for (const entry of readdirSync(publicDir)) {
    if (entry.startsWith(".")) {
      continue;
    }

    const source = join(publicDir, entry);
    const extension = extname(entry).toLowerCase();

    if (
      statSync(source).isFile() &&
      (optionalRootFiles.has(entry) || optionalRootExtensions.has(extension))
    ) {
      copyEntry(source, join(clientPublicDir, entry));
    }
  }
}

console.log(
  `Copied ${copiedCount} public asset${copiedCount === 1 ? "" : "s"} into client/public.`,
);
