const path = require('path')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const {
  JSDOM
} = require('jsdom')

const {
  searchForFiles,
  cleanHtmlString
} = require('./helperFunctions')

const attributeName = 'aria-label';

(() => searchForFiles('./', /\.html$/, filename => {
  console.log('-- found: ', filename)

  JSDOM.fromFile(filename).then(dom => {
    const results = []
    const rootFolder = path.join(__dirname, filename.replace(/([^\/]+$)/, ''))

    const csvWriter = createCsvWriter({
      path: `${rootFolder}${attributeName}-text.csv`,
      header: [{
        id: 'text',
        title: `${attributeName} Text Content`
      }]
    })

    dom.window.document.querySelectorAll(`[${attributeName}]`).forEach(domNode => {
      const textString = cleanHtmlString(domNode.getAttribute(`${attributeName}`))
      results.push(textString)
    })

    csvWriter.writeRecords([...new Set(results)].map(tex => ({ text: tex })))
      .then(() => console.log(`...Done! filepath: ${rootFolder}${attributeName}-text.csv`))
  })
}))()