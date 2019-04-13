const fs = require('fs');
const {join} = require('path');
const {JSDOM} = require('jsdom');

const html = fs.readFileSync(
  join(__dirname, '/../indexes/html/aqdas.html'),
  'utf8'
);
const {document, Node} = (new JSDOM(html)).window;
// const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const letterSections = [...$$('a[name]')].filter((a) => (/^[A-Z]$/u).test(a.name))
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
          text += elem.textContent;
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
      if (seeAlso !== false) {
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
                arr.push(l.textContent);
                break;
              }
              if (nodeName === 'br' ||
                (nodeName === 'i' &&
                  [
                    // These two are used depending on whether other child
                    //   content exists, but this can be detected and added
                    //   programmatically
                    'See', 'See also', 'see', 'See headings under',
                    // "See above" and "See below" are used if the entry
                    //   were in the same level, but this can be detected
                    //   and added programmatically
                    'See above', 'See below'
                  ].includes(l.textContent))
              ) {
                break;
              }
              if (nodeName !== 'i') {
                // Todo: Handle `ul`
                arr.push(nodeName + ':::' + l.outerHTML);
                break;
              }
              throw new TypeError('Unexpected node name');
            }
            default:
              throw new TypeError('Unexpected `seeAlso` type ' + nodeType);
            }
            return arr;
          },
          []
        );
      }
      if (links !== false) {
        jsonIndexEntry[text].$links = childNodes.slice(links).reduce(
          (arr, l) => {
            const {nodeType} = l;
            switch (nodeType) {
            case Node.TEXT_NODE: {
              const txt = stripPunctuationAndWhitespace(l.nodeValue);
              if (txt) {
                if (txt === '-') {
                  // Todo: Handle range `-`
                  arr.push('++LINKED-RANGE');
                } else if ((/-\d+$/u).test(txt)) {
                  // Todo: Handle range `-`
                  arr.push('++UNLINKED-RANGE' + txt);
                } else {
                  // Todo: Handle
                  arr.push('==' + txt);
                }
              }
              break;
            }
            case Node.ELEMENT_NODE: {
              const nodeName = l.nodeName.toLowerCase();
              if (nodeName === 'br' ||
                (nodeName === 'i' &&
                  [
                    // These are used depending on whether other child
                    //   content exists, but this can be detected and added
                    //   programmatically
                    'See also', 'see also', 'See',
                    // "See above" and "See below" are used if the entry
                    //   were in the same level, but this can be detected
                    //   and added programmatically
                    'See also above',
                    // Todo: We could add a flag to allow programmatic
                    //   reconstruction re: headings
                    // Probably not too critical to preserve these
                    //   distinct descriptions
                    'See also additional headings under',
                    'see additional headings under'
                  ].includes(l.textContent))
              ) {
                break;
              }
              const val = nodeName === 'a'
                ? l.textContent
                : l.nodeName + '::' + l.textContent;
              // Todo: Handle table `nodeName` and newlines case
              arr.push(val);
              break;
            }
            default:
              throw new TypeError('Unexpected `links` type ' + nodeType);
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
