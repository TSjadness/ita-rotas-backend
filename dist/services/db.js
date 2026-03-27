import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../data/db.json');
let writeQueue = Promise.resolve();
export async function readDb() {
    const content = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(content);
}
export async function writeDb(data) {
    writeQueue = writeQueue.then(() => fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8'));
    return writeQueue;
}
export async function updateCollection(key, updater) {
    const db = await readDb();
    db[key] = updater(db[key], db);
    await writeDb(db);
    return db[key];
}
