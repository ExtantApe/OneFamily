# Export coverage: what our exporter has to reproduce

Dated 2026-11-25 (task K132). Genealogy Assistant is a program people use to export their own Ancestry match data as CSV files. OneFamily reads files in those shapes, and our own collector (the Chrome extension, ADR 0009) will have to write them. This inventory lists every column of the three file shapes, and what our code does with it today. It is clean room: it describes file shapes only.

## Sources used

- The column lists in `packages/simulate/src/export-ga.ts` (`MATCH_LIST_COLUMNS`, `SHARED_MATCH_COLUMNS`, `MATCH_TREE_COLUMNS`). They were written for the simulator on 2026-11-10. The repo doesn't record where they were first taken from, other than the owner's own exported files, which are data and never in the repo.
- Our own importer, `packages/connectors/src/genealogy-assistant.ts`, and its tests.
- The file name patterns in the importer: `<name> - DNA Matches - Test <id>.csv`, `Shared Matches - <name> - Test <id> - Match <id>.csv`, and `<name> - Match Trees.csv`.

No code or binaries of the other program were read, run or unpacked for this document. The program's own public documentation could not be found on 2026-11-25 (the searches returned nothing usable), so none was read either. That means this inventory is only as complete as the files the owner has seen. It can't say which columns the program writes in other versions, which it adds or drops, or what its columns mean beyond how our importer treats them. Naming the program's published documentation is an owner item (see docs/s3-status.md).

## What our exporter must write today

The importer needs the columns marked required in the first two tables, with the three file names above, and refuses the whole import otherwise (S4). It reads no tree file yet: tree files are sealed while a kit is blind (S1).

## Match list

| Column | Our simulator writes it | Our importer |
|---|---|---|
| Match Name | yes | reads it (required) |
| Shared cM | yes | reads it (required) |
| Unweighted cM | yes | reads it (required) |
| Longest Segment cM | yes | reads it (required) |
| Avg Segment cM | yes | doesn't read it |
| Shared Segments | yes | reads it (required) |
| Shared Percentage | yes | doesn't read it |
| Estimated Relationship | yes | doesn't read it |
| Match Side | yes | reads it (required) |
| Family Tree | yes | reads it (required) |
| Tree Size | yes | reads it (required) |
| Common Ancestor | yes | seals it while the kit is blind; never read yet |
| Notes | yes | seals it while the kit is blind; never read yet |
| Groups | yes | seals it while the kit is blind; never read yet |
| Connected To Tree | yes | seals it while the kit is blind; never read yet |
| URL | yes | doesn't read it |
| GUID | yes | reads it (required) |
| Match Date | yes | reads it (required) |
| Possible Relationships | yes | doesn't read it |
| Meiosis | yes | doesn't read it |
| Managed By | yes | doesn't read it |
| Gender | yes | doesn't read it |
| Starred | yes | doesn't read it |
| Hidden | yes | doesn't read it |

## Shared matches (one file per match of 20 cM or more)

| Column | Our simulator writes it | Our importer |
|---|---|---|
| Match Name | yes | doesn't read it |
| Shared cM | yes | reads it (required) |
| Unweighted cM | yes | doesn't read it |
| Longest Segment cM | yes | doesn't read it |
| Avg Segment cM | yes | doesn't read it |
| Shared Segments | yes | doesn't read it |
| Estimated Relationship | yes | doesn't read it |
| Match Side | yes | doesn't read it |
| Tree Status | yes | doesn't read it |
| Tree Size | yes | doesn't read it |
| Common Ancestor | yes | doesn't read it |
| Notes | yes | doesn't read it |
| Groups | yes | doesn't read it |
| Connected To Tree | yes | doesn't read it |
| URL | yes | doesn't read it |
| GUID | yes | reads it (required) |
| Also Matches | yes | doesn't read it |
| GUID of Match | yes | reads it (required) |
| Shared cM with Match | yes | reads it (required) |
| Unweighted cM with Match | yes | doesn't read it |
| Longest Segment cM with Match | yes | reads it (required) |
| Avg Segment cM with Match | yes | doesn't read it |
| Shared Segments with Match | yes | reads it (required) |
| Estimated Relationship to Match | yes | doesn't read it |
| Match Date | yes | doesn't read it |
| Possible Relationships | yes | doesn't read it |
| Possible Relationships to Match | yes | doesn't read it |
| Meiosis | yes | doesn't read it |
| Managed By | yes | doesn't read it |
| Gender | yes | doesn't read it |
| Starred | yes | doesn't read it |
| Hidden | yes | doesn't read it |

## Match trees

Sealed while the kit is blind. A later importer reads them after the owner unblinds a kit, so nothing here is read yet.

| Column | Our simulator writes it | Our importer |
|---|---|---|
| Match Name | yes | sealed; not read yet |
| Match GUID | yes | sealed; not read yet |
| Match URL | yes | sealed; not read yet |
| Tree Name | yes | sealed; not read yet |
| Tree ID | yes | sealed; not read yet |
| Ahnentafel | yes | sealed; not read yet |
| Given Name | yes | sealed; not read yet |
| Surname | yes | sealed; not read yet |
| Gender | yes | sealed; not read yet |
| Living | yes | sealed; not read yet |
| Birth Date | yes | sealed; not read yet |
| Birth Place | yes | sealed; not read yet |
| Death Date | yes | sealed; not read yet |
| Death Place | yes | sealed; not read yet |
| Person ID | yes | sealed; not read yet |
| Father Person ID | yes | sealed; not read yet |
| Mother Person ID | yes | sealed; not read yet |
| Generation | yes | sealed; not read yet |

## Gaps

- **Unknown columns.** An unexpected extra column is ignored, a missing required one refuses the import. There's no list of what the program's other versions write.
- **Unread columns.** Estimated Relationship, Avg Segment cM, Shared Percentage, Possible Relationships, Meiosis, Managed By, Gender, Starred, Hidden and Also Matches are written by the simulator but not read. They aren't needed for grouping. Reading them is a feature, not a coverage gap.
- **Encodings and number formats.** UTF-8 only, with a dot as the decimal point. Other locales' exports haven't been seen.
- **Our collector.** It writes a different, smaller shape today (`pages/0001.json`, mock site only, see `collected.ts`). Writing these three CSV shapes from it waits on a partnership (docs/decisions.md, 2026-11-09), so nothing here is built.
