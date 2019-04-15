const aqdas = require('../indexes/json/aqdas.json');

const aqdasInternalLinksRegex = /^[KQn]?\d+$/u;

/**
 * @param {Object} json
 * @param {Object} cbObj
 * @param {string} basePath
 * @returns {void}
 */
function iterateKeys (json, cbObj, basePath = '') {
  Object.entries(json).forEach(([key, val]) => {
    if (cbObj.keys) {
      cbObj.keys(key, basePath, val);
    }
    if (cbObj.links) {
      cbObj.links(val.$links, key, basePath);
    }
    if (cbObj.seeAlso) {
      cbObj.seeAlso(val.$seeAlso, key, basePath);
    }
    if (!val.$children) {
      return;
    }
    iterateKeys(val.$children, cbObj, basePath + '/' + key);
  });
}

const isValidLink = (link) => {
  return link.match(aqdasInternalLinksRegex) ||
    [
      // Could replace this with a Roman numeral regex
      'viii', 'ix', 'vii'
    ].includes(link);
};

// Todo: adapt as needed for loading and iterating index files to plugin,
//    caching result to avoid rebuilding flattened structure on each load

const indexEntryInfo = new Map();
iterateKeys(aqdas, {
  keys (indexName, basePath, val) {
    // Todo: Set index entry info if needed using basePath, and
    //    get `seeAlso` to use
    if (!basePath) {
      indexEntryInfo.set(indexName, {
        children: val.$children, links: val.$links
      });
    }
  },
  links (links) {
    if (!links) {
      return;
    }
    /**
     *
     * @param {string} link
     * @returns {void}
     */
    function validateLink (link) {
      // Validate `links` are all numeric or with `[KQn]`
      if (!isValidLink(link)) {
        throw new Error('Unexpected link format: ' + link);
      }
    }
    links.forEach((link) => {
      if (Array.isArray(link)) {
        if (link.length !== 2) {
          throw new Error('Unexpected link length');
        }
        link.forEach((lnk) => validateLink(lnk));
        return;
      }
      validateLink(link);
    });
  }
});

const badSeeAlsos = [];
iterateKeys(aqdas, {
  seeAlso (seeAlsos, indexName, basePath) {
    // Todo: Validate that `seeAlso`'s lead to (unique) existent location
    if (!seeAlsos) {
      return;
    }
    seeAlsos.forEach((seeAlso) => {
      seeAlso = seeAlso && typeof seeAlso === 'object'
        ? seeAlso.headings
        : seeAlso;
      // This might not be an error, but probably a good sanity check
      //   until we see any such data
      if (isValidLink(seeAlso)) {
        throw new Error('Unexpected apparent link format');
      }
      if (!indexEntryInfo.has(seeAlso) && !badSeeAlsos.includes(seeAlso)) {
        // throw new Error('Unexpected duplicate index entry: ' + indexName);
        badSeeAlsos.push(seeAlso);
      }
    });
  }
});

console.log(badSeeAlsos);
console.log('Length: ' + badSeeAlsos.length);
