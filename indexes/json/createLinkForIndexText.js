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
  const number = linkText.match(/\d+/u)?.[0];
  switch (book) {
  case 'Lights of Guidance': {
    a.href = 'https://bahai-library.com/jumpto2.php?booklist=http%3A%2F%2Fbahai-library.com%2Fhornby_lights_guidance%26chapter%3D%2B%2B%2B%23n%40%40%40&search=' + linkText;
    break;
  } case 'Some Answered Questions': {
    // There are also Roman numeral links to detect, but our online
    //  copy doesn't have those page anchors apparently

    // CHAPTER+PARAGRAPH
    let {groups: {num, par}} = linkText.match(
      /^(?<num>\d+)\.(?<par>\d+)$/u
    ) || {groups: {}};
    if (num) {
      a.href = 'https://bahai-library.com/abdul-baha_some_answered_questions#par' +
                num + '-' + par;
    } else {
      // CHAPTER ONLY
      ({groups: {num}} = linkText.match(
        /^(?<num>\d+)$/u
      ) || {groups: {}});
      if (num) {
        a.href = 'https://bahai-library.com/abdul-baha_some_answered_questions#chapter' +
                  num;
      } else {
        // FOOTNOTE
        const {groups: {footnote}} = linkText.match(
          /^(?<num>\d+)\.(?<par>\d+)n(?<footnote>\d+)$/u
        ) || {groups: {}};
        if (footnote) {
          a.href = 'https://bahai-library.com/abdul-baha_some_answered_questions#endnote-body-' +
          footnote;
        }
      }
    }

    break;
  } case 'Gleanings':
    a.href = 'https://bahai-library.com/writings/bahaullah/' +
      'gwb/gleaningsall.html#' + number;
    break;
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
