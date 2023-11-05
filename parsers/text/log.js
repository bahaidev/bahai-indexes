import {readFile} from 'fs/promises';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import writeJSON from '../html/utils/writeJSON.js';

/**
 * @param {JSON} target
 * @param {string} $text
 * @param {(string|[string, string])[]} $links
 * @param {string} seeAlso
 * @param {string} seeAlsoText
 * @returns {void}
 */
function processItem (target, $text, $links, seeAlso, seeAlsoText) {
  target[$text] = {
    $text
  };
  if ($links) {
    target[$text].$links = $links;
  }
  if (seeAlso) { // This form of seeAlso only present on main
    processSeeAlso(target, $text, seeAlso, seeAlsoText);
  }
}

/**
 * @param {JSON} target
 * @param {string} $text
 * @param {string} seeAlso
 * @param {string} seeAlsoText
 * @returns {void}
 */
function processSeeAlso (target, $text, seeAlso, seeAlsoText) {
  if (!target[$text].$seeAlso) {
    target[$text].$seeAlso = [];
  }
  target[$text].$seeAlso.push(
    ...seeAlso.trim().split('; ').map((id) => {
      const obj = {id};
      if (!['see also', 'see'].includes(seeAlsoText)) {
        console.log('seeAlso', seeAlso);
        throw new Error('Unexpected SeeAlso');
      }
      return obj;
    })
  );
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const file = join(__dirname, '/../../indexes/text/Lights of Guidance.txt');
const fileContents = await readFile(file, 'utf8');

const lines = fileContents.split('\n').filter(Boolean);

const jsonIndex = {};

let lastMainParentText, lastChildParentText;
lines.forEach((line) => {
  const childDepth = line.match(/^\t+/u)?.[0];
  line = line.replace(/^\t+/u, '');

  let text, links, seeAlso, seeAlsoText;
  // Has links
  ({groups: {text, links, seeAlso, seeAlsoText}} =
    (/(?<text>^.*?)(?:, (?<links>\d[\d, -]*))(?:<i>(?<seeAlsoText>.*?)<\/i>(?<seeAlso>.*))?$/u).exec(line) || {groups: {}});
  if (!text) {
    // See or children only
    ({groups: {
      text, links, seeAlso, seeAlsoText
    }} = (/(?<text>^[\wáí'() ,;-]+?)(?:<i>(?<seeAlsoText>.*?)<\/i>(?<seeAlso>.*))?$/u).exec(line) || {groups: {}});
  }

  if (!text && childDepth) {
    ({groups: {
      seeAlsoText,
      seeAlso
    }} = (/(?:<i>(?<seeAlsoText>.*?)\s*<\/i>(?<seeAlso>.*))$/u).exec(line) || {groups: {}});

    if (!seeAlso) {
      console.log('Expected see also', JSON.stringify(line));
      throw new Error('No expected see also');
    }

    if (childDepth.length === 2) {
      processSeeAlso(
        jsonIndex[lastMainParentText].$children,
        lastChildParentText,
        seeAlso,
        seeAlsoText
      );
      return;
    }

    if (!lastMainParentText) {
      console.log('No previous lastMainParentText', JSON.stringify(line));
      throw new Error('No previous lastMainParentText');
    }

    processSeeAlso(jsonIndex, lastMainParentText, seeAlso, seeAlsoText);
    return;
  }

  if (!text) {
    console.log('Missing', JSON.stringify(line));
    throw new Error('Missing $text');
  }

  let $links;
  if (links) {
    const l = links.split(', ');
    const decimal = /^(?:\d+)(?:-\d+)?$/u;
    const badLink = l.find((link) => {
      return !decimal.test(link);
    });
    if (badLink) {
      console.log('Number', JSON.stringify(badLink));
      throw new Error('Number in bad format');
    }

    $links = l.map((link) => {
      return link.includes('-') ? link.split('-') : link;
    });
  }

  const $text = text.trim();
  if (childDepth && childDepth.length === 2) {
    const topObj = jsonIndex[lastMainParentText];
    if (!topObj.$children[lastChildParentText].$children) {
      topObj.$children[lastChildParentText].$children = {};
    }
    processItem(
      topObj.$children[lastChildParentText].$children,
      $text, $links, seeAlso, seeAlsoText
    );
  } else if (childDepth) {
    if (!jsonIndex[lastMainParentText].$children) {
      jsonIndex[lastMainParentText].$children = {};
    }
    processItem(
      jsonIndex[lastMainParentText].$children,
      $text, $links, seeAlso, seeAlsoText
    );
    lastChildParentText = $text;
  } else {
    processItem(jsonIndex, $text, $links, seeAlso, seeAlsoText);
    lastMainParentText = $text;
  }
});

// console.log('lines', lines);

const writePath = join(
  __dirname, '/../../indexes/json/books/Lights of Guidance.json'
);
await writeJSON(writePath, jsonIndex);
console.log(`Wrote to ${writePath}`);
