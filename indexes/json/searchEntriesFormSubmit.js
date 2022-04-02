/* eslint-disable no-unsanitized/property -- Source must be trusted as
    we want its HTML */

import {$, httpquery} from './utils.js';
import {appendLinks, appendLinksToHolder} from './appendLinks.js';
import traverse from './traverse.js';

const resultsHolder = $('#searchEntriesResults');

/**
 * @param {Event} e
 * @returns {Promise<void>}
 */
async function searchEntriesFormSubmit (e) {
  e.preventDefault();
  resultsHolder.innerHTML = '';

  /**
   * @param {IndexObject} obj
   * @returns {boolean}
   */
  function isMatch (obj) {
    return exactMatch
      ? matchCase
        ? target === obj.$text
        : target.toLowerCase() === obj.$text.toLowerCase()
      : matchCase
        ? obj.$text.includes(target)
        : obj.$text.toLowerCase().includes(target.toLowerCase());
  }

  const mergeLinks = $('#merge-links').checked;
  const exactMatch = $('#exact-match').checked;
  const matchCase = $('#match-case').checked;
  const topLevelOnly = $('#top-level-only').checked;
  const entriesOrLinks = $('#entries-or-links').value;
  const target = $('#index-term').value;
  const book = $('#books').value;
  const jsonataBindings = {target};

  const bookChoice = `*[${book ? `book="${book}"` : 'book'}].index.`;

  // We don't really need jsonata as much since we have to iterate
  const jsonataQuery = exactMatch
    ? matchCase
      ? topLevelOnly
        ? bookChoice + '*[`$text` = $target][$exists($.**.`$links`)][]'
        : bookChoice + '*[`$text`][$exists(' +
          '$.**[`$text` = $target][$exists($.**.`$links`)]' +
        ')][]'
      : topLevelOnly
        ? bookChoice + '*[$lowercase(`$text`) = $lowercase($target)]' +
          '[$exists($.**.`$links`)][]'
        : bookChoice + '*[`$text`][$exists(' +
          '$.**[$lowercase(`$text`) = $lowercase($target)]' +
            '[$exists($.**.`$links`)]' +
        ')][]'
    : matchCase
      ? topLevelOnly
        ? bookChoice + '*[$contains(`$text`, ' +
          '$target)][$exists($.**.`$links`)][]'
        : bookChoice + '*[`$text`][$exists($.**[$contains(`$text`, ' +
          '$target)])][$exists($.**.`$links`)][]'
      : topLevelOnly
        ? bookChoice + '*[$contains($lowercase(`$text`), ' +
          '$lowercase($target))][$exists($.**.`$links`)][]'
        : bookChoice + '*[`$text`][$exists($.**[$contains(' +
          '$lowercase(`$text`), $lowercase($target))])]' +
            '[$exists($.**.`$links`)][]';

  const results = await httpquery(
    'http://127.0.0.1:1337/books.json',
    {
      query: jsonataQuery,
      bindings: jsonataBindings
    }
  );

  if (entriesOrLinks === 'links-only') {
    const rootLinks = {};
    results.forEach((result) => {
      let matched = false;
      const indexPath = [];
      const links = [];
      if (topLevelOnly) {
        indexPath.push(result.$text);
      }
      traverse(result, null, (obj, _lastResult, paths) => {
        if (topLevelOnly) {
          links.push(...(obj.$links || []));
          matched = true;
        } else if (!matched) {
          if (isMatch(obj)) {
            const totalLinks = obj.$links || [];
            if (totalLinks.length) {
              indexPath.push(...(paths || []), obj.$text);
              matched = true;
            }
            // Ensure heading is available if matching below
            if (!totalLinks.length) {
              indexPath.push(obj.$text);
            }
            traverse(obj, null, (o) => {
              const countedLinks = o.$links || [];
              if (countedLinks.length) {
                links.push(...countedLinks);
                matched = true;
              }
            });
          }
        }
        paths.push(obj.$text);
      });

      if (!matched) {
        return;
      }
      if (mergeLinks) {
        if (!rootLinks[result.$book]) {
          rootLinks[result.$book] = [];
        }
        rootLinks[result.$book].push(links);
      } else {
        const heading = document.createElement('h4');
        heading.innerHTML =
          (
            book
              ? indexPath
              : [`(${result.$book})`, ...indexPath]
          ).join(' > ');
        resultsHolder.append(heading);
        appendLinksToHolder(links, resultsHolder);
      }
    });
    if (mergeLinks) {
      Object.entries(rootLinks).forEach(([currentBook, links]) => {
        if (!book) {
          const bookHeading = document.createElement('b');
          bookHeading.textContent = currentBook;
          resultsHolder.append(bookHeading);
        }
        appendLinksToHolder(links, resultsHolder);
      });
    }
  } else {
    // const mergeEntries = $('#merge-entries').checked;

    const ul = document.createElement('ul');
    let bookUl;
    results.forEach((result) => {
      if (!book) {
        bookUl = document.createElement('ul');
        const bookLi = document.createElement('li');
        const bold = document.createElement('b');
        bold.textContent = `[${result.$book}]`;
        bookLi.append(bold);
        bookLi.append(ul);
        bookUl.append(bookLi);
      }
      traverse(result, ul, (obj, parent) => {
        const li = document.createElement('li');
        li.innerHTML = obj.$text;
        const links = obj.$links || [];

        if (entriesOrLinks === 'both') {
          if (links.length) {
            li.append(' - ');
            appendLinks(links, li);
          }
        }
        parent.append(li);
        if (obj.$children) {
          const innerUl = document.createElement('ul');
          li.append(innerUl);
          return innerUl;
        }
        return li;
      });
    });

    resultsHolder.append(bookUl || ul);
  }
}

export default searchEntriesFormSubmit;