import {readFile, writeFile} from 'fs/promises';

const book = process.argv[2];

const path = `./indexes/json/books/${book}.json`;

const bookJSON = JSON.parse(await readFile(path));

Object.entries(bookJSON).forEach(([, value]) => {
  value.$book = book;
});

await writeFile(path, JSON.stringify(bookJSON, (k, v) => {
  if (typeof v === 'number') {
    return String(v);
  }
  return v;
}, 2));
