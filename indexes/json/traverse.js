/**
 * @typedef {PlainObject} IndexObject
 * @property {string} $text
 * @property {Object<string,IndexObject>} $children
 */

/**
 * @callback IndexHandler
 * @param {IndexObject} obj
 * @returns {void}
 */

/**
 * @param {IndexObject} obj
 * @param {any} lastResult
 * @param {IndexHandler} handler
 * @param {string[]} [paths=[]]
 * @returns {void}
 */
const traverse = (obj, lastResult, handler, paths = []) => {
  paths = [...paths];
  const result = handler(obj, lastResult, paths);
  if (!obj.$children) {
    return;
  }

  Object.values(obj.$children).forEach((childObj) => {
    traverse(childObj, result, handler, paths);
  });
};

export default traverse;
