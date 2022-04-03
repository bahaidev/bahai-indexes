import sortEntries from './sortEntries.js';
import createLinkForIndexText from './createLinkForIndexText.js';

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
  const uniqueLinks = [...new Set(links)];
  uniqueLinks.filter((link, idx) => {
    // Remove array dupes
    return !Array.isArray(link) ||
      idx === uniqueLinks.findIndex((innerLink) => {
        return link[0] === innerLink[0] &&
          link[1] === innerLink[1];
      });
  }).sort((a, b) => {
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
