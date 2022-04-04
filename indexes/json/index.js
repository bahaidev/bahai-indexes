import {$, httpquery} from './utils.js';
import searchEntriesFormSubmit from './searchEntriesFormSubmit.js';
import searchEntriesPagesFormSubmit from './searchEntriesPagesFormSubmit.js';

const namespace = 'bahai-indexes-';

const books = await httpquery(
  'books.json',
  {
    query: '*.book[]',
    bindings: '{}'
  }
);
books.forEach((book) => {
  const option = document.createElement('option');
  option.textContent = book;
  $('#books').append(option);
  $('#books-pages').append(option.cloneNode(true));
});

const searchEntriesForm = $('#searchEntries');

const searchEntriesPagesForm = $('#searchEntriesPages');

const selectMenus = [
  'entries-or-links',
  'books'
];
const selectMenusPages = [
  'entries-or-links-pages',
  'books-pages'
];

const checkboxes = [
  'exact-match',
  'match-case',
  'top-level-only',
  'merge-entries',
  'merge-links'
];
const checkboxesPages = [
  'merge-links-pages',
  'merge-entries-pages'
];

searchEntriesForm.addEventListener('submit', searchEntriesFormSubmit);
searchEntriesPagesForm.addEventListener('submit', searchEntriesPagesFormSubmit);

const storeSelect = (id) => {
  localStorage.setItem(
    namespace + id, $('#' + id).selectedIndex
  );
};

const storeCheckbox = (id) => {
  localStorage.setItem(namespace + id, $('#' + id).checked);
};

searchEntriesForm.addEventListener('change', () => {
  selectMenus.forEach((id) => storeSelect(id));
  checkboxes.forEach((id) => storeCheckbox(id));

  searchEntriesFormSubmit(new Event('submit'));
});

searchEntriesPagesForm.addEventListener('change', () => {
  selectMenusPages.forEach((id) => storeSelect(id));
  checkboxesPages.forEach((id) => storeCheckbox(id));

  searchEntriesPagesFormSubmit(new Event('submit'));
});

const indexTermInput = $('#index-term');
indexTermInput.addEventListener('change', (e) => {
  const url = new URL(location.href);
  url.searchParams.set('indexTerm', e.target.value);
  url.searchParams.delete('indexPage');
  location.href = url.toString();
});
indexTermInput.focus();

const indexPageInput = $('#index-page');
indexPageInput.addEventListener('change', (e) => {
  const url = new URL(location.href);
  url.searchParams.set('indexPage', e.target.value);
  url.searchParams.delete('indexTerm'); // Will interfere otherwise
  location.href = url.toString();
});

const setMenu = (id) => {
  $('#' + id).selectedIndex = localStorage.getItem(
    namespace + id
  );
};

const setCheckbox = (id) => {
  $('#' + id).checked = localStorage.getItem(
    namespace + id
  ) === 'true';
};

selectMenus.forEach((id) => setMenu(id));
selectMenusPages.forEach((id) => setMenu(id));
checkboxes.forEach((id) => setCheckbox(id));
checkboxesPages.forEach((id) => setCheckbox(id));

const indexTerm = new URL(location.href).searchParams.get('indexTerm');
const indexPage = new URL(location.href).searchParams.get('indexPage');

if (indexTerm) {
  indexTermInput.value = indexTerm;
  searchEntriesFormSubmit(new Event('submit'));
} else if (indexPage) {
  indexPageInput.value = indexPage;
  searchEntriesPagesFormSubmit(new Event('submit'));
  indexPageInput.focus();
}
