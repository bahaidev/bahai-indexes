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
      [...liOrUl.childNodes].some((elem) => {
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
          if (elem.matches('i,a[href]')) { // Ignore "see also"'s
            // Todo: Add see also values
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
      text = text.trim().replace(/\s(\s+)/gu, ' ').replace(/[.,]$/gu, ''); // .replace(/\n/gu, '')
      jsonIndexEntry[text] = {};
      lastText = text;
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
