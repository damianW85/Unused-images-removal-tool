const path = require('path')
const jsRTF = require('jsrtf')
const {
  JSDOM
} = require('jsdom')

const {
  searchForFiles,
  createFile,
  cleanHtmlString
} = require('./helperFunctions')

const boldElements = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'STRONG'];

(() => searchForFiles('./', /\.html$/, filename => {
  console.log('-- found: ', filename)

  JSDOM.fromFile(filename).then(dom => {
    const results = []
    const rootFolder = path.join(__dirname, filename.replace(/([^\/]+$)/, ''))
    const myDoc = new jsRTF()

    dom.window.document.querySelectorAll('.copy').forEach(domNode => {

      results.push({
        name: domNode.nodeName,
        text: cleanHtmlString(domNode.innerHTML)
      })
    })
    // Formatter object
    const textFormat = new jsRTF.Format({
      spaceBefore: 200,
      spaceAfter: 200,
      paragraph: true
    })

    results.map(testObject => {
      if (boldElements.includes(testObject.name)) myDoc.writeText(testObject.text, {
        ...textFormat,
        bold: true
      })
      else myDoc.writeText(testObject.text, textFormat)
    })

    const buffer = new Buffer.from(myDoc.createDocument(), 'binary')
    return createFile(`${rootFolder}HTMLText.rtf`, buffer)
  })
}))()