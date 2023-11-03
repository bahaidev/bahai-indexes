import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import {getDomForFile} from './utils/getDom.js';
import writeJSON from './utils/writeJSON.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const {$$, XMLSerializer, Node, document} = await getDomForFile(
  join(__dirname, '/../../indexes/html/Some Answered Questions.html')
);

const jsonIndex = {};

/**
 * @param {Node[]} base
 * @param {JSON} target
 * @throws {Error}
 * @returns {string}
 */
function processTextAndLinks (base, target) {
  let $text, links;

  // Has links
  ({groups: {$text, links}} =
    (/(?<$text>^.*?)(?:, (?<links>[\divx][\divx,.n -]*))$/u).exec(base[0].nodeValue) || {groups: {}});

  if (!$text) {
    // See
    ({groups: {
      $text, links
    }} = (/(?<$text>^.*?)(?:\.[ ]*)$/u).exec(base[0].nodeValue) || {groups: {}});

    // Children only
    if (!$text) {
      ({groups: {
        $text, links
      }} = (/(?<$text>^[\w()</> ,]+?)$/u).exec(base[0].nodeValue) || {groups: {}});
    }
  }

  if (!$text) {
    console.log('Missing', JSON.stringify(base[0].nodeValue));
    throw new Error('Missing $text');
  }

  /** @type {string|[string, string]} */
  let $links;
  if (links) {
    const l = links.split(', ').map((link) => {
      return link.replace(/\.+?\s*$/u, '').trim();
    });
    const decimal = /^(?<chapter>\d+)(?:\.(?<par>\d+)(?:n\d+)?(?:-\d+)?)?$/u;
    const badLink = l.find((link) => {
      return !decimal.test(link) &&
        !(/[ivx]+/u).test(link);
    });
    if (badLink) {
      console.log('Number', JSON.stringify(badLink));
      throw new Error('Number in bad format');
    }

    $links = l.map((link) => {
      if (link.includes('-')) {
        const linkRange = link.split('-');

        if (link.includes('.')) {
          const {chapter, par} = linkRange[0].match(decimal).groups;
          linkRange[1] = `${chapter}.${
            (linkRange[1].length < par.length
              ? par.slice(0, -1)
              : '') +
            linkRange[1]
          }`;
        }
        return linkRange;
      }
      return link;
    });
    // console.log('l', l);
  }

  const text = $text.trim();

  target[text] = {
    $text: text
  };
  if ($links) {
    target[text].$links = $links;
  }

  return text;
}

/**
 * @param {Node[]} base
 * @param {string} text
 * @throws {Error}
 * @returns {void}
 */
function processSeeAlso (base, text) {
  if (base[1] && base[1].tagName === 'I') {
    const txt = base[1].textContent.trim();
    if (!['See', 'See also', 'See also under'].includes(txt)) {
      throw new Error('Unexpected element');
    }
    if (base.length >= 4) {
      if (!jsonIndex[text].$seeAlso) {
        jsonIndex[text].$seeAlso = [];
      }
      // console.log('111', serializeChunk(base));
      jsonIndex[text].$seeAlso.push(
        ...base[2].nodeValue.trim().replace(/;\s*$/u, '').split('; ').map((id) => {
          return {id};
        })
      );
      if (base[3].textContent.trim() === 'and under') {
        jsonIndex[text].$seeAlso.push({
          // No semi-colon-separated processing needed here
          id: base[4].nodeValue.trim(),
          headings: true
        });
      } else {
        jsonIndex[text].$seeAlso.push({
          id: base[3].outerHTML
        });
      }
    } else {
      if (!jsonIndex[text].$seeAlso) {
        jsonIndex[text].$seeAlso = [];
      }
      jsonIndex[text].$seeAlso.push(
        ...base[2].nodeValue.trim().split('; ').map((id) => {
          const obj = {id};
          if (txt === 'See also under') {
            obj.headings = true;
          }
          return obj;
        })
      );
    }
  }
}

/**
 * @param {Node[]} chnk
 * @returns {string[]}
 */
function serializeChunk (chnk) {
  return chnk.map((node) => {
    return (node.nodeType === Node.TEXT_NODE
      ? ''
      : `TYPEEEEE(${node.nodeType}):`) +
      new XMLSerializer().serializeToString(node);
  });
}

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

  const base = chunks[0];

  // Italicized foreign words and book titles
  if (base[0].nodeType === Node.ELEMENT_NODE) {
    const tmp = base[0].outerHTML;
    base.shift();
    if (base[0]) {
      base[0].nodeValue = tmp + base[0].nodeValue;
    } else {
      base.push(document.createTextNode(tmp));
    }
  }

  const text = processTextAndLinks(base, jsonIndex);

  if (chunks.length > 1) {
    // Strip initial line breaks
    for (let i = 1; i < chunks.length; i++) {
      if (chunks[i][0].nodeType === Node.TEXT_NODE) {
        if (chunks[i][0].nodeValue === '\n') {
          chunks[i].shift();
        } else {
          chunks[i][0] = document.createTextNode(
            chunks[i][0].nodeValue.replace(/^\n/u, '')
          );
        }
      }
    }
  }

  processSeeAlso(base, text);

  // console.log('===', p.innerHTML);

  // SeeAlso within children section
  // Only really need i === 1, but doing for sanity checking
  for (let i = 1; i < chunks.length; i++) {
    for (let j = 0; j < chunks[i].length; j++) {
      if (chunks[i][j].nodeType === Node.ELEMENT_NODE) {
        processSeeAlso([undefined, ...chunks[i]], text);
        chunks.splice(i, 1);
        i--;
        break;
      }
    }
  }

  // Plain text children
  let lastChildText, lastChildTarget;
  for (let i = 1; i < chunks.length; i++) {
    // Process differently if begins with `\t` (only one level
    //   of nesting exists)
    // Only happens to have one-item arrays now
    console.log('chunks', serializeChunk(chunks[i]));

    const child = chunks[i][0].nodeValue;

    if (!jsonIndex[text].$children) {
      jsonIndex[text].$children = {};
    }

    const childObj = jsonIndex[text].$children;

    if (child.startsWith('\t')) {
      if (!lastChildTarget[lastChildText].$children) {
        lastChildTarget[lastChildText].$children = {};
      }
      processTextAndLinks(chunks[i], lastChildTarget[lastChildText].$children);
    } else {
      lastChildText = processTextAndLinks(chunks[i], childObj);
      lastChildTarget = childObj;
    }
  }
});

const writePath = join(
  __dirname, '/../../indexes/json/books/Some Answered Questions.json'
);
await writeJSON(writePath, jsonIndex);
console.log(`Wrote to ${writePath}`);
