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

  const mergeLinks = $('#mergeLinks').checked;
  const exactMatch = $('#exactMatch').checked;
  const matchCase = $('#matchCase').checked;
  const topLevelOnly = $('#topLevelOnly').checked;
  const entriesOrLinks = $('#entriesOrLinks').value;
  const target = $('#indexTerm').value;
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
    'books.json',
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
        rootLinks[result.$book].push(...links);
      } else {
        const heading = document.createElement('h4');
        heading.innerHTML =
          (
            book
              ? indexPath
              : [`(${result.$book})`, ...indexPath]
          ).join(' > ');
        resultsHolder.append(heading);
        appendLinksToHolder(links, resultsHolder, result.$book);
      }
    });
    if (mergeLinks) {
      Object.entries(rootLinks).forEach(([currentBook, links]) => {
        if (!book) {
          const bookHeading = document.createElement('b');
          bookHeading.textContent = currentBook;
          resultsHolder.append(bookHeading);
        }
        appendLinksToHolder(links, resultsHolder, currentBook);
      });
    }
  } else {
    // const mergeEntries = $('#mergeEntries').checked;

    const ul = document.createElement('ul');
    const bookUl = book ? null : document.createElement('ul');
    const visited = {};
    results.forEach((result) => {
      let bookUlInner;
      if (!book && !visited[result.$book]) {
        const bookLi = document.createElement('li');
        const bold = document.createElement('b');
        bookUlInner = document.createElement('ul');
        bold.textContent = `[${result.$book}]`;
        bookLi.append(bold);
        bookLi.append(bookUlInner);
        bookUl.append(bookLi);

        resultsHolder.append(bookUl);
        visited[result.$book] = true;
      }
      traverse(result, bookUlInner || ul, (obj, parent) => {
        const li = document.createElement('li');
        li.innerHTML = obj.$text;
        const links = obj.$links || [];

        if (entriesOrLinks === 'both') {
          if (links.length) {
            li.append(' - ');
            appendLinks(links, li, result.$book);
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

    if (!bookUl) resultsHolder.append(ul);
  }
}

export default searchEntriesFormSubmit;
