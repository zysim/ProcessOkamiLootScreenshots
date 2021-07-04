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
