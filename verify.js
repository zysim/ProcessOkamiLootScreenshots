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
