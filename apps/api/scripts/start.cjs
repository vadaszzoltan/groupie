const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const candidatePaths = [
  'dist/main.js',
  'dist/src/main.js',
  'dist/apps/api/main.js',
  'dist/apps/api/src/main.js',
];

const entry = candidatePaths
  .map((relativePath) => resolve(__dirname, '..', relativePath))
  .find((absolutePath) => existsSync(absolutePath));

if (!entry) {
  console.error('Could not find a built API entrypoint. Checked:');
  for (const relativePath of candidatePaths) {
    console.error(`- ${relativePath}`);
  }
  process.exit(1);
}

const result = spawnSync(process.execPath, [entry], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
