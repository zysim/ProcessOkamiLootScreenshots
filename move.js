import fs from 'fs/promises'
import path from 'path'

const curry =
  (f, ...outer) =>
  (...inner) =>
    f.apply(null, outer.concat(inner))

const getAndSeparateFiles = async () => {
  const r = await (
    await fs.readdir('Out')
  ).reduce(
    async (acc, dir) =>
      (
        await acc
      ).concat((await fs.readdir(`Out/${dir}`)).map(f => `${dir}/${f}`)),
    [],
  )
  return r.reduce(
    async (acc, file) => ({
      ...(await acc),
      copy: file.includes('-50')
        ? (await acc).copy.concat(file)
        : (await acc).copy,
      store: file.includes('-FULL')
        ? (await acc).store.concat(file)
        : (await acc).store,
    }),
    { copy: [], store: [] },
  )
}

const copyFile = async (destDir, file) => {
  const { dir, ext, name } = path.parse(file)

  const dest = `${path.join(
    destDir,
    dir,
    name.replace(/-(50|FULL)/g, '').replace(',', '_'),
  )}${ext}`

  try {
    await fs.stat(path.join(destDir, dir))
  } catch (error) {
    await fs.mkdir(path.join(destDir, dir))
  } finally {
    console.log(`Copying ${file} to ${dest}`)
    fs.copyFile(`Out/${file}`, dest)
  }
}

const collectAllFilesInDirectory = async dir =>
  (await fs.readdir(dir)).reduce(
    async (acc, childDirs) =>
      (await acc).concat(
        (await fs.readdir(path.join(dir, childDirs))).map(filename =>
          path.join(childDirs, filename),
        ),
      ),
    [],
  )

const filterAndCheck = (srcFiles, destFiles, suffix) =>
  srcFiles
    .filter(file => file.includes(suffix))
    .filter(file => {
      const { dir, ext, name } = path.parse(file)
      return !destFiles.includes(path.join(dir, name.replace(suffix, '')) + ext)
    })

const listFilesThatDidNotCopy = async () => {
  const outputFiles = await collectAllFilesInDirectory('Out')
  const copyFiles = await collectAllFilesInDirectory('CopyOver')
  const storeFiles = await collectAllFilesInDirectory('OkamiLootScreenshots')

  return {
    copyOver: filterAndCheck(outputFiles, copyFiles, '-50'),
    store: filterAndCheck(outputFiles, storeFiles, '-FULL'),
  }
}

const main = async () => {
  const { copy, store } = await getAndSeparateFiles()

  copy.forEach(curry(copyFile, 'CopyOver'))
  store.forEach(curry(copyFile, 'OkamiLootScreenshots'))

  console.log(await listFilesThatDidNotCopy())
}

main()
