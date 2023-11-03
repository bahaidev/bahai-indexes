import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import {getDomForFile} from './utils/getDom.js';
import writeJSON from './utils/writeJSON.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const {$$, XMLSerializer, Node} = await getDomForFile(
  join(__dirname, '/../../indexes/html/Some Answered Questions.html')
);

const jsonIndex = {};

$$('span.s1').forEach((span) => {
  span.replaceWith(...span.childNodes);
});

$$('span[class="Apple-tab-span"]').forEach((span) => {
  span.replaceWith(span.textContent);
});

$$('span[class="Apple-converted-space"]').forEach((span) => {
  span.remove();
});

$$('p.p6').forEach((p) => {
  const chunks = [];
  let chunk = [];
  (p.normalize() || p).childNodes.forEach((node, idx, childNodes) => {
    if (node.tagName === 'BR') {
      chunks.push(chunk);
      chunk = [];
      return;
    }

    chunk.push(node);
    if (idx === childNodes.length - 1) {
      chunks.push(chunk);
    }
  });

  const chunkCopy = [...chunks];

  const base = chunks.shift();

  if (base.nodeType === Node.TEXT_NODE) {
    throw new Error('Unexpected initial element');
  }

  // $links (string, [string, string])
  // $seeAlso (id, text, headings)
  // $children
  const {groups: {$text, links}} =
    (/(?<$text>.*?)(?:, (?<links>[\divx][\divx,.n -]*))$/u).exec(base.at().nodeValue) || {groups: {}};

  jsonIndex[$text] = {
    $text
  };

  console.log(
    '===', chunkCopy.map((chnk) => {
      return chnk.map((node) => {
        return (node.nodeType === Node.TEXT_NODE
          ? ''
          : `TYPEEEEE(${node.nodeType}):`) +
          new XMLSerializer().serializeToString(node);
      });
    })
  );
  // console.log('===', p.innerHTML);
});

const writePath = join(
  __dirname, '/../../indexes/json/books/Some Answered Questions.json'
);
await writeJSON(writePath, jsonIndex);
console.log(`Wrote to ${writePath}`);
