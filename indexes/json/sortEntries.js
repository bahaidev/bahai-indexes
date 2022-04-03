/**
 * @param {string} a First item to compare
 * @param {string} b Second item to compare
 * @returns {1|-1|0}
 */
function sortEntries (a, b) {
  const aFirst = Array.isArray(a) ? a[0] : a;
  const bFirst = Array.isArray(b) ? b[0] : b;
  const numA = Number.parseInt(aFirst);
  const numB = Number.parseInt(bFirst);
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
    const firstCharA = aFirst.charAt();
    const firstCharB = bFirst.charAt();
    if (firstCharA !== firstCharB) {
      return firstCharA < firstCharB ? -1 : firstCharA > firstCharB ? 1 : 0;
    }
    const numPartA = Number.parseInt(aFirst.match(/\d+/u));
    const numPartB = Number.parseInt(bFirst.match(/\d+/u));
    return numPartA < numPartB ? -1 : numPartA > numPartB ? 1 : 0;
  }

  return numA < numB ? -1 : numA > numB ? 1 : 0;
}

export default sortEntries;
