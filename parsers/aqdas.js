const fs = require('fs');
const {join} = require('path');
const {JSDOM} = require('jsdom');
const handleNode = require('handle-node');

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
  let lastText;
  [...lisOrUls].forEach((liOrUl, i) => {
    if (liOrUl.matches('li')) {
      let text = '';
      let seeAlso = false;
      let links = false;
      const childNodes = [...liOrUl.childNodes];
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
          text += serializeLinkContents(elem);
          break;
        }
        default:
          throw new TypeError('Unexpected type ' + nodeType);
        }
        return false;
      });
      text = stripPunctuationAndWhitespace(text);
      jsonIndexEntry[text] = {};
      lastText = text;
      if (links !== false) {
        let rangeBegun = false;
        const $links = [];
        const letterLinkRegex = /^[nKQ]\d+$/u;
        const numbersOnlyRegex = /^\d+$/u;
        const sequenceDifference = (val) => {
          const lastRange = $links[$links.length - 1];
          if (!Array.isArray(lastRange)) {
            return false;
          }
          const lastItem = lastRange[lastRange.length - 1];
          if (lastItem.length === val.length) {
            // e.g., K101, K102
            if (lastItem.match(letterLinkRegex) &&
                val.match(letterLinkRegex)
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
          return sequenceDifference(val) === 1;
        };
        const mergeSequential = (val) => {
          const lastRange = $links[$links.length - 1];
          lastRange.pop();
          lastRange.push(val);
        };
        const mergeIfSequential = (val) => {
          if (isSequential(val)) {
            mergeSequential(val);
            return true;
          }
          return false;
        };
        childNodes.slice(links).some(
          (l, j) => {
            const {nodeType} = l;
            switch (nodeType) {
            case Node.TEXT_NODE: {
              const txt = stripPunctuationAndWhitespace(l.nodeValue);
              if (txt) {
                if (txt !== '-') {
                  throw new TypeError('Unexpected text node');
                }
                if (!rangeBegun &&
                  // Don't keep nesting if this accidentally lists as a range,
                  //   e.g., K175-K176-K177
                  !Array.isArray($links[$links.length - 1])
                ) {
                  rangeBegun = true;
                  const val = $links.pop();
                  // Check to see if value is contiguous with
                  //   any range array just previous and merge instead of
                  //   pushing
                  if (mergeIfSequential(val)) {
                    break;
                  }
                  $links.push([val]);
                }
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

              // Todo: Deal with "see-also" links at different levels and IDs
              const textContent = serializeLinkContents(l);
              if (rangeBegun) {
                let val;
                // Add missing letters to range endings
                if ($links[$links.length - 1][0].match(letterLinkRegex) &&
                  textContent.match(numbersOnlyRegex)
                ) {
                  const diff = $links[$links.length - 1][0].slice(1).length -
                    textContent.length;
                  val = $links[$links.length - 1][0].charAt() + (
                    diff > 0
                      // Programmatic fix if insufficiently
                      //  padded (e.g., `02`)
                      ? $links[$links.length - 1][0].slice(1, diff + 1) +
                        textContent
                      : textContent
                  );
                } else {
                  val = textContent;
                }
                $links[$links.length - 1].push(val);
                rangeBegun = false;
              } else {
                // Merge with last range array if still sequential
                if (mergeIfSequential(textContent)) {
                  break;
                }
                if (textContent.match(/^\d+-\d+$/u)) {
                  const [begin, end] = textContent.split('-');
                  const diff = sequenceDifference(begin);
                  if (diff === 0 || diff === 1) {
                    mergeSequential(end);
                  } else {
                    $links.push([begin, end]);
                  }
                  break;
                }
                $links.push(textContent);
              }
              break;
            }
            default:
              throw new TypeError('Unexpected `links` type ' + nodeType);
            }
            return false;
          },
          []
        );
        jsonIndexEntry[text].$links = $links;
      }
      if (seeAlso !== false) {
        let additionalHeadings = false;
        jsonIndexEntry[text].$seeAlso = childNodes.slice(seeAlso).reduce(
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
                arr.push(
                  additionalHeadings
                    // Here the `see-also` points to the *headings of*
                    //   an entry, not the entry itself
                    ? {headings: textContent}
                    : textContent
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
                  'See also', 'See', 'see', 'See headings under',
                  // "See above" and "See below" are used if the entry
                  //   were in the same level, but this can be detected
                  //   and added programmatically
                  'See above', 'See below'
                ].includes(l.textContent)) {
                  break;
                }
                if ([
                  'see additional headings under',
                  'See also additional headings under'
                ].includes(l.textContent)) {
                  additionalHeadings = true;
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
      jsonIndexEntry[lastText].$children = {};
      recurseList(liOrUl, jsonIndexEntry[lastText].$children);
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
