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

const changeSubmitter = ({target}) => {
  const {type, id} = target;

  let newURL;
  switch (type) {
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

const indexTermInput = $('#indexTerm');
const indexPageInput = $('#indexPage');

const url = new URL(location.href);

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

selectMenus.forEach((id) => setSelect(id));
selectMenusPages.forEach((id) => setSelect(id));
checkboxes.forEach((id) => setCheckbox(id));
checkboxesPages.forEach((id) => setCheckbox(id));
inputs.forEach((id) => setInput(id));
inputsPages.forEach((id) => setInput(id));
