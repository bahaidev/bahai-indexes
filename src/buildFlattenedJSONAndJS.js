// Todo: It would be ideal if this could be made generic to other books, but
//        it would have to handle pecularities like parsing K paragraph vs.
//        note links for the Aqdas
import fsImport from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const {readFile, writeFile} = fsImport.promises;

const aqdasInternalLinksRegex = /^[KQn]?\d+$/u;

/**
* @callback KeysCallback
* @param {string} key
* @param {string} basePath
* @param {WritingsMeta} val
* @param {KeyValue[]} parents
* @returns {void}
*/

/**
* @callback LinksCallback
* @param {LinksMeta} $links
* @param {string} key
* @param {string} basePath
* @param {WritingsMeta} val
* @param {KeyValue[]} parents
* @returns {void}
*/

/**
* @callback SeeAlsoCallback
* @param {SeeAlsoMeta[]} $seeAlso
* @param {string} key
* @param {string} basePath
* @param {WritingsMeta} val
* @param {KeyValue[]} parents
* @returns {void}
*/

/**
* @typedef {object} IterateKeysCallbackObject
* @property {KeysCallback} [keys]
* @property {LinksCallback} [links]
* @property {SeeAlsoCallback} [seeAlso]
*/

/**
 * @typedef {object} SeeAlsoMeta
 * @property {string} id Refers to `WritingsJSON` key
 * @property {string} [text] The full text of the index entry
 * @property {boolean} [headings] Whether this meta to be shown as
 *   "See additional headings under"
 */

/**
 * A range of pages/paragraphs/verses.
 * @typedef {[string, string]} LinksMetaArray
 */

/**
 * @typedef {(string|LinksMetaArray)[]} LinksMeta
 */

/**
 * @typedef {string} TextMeta
 */

/**
 * @typedef {object} WritingsMeta
 * @property {LinksMeta} [$links]
 * @property {SeeAlsoMeta[]} [$seeAlso]
 * @property {TextMeta} [$text]
 * @property {WritingsMeta} [$children]
 */

/**
 * Keyed by id.
 * @typedef {Object<string, WritingsMeta>} WritingsJSON
 */

/**
* @typedef {GenericArray} KeyValue
* @property {string} 0 Key
* @property {WritingsMeta} 1 Value
*/

/**
 * @param {WritingsJSON} json
 * @param {IterateKeysCallbackObject} cbObj
 * @param {string} basePath
 * @param {KeyValue[]} parents
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
      [...parents, [key, val]]
    );
  });
}

const isValidLink = (link) => {
  return aqdasInternalLinksRegex.test(link) ||
    [
      // Could replace this with a Roman numeral regex
      'viii', 'ix', 'vii'
    ].includes(link);
};

/**
 * @param {WritingsJSON} json
 * @throws {Error}
 * @returns {void}
 */
function validate (json) {
  const indexEntryInfo = new Map();
  iterateKeys(json, {
    keys (indexName, basePath, val) {
      if (!val.$text) { // A hierarchical entry, but not a target of links
        return;
      }
      if (indexEntryInfo.has(indexName)) {
        console.log('Duplicate key: ' + indexName);
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
       * @throws {Error}
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
  iterateKeys(json, {
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
 * @param {WritingsJSON} json
 * @throws {Error}
 * @returns {void}
 */
async function arrangeByParagraph (json) {
  const badFullLabels = [];
  const paragraphToIndexEntries = {};
  iterateKeys(json, {
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
        const ret = Array.isArray(link)
          // These should already be the same type
          ? paragraphLink(link[0])
          : paragraphLink(link);

        if (!ret) {
          nonparagraphLinks.push(link);
        }
        return ret;
      });
      const setInfo = (p) => {
        const num = Number.parseInt(p.slice(1));
        if (!paragraphToIndexEntries[num]) {
          paragraphToIndexEntries[num] = [];
        }
        const ancestorsLabel = parents.map(
          ([k, v]) => (v.$text || k)
        ).join(', ');
        const childLabel = (val.$text || key);
        const fullLabel = (ancestorsLabel ? (ancestorsLabel + ', ') : '') +
          childLabel;
        if (!(/[`"A-Z]/u).test(fullLabel.charAt()) && !badFullLabels.includes(fullLabel)) {
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
          let [start, end] = ps.map((n) => Number.parseInt(n.slice(1)));
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
  // console.log(paragraphToIndexEntries);
  const data = JSON.stringify(paragraphToIndexEntries, null, 2);
  await Promise.all([
    writeFile(
      join(__dirname, '/../indexes/json-flattened/Kitáb-i-Aqdas.json'),
      data + '\n'
    ),
    writeFile(
      join(__dirname, '/../indexes/json-flattened/aqdas.js'),
      'export default ' + data + ';\n'
    )
  ]);
}

const aqdas = JSON.parse(
  await readFile(
    new URL('../indexes/json/books/Kitáb-i-Aqdas.json', import.meta.url)
  )
);
validate(aqdas);
await arrangeByParagraph(aqdas);
console.log('Complete!');
