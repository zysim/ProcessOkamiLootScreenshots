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
import { filterExistingFiles, oneLiner } from './util.js'

const IN_DIR = 'In'
const OUT_DIR = 'Out'
const QUALITY = {
  Full: 100,
  Lossy: 50,
}

const compose = (f, ...g) =>
  !g.length ? f : x => compose(g[0], ...g.slice(1))(f(x))
const curry =
  (f, ...outer) =>
  (...inner) =>
    f.apply(null, outer.concat(inner))

const prepImageObj = (inputDir, filepath) => {
  try {
    const { dir, name } = path.parse(filepath)

    return {
      dir: path.join(OUT_DIR, dir.slice(inputDir.length + 1)),
      image: sharp(filepath),
      name,
    }
  } catch (err) {
    console.error('Filename:', filepath)
    console.error(err)
    return null
  }
}

const resizeImage = async ({ height, width }, imageObj) =>
  (await imageObj)
    ? {
        ...(await imageObj),
        image: (await imageObj).image.resize(width, height, { fit: 'contain' }),
      }
    : null

const resizeToFullHd = curry(resizeImage, { height: 1080, width: 1920 })
const resizeTo720p = curry(resizeImage, { height: 720, width: 1280 })

const cropMyImage = async startImageObj => {
  try {
    const { height, width } = await startImageObj.image.metadata()
    return {
      ...startImageObj,
      image: startImageObj.image.extract({
        top: height - 1081,
        left: ~~((width - 1920) / 2),
        width: 1920,
        height: 1080,
      }),
    }
  } catch (error) {
    console.log({ error })
    return null
  }
}

const saveImageAs = async (format, quality, imageObj) =>
  (await imageObj)
    ? {
        ...(await imageObj),
        format,
        image: (await imageObj).image[format]({ quality }),
        quality,
      }
    : null

const saveImageAsJpeg = curry(saveImageAs, 'jpeg')
const saveImageAsWebp = curry(saveImageAs, 'webp')
const saveImageAsPng = curry(saveImageAs, 'png')

const writeImageToFile = async imageObj => {
  if ((await imageObj) == null) return null
  const { dir, format, image, name, quality } = await imageObj

  const [_, statErr] = await oneLiner(fs.stat, dir)

  if (statErr) {
    await oneLiner(fs.mkdir, dir, { recursive: true })
  }

  await image.toFile(
    `${path.join(dir, name)}-${quality === 100 ? 'FULL' : quality}.${format}`,
  )

  return imageObj
}

const aurides = {
  baseInputDir: "Auride's",
  mapper: compose(
    curry(prepImageObj, "Auride's"),
    compose(
      curry(saveImageAsPng, QUALITY.Full),
      writeImageToFile,
      resizeTo720p,
      curry(saveImageAsWebp, QUALITY.Lossy),
      writeImageToFile,
      curry(saveImageAsJpeg, QUALITY.Lossy),
      writeImageToFile,
    ),
  ),
}

const mine = {
  baseInputDir: IN_DIR,
  mapper: compose(
    curry(prepImageObj, IN_DIR),
    compose(
      cropMyImage,
      curry(saveImageAsWebp, QUALITY.Full),
      writeImageToFile,
      resizeTo720p,
      curry(saveImageAsWebp, QUALITY.Lossy),
      writeImageToFile,
      curry(saveImageAsJpeg, QUALITY.Lossy),
      writeImageToFile,
    ),
  ),
}

const kys = {
  baseInputDir: "Ky's",
  mapper: compose(
    curry(prepImageObj, "Ky's"),
    compose(
      resizeToFullHd,
      curry(saveImageAsWebp, QUALITY.Full),
      writeImageToFile,
      resizeTo720p,
      curry(saveImageAsWebp, QUALITY.Lossy),
      writeImageToFile,
      curry(saveImageAsJpeg, QUALITY.Lossy),
      writeImageToFile,
    ),
  ),
}

const run = async ({ baseInputDir, mapper }, files = null) =>
  (files
    ? files.map(f => `${baseInputDir}/${f}`)
    : await filterExistingFiles(baseInputDir, OUT_DIR)
  ).forEach(mapper)

const test = async ({ baseInputDir }, files = null) =>
  files
    ? files.map(f => `${baseInputDir}/${f}`)
    : await filterExistingFiles(baseInputDir, OUT_DIR)

// test(mine)
run(mine)
