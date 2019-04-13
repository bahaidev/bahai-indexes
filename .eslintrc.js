module.exports = {
  extends: [
    "ash-nazg/sauron-node"
  ],
  parserOptions: {
    sourceType: "module"
  },
  // Need to make explicit here for processing by jsdoc/check-examples
  plugins: [],
  env: {
    browser: false,
    node: true
  },
  settings: {
    polyfills: [
      "Array.isArray",
      "Blob",
      "console",
      "Date.now",
      "document.body",
      "document.evaluate",
      "document.head",
      "document.importNode",
      "document.querySelector", "document.querySelectorAll",
      "DOMParser",
      "Error",
      "fetch",
      "FileReader",
      "history.pushState",
      "history.replaceState",
      "JSON",
      "location.href",
      "location.origin",
      "MutationObserver",
      "Object.assign", "Object.defineProperty", "Object.defineProperties",
      "Object.getOwnPropertyDescriptor",
      "Object.entries", "Object.keys", "Object.values",
      "Promise",
      "Set",
      "Uint8Array",
      "URL",
      "window.getComputedStyle",
      "window.postMessage",
      "window.scrollX", "window.scrollY",
      "XMLHttpRequest",
      "XMLSerializer"
    ],
    jsdoc: {
      additionalTagNames: {
        // In case we need to extend
        customTags: []
      },
      tagNamePreference: {
        arg: "param",
        return: "returns"
      },
      allowOverrideWithoutParam: true,
      allowImplementsWithoutParam: true,
      allowAugmentsExtendsWithoutParam: true,
      // For `jsdoc/check-examples` in `ash-nazg`
      matchingFileName: "dummy.md",
      rejectExampleCodeRegex: "^`",
    }
  },
  rules: {
    // Override these `ash-nazg/sauron` rules which are difficult for us
    //   to apply at this time
    "import/unambiguous": 0,
    "import/no-commonjs": 0,
    "compat/compat": 0,
    "no-sync": 0,
    "no-shadow": 0,
    "no-console": 0
  }
};
