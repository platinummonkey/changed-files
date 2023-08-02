import {
  FileMod,
  changedFiles,
  fileModsToPaths,
  fileModsByStatus
} from '../src/changed-files'
import {expect, test} from '@jest/globals'

test('test FileMod[] to string[] for filenames', async () => {
  const files: FileMod[] = [
    new FileMod('foo/bar.json', 'modified', 0, 0, ''),
    new FileMod('foo/baz.json', 'modified', 0, 0, '')
  ]
  const paths: string[] = fileModsToPaths(files)
  expect(paths).toEqual(['foo/bar.json', 'foo/baz.json'])
})

test('test fileModsByStatus to filter', async () => {
  const files: FileMod[] = [
    new FileMod('foo/a.json', 'added', 0, 0, ''),
    new FileMod('foo/b.json', 'modified', 0, 0, ''),
    new FileMod('foo/c.json', 'modified', 0, 0, ''),
    new FileMod('foo/d.json', 'added', 0, 0, '')
  ]
  const filtered: FileMod[] = fileModsByStatus(files, 'added')
  const paths: string[] = fileModsToPaths(filtered)
  expect(paths).toEqual(['foo/a.json', 'foo/d.json'])
})

test('test changedFiles default', async () => {
  const files: FileMod[] = [
    new FileMod('foo/a.json', 'added', 0, 0, ''),
    new FileMod('foo/b.json', 'modified', 0, 0, ''),
    new FileMod('foo/c.json', 'modified', 0, 0, ''),
    new FileMod('foo/d.json', 'added', 0, 0, ''),
    new FileMod('foo/e.json', 'deleted', 0, 0, ''),
    new FileMod('foo/f.json', 'copied', 0, 0, '')
  ]
  const filtered = await changedFiles([], [], [], files)
  expect(filtered).toHaveLength(files.length)
})

test('test changedFiles filterByStatus', async () => {
  const files: FileMod[] = [
    new FileMod('foo/a.json', 'added', 0, 0, ''),
    new FileMod('foo/b.json', 'modified', 0, 0, ''),
    new FileMod('foo/c.json', 'modified', 0, 0, ''),
    new FileMod('foo/d.json', 'added', 0, 0, ''),
    new FileMod('foo/e.json', 'deleted', 0, 0, ''),
    new FileMod('foo/f.json', 'copied', 0, 0, '')
  ]

  // only 2 should match
  var filtered = await changedFiles([], [], ['deleted', 'copied'], files)
  expect(filtered).toHaveLength(2)
  expect(filtered).toEqual([files[4], files[5]])
})

test('test changedFiles onlyPattern', async () => {
  const files: FileMod[] = [
    new FileMod('foo/a.json', 'added', 0, 0, ''),
    new FileMod('foo/b.json', 'modified', 0, 0, ''),
    new FileMod('foo/c.json', 'modified', 0, 0, ''),
    new FileMod('foo/d.json', 'added', 0, 0, ''),
    new FileMod('foo/e.json', 'deleted', 0, 0, ''),
    new FileMod('foo/f.json', 'copied', 0, 0, '')
  ]

  // all of them should match
  var filtered = await changedFiles(['foo/.*.json'], [], [], files)
  expect(filtered).toHaveLength(files.length)

  // none should match
  var filtered = await changedFiles(['bar/.*.json'], [], [], files)
  expect(filtered).toHaveLength(0)

  // only 2 should match
  var filtered = await changedFiles(['foo/[a,b].json'], [], [], files)
  expect(filtered).toHaveLength(2)
  expect(filtered).toEqual([files[0], files[1]])
})

test('test changedFiles ignorePattern', async () => {
  const files: FileMod[] = [
    new FileMod('foo/a.json', 'added', 0, 0, ''),
    new FileMod('foo/b.json', 'modified', 0, 0, ''),
    new FileMod('foo/c.json', 'modified', 0, 0, ''),
    new FileMod('foo/d.json', 'added', 0, 0, ''),
    new FileMod('foo/e.json', 'deleted', 0, 0, ''),
    new FileMod('foo/f.json', 'copied', 0, 0, '')
  ]

  // none should match
  var filtered = await changedFiles([], ['bar/.*.json'], [], files)
  expect(filtered).toHaveLength(files.length)

  // all should match
  var filtered = await changedFiles([], ['foo/.*.json'], [], files)
  expect(filtered).toHaveLength(0)

  // only 2 should match
  var filtered = await changedFiles([], ['foo/[a,b].json'], [], files)
  expect(filtered).toHaveLength(4)
  expect(filtered).toEqual([files[2], files[3], files[4], files[5]])
})
