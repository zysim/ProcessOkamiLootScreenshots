/**
 * ProcessScreenshots - Processes screenshots for https://dshepsis.github.io/OkamiMap
 * Copyright (C) 2021  ZY Sim
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import fs from 'fs/promises'
import path from 'path'

/**
 * Lists all files in a directory recursively. Returns full paths, relative to `dir`.
 *
 * @param {string} dir The base directory to search for files.
 * @returns {Promise<string[]>}
 */
export const listAllFilesInDirectory = async dir => {
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

/**
 * @param {string} inDir
 * @param {string} outDir
 * @returns {Promise<string[]>}
 */
export const filterExistingFiles = async (inDir, outDir) => {
  const inputFilesWithoutExtensions = await listAllFilesInDirectory(inDir)
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

/**
 * @param {Function} cb
 * @param {...any} args
 * @returns {Promise<[?any, ?Error]>}
 */
export const oneLiner = async (cb, ...args) => {
  try {
    const data = cb.apply(null, args)
    return [await data, null]
  } catch (e) {
    console.error(e)
    return [null, e]
  }
}

/**
 * Gets all directories in a base directory. Not recursive.
 *
 * Return paths include the base path itself.
 * @param {string} base The path to the base directory.
 * @returns {Promise<string[]>}
 */
const getAllDirs = async base =>
  (await fs.readdir(base, { withFileTypes: true })).reduce(
    (dirs, file) =>
      file.isDirectory() ? dirs.concat(path.join(base, file.name)) : dirs,
    [],
  )

/**
 * ## This was designed for OkamiMap, and not for this folder.
 *
 * Removes duplicate ANIMAL-ONLY images in a Loot folder, specified by `dir`, i.e. the
 * images already exist in the corresponding Animals folder.
 *
 * This works under the assumption that combination images (ones that have animals+loot)
 * have an underscore in its name.
 * @param {string} dir The directory (aka map) to scan through
 * @param {boolean} test Set this to `true` if you'd like to only see which files would
 * be deleted, without the deletion actually happening. Defaults to `false`.
 * @returns {Promise<void>}
 */
export const removeAnimalImagesInLootFolder = async (dir, test = false) => {
  try {
    const animals = await fs.readdir(`./Animals/${dir}`)
    const loot = await fs.readdir(`./Loot/${dir}`)
    const dupes = loot.filter(
      l =>
        animals.find(a => path.parse(l).name === path.parse(a).name) &&
        !path.parse(l).name.includes('_'),
    )
    console.log(`Deleting dupes in ./Loot/${dir}:`)
    console.log(dupes)
    if (!test) {
      dupes.forEach(dupe => {
        fs.rm(`./Loot/${dir}/${dupe}`)
      })
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`./Animals/${dir} doesn't exist yet.`)
    } else {
      console.error(e)
    }
  }
}

/**
 * ## This was designed for OkamiMap, and not for this folder.
 *
 * Loops through all folders (maps) in the Loot folder and deletes ANIMAL-ONLY images
 * that already exist in the Animals folders.
 *
 * @param {boolean} test Set to `true` to simply list out dupes without deleting
 * anything. Defaults to `false`.
 * @returns {void}
 */
export const removeAnimalImagesInAllLootFolders = (test = false) => {
  getAllDirs('Loot').then(lootDirs => {
    lootDirs.forEach(dir => {
      removeAnimalImagesInLootFolder(dir, test)
    })
  })
}
