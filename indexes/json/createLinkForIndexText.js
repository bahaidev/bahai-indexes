/**
 * @param {string} linkText
 * @returns {HTMLAnchorElement}
 */
function createLinkForIndexText (linkText) {
  const a = document.createElement('a');
  a.textContent = linkText;
  const firstChar = linkText.charAt();
  const number = linkText.match(/\d+/u);
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

  return a;
}

export default createLinkForIndexText;
