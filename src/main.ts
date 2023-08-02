import * as core from '@actions/core'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'
import {Api} from '@octokit/plugin-rest-endpoint-methods/dist-types/types' // eslint-disable-line
import {
  FileMod,
  changedFiles,
  fileModsToPaths,
  fileModsByStatus
} from './changed-files'

async function run(): Promise<void> {
  try {
    const ghToken = core.getInput('github-token', {
      required: true,
      trimWhitespace: true
    })
    const gh = github.getOctokit(ghToken)

    core.debug(
      `repo_owner=${github.context.repo.owner} repo=${github.context.repo} pull_number=${github.context.payload.pull_request?.number}`
    )

    const allChangedFiles: FileMod[] = await getDiffPaths(gh, github.context)
    core.debug(`all_changed_files=${allChangedFiles}`)

    const separator: string = core.getInput('separator', {
      required: true,
      trimWhitespace: false
    })
    if (separator.length === 0) {
      core.setFailed('`separator` field must be non-empty!')
      return
    }

    const onlyFocusPatterns: string[] = core.getMultilineInput(
      'only_file_patterns',
      {required: false, trimWhitespace: true}
    )
    const ignorePatterns: string[] = core.getMultilineInput(
      'ignore_file_patterns',
      {required: false, trimWhitespace: true}
    )
    const filterByStatus: string[] = core.getMultilineInput(
      'filter_by_status',
      {required: false, trimWhitespace: true}
    )
    core.debug(
      `inputs: separator=${separator} filter_by_status=${filterByStatus} only_file_patterns=${onlyFocusPatterns.join(
        ','
      )} ignore_file_patterns=${ignorePatterns.join(',')}`
    )

    const results: FileMod[] = await changedFiles(
      onlyFocusPatterns,
      ignorePatterns,
      filterByStatus,
      allChangedFiles
    )
    core.debug(`results: ${results.join(',')}`)

    core.setOutput('any_changed', new Boolean(results.length > 0).toString())
    core.setOutput(
      'all_changed_files',
      fileModsToPaths(results).join(separator)
    )

    // only added
    const onlyAddedFiles: FileMod[] = fileModsByStatus(results, 'added')
    core.setOutput(
      'only_added',
      fileModsToPaths(onlyAddedFiles).join(separator)
    )
    core.setOutput(
      'any_added',
      new Boolean(onlyAddedFiles.length > 0).toString()
    )

    // only modified
    const onlyModifiedFiles: FileMod[] = fileModsByStatus(results, 'modified')
    core.setOutput(
      'only_modified',
      fileModsToPaths(onlyModifiedFiles).join(separator)
    )
    core.setOutput(
      'any_modified',
      new Boolean(onlyModifiedFiles.length > 0).toString()
    )

    // only deleted
    const onlyDeletedFiles: FileMod[] = fileModsByStatus(results, 'deleted')
    core.setOutput(
      'only_deleted',
      fileModsToPaths(onlyDeletedFiles).join(separator)
    )
    core.setOutput(
      'any_deleted',
      new Boolean(onlyDeletedFiles.length > 0).toString()
    )
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

export async function getDiffPaths(gh: Api, ctx: Context): Promise<FileMod[]> {
  return new Promise(async resolve => {
    if (ctx.payload.pull_request === undefined) {
      throw new Error('missing payload pull request context')
    }

    const prMetadata = {
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      pull_number: ctx.payload.pull_request.number
    }

    /**
     * `data` is an array of items that look like this:
     * {
     *
     *   filename: 'foo/bar/baz.json',
     *   status: 'modified',  // added,removed,modified,renamed,copied,changed,unchanged
     *   additions: 14,
     *   deletions: 14,
     *   changes: 14,
     *   blob_url: "..."
     *   contents_url: "...",
     *   raw_url: "...",
     *   patch: '@@ -1,2 +1,2 @@\n' +
     *    ' "foo": "bar",\n' +
     *    '-"hello": "world"\n' +
     *    '+"hello": "people"'
     * }
     *
     *
     * listFiles(params?: (RequestParameters & Omit<{ owner: string; repo: string; pull_number: number; } & { per_page?: number | undefined; page?: number | undefined; }, "baseUrl" | "headers" | "mediaType">) | undefined):
     *  Promise<OctokitResponse<{ sha: string; filename: string; status: "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged"; additions: number; deletions: number; changes: number; blob_url: string; raw_url: string; contents_url: string; patch?: string | undefined; previous_filename?: string | undefined; }[], 200>>
     *
     */
    const {data} = await gh.rest.pulls.listFiles(prMetadata)

    const diffPaths: FileMod[] = data.map((item: any) => {
      // eslint-disable-line
      return new FileMod(
        item.filename,
        item.status,
        item.additions,
        item.deletions,
        item.patch
      )
    })

    resolve(diffPaths)
  })
}

run()
