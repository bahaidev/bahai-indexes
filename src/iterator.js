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

// Todo: adapt as needed for loading and iterating index files to plugin,
//    caching result to avoid rebuilding flattened structure on each load

const indexEntryInfo = new Map();
iterateKeys(aqdas, {
  keys (indexName, basePath, val) {
    // Todo: Set index entry info if needed using basePath, and
    //    get `seeAlso` to use
    if (!basePath) {
      console.log('i', indexName);
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
      if (!link.match(aqdasInternalLinksRegex) &&
        !['viii', 'ix', 'vii'].includes(link)
      ) {
        throw new Error('Unexpected link format: ' + link);
      }
    }
    links.forEach((link) => {
      if (Array.isArray(link)) {
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
    // Todo: Validate that `seeAlso`'s lead to (unique) location
    if (!seeAlsos) {
      return;
    }
    seeAlsos.forEach((seeAlso) => {
      if (!indexEntryInfo.has(seeAlso) && !badSeeAlsos.includes(seeAlso)) {
        // throw new Error('Unexpected duplicate index entry: ' + indexName);
        badSeeAlsos.push(seeAlso);
      }
    });
  }
});
console.log(badSeeAlsos);
console.log('Length: ' + badSeeAlsos.length);
