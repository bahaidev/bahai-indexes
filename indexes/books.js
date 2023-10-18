import {readFile, readdir} from 'fs/promises';
import writeJSON from '../parsers/html/utils/writeJSON.js';

const books = await readdir('./indexes/json/books');

const compositeJson = await Promise.all(books.map(async (fileName) => {
  return {
    book: fileName.replace(/\.json$/gu, ''),
    index: JSON.parse(
      await readFile(
        new URL(`json/books/${fileName}`, import.meta.url)
      )
    )
  };
}));

await writeJSON(
  './indexes/json/books.json', compositeJson
);

// eslint-disable-next-line no-console -- CLI
console.log('Complete!');
