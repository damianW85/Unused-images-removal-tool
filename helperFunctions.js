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

const cleanHtmlString = (str, ignore = []) => {
  const htmlTagsToRemove = ignore ? new RegExp(
      `<(?!\/?${ignore.map((t, i) => i !== ignore.length - 1 ? `${t}|` : `${t}`).join('')}>)[^>]+>`, 'g') :
    /(<[^>]*>)|(^ +|\n|\t|\r)/gm

  const doubleSpaces = /\s\s+/g
  const beginningSpaces = /^\s/g
  const nBs = /&nbsp;/g

  return str.replace(htmlTagsToRemove, ' ')
    .replace(doubleSpaces, ' ')
    .replace(nBs, ' ')
    .replace(beginningSpaces, '').trim()
}

const buildImacTableData = (resultsArray, imacTableClass) => {
  const forImac = []
  const row1 = []
  const row2 = []

  for (let i = 0; i < resultsArray.length; i++) {
    if (resultsArray[i].parentClasses.includes(imacTableClass)) {
      forImac.push(...resultsArray[i].textArray)
    }
    if (i === resultsArray.length - 1) {

      forImac.splice(0, 2);

      forImac.map((txt, idx) => {
        idx % 2 !== 0 ? row1.push(txt) : row2.push(txt)
      })

      const row2amend = row2.splice(6, 3)
      const row1amend = row1.splice(6, 3)

      row1.splice(6, 0, ...row2amend)
      row2.splice(6, 0, ...row1amend)
      const row2amend2 = row2.splice(10, 1)
      const row1amend2 = row2amend2.concat(row1[10]).toString().replace(',', ' ')
      row1.splice(10, 1, row1amend2)
      return {
        forImac,
        row1,
        row2
      }
    }
  }
}

module.exports = {
  searchForFiles,
  deleteFile,
  createFile,
  cleanHtmlString,
  buildImacTableData
}