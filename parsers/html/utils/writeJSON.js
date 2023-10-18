import {writeFile} from 'fs/promises';

/**
 * @param {string} writePath
 * @param {JSON} json
 * @returns {Promise<writePath>}
 */
async function writeJSON (writePath, json) {
  return await writeFile(
    writePath,
    JSON.stringify(json, null, 2) + '\n'
  );
}

export default writeJSON;
