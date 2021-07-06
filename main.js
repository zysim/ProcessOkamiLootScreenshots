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

/**
 * @typedef {Object} ImageObj Object holding the Sharp instance of an image file, along
 * with its filename and its containing directory's path.
 * @property {string} dir The full path of the directory containing this image
 * @property {sharp.Sharp} image The Sharp instance of the image to be processed
 * @property {string} name The name of the image file
 */

/**
 * @typedef {Object} ProcessedImageObj ImageObj with two extra details; the format to be
 * saved as, along with its quality
 * @property {string} dir The full path of the directory containing this image
 * @property {string} format The format the image will be saved as
 * @property {sharp.Sharp} image The Sharp instance of the image to be processed
 * @property {string} name The name of the image file
 * @property {number} quality The quality the image will be saved at
 */

/**
 * @typedef {Object} MapperObj The meat and bones of this script. Specifies two things:
 * the base input directory where all images to be processed in the same fashion are in,
 * and the mapper function that processes all those images.
 * @property {string} baseInputDir The starting input directory where all images to be
 * processed in the same fashion are in
 * @property {Mapper} mapper The function used to process every image contained in
 * `baseInputDir`, including child folders
 */

/**
 * @callback Mapper Takes the full path of an image (relative to project root), processes
 * it, and saves it to the location specified in the function.
 * @param {string} filepath The full image path, relative to this project's root
 * @returns {Promise<?ProcessedImageObj>}
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

/**
 * @param {string} inputDir
 * @param {string} filepath
 * @returns {ImageObj}
 */
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

/**
 * @param {{ height: number, width: number }}
 * @param {ImageObj} imageObj
 */
const resizeImage = async ({ height, width }, imageObj) =>
  (await imageObj)
    ? {
        ...(await imageObj),
        image: (await imageObj).image.resize(width, height, { fit: 'contain' }),
      }
    : null

const resizeToFullHd = curry(resizeImage, { height: 1080, width: 1920 })
const resizeTo720p = curry(resizeImage, { height: 720, width: 1280 })

/**
 * @param {Promise<ImageObj>} startImageObj
 * @returns {Promise<?ImageObj>}
 */
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

/**
 * @param {string} format
 * @param {number} quality
 * @param {Promise<?ImageObj>} imageObj
 * @returns {Promise<?ProcessedImageObj>}
 */
const saveImageAs = async (format, quality, imageObj) =>
  (await imageObj)
    ? {
        ...(await imageObj),
        format,
        image: (await imageObj).image[format]({ quality }),
        quality,
      }
    : null

/**
 * @callback SaveImageAsFormat
 * @param {number} quality The quality to save the image at
 * @param {Promise<?ImageObj>} imageObj The ImageObj to save
 * @returns {Promise<?ProcessedImageObj>}
 */

/** @type {SaveImageAsFormat} */
const saveImageAsJpeg = curry(saveImageAs, 'jpeg')
/** @type {SaveImageAsFormat} */
const saveImageAsWebp = curry(saveImageAs, 'webp')
/** @type {SaveImageAsFormat} */
const saveImageAsPng = curry(saveImageAs, 'png')

/**
 * @param {Promise<?ProcessedImageObj>} imageObj
 * @returns {Promise<?ProcessedImageObj>}
 */
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

/** @type MapperObj */
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

/** @type MapperObj */
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

/** @type MapperObj */
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

/**
 * Runs the script.
 *
 * If `files` is not specified (default), this will:
 * 1. Filter input images that already have corresponding processed images in `Out/`
 * 1. Process the ones that remain, and saves them to `Out/`
 *
 * If `files` _is_ specified, this will:
 * 1. Process and save images specified by `files`, overriding existing images in `Out`/
 * if they exist
 * @param {MapperObj} mapperObj
 * @param {?string[]} [files=null]
 */
const run = async ({ baseInputDir, mapper }, files = null) =>
  (files
    ? files.map(f => `${baseInputDir}/${f}`)
    : await filterExistingFiles(baseInputDir, OUT_DIR)
  ).forEach(mapper)

/**
 * Prints the files to be processed only, without actually processing.
 * @param {MapperObj} mapperObj
 * @param {?string[]} [files=null]
 */
const test = async ({ baseInputDir }, files = null) =>
  files
    ? files.map(f => `${baseInputDir}/${f}`)
    : await filterExistingFiles(baseInputDir, OUT_DIR)

// test(mine)
run(mine)
