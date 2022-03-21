/**
 * @param {string} sel
 * @returns {Element}
 */
const $ = (sel) => {
  return document.querySelector(sel);
};

/**
 * @typedef {null|boolean|number|string|Array<JSON>|Object<string,JSON>} JSON
 */

/**
 * @param {string} url
 * @param {PlainObject} cfg
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
  } catch (err) {
    return [];
  }
}

export {$, httpquery};
