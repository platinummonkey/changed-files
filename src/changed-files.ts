export class FileMod {
  filename: string
  status: string // added,removed,modified,renamed,copied,changed,unchanged
  additions: number
  deletions: number
  patch: string

  constructor(
    filename: string,
    status: string,
    additions: number,
    deletions: number,
    patch: string
  ) {
    this.filename = filename
    this.status = status
    this.additions = additions
    this.deletions = deletions
    this.patch = patch
  }
}

export function fileModsByStatus(files: FileMod[], status: string): FileMod[] {
  return files.filter(f => f.status === status)
}

export function fileModsToPaths(files: FileMod[]): string[] {
  return files.map(f => f.filename)
}

export async function changedFiles(
  onlyFocusPatterns: string[],
  ignorePatterns: string[],
  filterByStatus: string[],
  allChangedFiles: FileMod[]
): Promise<FileMod[]> {
  return new Promise(resolve => {
    let results: FileMod[] = allChangedFiles

    if (filterByStatus.length > 0) {
      results = results.filter(f => {
        return filterByStatus.includes(f.status)
      })
    }

    if (onlyFocusPatterns.length > 0) {
      // filter only changed patterns
      results = results.filter(f => {
        if (
          onlyFocusPatterns.find(p => {
            const r = new RegExp(p)
            return r.test(f.filename)
          })
        ) {
          return true
        }
        return false
      })
    }

    if (ignorePatterns.length > 0) {
      // filter out ignored files
      results = results.filter(f => {
        if (
          ignorePatterns.find(p => {
            const r = new RegExp(p)
            return r.test(f.filename)
          })
        ) {
          return false
        }
        return true
      })
    }

    resolve(results)
  })
}
