import {Context} from '@actions/github/lib/context'
import {Api} from '@octokit/plugin-rest-endpoint-methods/dist-types/types'

export class FileMod {
    filename: string;
    status: string;  // added,removed,modified,renamed,copied,changed,unchanged
    additions: number;
    deletions: number;
    patch: string;

    constructor(filename: string, status: string, additions: number, deletions: number, patch: string) {
        this.filename = filename;
        this.status = status;
        this.additions = additions;
        this.deletions = deletions;
        this.patch = patch;
    }
}

export function fileModsByStatus(files: FileMod[], status: string): FileMod[] {
    return files.filter((f) => f.status == status)
}

export function fileModsToPaths(files: FileMod[]): string[] {
    return files.map((f) => f.filename)
}

export async function changedFiles(onlyFocusPatterns: string[], ignorePatterns: string[], filterByStatus: string[], allChangedFiles: FileMod[]): Promise<FileMod[]> {
    return new Promise(resolve => {
        var results: FileMod[] = allChangedFiles;

        if (filterByStatus.length > 0) {
            results = results.filter((f) => {
                return filterByStatus.includes(f.status)
            })
        }

        if (onlyFocusPatterns.length > 0) {
            // filter only changed patterns
            results = results.filter((f) => {
                if (onlyFocusPatterns.find((p) => {
                    var r = new RegExp(p);
                    return r.test(f.filename)
                })) {
                    return true
                }
                return false
            })
        }

        if (ignorePatterns.length > 0) {
            // filter out ignored files
            results = results.filter((f) => {
                if (ignorePatterns.find((p) => {
                    var r = new RegExp(p);
                    return r.test(f.filename)
                })) {
                    return false
                }
                return true
            })
        }

        resolve(results);
    })
}

export async function getDiffPaths(gh: Api, ctx: Context ): Promise<FileMod[]> {
    return new Promise(async resolve => {

        if (ctx.payload.pull_request == undefined) {
            throw new Error("missing payload pull request context")
        }
        
        const prMetadata = {
            owner: ctx.repo.owner,
            repo: ctx.repo.repo,
            pull_number: ctx.payload.pull_request.number,
        };
        

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
        const { data } = await gh.rest.pulls.listFiles(prMetadata);

        const diffPaths: FileMod[] = data.map((item: any) => {
            return new FileMod(item.filename, item.status, item.additions, item.deletions, item.patch)
        });

        resolve(diffPaths);
    })
    
}