// Leonida Press — the hand-in program for gta6-cover-art-01 (Node 22, stdlib only).
//
// What it does, in one breath: it takes the app this repository built — the
// static files under app/, the screenshots under screenshots/ — and lays them
// out in the grader's output folder, then asks the vendored make.fun library
// to write the dossier.json the judge reads from those exact files.
//
// Run it outside the grader like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader MAKEFUN_OUTPUT_DIR is unset and the folder is /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is wherever this file lives.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(destination, { recursive: true });
cpSync(join(repoRoot, 'app'), join(destination, 'app'), { recursive: true });
mkdirSync(join(destination, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(destination, 'screenshots'), { recursive: true });
}

// The caps below mirror the gate's own limits, so a hand-in this program
// produces can only be refused by the gate for something the gate itself
// measures differently — never for a file this program let through that the
// gate forbids (too many screenshots, one too big, app/ too large, and so on).
// Only text_max_bytes shapes the dossier's bytes; the rest are guard rails.
writeFileSync(
  join(destination, 'dossier.json'),
  buildDossier(destination, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
