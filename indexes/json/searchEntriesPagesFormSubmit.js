// /* eslint-disable no-unsanitized/property -- Source must be trusted as
//    we want its HTML */

import {$, httpquery} from './utils.js';
import {appendLinks, appendLinksToHolder} from './appendLinks.js';
import traverse from './traverse.js';

const resultsHolder = $('#searchEntriesPagesResults');

/**
 * @param {Event} e
 * @returns {Promise<void>}
 */
async function searchEntriesFormPagesSubmit (e) {
  e.preventDefault();
  resultsHolder.innerHTML = '';

  /**
   * @param {IndexObject} obj
   * @returns {boolean}
   */
  function isDirectMatch (obj) {
    return (obj.$links || []).find((link) => {
      if (Array.isArray(link)) {
        return (
          (/^\d/u).test(link[0]) && (/^\d/u).test(target) &&
          Number.parseInt(target) >= Number.parseInt(link[0]) &&
          Number.parseInt(target) <= Number.parseInt(link[1])
        ) || (
          (/^\D/u).test(link[0]) &&
          link[0].charAt() === target.charAt() &&
          Number.parseInt(target.slice(1)) >=
            Number.parseInt(link[0].slice(1)) &&
          Number.parseInt(target.slice(1)) <=
            Number.parseInt(link[1].slice(1))
        );
      }
      return link.toLowerCase() === target.toLowerCase();
    });
  }

  /**
   * @param {IndexObject} obj
   * @returns {{directMatch: boolean, match: boolean}}
   */
  function isMatch (obj) {
    const directMatch = isDirectMatch(obj);
    return {
      directMatch,
      match: directMatch ||
        Object.values(obj.$children || []).some((child) => {
          return isMatch(child);
        })
    };
  }

  // const mergeEntries = $('#mergeEntries').checked;
  const mergeLinks = $('#mergeLinksPages').checked;
  const entriesOrLinks = $('#entriesOrLinksPages').value;
  const target = $('#indexPage').value;
  const book = $('#booksPages').value;
  const jsonataBindings = {target};

  const bookChoice = `*[${book ? `book="${book}"` : 'book'}].index.`;

  const jsonataQuery = bookChoice +
  `
  *[$exists($.**[$filter(\`$links\`, function ($v) {
    (
      $type($v) = "array" and (
        (
          $contains($v[0], /^\\d/) and
          $contains($target, /^\\d/) and
          $number($target) >= $number($v[0]) and
          $number($target) <= $number($v[1])
        ) or (
          $contains($v[0], /^\\D/) and
          $substring($v[0], 0, 1) = $substring($target, 0, 1) and
          $number($substring($target, 1)) >=
            $number($substring($v[0], 1)) and
          $number($substring($target, 1)) <= $number($substring($v[1], 1))
        )
      )
    ) or (
      $type($v) = "string" and
      $lowercase($v) = $lowercase($target)
    )
  })])][]
  `.replaceAll('\n', ' ');

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
      const links = [];

      const addLink = (paths) => {
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
                ? paths
                : [`(${result.$book})`, ...paths]
            ).join(' > ');
          resultsHolder.append(heading);
          appendLinksToHolder(links, resultsHolder, result.$book);
          links.splice(0, links.length);
        }

        // RESET
        // paths.splice(0, paths.length);
      };
      traverse(result, null, (obj, _lastResult, paths) => {
        const {directMatch} = isMatch(obj);
        if (directMatch) {
          const totalLinks = obj.$links;
          paths.push(obj.$text);
          links.push(...totalLinks);
          addLink(paths);
        } else {
          paths.push(obj.$text);
        }
      });
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
    const ul = document.createElement('ul');
    const bookUl = book ? null : document.createElement('ul');
    const visited = {};
    results.forEach((result) => {
      let bookUlInner;
      if (!book) {
        const bookLi = document.createElement('li');
        bookLi.style.listStyleType = 'none';
        if (!visited[result.$book]) {
          const bold = document.createElement('b');
          bold.textContent = `[${result.$book}]`;
          bookLi.append(bold);
        }
        bookUlInner = document.createElement('ul');
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

    if (!bookUl) {
      resultsHolder.append(ul);
    }
  }
}

export default searchEntriesFormPagesSubmit;
