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
    const textLineLength = 198
    let comparisonTable = false
    const doc = new jsPDF()
    doc.addFileToVFS('calibriNormal.ttf', calibriNormal)
    doc.addFont('calibriNormal.ttf', 'calibriNormal', 'normal')
    doc.addFileToVFS('calibriBold.ttf', calibriBold)
    doc.addFont('calibriBold.ttf', 'calibriBold', 'bold')
    doc.setFontSize(fontSize)

    // get all the text by querying all elements with the copy class.
    dom.window.document.querySelectorAll('.copy').forEach(domNode => {
      // filter all tags from the innerHTML of the dom node except for strong tags, then replace those tags with ** so we can know where text is bold.
      const stringWithStrongTags = cleanHtmlString(domNode.innerHTML, ['strong']).replace(/(<[^>]*>)|(^ +|\n|\t|\r)/gm, '**')

      results.push({
        parentClasses: domNode.closest('.section').className,
        name: domNode.nodeName,
        textArray: doc.splitTextToSize(stringWithStrongTags, textLineLength)
      })
    })
    // this is the padding gap on the left of the document.
    const startGap = 15
    let verticalGap = startGap
    let currentSection = ''
    // this is effectively the line height.
    const horizontalGap = 10

    results.map(textObject => {
      if (textObject.parentClasses.includes('section-compare-table')) {
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

      textObject.textArray.map((textLine, i) => {
        const arrayOfNormalAndBoldText = textLine.split('**')

        if (!boldElements.includes(textObject.name) && arrayOfNormalAndBoldText.length) {
          let paddingLeft = horizontalGap

          arrayOfNormalAndBoldText.map((text, j) => {
            const cleanText = cleanHtmlString(text)
            if (!cleanText.length) return

            doc.setFontSize(fontSize)
            doc.setFont('calibriBold', 'bold')
            if (j % 2 === 0) doc.setFont('calibriNormal', 'normal')
            // split the footer section \\
            // if (currentSection === 'section w6ea047' && doc.getFont().fontName=== 'calibriBold') {
            //   paddingLeft = horizontalGap
            //   verticalGap += updateLineGap(1)
            // }

            if (currentSection !== textObject.parentClasses) {
              verticalGap += updateLineGap(1)
              currentSection = textObject.parentClasses
            }
            doc.text(paddingLeft, verticalGap, cleanText)
            paddingLeft += doc.getTextWidth(cleanText) + 1
          })
          verticalGap += updateLineGap(1)
        }
        if (boldElements.includes(textObject.name)) {
          // check for header elements and write them in bold to the doc.
          doc.setFont('calibriBold', 'bold')
          doc.setFontSize(headingFontSize)
          if (verticalGap !== startGap) verticalGap += updateLineGap(1)
          doc.text(horizontalGap, verticalGap, cleanHtmlString(textLine))
        }
      })
    })

    try {
      doc.save(`${rootFolder}HTMLText.pdf`)
      return console.log('PDF File Saved at: ', `${rootFolder}HTMLText.pdf`)
    } catch (error) {
      console.error('Error Saving PDF File ', error)
    }
  })
}))()