import sortEntries from './sortEntries.js';
import createLinkForIndexText from './createLinkForIndexText.js';

/**
 * @param {any} items
 * @returns {any[]}
 */
function recursiveFlatten (items) {
  const flattened = [];

  items.forEach((item) => {
    if (Array.isArray(item)) {
      flattened.push(...recursiveFlatten(item));
    } else {
      flattened.push(item);
    }
  });

  return flattened;
}

/**
 * @typedef {string} Link
 */

/**
 * @typedef {Link[]|Links[]} Links
 */

/**
 * @param {Links} links
 * @param {HTMLElement} linkHolder
 * @param {string} book
 * @returns {void}
 */
function appendLinks (links, linkHolder, book) {
  [...new Set(recursiveFlatten(links))].sort((a, b) => {
    return sortEntries(a, b);
  }).forEach((linkText) => {
    const a = createLinkForIndexText(linkText, book);
    linkHolder.append(a, ' ');
  });
}

/**
 * @param {Links} links
 * @param {HTMLElement} holder
 * @param {string} book
 * @returns {void}
 */
function appendLinksToHolder (links, holder, book) {
  const linkHolder = document.createElement('div');
  linkHolder.style.margin = '10px';
  appendLinks(links, linkHolder, book);
  holder.append(linkHolder);
}

export {appendLinks, appendLinksToHolder};
