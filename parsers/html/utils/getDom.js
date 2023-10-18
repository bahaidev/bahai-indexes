import {readFile} from 'fs/promises';
import JSDOM from 'jsdom';

/**
 * @typedef {{$: $, $$: $$, document: HTMLDocument, Node: Node}} DomInfo
 */

/**
 * @param {string} html
 * @returns {DomInfo}
 */
function getDomForHtml (html) {
  const {document, Node} = new JSDOM.JSDOM(html).window;

  /**
   * @callback $
   * @param {string} selector
   * @returns {HTMLElement}
   */

  /**
   * @callback $$
   * @param {string} selector
   * @returns {HTMLElement[]}
   */

  /** @type {$} */
  const $ = (s) => document.querySelector(s);

  /** @type {$$} */
  const $$ = (s) => [...document.querySelectorAll(s)];

  return {$, $$, document, Node};
}

/**
 * @param {string} file
 * @returns {Promise<DomInfo>}
 */
async function getDomForFile (file) {
  const html = await readFile(file, 'utf8');
  return getDomForHtml(html);
}

export {getDomForHtml, getDomForFile};
