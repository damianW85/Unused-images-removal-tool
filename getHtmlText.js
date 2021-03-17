const path = require('path')
const {
  JSDOM
} = require("jsdom")

const {
  searchForFiles,
  createFile,
  getTextFromNode
} = require('./helperFunctions');

(() => searchForFiles('./', /\.html$/, filename => {
  console.log('-- found: ', filename)
  const result = []
  JSDOM.fromFile(filename).then(dom => {

    dom.window.document.querySelectorAll('.copy').forEach(domNode => getTextFromNode(domNode, result))
    const textContent = [...new Set(result)].join("\n").replace(/^[ ]+/g, "")
    const rootFolder = path.join(__dirname, filename.replace(/([^\/]+$)/, ''))

    return createFile(`${rootFolder}HTMLText.txt`, textContent)
  })
}))()