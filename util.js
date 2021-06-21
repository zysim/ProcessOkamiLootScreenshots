import fs from 'fs/promises'
import path from 'path'

const listAllFilesInDirectory = async dir => {
  const [dirEnts, error] = await oneLiner(fs.readdir, dir, {
    withFileTypes: true,
  })

  if (error) {
    return []
  }

  return dirEnts.reduce(async (acc, dirEnt) => {
    if (!dirEnt.isFile() && !dirEnt.isDirectory()) return acc
    if (dirEnt.isFile()) return (await acc).concat(path.join(dir, dirEnt.name))
    return (await acc).concat(
      await listAllFilesInDirectory(path.join(dir, dirEnt.name)),
    )
  }, [])
}

export const filterExistingFiles = async (inDir, outDir) => {
  const inputFilesWithoutExtensions = await listAllFilesInDirectory(
    inDir,
  )
  const outputFiles = await listAllFilesInDirectory(outDir)
  const outputFilesWithoutExtensionsAndBaseDir = Array.from(
    new Set(outputFiles.map(file => file.replace(/-(50|FULL)\.\w+$/, ''))),
  ).map(file => file.replace(outDir, ''))
  const r = inputFilesWithoutExtensions.filter(
    inputFile =>
      !outputFilesWithoutExtensionsAndBaseDir.includes(
        inputFile.replace(inDir, '').replace(/\.png$/, ''),
      ),
  )
  console.log('To process:', r)
  return r
}

export const oneLiner = async (cb, ...args) => {
  try {
    const data = cb.apply(null, args)
    return [await data, null]
  } catch (e) {
    console.error(e)
    return [null, e]
  }
}
