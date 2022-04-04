# bahai-indexes

Indexes to the Bahá'í Writings in JSON format, along with some
tools to convert from the original (idiosyncratic) HTML versions.

```shell
npm i bahai-indexes
```

Note that any copyright that applies for the original indexes follows its own
copyright.

**NOTE: This project only has an index for the following files at present!**

## Sources

-  *Kitáb-i-Aqdas* (`aqdas`) - From <http://bahai-library.com/writings/bahaullah/aqdas/aqdas2/aqdas-allindex.html>;
    view within queries against the following (currently Chrome only:
    <https://bahai-browser.org/#lang=en-US&work=aqdas>).

## Higher priority to-dos

1. Put web app online and add link here
1. Add books

## Medium priority to-dos

1. Delete unused URL params
1. Merging of entries option
1. Ideally add categories, even to each entry level, and allow merging
1. Editing
    1. Add category mechanism for adding categories (and categories for these
        categories) to top-level index items (for a completely subject-based
        sorting, as with
        <http://bahai-library.com/hornby_lights_guidance#topicalcontents>).
    1. Ability to mark-up any two entries as identical, e.g.,
        "Hair, does not invalidate prayer" and
        "Prayer, hair does not invalidate", so that could optionally avoid
        showing duplicates (though admittedly not exactly duplicates based
        on difference of emphasis)

## Lower priority to-dos

1. Add JSON Schema for each schema and any fixed rules into an abstract schema
