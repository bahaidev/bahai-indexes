const fs = require('fs');
const {join} = require('path');
const {JSDOM} = require('jsdom');
const handleNode = require('handle-node');

const letterLinkOnlyRegex = /^[nKQ]\d+$/u;
const numbersOnlyRegex = /^\d+$/u;
const romanNumeralsOnlyRegex = /^[mclxvi]+$/u;
const decimalRangeRegex = /^\d+-\d+$/u;
const romanNumeralRangeRegex = /^[mclxvi]+-[mclxvi]+$/u;
const endIndexLinkRegex = /^([A-Z]_EndIndex\.htm|about:blank)?#/u; // eslint-disable-line unicorn/no-unsafe-regex

const html = fs.readFileSync(
  join(__dirname, '/../indexes/html/aqdas.html'),
  'utf8'
);
const {document, Node} = (new JSDOM(html)).window;
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

/**
 *
 * @param {string} s
 * @returns {string}
 */
function stripPunctuationAndWhitespace (s) {
  return s.trim().replace(/\s(\s+)/gu, ' ').replace(/[.,;]$/gu, ''); // .replace(/\n/gu, '')
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
 * @param {Object} jsonIndexEntry
 * @returns {undefined}
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
      jsonIndexEntry[lastID] = {text};
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
            if (lastItem.match(letterLinkOnlyRegex) &&
                val.match(letterLinkOnlyRegex)
            ) {
              return parseInt(val.slice(1)) - parseInt(lastItem.slice(1));
            }
            // e.g., 101, 102
            if (lastItem.match(numbersOnlyRegex) &&
                val.match(numbersOnlyRegex)
            ) {
              return parseInt(val) - parseInt(lastItem);
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
              if (l.textContent === 'See also above') {
                // Todo
              }
              return true;
            }
            if (nodeName !== 'a') {
              throw new TypeError(
                'Unexpected nodeName ' + nodeName + '::' + l.textContent
              );
            }

            // Todo: Deal with "see-also" links at different levels and IDs
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
              if (lastItem.match(letterLinkOnlyRegex)) {
                if (!val.match(letterLinkOnlyRegex)) {
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
                  (parseInt(val.slice(1)) -
                    parseInt(lastItem.slice(1))
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
              if (textContent.match(decimalRangeRegex)) {
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
              if (textContent.match(romanNumeralRangeRegex)
              ) {
                // We thankfully don't need any merging of roman numerals
                $links.push(textContent.split('-'));
                break;
              }
              if (
                !textContent.match(letterLinkOnlyRegex) &&
                !textContent.match(numbersOnlyRegex) &&
                !textContent.match(romanNumeralsOnlyRegex)
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
        }, []);
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
                if (!l.href.match(endIndexLinkRegex)) {
                  throw new Error('Unexpected link format: ' + l.href);
                }
                const id = l.href.replace(endIndexLinkRegex, '');
                arr.push(
                  headings
                    // Here the `see-also` points to the *headings of*
                    //   an entry, not the entry itself
                    ? {id, text: textContent, headings: true}
                    : {id, text: textContent}
                );
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
                  'See also', 'See', 'see'
                ].includes(l.textContent)) {
                  break;
                }
                if ([
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

const jsonIndex = {};

topUls.forEach((ul) => {
  recurseList(ul, jsonIndex);
});

fs.writeFileSync(
  join(__dirname, '/../indexes/json/aqdas.json'),
  JSON.stringify(jsonIndex, null, 2) + '\n'
);
