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
import sharp from 'sharp'

const collectAllFilesInDirectory = async dir =>
  (await fs.readdir(dir)).reduce(
    async (acc, childDirs) =>
      (await acc).concat(
        (await fs.readdir(path.join(dir, childDirs))).map(filename =>
          path.join(childDirs, filename.slice(0, filename.lastIndexOf('.'))),
        ),
      ),
    Promise.resolve([]),
  )

const listFilesThatDidNotConvert = async inputDir => {
  const inputFiles = await collectAllFilesInDirectory(inputDir)
  const outputFiles = (await collectAllFilesInDirectory('Out')).map(output =>
    /-FULL$/.test(output)
      ? output.slice(0, -5)
      : /-50$/.test(output)
      ? output.slice(0, -3)
      : output,
  )
  return inputFiles.filter(input => !outputFiles.includes(input))
}

const listFilesThatAreNotFullHd = async () => {
  console.log("Files that aren't full HD:")
  const dirs = await fs.readdir('Out')
  dirs.forEach(async dir => {
    const files = await fs.readdir(path.join('Out', dir))

    files.forEach(async file => {
      try {
        const s = sharp(path.join('Out', dir, file))
        const { height, width } = await s.metadata()
        if (
          (file.includes('-50') && (width !== 1280 || height !== 720)) ||
          (file.includes('-FULL') && (width !== 1920 || height !== 1080))
        ) {
          console.table({ height, path: path.join('Out', dir, file), width })
        }
      } catch (error) {
        console.error('Error in file:', path.join(dir, file), error);
      }
    })
  })
}

listFilesThatDidNotConvert('In').then(files => {
  console.log("Files that didn't convert:")
  console.table(files)
})
listFilesThatAreNotFullHd()
