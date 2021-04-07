const path = require('path')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const {
  JSDOM
} = require('jsdom')

const {
  searchForFiles,
  cleanHtmlString
} = require('./helperFunctions');

(() => searchForFiles('./', /\.html$/, filename => {
  console.log('-- found: ', filename)

  JSDOM.fromFile(filename).then(dom => {
    let comparisonTable = false
    const results = []
    const rootFolder = path.join(__dirname, filename.replace(/([^\/]+$)/, ''))

    const csvWriter = createCsvWriter({
      path: `${rootFolder}ARIA-LABEL-Text.csv`,
      header: [{
        id: 'text',
        title: 'Text Content'
      }]
    })

    dom.window.document.querySelectorAll('[aria-label]').forEach(domNode => {
      const textString = cleanHtmlString(domNode.getAttribute('aria-label'))

      results.push({
        text: textString
      })
    })

    csvWriter.writeRecords(results)
      .then(() => console.log(`...Done! filepath: ${rootFolder}ARIA-LABEL-Text.csv`))
  })
}))()