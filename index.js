// Entry point for deployment
process.env.NODE_ENV = "production";

// Import the server
import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files
const publicDir = join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Import and start the main server
await import("./server/index.ts");