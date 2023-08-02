# changed-files GitHub Action
A Faster Github Action to filter for changed files for pull requests.

Other changed-files actions rely on native `git` diffs comparing against the merge-base. While this works releatively well for small-to-medium sized projects. This method doesn't scale well for any moderately or large git codebase. Particularly if this code-base has a large velocity of changes. There becomes a problem with the full clones taking too long, then people often move to shallow clones coupled with incremental enrichment to once again find the merge-base to accurrately compare. Eventually even this solution becomes brittle and difficult to scale.

Thus I've created this action to take advantage of the existing computation GitHub has already done (and visible in the UI) through their API. This action depends on there being a pull request open, but is far faster than git-clone and diff comparison. In addition you get more information about the status of the change (additions/deletions/modified/...). We also have patch content but this is unused.

It would be expected to use this action for other downstream conditional steps that you might use in your github workflows.

## Inputs

### `github-token`

**Required** The github token, for the most part you can just use `${{ secrets.GITHUB_TOKEN }}`.
**Example**
`${{ secrets.GITHUB_TOKEN }}`

### `separator`

**Required** The separator to use on output.
**Default** `,`
**Example**
`${{ secrets.GITHUB_TOKEN }}`

### `ignore_file_patterns`

**Optional** A newline separated list of regex paths to ignore.
**Default** ``
**Example**
```
foo/.*\.json
bar/.*\.ini
```

### `only_file_patterns`

**Optional** A newline separated list of regex paths to only consider. This is applied before `ignore_file_patterns`.
**Default** ``
**Example**
```
foo/.*\.json
bar/.*\.ini
```

### `filter_by_status`

**Optional** A newline separated list of status to filter by, options are: `added,removed,modified,renamed,copied,changed,unchanged`. This is applied before `ignore_file_patterns`.
**Default** `` - meaning all.
**Example**
```
added
copied
renamed
```

## Outputs

### `all_changed_files`

A list of changed file paths using the separator.

**Example**
foo/a.json,bar/c.ini

### `only_added`

A list of  only added file paths using the separator.

**Example**
foo/a.json,bar/c.ini

### `only_modified`

A list of  only modified file paths using the separator.

**Example**
foo/a.json,bar/c.ini

### `only_deleted`

A list of  only deleted file paths using the separator.

**Example**
foo/a.json,bar/c.ini

### `any_changed`

"true" if any files were modified.

**Example**
true

### `any_added`

"true" if any files were marked with "added" status.

**Example**
true

### `any_modified`

"true" if any files were marked with "modified" status

**Example**
true

### `any_deleted`

"true" if any files were marked with "deleted" status

**Example**
true

## Example usage

```yaml
jobs:
  my_check: # make sure the action works on a clean machine without building
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: changed-files
        id: changed-files
        uses: platinummonkey/changed-files@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          separator: ','
          ignore_files_pattern: |
            foo/.*\.json
          only_files_pattern: |
            foo/bar.*
          filter_by_status: |
            added
            modified
            deleted
      - name: output results
        shell: bash
        env:
          OUTPUT_ANY_CHANGED: ${{ steps.changed-files.outputs.any_changed }}
          OUTPUT_ALL_CHANGED_FILES: ${{ steps.changed-files.outputs.all_changed_files }}
          OUTPUT_ANY_ADDED: ${{ steps.changed-files.outputs.any_added }}
          OUTPUT_ANY_MODIFIED: ${{ steps.changed-files.outputs.any_modified }}
          OUTPUT_ANY_DELETED: ${{ steps.changed-files.outputs.any_deleted }}
          OUTPUT_ONLY_ADDED_FILES: ${{ steps.changed-files.outputs.only_added }}
          OUTPUT_ONLY_MODIFIED_FILES: ${{ steps.changed-files.outputs.only_modified }}
          OUTPUT_ONLY_DELETED_FILES: ${{ steps.changed-files.outputs.only_deleted }}
        run: |
          echo "any_changed=${OUTPUT_ANY_CHANGED}"
          echo "all_changed_files=${OUTPUT_ALL_CHANGED_FILES}"
          echo "any_added=${OUTPUT_ANY_ADDED}"
          echo "any_modified=${OUTPUT_ANY_MODIFIED}"
          echo "any_deleted=${OUTPUT_ANY_DELETED}"
          echo "only_added=${OUTPUT_ONLY_ADDED_FILES}"
          echo "only_modified=${OUTPUT_ONLY_MODIFIED_FILES}"
          echo "only_deleted=${OUTPUT_ONLY_DELETED_FILES}"
```
