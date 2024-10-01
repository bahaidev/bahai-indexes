// /* eslint-disable no-unsanitized/property -- Source must be trusted as
// we want its HTML */

import {appendLinks} from './appendLinks.js';
import traverse from './traverse.js';

/**
 * @param {string} sel
 * @returns {Element}
 */
const $ = (sel) => {
  return document.querySelector(sel);
};

/**
 * @param {string} sel
 * @returns {Element}
 */
const $$ = (sel) => {
  return [...document.querySelectorAll(sel)];
};

/**
 * @typedef {null|boolean|number|string|Array<JSON>|Object<string,JSON>} JSON
 */

/**
 * @param {string} url
 * @param {object} cfg
 * @param {string} cfg.query
 * @param {JSON} cfg.bindings
 * @returns {Promise<JSON>}
 */
async function httpquery (url, {
  query,
  bindings
}) {
  const resp = await fetch(url, {
    headers: {
      'query-jsonata': query,
      'query-bindings': JSON.stringify(bindings)
    }
  });
  try {
    return await resp.json();
  } catch {
    return [];
  }
}

/**
 * @typedef {any} IndexResult
 * @todo Specify
 */

/**
 * @param {object} cfg
 * @param {IndexResult} cfg.result
 * @param {HTMLElement} cfg.ul
 * @param {string} cfg.id
 * @param {string} cfg.entriesOrLinks
 * @returns {void}
 */
function populateFullIndex ({result, ul, id, entriesOrLinks = 'both'}) {
  traverse(result, ul, (obj, parent, paths) => {
    const li = document.createElement('li');
    const currentId = id === obj.$text
      ? id
      : `${paths.join(', ')}, ${obj.$text}`;
    li.id = currentId;

    paths.push(obj.$text);

    li.innerHTML = obj.$text;
    const links = obj.$links || [];

    if (entriesOrLinks === 'both') {
      if (links.length) {
        li.append(' - ');
        appendLinks(links, li, result.$book);
      }
    }
    parent.append(li);

    if (obj.$seeAlso) {
      // None with `obj.$children`?
      if (links.length) {
        const innerUl = document.createElement('ul');
        li.append(innerUl);
        const innerLi = document.createElement('li');
        innerUl.append(innerLi);

        const i = document.createElement('i');
        i.textContent = 'See also ';
        innerLi.append(i);

        obj.$seeAlso.forEach((see, idx) => {
          const a = document.createElement('a');
          a.href = '#';
          a.dataset.book = result.$book;
          a.dataset.id = see.id;
          a.textContent = see.text || see.id;
          innerLi.append(
            idx ? ', ' : '',
            see.headings ? 'the headings under ' : '',
            a
          );
        });
      } else {
        const i = document.createElement('i');
        i.textContent = ' See ';
        li.append(i);

        obj.$seeAlso.forEach((see, idx) => {
          const a = document.createElement('a');
          a.href = '#';
          a.dataset.book = result.$book;
          a.dataset.id = see.id;
          a.textContent = see.text || see.id;
          li.append(
            idx ? ', ' : '',
            see.headings ? 'the headings under ' : '',
            a
          );
        });
      }
    }

    if (obj.$children) {
      const innerUl = document.createElement('ul');
      li.append(innerUl);
      return innerUl;
    }

    return li;
  });
}

export {$, $$, httpquery, populateFullIndex};
