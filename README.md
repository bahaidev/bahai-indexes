# bahai-indexes

Indexes to the Bahá'í Writings in JSON format, along with some
tools to convert from the original (idiosyncratic) HTML versions.

```shell
npm i bahai-indexes
```

Note that any copyright that applies for the original indexes follows its own
copyright.

You can see a [**Demo**](https://bahai-browser.org/indexes/json/?indexTerm=God&entriesOrLinks=2).

**NOTE: This project only has an index for the following files at present!**

## Sources

-  *Kitáb-i-Aqdas* - From <http://bahai-library.com/writings/bahaullah/aqdas/aqdas2/aqdas-allindex.html>;
    view within queries against the following (currently Chrome only:
    <https://bahai-browser.org/#lang=en-US&work=aqdas>).

-  *Kitáb-i-Íqán* - From <https://bahai-library.com/writings/bahaullah/iqan/iq-indx.htm>.

- *Gleanings* - From <https://bahai-library.com/zamir/indexes/gleaningsindex.html>.

- *Some Answered Questions* - From <https://bahai-library.com/zamir/indexes/Some%20Answered%20Questions%20(2015)%20%20INDEX%20copy.html>.

- *Lights of Guidance* - From <https://bahai-library.com/hornby_lights_guidance> (using
    a script at <https://bahai-library.com/jumpto2.php>
    for pagination)

## Higher priority to-dos

1. Add more books (see <https://bahai-library.com/zamir_temp_indexes>)
1. Option to search word boundaries

## Medium priority to-dos

1. Delete unused URL params
1. Fix individual broken "See also" entries
1. Merging of entries option
1. Could make agnostic to application, with user supplying JSON as config
    files.
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

1. Offline ability (and reactive web components like uce(-template)?)
1. Add JSON Schema for each schema and any fixed rules into an abstract schema
