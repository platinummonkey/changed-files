import * as core from '@actions/core'
import * as github from '@actions/github'
import { FileMod, changedFiles, getDiffPaths, fileModsToPaths, fileModsByStatus } from './changed-files'

async function run(): Promise<void> {
  try {
    const ghToken = core.getInput('github-token', {required: true, trimWhitespace: true});
    const gh = github.getOctokit(ghToken)
    const allChangedFiles: FileMod[] = await getDiffPaths(gh, github.context)
    
    const separator: string = core.getInput('separator', {required: true, trimWhitespace: false});
    if (separator.length == 0) {
        core.setFailed("`separator` field must be non-empty!")
        return
    }

    const onlyFocusPatterns: string[] = core.getMultilineInput("only_file_patterns", {required: false, trimWhitespace: true})
    const ignorePatterns: string[] = core.getMultilineInput("ignore_file_patterns", {required: false, trimWhitespace: true})
    const filterByStatus: string[] = core.getMultilineInput("filter_by_status", {required: false, trimWhitespace: true})
    core.debug(`inputs: separator=${separator} filter_by_status=${filterByStatus} only_file_patterns=${onlyFocusPatterns.join(',')} ignore_file_patterns=${ignorePatterns.join(',')}`)

    const results: FileMod[] = await changedFiles(onlyFocusPatterns, ignorePatterns, filterByStatus, allChangedFiles);
    core.debug(`results: ${results.join(',')}`)

    core.setOutput('any_changed', (results.length > 0) + "")
    core.setOutput("all_changed_files", fileModsToPaths(results).join(separator))

    // only added
    const onlyAddedFiles: FileMod[] = fileModsByStatus(results, 'added');
    core.setOutput("only_added", fileModsToPaths(onlyAddedFiles).join(separator))
    core.setOutput('any_added', (onlyAddedFiles.length > 0) + "")

    // only modified
    const onlyModifiedFiles: FileMod[] = fileModsByStatus(results, 'modified');
    core.setOutput("only_modified", fileModsToPaths(onlyModifiedFiles).join(separator))
    core.setOutput('any_modified', (onlyModifiedFiles.length > 0) + "")

    // only deleted
    const onlyDeletedFiles: FileMod[] = fileModsByStatus(results, 'deleted');
    core.setOutput("only_deleted", fileModsToPaths(onlyDeletedFiles).join(separator))
    core.setOutput('any_deleted', (onlyDeletedFiles.length > 0) + "")
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()