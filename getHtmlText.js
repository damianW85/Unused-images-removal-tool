const path = require('path')
require('jspdf-autotable')
const {
  calibriNormal
} = require('./calibriNormalFont')
const {
  calibriBold
} = require('./calibriBoldFont')
const {
  jsPDF
} = require('jspdf')
const {
  JSDOM
} = require('jsdom')

const {
  searchForFiles,
  cleanHtmlString
} = require('./helperFunctions')

const updateLineGap = multiple => multiple * 5
const needNewPage = vertGap => vertGap > 275

const arrayToRow = (arr, isHeader) => {
  const rows = []

  if (isHeader) {
    arr.map(rowArray => rows.push(rowArray[0]))
  } else {
    for (let i = 1; i < arr[0].length - 1; i++) {
      const row = []
      arr.map(subArr => row.push(subArr[i]))
      rows.push(row)
    }
  }
  return isHeader ? [rows] : rows
}

const buildTable = (dom, doc, position, callback) => {
  const tableArray = []

  for (let z = 0; dom.window.document.querySelectorAll(`.product-${z}`).length; z++) {
    const column = []

    dom.window.document.querySelectorAll(`.product-${z}`).forEach(tableNode => {
      column.push(...[cleanHtmlString(tableNode.innerHTML)].filter(Boolean))
    })
    tableArray.push(column)
  }

  return doc.autoTable({
    head: arrayToRow(tableArray, true),
    body: arrayToRow(tableArray),
    startY: position.verticalGap,
    didDrawPage: HookData => {
      callback(HookData.table.body.length)
    },
    margin: {
      left: position.horizontalGap
    },
    styles: {
      fontSize: 8,
      tableWidth: 'wrap',
      font: 'calibriNormal'
    }
  })
}

const boldElements = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

(() => searchForFiles('./', /\.html$/, filename => {
  console.log('-- found: ', filename)

  JSDOM.fromFile(filename).then(dom => {
    const results = []
    const rootFolder = path.join(__dirname, filename.replace(/([^\/]+$)/, ''))
    const fontSize = 8
    const headingFontSize = 10
    let comparisonTable = false
    const doc = new jsPDF()
    doc.addFileToVFS('calibriNormal.ttf', calibriNormal)
    doc.addFont('calibriNormal.ttf', 'calibriNormal', 'normal')
    doc.addFileToVFS('calibriBold.ttf', calibriBold)
    doc.addFont('calibriBold.ttf', 'calibriBold', 'bold')
    doc.setFontSize(fontSize)

    // get all the text by querying all elements with the copy class.
    dom.window.document.querySelectorAll('.copy').forEach(domNode => {
      // filter all tags from the innerHTML of the dom node except for strong tags so we can know where text is bold.
      const stringWithStrongTags = cleanHtmlString(domNode.innerHTML, 'strong')
      // Identify elements inside the comparison table and push the table name into the results array.
      if (domNode.closest('.compare-wrapper')) {
        results.push({
          name: 'compareTable'
        })
      } else {
        results.push({
          name: domNode.nodeName,
          text: stringWithStrongTags
        })
      }
    })
    // this is the padding gap on the left of the document.
    const startGap = 15
    let verticalGap = startGap
    // this is effectively the line height.
    const horizontalGap = 10

    results.map(textObject => {
      if (textObject.name === 'compareTable') {
        if (!comparisonTable) {
          // create the comparison table, update the verticalGap and set the variable to true.
          buildTable(dom, doc, {
            verticalGap,
            horizontalGap
          }, totalTableCells => verticalGap += (totalTableCells * 12))
          comparisonTable = true
        }
        return
      }
      // check if we need to add a new page to the document.
      needNewPage(verticalGap) ? (doc.addPage(), verticalGap = startGap) : null
      const fullText = cleanHtmlString(textObject.text).trim()
      // strip the text from the strong tags in to an array.
      const textStrippedFromTags = textObject.text.match(/(?<=>)([\w\s]+)(?=<\/)/g)

      const arrayOfNormalAndBoldText = textObject.text.split(/(?<=>)([\w\s]+)(?=<\/)/g)

      if (!boldElements.includes(textObject.name) && arrayOfNormalAndBoldText.length) {
        let paddingLeft = horizontalGap
        arrayOfNormalAndBoldText.map((text, i) => {
          const cleanText = cleanHtmlString(text)

          if (!cleanText.length) return
          needNewPage(verticalGap) ? (doc.addPage(), verticalGap = startGap) : null
          doc.setFontSize(fontSize)
          doc.setFont('calibriBold', 'bold')

          if (i % 2 === 0) {
            doc.setFont('calibriNormal', 'normal')
          }

          doc.splitTextToSize(cleanText, 190).map(t => {
            doc.text(paddingLeft, verticalGap, t)
            verticalGap += updateLineGap(1)
          })
        })
      } else if (boldElements.includes(textObject.name)) {
        // check for header elements and write them in bold to the doc.
        doc.setFont('calibriBold', 'bold')
        doc.setFontSize(headingFontSize)
        if (verticalGap !== startGap) verticalGap += updateLineGap(doc.splitTextToSize(fullText, 190).length)
        doc.text(horizontalGap, verticalGap, doc.splitTextToSize(fullText, 190))
        verticalGap += updateLineGap(doc.splitTextToSize(fullText, 190).length)
      } else {
        // write normal text to the doc.
        doc.setFont('calibriNormal', 'normal')
        doc.setFontSize(fontSize)
        doc.text(horizontalGap, verticalGap, doc.splitTextToSize(fullText, 190))
        verticalGap += updateLineGap(doc.splitTextToSize(fullText, 190).length)
      }
      // update the line height after writing the text.

    })

    try {
      doc.save(`${rootFolder}HTMLText.pdf`)
      return console.log('PDF File Saved at: ', `${rootFolder}HTMLText.pdf`)
    } catch (error) {
      console.error('Error Saving PDF File ', error)
    }
  })
}))()