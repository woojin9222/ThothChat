import { build } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Build frontend
console.log('Building frontend...');
await build();

// Build backend
console.log('Building backend...');
execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

// Copy shared folder to dist
console.log('Copying shared files...');
if (fs.existsSync('shared')) {
  fs.cpSync('shared', 'dist/shared', { recursive: true });
}

console.log('Build complete!');