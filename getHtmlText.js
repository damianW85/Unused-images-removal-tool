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

// GLOBALS
const updateLineGap = multiple => multiple * 5
const needNewPage = vertGap => vertGap > 275
const pdfName = 'Q221_Web_Marketing_Page_CopyDeck'
const compareSection = 'section-compare-table'
const compareClass = 'compare-column-'
const footerSection = 'section w6ea047'
const hiddenOnMobile = 'small-hide'
const copyClass = 'copy'

const arrayToRow = (arr, isHeader = false) => {
  const rows = []

  if (isHeader) {
    arr.map(rowArray => rows.push(rowArray[0]))
  } else {
    for (let i = 1; i < arr[0].length; i++) {
      const row = []
      arr.map(subArr => row.push(subArr[i]))
      rows.push(row)
    }
  }
  return isHeader ? [rows] : rows
}

const buildTable = (dom, doc, position, callback) => {
  const tableArray = []

  for (let z = 0; dom.window.document.querySelectorAll(`.${compareClass}${z}`).length; z++) {
    const column = []

    dom.window.document.querySelectorAll(`.${compareClass}${z}`).forEach(tableNode => {
      column.push(...[cleanHtmlString(tableNode.innerHTML)].filter(Boolean))
    })
    tableArray.push(column)
  }

  return doc.autoTable({
    head: arrayToRow(tableArray, true),
    body: arrayToRow(tableArray),
    startY: position.verticalGap + 5,
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

(() => searchForFiles('./', /\.html$/, filename => {
  console.log('-- found: ', filename)

  JSDOM.fromFile(filename).then(dom => {
    let comparisonTable = false
    const results = []
    const rootFolder = path.join(__dirname, filename.replace(/([^\/]+$)/, ''))
    const boldFont = ['calibriBold', 'bold']
    const normalFont = ['calibriNormal', 'normal']
    const boldElements = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']
    const fontSize = 8
    const headingFontSize = 10
    const textLineLength = 185

    const doc = new jsPDF()
    doc.addFileToVFS('calibriNormal.ttf', calibriNormal)
    doc.addFont('calibriNormal.ttf', ...normalFont)
    doc.addFileToVFS('calibriBold.ttf', calibriBold)
    doc.addFont('calibriBold.ttf', ...boldFont)
    doc.setFontSize(fontSize)

    // get all the text by querying all elements with the copy class.
    dom.window.document.querySelectorAll(`.${copyClass}`).forEach(domNode => {
      // prevent duplication of text in the pdf.
      if (domNode.closest(`.${hiddenOnMobile}`)) return
      // filter all tags from the innerHTML of the dom node except for strong tags, then replace those tags with ** so we can know where text is bold.
      const stringWithBoldStars = cleanHtmlString(domNode.innerHTML, ['strong']).replace(/(<[^>]*>)|(^ +|\n|\t|\r)/gm, '**')

      results.push({
        parentClasses: domNode.closest('.section').className,
        name: domNode.nodeName,
        textArray: doc.splitTextToSize(stringWithBoldStars, textLineLength)
      })
    })
    // this is the padding gap on the left of the document.
    const startGap = 15
    // this is effectively the line height.
    const horizontalGap = 10
    let verticalGap = startGap
    let currentSection = ''

    results.map((textObject, idx) => {
      if (textObject.parentClasses.includes(compareSection)) {
        if (!comparisonTable) {
          // create the comparison table, update the verticalGap and set the variable to true.
          buildTable(dom, doc, {
            verticalGap,
            horizontalGap
          }, totalTableCells => verticalGap += (totalTableCells * 11))
          comparisonTable = true
        }
        return
      }

      textObject.textArray.map((textLine, textIdx) => {
        if (!boldElements.includes(textObject.name)) {
          const arrayOfNormalAndBoldText = textLine.split('**')
          let paddingLeft = horizontalGap

          arrayOfNormalAndBoldText.map((text, j) => {
            const cleanText = cleanHtmlString(text)
            if (!cleanText.length) return

            doc.setFontSize(fontSize)
            doc.setFont(...boldFont)
            if (j % 2 === 0) doc.setFont(...normalFont)

            if (textIdx === 0 && results[idx - 1] && boldElements.includes(results[idx - 1].name) || currentSection !== textObject.parentClasses) {
              verticalGap += updateLineGap(1)
              currentSection = textObject.parentClasses
            }

            doc.text(paddingLeft, verticalGap, cleanText)
            // split the footer section.
            if (currentSection === footerSection) {
              paddingLeft = horizontalGap
              verticalGap += updateLineGap(1)
            } else {
              paddingLeft += doc.getTextWidth(cleanText) + 1
            }
          })
          // Only update the vertical spacing if we are not in the footer section.
          if (currentSection !== footerSection) verticalGap += updateLineGap(1)
        } else {
          // check for header elements and write them in bold to the doc.
          doc.setFont(...boldFont)
          doc.setFontSize(headingFontSize)
          if (verticalGap !== startGap) verticalGap += updateLineGap(1)
          doc.text(horizontalGap, verticalGap, cleanHtmlString(textLine))
        }
        // check if we need to add a new page to the document.
        needNewPage(verticalGap) ? (doc.addPage(), verticalGap = startGap) : null
      })
    })

    try {
      const filePath = `${rootFolder}${rootFolder.replace(`${path.resolve()}/`, '').replaceAll('/', '_')}${pdfName}.pdf`
      doc.save(filePath)
      return console.log('PDF File Saved at: ', filePath)
    } catch (error) {
      console.error('Error Saving PDF File ', error)
    }
  })
}))()