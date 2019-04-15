const aqdas = require('../indexes/json/aqdas.json');

const aqdasInternalLinksRegex = /^[KQn]?\d+$/u;

/**
 * @param {Object} json
 * @param {Object} cbObj
 * @param {string} basePath
 * @param {string} parents
 * @returns {void}
 */
function iterateKeys (json, cbObj, basePath = '', parents = []) {
  Object.entries(json).forEach(([key, val]) => {
    if (cbObj.keys) {
      cbObj.keys(key, basePath, val, parents);
    }
    if (cbObj.links) {
      cbObj.links(val.$links, key, basePath, val, parents);
    }
    if (cbObj.seeAlso) {
      cbObj.seeAlso(val.$seeAlso, key, basePath, val, parents);
    }
    if (!val.$children) {
      return;
    }
    iterateKeys(
      val.$children,
      cbObj,
      basePath + '/' + key,
      parents.concat([[key, val]])
    );
  });
}

const isValidLink = (link) => {
  return link.match(aqdasInternalLinksRegex) ||
    [
      // Could replace this with a Roman numeral regex
      'viii', 'ix', 'vii'
    ].includes(link);
};

/**
 *
 * @returns {void}
 */
function validate () {
  const indexEntryInfo = new Map();
  iterateKeys(aqdas, {
    keys (indexName, basePath, val) {
      if (!val.$text) { // A hierarchical entry, but not a target of links
        return;
      }
      if (indexEntryInfo.has(indexName)) {
        throw new Error('Unexpected duplicate key: ' + indexName);
      }
      indexEntryInfo.set(indexName, {
        children: val.$children, links: val.$links
      });
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
      if (!seeAlsos) {
        return;
      }
      seeAlsos.forEach((seeAlso) => {
        // This might not be an error, but probably a good sanity check
        //   until we see any such data
        if (isValidLink(seeAlso.id) || (
          seeAlso.text && isValidLink(seeAlso.text)
        )) {
          throw new Error('Unexpected apparent link format');
        }
        if (!indexEntryInfo.has(seeAlso.id) &&
          !badSeeAlsos.includes(seeAlso.id)
        ) {
          // throw new Error('Unexpected duplicate index entry: ' + indexName);
          badSeeAlsos.push(seeAlso);
        }
      });
    }
  });

  if (badSeeAlsos.length) {
    throw new Error(
      'Bad seeAlso\'s; Length: ' + badSeeAlsos.length + ' ' +
        JSON.stringify(badSeeAlsos)
    );
  }
  console.log('Valid!');
}

/**
 *
 * @returns {void}
 */
function arrangeByParagraph () {
  const badFullLabels = [];
  const paragraphToIndexEntries = {};
  iterateKeys(aqdas, {
    links (links, key, basePath, val, parents) {
      if (!links) {
        return;
      }
      const paragraphLinkRegex = /^K\d+$/u;
      const paragraphLink = function (lnk) {
        return lnk.match(paragraphLinkRegex);
      };
      const nonparagraphLinks = [];
      const paragraphLinks = links.filter((link) => {
        let ret;
        if (Array.isArray(link)) {
          // These should already be the same type
          ret = paragraphLink(link[0]);
        } else {
          ret = paragraphLink(link);
        }
        if (!ret) {
          nonparagraphLinks.push(link);
        }
        return ret;
      });
      const setInfo = (p) => {
        const num = parseInt(p.slice(1));
        if (!paragraphToIndexEntries[num]) {
          paragraphToIndexEntries[num] = [];
        }
        const ancestorsLabel = parents.map(
          ([k, v]) => (v.$text || k)
        ).join(', ');
        const childLabel = (val.$text || key);
        const fullLabel = (ancestorsLabel ? (ancestorsLabel + ', ') : '') +
          childLabel;
        if (!fullLabel.charAt().match(/[`"A-Z]/u) && !badFullLabels.includes(fullLabel)) {
          badFullLabels.push(fullLabel);
        }

        // Todo: Also resolve `see` links (if no links?)
        paragraphToIndexEntries[num].push(
          [
            fullLabel,
            // Todo: We could also check whether the `seeAlso` IDs exist at
            //   this level, so indexes could reconstruct
            //   "see above"/"see below"

            // val.$seeAlso ? '======' + JSON.stringify(val.$seeAlso) : '',
            val.$seeAlso,
            // Todo: We could filter this to also check for array ranges
            // JSON.stringify(paragraphLinks.filter((pl) => pl !== p)),
            paragraphLinks.filter((pl) => pl !== p),
            // JSON.stringify(nonparagraphLinks)
            nonparagraphLinks
          ]
        );
      };
      paragraphLinks.forEach((ps) => {
        if (Array.isArray(ps)) {
          // eslint-disable-next-line prefer-const
          let [start, end] = ps.map((n) => parseInt(n.slice(1)));
          // Todo: We could just do `start` and `end` if not
          //    interested in interim
          while (start <= end) {
            setInfo('K' + start);
            start++;
          }
          return;
        }
        setInfo(ps);
      });
    }
  });
  if (badFullLabels.length) {
    throw new Error('badFullLabels: ' + JSON.stringify(badFullLabels));
  }
  console.log(paragraphToIndexEntries);
}

validate();
arrangeByParagraph();
