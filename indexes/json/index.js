import {$, $$, httpquery, populateFullIndex} from './utils.js';
import searchEntriesFormSubmit from './searchEntriesFormSubmit.js';
import searchEntriesPagesFormSubmit from './searchEntriesPagesFormSubmit.js';

/**
 * @param {Event} e
 * @returns {void}
 */
async function linkOpener (e) {
  e.preventDefault();
  $$('#linkList a').forEach((a) => {
    a.classList.remove('selected-link');
  });
  e.target.classList.add('selected-link');

  const book = e.target.textContent;
  $('#chosenIndex').textContent = book;

  if (e.manuallyTriggered !== false) {
    const queryParams = new URLSearchParams(location.search);
    queryParams.delete('entry');
    queryParams.set('book', book);
    history.pushState(null, null, '?' + queryParams.toString());
  }

  const jsonataQuery = `*[${`book="${book}"`}].index`;
  const results = await httpquery(
    'books.json',
    {
      query: jsonataQuery,
      bindings: {}
    }
  );

  const resultsHolder = $('#indexView');
  resultsHolder.textContent = '';
  const newResultsHolder = resultsHolder.cloneNode(true);
  resultsHolder.replaceWith(newResultsHolder);

  newResultsHolder.addEventListener('click', (ev) => {
    if (ev.target.nodeName.toLowerCase() !== 'a' || !ev.target.dataset.id) {
      return;
    }

    ev.preventDefault();
    const targetedEntry = $('#' + CSS.escape(ev.target.dataset.id));

    const params = new URLSearchParams(location.search);
    params.set('entry', ev.target.dataset.id);
    history.pushState(null, null, '?' + params.toString());

    targetedEntry.scrollIntoView();
  });
  const ul = document.createElement('ul');
  Object.entries(results).forEach(([
    id,
    result
    /* {
      $links,
      $seeAlso,
      $text,
      $children
    } */
  ]) => {
    populateFullIndex({result, ul, id});
  });
  newResultsHolder.append(ul);
}

(await httpquery('books.json', {
  query: '*.book[]',
  bindings: '{}'
})).forEach((book) => {
  // OPTIONS
  const option = document.createElement('option');
  option.textContent = book;
  $('#books').append(option);
  $('#booksPages').append(option.cloneNode(true));

  // LINKS
  const a = document.createElement('a');
  a.href = '#';
  a.addEventListener('click', linkOpener);
  a.textContent = book;
  const li = document.createElement('li');
  li.append(a);
  $('#linkList').append(li);
});

const searchEntriesForm = $('#searchEntries');

const searchEntriesPagesForm = $('#searchEntriesPages');

const selectMenus = [
  'entriesOrLinks',
  'books'
];
const selectMenusPages = [
  'entriesOrLinksPages',
  'booksPages'
];

const checkboxes = [
  'exactMatch',
  'matchCase',
  'topLevelOnly',
  'mergeEntries',
  'mergeLinks'
];
const checkboxesPages = [
  'mergeLinksPages',
  'mergeEntriesPages'
];

const inputs = [
  'indexTerm'
];
const inputsPages = [
  'indexPage'
];

searchEntriesForm.addEventListener('submit', searchEntriesFormSubmit);
searchEntriesPagesForm.addEventListener(
  'submit', searchEntriesPagesFormSubmit
);

const storeInput = (id) => {
  const newURL = new URL(location.href);

  const [set, remove] = id === 'indexTerm'
    ? ['indexTerm', 'indexPage']
    : ['indexPage', 'indexTerm'];

  newURL.searchParams.set(set, $('#' + id).value);
  // Will interfere otherwise
  newURL.searchParams.delete(remove);

  return newURL.toString();
};

const storeSelect = (id) => {
  const newURL = new URL(location.href);
  newURL.searchParams.set(id, $('#' + id).selectedIndex);
  return newURL.toString();
};

const storeCheckbox = (id) => {
  const newURL = new URL(location.href);
  newURL.searchParams.set(id, $('#' + id).checked ? '1' : '0');
  return newURL.toString();
};

const adjustCollapseState = (id) => {
  const newURL = new URL(location.href);
  newURL.searchParams.set('collapse', id);
  return newURL.toString();
};

const changeSubmitter = ({target}) => {
  const {type, id} = target;

  let newURL;
  switch (type) {
  case 'submit': // Button
    newURL = adjustCollapseState(id);
    break;
  case 'text':
    newURL = storeInput(id);
    break;
  case 'checkbox':
    newURL = storeCheckbox(id);
    break;
  case 'select-one':
    newURL = storeSelect(id);
    break;
  default:
    throw new TypeError('Unknown type' + target.outerHTML);
  }

  location.href = newURL.toString();
};
searchEntriesForm.addEventListener('change', changeSubmitter);
searchEntriesPagesForm.addEventListener('change', changeSubmitter);

const collapseSearchEntries = $('#collapseSearchEntries');
const collapseSearchEntriesPages = $('#collapseSearchEntriesPages');
const expandAll = $('#expandAll');

expandAll.addEventListener('click', changeSubmitter);

const linkViewer = $('#linkViewer');
const openLinkList = $('#openLinkList');

openLinkList.addEventListener('click', changeSubmitter);

collapseSearchEntries.addEventListener('click', changeSubmitter);
collapseSearchEntriesPages.addEventListener('click', changeSubmitter);

const indexTermInput = $('#indexTerm');
const indexPageInput = $('#indexPage');

let url = new URL(location.href);

const setCollapseState = async () => {
  const param = url.searchParams.get('collapse');

  switch (param) {
  case 'openLinkList': {
    searchEntriesPagesForm.classList.add('hidden');
    searchEntriesForm.classList.add('hidden');
    linkViewer.classList.remove('hidden');
    const book = url.searchParams.get('book');
    if (book) {
      let lastA;
      if ($$('#linkList a').some((a) => {
        if (a.textContent === book) {
          lastA = a;
          return true;
        }
        return false;
      })) {
        await linkOpener({
          manuallyTriggered: false,
          preventDefault () {
            // Dummy
          },
          target: lastA
        });

        const entry = url.searchParams.get('entry');
        if (entry) {
          const targetedEntry = $('#' + CSS.escape(entry));
          if (targetedEntry) {
            targetedEntry.scrollIntoView();
          }
        }
      }
    }
    break;
  } case 'collapseSearchEntriesPages':
    searchEntriesForm.classList.remove('hidden');
    searchEntriesForm.classList.add('shownAlone');
    searchEntriesPagesForm.classList.add('hidden');
    linkViewer.classList.add('hidden');
    searchEntriesPagesForm.classList.remove('shownAlone');
    collapseSearchEntries.style.display = 'block';
    collapseSearchEntriesPages.style.display = 'none';
    expandAll.hidden = false;
    break;
  case 'collapseSearchEntries':
    searchEntriesForm.classList.remove('shownAlone');
    searchEntriesForm.classList.add('hidden');
    linkViewer.classList.add('hidden');
    searchEntriesPagesForm.classList.add('shownAlone');
    searchEntriesPagesForm.classList.remove('hidden');
    collapseSearchEntries.style.display = 'none';
    collapseSearchEntriesPages.style.display = 'block';
    expandAll.hidden = false;
    break;
  // case 'expandAll':
  default:
    searchEntriesForm.classList.remove('hidden');
    searchEntriesForm.classList.remove('shownAlone');
    searchEntriesPagesForm.classList.remove('hidden');
    searchEntriesPagesForm.classList.remove('shownAlone');
    collapseSearchEntries.style.display = 'block';
    collapseSearchEntriesPages.style.display = 'block';
    expandAll.hidden = true;
    break;
  }
};

const setSelect = (id) => {
  const param = url.searchParams.get(id);
  $('#' + id).selectedIndex = Number.parseInt(param);
};

const setCheckbox = (id) => {
  const param = url.searchParams.get(id);
  $('#' + id).checked = param === '1';
};

const setInput = (id) => {
  const param = url.searchParams.get(id);
  const input = $('#' + id);
  input.value = param;

  if (!param) {
    return;
  }

  if (id === 'indexTerm') {
    searchEntriesFormSubmit(new Event('submit'));
    indexTermInput.focus();
  } else if (id === 'indexPage') {
    searchEntriesPagesFormSubmit(new Event('submit'));
    indexPageInput.focus();
  }
};

// Default
indexTermInput.focus();

await setCollapseState();
selectMenus.forEach((id) => setSelect(id));
selectMenusPages.forEach((id) => setSelect(id));
checkboxes.forEach((id) => setCheckbox(id));
checkboxesPages.forEach((id) => setCheckbox(id));
inputs.forEach((id) => setInput(id));
inputsPages.forEach((id) => setInput(id));

// Reenable
const fieldsets = document.querySelectorAll('fieldset');
fieldsets.forEach((fieldset) => {
  fieldset.disabled = false;
});

window.addEventListener('popstate', () => {
  // Use fresh copy of location as will otherwise use stale info
  url = new URL(location.href);
  setTimeout(async () => {
    await setCollapseState();
  });
});
