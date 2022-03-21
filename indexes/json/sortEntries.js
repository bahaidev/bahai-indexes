/**
 * @param {string} a First item to compare
 * @param {string} b Second item to compare
 * @returns {1|-1|0}
 */
function sortEntries (a, b) {
  const numA = Number.parseInt(a);
  const numB = Number.parseInt(b);
  if (
    Number.isNaN(numA) && !Number.isNaN(numB)
  ) {
    return 1;
  }
  if (
    !Number.isNaN(numA) && Number.isNaN(numB)
  ) {
    return -1;
  }
  if (Number.isNaN(numA)) { // Both are not numbers
    const firstCharA = a.charAt();
    const firstCharB = b.charAt();
    if (firstCharA !== firstCharB) {
      return firstCharA < firstCharB ? -1 : firstCharA > firstCharB ? 1 : 0;
    }
    const numPartA = Number.parseInt(a.match(/\d+/u));
    const numPartB = Number.parseInt(b.match(/\d+/u));
    return numPartA < numPartB ? -1 : numPartA > numPartB ? 1 : 0;
  }

  return numA < numB ? -1 : numA > numB ? 1 : 0;
}

export default sortEntries;
