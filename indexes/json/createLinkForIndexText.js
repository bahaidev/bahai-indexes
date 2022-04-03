/**
 * @param {string} linkText
 * @param {string} book
 * @throws {Error}
 * @returns {HTMLAnchorElement}
 */
function createLinkForIndexText (linkText, book) {
  if (Array.isArray(linkText)) {
    const frag = document.createDocumentFragment();
    frag.append(
      createLinkForIndexText(linkText[0], book),
      '-',
      createLinkForIndexText(linkText[1], book)
    );
    return frag;
  }
  const a = document.createElement('a');
  a.textContent = linkText;
  const firstChar = linkText.charAt();
  const number = linkText.match(/\d+/u)[0];
  switch (book) {
  case 'Kitáb-i-Aqdas':
    switch (firstChar) {
    case 'n':
      a.href = 'https://bahai-library.com/writings/bahaullah' +
        '/aqdas/kaall.html#note' + number;
      break;
    case 'Q':
      a.href = 'https://bahai-library.com/writings/bahaullah' +
        '/aqdas/kaall.html#q' + number;
      break;
    case 'K':
      a.href = 'https://bahai-library.com/writings/bahaullah' +
        '/aqdas/kaall.html#par' + number;
      break;
    default:
      a.href = 'https://bahai-library.com/writings/bahaullah' +
        '/aqdas/kaall.html#' + linkText;
      break;
    }
    break;
  case 'Kitáb-i-Íqán':
    switch (firstChar) {
    case 'G':
      a.href = 'https://bahai-library.com/writings/bahaullah/iqan/' +
        'iq-glos.htm#' + number.padStart(3, '0');
      break;
    default: {
      const integer = Number.parseInt(number);
      const bookNumber = integer < 95 ? 1 : 2;
      a.href = `https://bahai-library.com/writings/bahaullah/iqan/iq-${
        bookNumber
      }.htm#` + number;
      break;
    }
    }

    break;
  default:
    throw new Error(`Unknown book ${book}`);
  }

  return a;
}

export default createLinkForIndexText;
