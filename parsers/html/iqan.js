import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import {getDomForFile} from './utils/getDom.js';
import writeJSON from './utils/writeJSON.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const {$$, $, Node} = await getDomForFile(
  join(__dirname, '/../../indexes/html/Kitáb-i-Íqán.html')
);

const rootObj = {};
const bElems = $$('p b');

const fromToUnless = function (elem, selector, filter, endFilter) {
  elem = elem.nextElementSibling;

  while (elem) {
    if (elem.matches(selector) && (!filter || filter(elem))) {
      break;
    }

    if (endFilter && elem.matches(endFilter)) {
      break;
    }

    elem = elem.nextElementSibling;
  }

  return elem;
};

bElems.forEach((b) => {
  const afterEntry = b.nextSibling;
  if (!afterEntry) { // Ignore this "Index" heading
    return;
  }

  if (afterEntry.nodeType !== Node.TEXT_NODE) {
    throw new Error('Unexpected node');
  }

  // const temp = obj;
  // 1. Strip : or ,
  // Keep `innerHTML` for underlining
  const mainEntryText = b.innerHTML.replace(/[,:.]\s*$/u, '');
  const mainLinksArray = [];
  const mainEntriesObject = {
    $text: mainEntryText,
    $links: mainLinksArray,
    $book: 'Kitáb-i-Íqán'
  };
  rootObj[mainEntryText] = mainEntriesObject;

  /**
   * @param {Node} node
   * @param {IndexObject} obj
   * @param {string[]} linksArray
   * @throws {Error}
   * @returns {void}
   */
  function parseIndex (node, obj, linksArray) {
    // (We replace for ; for subsequent iterations)
    let subEntry = node.nodeValue
      .trim().replace(/^[;,]\s*/u, '').replace(/,$/u, '').replaceAll('\n', ' ');

    if (!subEntry) {
      // 2. If no intervening non-whitespace text, add subsequent links to self
      const a = node.nextElementSibling;
      if (!a) {
        console.log('node', node.parentNode.outerHTML);
      }
      if (a.matches('a[href]')) {
        const aText = a.textContent.trim();

        if (!(/iq-[12]|iq-glos/u).test(a.href)) {
          throw new Error(`Unexpected link ${a.href}`);
        }

        const connectingNode = a.nextSibling;
        const connecting = connectingNode?.nodeValue?.trim() || '';

        if (connecting.startsWith('-')) {
          const {groups: {
            digits: a2Text, remainder
          }} = (/^-(?<digits>\d+)(?<remainder>[\s\S]*$)/u).exec(connecting);

          linksArray.push(
            // (a.href.includes('iq-1') ? '1-' : '2-') +
            [
              aText,
              aText.length > a2Text.length
                ? a2Text.padStart(aText.length, aText)
                : a2Text
            ]
          );

          if (remainder) {
            // Just a comma here or so
            parseIndex({
              nodeValue: remainder,
              nextElementSibling: connectingNode.nextElementSibling
            }, obj, linksArray);
          }

          return;
        }

        linksArray.push(
          // (a.href.includes('iq-1') ? '1-' : '2-') +
          aText === '[Glossary]' ? a.href : aText
        );
        if (connecting.startsWith(',') || connecting.startsWith(';')) {
          parseIndex(connectingNode, obj, linksArray);
        }
      } else if (a.matches('i')) {
        const link = a.nextElementSibling;
        obj.$seeAlso = [{
          id: link.textContent.replaceAll('\n', ' ')
        }];
      }
    } else {
      // 3. Otherwise, add recursively as descendants (except for "Glossary"
      //      which can apparently be added to self)
      // 4. Handle `$seeAlso`

      // One exception for a page break where the data was split and
      //   dropped (p. 274)
      let {nextElementSibling, parentNode} = node;
      if (subEntry === 'reason') {
        subEntry += 'why, changed by Muhammad';
        nextElementSibling = $('body > p:nth-child(111) > a:nth-child(2)');
        ({parentNode} = nextElementSibling);
      }

      if (!obj.$children) {
        obj.$children = {};
      }

      const newLinksArray = [];

      obj.$children[subEntry] = {
        $text: subEntry,
        $links: newLinksArray
      };

      parseIndex({
        nodeValue: '',
        nextElementSibling,
        // For debugging
        parentNode
      }, obj, newLinksArray);
    }
  }

  parseIndex(afterEntry, mainEntriesObject, mainLinksArray);

  const link = fromToUnless(b, 'a[href]', (elem) => {
    return elem.textContent === '[Glossary]';
  }, 'b');
  if (link) {
    mainLinksArray.push('G' + link.href.match(/[1-9]\d*$/u));
  }
});

const writePath = join(
  __dirname, '/../../indexes/json/books/Kitáb-i-Íqán.json'
);
await writeJSON(writePath, rootObj);
console.log(`Wrote to ${writePath}`);
