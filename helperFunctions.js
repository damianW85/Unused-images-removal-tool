const fs = require('fs')
const path = require('path')

const searchForFiles = (startPath, filter, callback) => {

  if (!fs.existsSync(startPath)) return console.log("no dir ", startPath)

  const files = fs.readdirSync(startPath)

  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i])
    const stat = fs.lstatSync(filename)

    if (stat.isDirectory() && !filename.includes('node_modules')) searchForFiles(filename, filter, callback) //recurse

    else if (filter.test(filename)) callback(filename)
  }
}

const deleteFile = filePath => fs.unlink(filePath, (err) => {
  if (err) return console.error('File DELETION ERROR: ', err)
  console.log('File DELETED: ', filePath)
})

const createFile = (filePath, fileContent) => fs.writeFile(filePath, fileContent, err => {
  if (err) return console.error('File CREATION ERROR: ', err)
  console.log(`Text file created at: ${filePath}`)
})

module.exports = {
  searchForFiles,
  deleteFile,
  createFile
}