import {readFile, writeFile, readdir} from 'fs/promises';

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

await writeFile(
  './indexes/json/books.json', JSON.stringify(compositeJson, null, 2) + '\n'
);

// eslint-disable-next-line no-console -- CLI
console.log('Complete!');
