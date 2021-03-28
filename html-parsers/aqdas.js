import fsImport from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import JSDOM from 'jsdom';
import handleNode from 'handle-node';

let document, Node;

const __dirname = dirname(fileURLToPath(import.meta.url));
const {readFile, writeFile} = fsImport.promises;
const letterLinkOnlyRegex = /^[nKQ]\d+$/u;
const numbersOnlyRegex = /^\d+$/u;
const romanNumeralsOnlyRegex = /^[mclxvi]+$/u;
const decimalRangeRegex = /^\d+-\d+$/u;
const romanNumeralRangeRegex = /^[mclxvi]+-[mclxvi]+$/u;
const endIndexLinkRegex = /^(?:[A-Z]_EndIndex\.htm|about:blank)?#/u;

/**
 *
 * @param {string} s
 * @returns {string}
 */
function stripPunctuationAndWhitespace (s) {
  return s.trim().replace(/\s(?:\s+)/gu, ' ').replace(/[.,;]$/gu, ''); // .replace(/\n/gu, '')
}

const serializeLinkContents = (linkElem) => {
  const textContentSerializer = {
    element ({childNodes, nodeName}) {
      const children = [...childNodes].reduce((str, node) => {
        return str + handleNode(node, textContentSerializer);
      }, '');
      if (nodeName.toLowerCase() === 'i') {
        return '<i>' + children + '</i>';
      }
      return children;
    },
    text: ({nodeValue}) => nodeValue
  };
  return handleNode(linkElem, textContentSerializer);
};

/**
 *
 * @param {HTMLUListElement} ul
 * @param {WritingsMeta} jsonIndexEntry
 * @returns {void}
 */
function recurseList (ul, jsonIndexEntry) {
  const {children: lisOrUls} = ul;
  // console.log(lisOrUls);
  let lastID;
  [...lisOrUls].forEach((liOrUl, i) => {
    if (liOrUl.matches('li')) {
      let text = '';
      let seeAlso = false;
      let links = false;
      const childNodes = [...liOrUl.childNodes];
      let id;
      childNodes.some((elem, i) => {
        const {nodeType, nodeValue} = elem;
        switch (nodeType) {
        case Node.COMMENT_NODE: { // Ignore
          break;
        }
        case Node.TEXT_NODE: {
          text += nodeValue;
          break;
        }
        case Node.ELEMENT_NODE: {
          if (elem.matches('i')) {
            if ([
              'see',
              'See', 'See also', 'See above', 'See below',
              'See headings under'
            ].includes(elem.textContent.trim())) {
              seeAlso = i;
              return true;
            }
            text += `<i>${stripPunctuationAndWhitespace(elem.textContent)}</i>`;
            break;
          }
          if (elem.matches('a[href]')) {
            links = i;
            return true;
          }
          if (elem.matches('a[name]')) {
            id = elem.name;
          }
          text += serializeLinkContents(elem);
          break;
        }
        default:
          throw new TypeError('Unexpected type ' + nodeType);
        }
        return false;
      });
      text = stripPunctuationAndWhitespace(text);
      lastID = id || text;
      if (id) {
        jsonIndexEntry[lastID] = {$text: text};
      } else {
        jsonIndexEntry[lastID] = {};
      }
      if (links !== false) {
        let rangeBegun = false;
        const $links = [];
        /**
         *
         * @param {string} val
         * @returns {false|integer}
         */
        const sequenceDifferenceSinceLast = (val) => {
          const lastRange = $links[$links.length - 1];
          if (!Array.isArray(lastRange)) {
            return false;
          }
          const lastItem = lastRange[lastRange.length - 1];
          if (lastItem.length === val.length) {
            // e.g., K101, K102
            if (letterLinkOnlyRegex.test(lastItem) &&
                letterLinkOnlyRegex.test(val)
            ) {
              return Number.parseInt(val.slice(1)) -
                Number.parseInt(lastItem.slice(1));
            }
            // e.g., 101, 102
            if (numbersOnlyRegex.test(lastItem) &&
                numbersOnlyRegex.test(val)
            ) {
              return Number.parseInt(val) - Number.parseInt(lastItem);
            }
          }
          return false;
        };
        const isSequential = (val) => {
          return sequenceDifferenceSinceLast(val) === 1;
        };
        const mergeSequential = (val) => {
          const lastRange = $links[$links.length - 1];
          if (lastRange.length > 1) {
            lastRange.pop();
          }
          lastRange.push(val);
        };
        const mergeIfSequential = (val) => {
          if (isSequential(val)) {
            mergeSequential(val);
            return true;
          }
          return false;
        };
        childNodes.slice(links).some((l, j) => {
          const {nodeType} = l;
          switch (nodeType) {
          case Node.TEXT_NODE: {
            const txt = stripPunctuationAndWhitespace(l.nodeValue);
            if (!txt) {
              rangeBegun = false;
              break;
            }
            if (txt !== '-') {
              throw new TypeError('Unexpected text node');
            }
            rangeBegun = true;
            if (!Array.isArray($links[$links.length - 1])) {
              // Don't keep nesting if this accidentally lists as a range,
              //   e.g., K175-K176-K177
              const val = $links.pop();
              // Check to see if value is contiguous with
              //   any range array just previous and merge instead of
              //   pushing
              if (mergeIfSequential(val)) {
                break;
              }
              $links.push([val]);
            }
            break;
          }
          case Node.ELEMENT_NODE: {
            const nodeName = l.nodeName.toLowerCase();
            if (nodeName === 'br') {
              break;
            }
            if (nodeName === 'i' &&
                [
                  // These are used depending on whether other child
                  //   content exists, but this can be detected and added
                  //   programmatically
                  'See also', 'see also', 'See', 'See also above'
                ].includes(l.textContent)
            ) {
              seeAlso = links + j + 1;
              return true;
            }
            if (nodeName !== 'a') {
              throw new TypeError(
                'Unexpected nodeName ' + nodeName + '::' + l.textContent
              );
            }

            const textContent = serializeLinkContents(l);
            if (rangeBegun) {
              rangeBegun = false;
              if (mergeIfSequential(textContent)) {
                break;
              }
              let val = textContent;
              // Add missing letters to range endings
              const lastRange = $links[$links.length - 1];
              const lastItem = lastRange[0];
              if (letterLinkOnlyRegex.test(lastItem)) {
                if (!letterLinkOnlyRegex.test(val)) {
                  // If letter omitted from second part of range (and
                  //   known to be indeed a range)
                  val = lastItem.charAt() + val;
                }
                // If, e.g., K101-(K)03
                const paddingDiff = lastItem.length - val.length;
                if (paddingDiff > 0) {
                  val = val.charAt() +
                    lastItem.slice(1, 1 + paddingDiff) +
                    val.slice(1);
                }
                if (
                  (Number.parseInt(val.slice(1)) -
                    Number.parseInt(lastItem.slice(1))
                  ) <= 0
                ) {
                  throw new Error('Unexpected item mismatch');
                }
              }
              $links[$links.length - 1].splice(1, 1, val);
            } else {
              // Merge with last range array if sequential despite
              //   our not being in range mode (i.e., despite not
              //   having a hyphen); but we can't safely do other
              //   types of merges like K100 with 101, in case the
              //   latter is a page number
              if (mergeIfSequential(textContent)) {
                break;
              }
              // If a range is specified within the link text
              if (decimalRangeRegex.test(textContent)) {
                const [begin, end] = textContent.split('-');
                const diff = sequenceDifferenceSinceLast(begin);
                // If begin is higher by one, merge the end; if the same,
                //  also merge the end since our ending should still be after
                if (diff === 0 || diff === 1) {
                  mergeSequential(end);
                } else {
                  // Otherwise, start a new range
                  $links.push([begin, end]);
                }
                break;
              }
              // Handle Roman numeral range text
              if (romanNumeralRangeRegex.test(textContent)
              ) {
                // We thankfully don't need any merging of roman numerals
                $links.push(textContent.split('-'));
                break;
              }
              if (
                !letterLinkOnlyRegex.test(textContent) &&
                !numbersOnlyRegex.test(textContent) &&
                !romanNumeralsOnlyRegex.test(textContent)
              ) {
                throw new Error('Unexpected link content');
              }

              // Just a lone link (or will be extracted into an
              //   array later if followed by a range hyphen)
              $links.push(textContent);
            }
            break;
          }
          default:
            throw new TypeError('Unexpected `links` type ' + nodeType);
          }
          return false;
        });
        jsonIndexEntry[lastID].$links = $links;
      }
      if (seeAlso !== false) {
        let headings = false;
        jsonIndexEntry[lastID].$seeAlso = childNodes.slice(seeAlso).reduce(
          (arr, l) => {
            const {nodeType} = l;
            switch (nodeType) {
            case Node.COMMENT_NODE: // Ignore
            case Node.TEXT_NODE:
              break;
            case Node.ELEMENT_NODE: {
              const nodeName = l.nodeName.toLowerCase();
              if (nodeName === 'a') {
                const textContent = serializeLinkContents(l);
                if (!endIndexLinkRegex.test(l.href)) {
                  throw new Error('Unexpected link format: ' + l.href);
                }
                const id = l.href.replace(endIndexLinkRegex, '');
                const obj = {
                  id,
                  ...(id === textContent ? {} : {text: textContent}),
                  // Here the `see-also` points to the *headings of*
                  //   an entry, not the entry itself
                  ...(headings ? {headings: true} : {})
                };
                arr.push(obj);
                break;
              }
              if (nodeName === 'br') {
                break;
              }
              if (nodeName === 'i') {
                if ([
                  // These two are used depending on whether other child
                  //   content exists, but this can be detected and added
                  //   programmatically
                  'See also', 'See', 'see',
                  // "See above" and "See below" are used if the entry
                  //   were in the same level, but this can be detected
                  //   and added programmatically
                  'See above', 'See below'
                ].includes(l.textContent)) {
                  break;
                }
                if ([
                  'See headings under',
                  'see additional headings under',
                  'See also additional headings under'
                ].includes(l.textContent)) {
                  headings = true;
                  break;
                }
              }
              throw new TypeError(
                'Unexpected node name: ' + nodeName + ': ' + l.textContent
              );
            }
            default:
              throw new TypeError('Unexpected `seeAlso` type ' + nodeType);
            }
            return arr;
          },
          []
        );
      }
    } else if (liOrUl.matches('ul')) {
      jsonIndexEntry[lastID].$children = {};
      recurseList(liOrUl, jsonIndexEntry[lastID].$children);
    }
  });
}

(async () => {
const html = await readFile(
  join(__dirname, '/../indexes/html/aqdas.html'),
  'utf8'
);
({document, Node} = (new JSDOM.JSDOM(html)).window);

// const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const letterSections = [...$$('a[name]')]
  // Main letter sections
  .filter((a) => (/^[A-Z]$/u).test(a.name))
  // Followed by nested items
  .filter(({parentElement: implicitPar}) => {
    const ul = implicitPar && implicitPar.nextElementSibling;
    return ul && ul.matches('ul');
  });
const topUls = letterSections.map((
  {parentElement: {nextElementSibling: ul}}
) => ul);

const jsonIndex = {};

topUls.forEach((ul) => {
  recurseList(ul, jsonIndex);
});

const writePath = join(__dirname, '/../indexes/json/aqdas.json');
await writeFile(
  writePath,
  JSON.stringify(jsonIndex, null, 2) + '\n'
);
console.log(`Wrote to ${writePath}`);
})();
