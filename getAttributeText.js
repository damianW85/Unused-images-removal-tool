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
      path: `${rootFolder}${attributeName}-Text.csv`,
      header: [{
        id: 'text',
        title: 'Text Content'
      }]
    })

    dom.window.document.querySelectorAll(`[${attributeName}]`).forEach(domNode => {
      const textString = cleanHtmlString(domNode.getAttribute(`${attributeName}`))

      results.push({
        text: textString
      })
    })

    csvWriter.writeRecords(results)
      .then(() => console.log(`...Done! filepath: ${rootFolder}${attributeName}-Text.csv`))
  })
}))()