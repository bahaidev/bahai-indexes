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
 * @returns {void}
 */
function appendLinks (links, linkHolder) {
  [...new Set(recursiveFlatten(links))].sort((a, b) => {
    return sortEntries(a, b);
  }).forEach((linkText) => {
    const a = createLinkForIndexText(linkText);
    linkHolder.append(a, ' ');
  });
}

/**
 * @param {Links} links
 * @param {HTMLElement} holder
 * @returns {void}
 */
function appendLinksToHolder (links, holder) {
  const linkHolder = document.createElement('div');
  linkHolder.style.margin = '10px';
  appendLinks(links, linkHolder);
  holder.append(linkHolder);
}

export {appendLinks, appendLinksToHolder};
