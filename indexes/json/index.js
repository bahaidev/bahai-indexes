import {$, httpquery} from './utils.js';
import searchEntriesFormSubmit from './searchEntriesFormSubmit.js';
import searchEntriesPagesFormSubmit from './searchEntriesPagesFormSubmit.js';

(await httpquery('books.json', {
  query: '*.book[]',
  bindings: '{}'
})).forEach((book) => {
  const option = document.createElement('option');
  option.textContent = book;
  $('#books').append(option);
  $('#booksPages').append(option.cloneNode(true));
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
searchEntriesPagesForm.addEventListener('submit', searchEntriesPagesFormSubmit);

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
collapseSearchEntries.addEventListener('click', changeSubmitter);
collapseSearchEntriesPages.addEventListener('click', changeSubmitter);

const indexTermInput = $('#indexTerm');
const indexPageInput = $('#indexPage');

const url = new URL(location.href);

const setCollapseState = () => {
  const param = url.searchParams.get('collapse');

  switch (param) {
  case 'collapseSearchEntriesPages':
    searchEntriesForm.hidden = false;
    searchEntriesPagesForm.hidden = true;
    collapseSearchEntries.style.display = 'block';
    collapseSearchEntriesPages.style.display = 'none';
    expandAll.hidden = false;
    break;
  case 'collapseSearchEntries':
    searchEntriesForm.hidden = true;
    searchEntriesPagesForm.hidden = false;
    collapseSearchEntries.style.display = 'none';
    collapseSearchEntriesPages.style.display = 'block';
    expandAll.hidden = false;
    break;
  // case 'expandAll':
  default:
    searchEntriesForm.hidden = false;
    searchEntriesPagesForm.hidden = false;
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

setCollapseState();
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
