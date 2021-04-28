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

const buildTable = (test, doc, position, callback) => {
  // const tableArray = []

  // for (let z = 0; dom.window.document.querySelectorAll(`.compare-column-${z}`).length; z++) {
  //   const column = []

  //   dom.window.document.querySelectorAll(`.compare-column-${z}`).forEach(tableNode => {
  //     column.push(...[cleanHtmlString(tableNode.innerHTML)].filter(Boolean))
  //   })
  //   tableArray.push(column)
  // }

  return doc.autoTable({
    head: [test.forImac.splice(0, 2)],
    body: arrayToRow([test.row1, test.row2]),
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

(() => searchForFiles('./', /\.html$/, filename => {
  console.log('-- found: ', filename)

  JSDOM.fromFile(filename).then(dom => {
    let comparisonTable = false
    const results = []
    const rootFolder = path.join(__dirname, filename.replace(/([^\/]+$)/, ''))
    const fontSize = 8
    const headingFontSize = 10
    const textLineLength = 185
    const boldElements = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']
    const compareSection = 's21bf56e'
    const footerSection = 'section w6ea047'
    const boldFont = ['calibriBold', 'bold']
    const normalFont = ['calibriNormal', 'normal']

    const doc = new jsPDF()
    doc.addFileToVFS('calibriNormal.ttf', calibriNormal)
    doc.addFont('calibriNormal.ttf', ...normalFont)
    doc.addFileToVFS('calibriBold.ttf', calibriBold)
    doc.addFont('calibriBold.ttf', ...boldFont)
    doc.setFontSize(fontSize)

    // get all the text by querying all elements with the copy class.
    dom.window.document.querySelectorAll('.copy').forEach(domNode => {
      if (domNode.closest('.small-hide')) return

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
    const forImac = []
    const row1 = []
    const row2 = []

    for (let i = 0; i < results.length; i++) {
      if (results[i].parentClasses.includes('section theme-light s21bf56')) {
        forImac.push(...results[i].textArray)
      }
      if (i === results.length - 1) {

        forImac.splice(0, 2);

        forImac.map((txt, idx) => {
          console.log(idx, txt)
          idx % 2 !== 0 ? row1.push(txt) : row2.push(txt)
        })

        const test2 = row2.splice(6, 3)
        const test1 = row1.splice(6, 3)

        row1.splice(6, 0, ...test2)
        row2.splice(6, 0, ...test1)
        const test3 = row2.splice(10, 1)
        const test4 = test3.concat(row1[10]).toString().replace(',', ' ')
        row1.splice(10, 1, test4)
        console.log(row1, row2)
      }
    }
    let count = 0
    results.map((textObject, idx) => {

      if (textObject.parentClasses.includes('section theme-light s21bf56')) {
        count++
        if (!comparisonTable && count > 2) {

          // create the comparison table, update the verticalGap and set the variable to true.
          buildTable({ forImac, row1, row2 }, doc, {
            verticalGap,
            horizontalGap
          }, totalTableCells => verticalGap += (totalTableCells * 8))
          comparisonTable = true
        }
        if (count > 2) return
      }

      textObject.textArray.map(textLine => {
        if (!boldElements.includes(textObject.name)) {
          const arrayOfNormalAndBoldText = textLine.split('**')
          let paddingLeft = horizontalGap

          arrayOfNormalAndBoldText.map((text, j) => {
            const cleanText = cleanHtmlString(text)
            if (!cleanText.length) return

            doc.setFontSize(fontSize)
            doc.setFont(...boldFont)
            if (j % 2 === 0) doc.setFont(...normalFont)

            // if (results[idx - 1] && boldElements.includes(results[idx - 1].name) || currentSection !== textObject.parentClasses) {
            //   verticalGap += updateLineGap(1)
            //   currentSection = textObject.parentClasses
            // }

            if (currentSection !== textObject.parentClasses) {
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
          if (verticalGap !== startGap) verticalGap += updateLineGap(1)
        }
        // check if we need to add a new page to the document.
        needNewPage(verticalGap) ? (doc.addPage(), verticalGap = startGap) : null
      })
    })

    try {
      doc.save(`${rootFolder}${rootFolder.replace('/Users/damianwhyte/Desktop/Projects/Unused-images-removal-tool/', '').replaceAll('/', '_')}iMac_Q221_Web_Marketing_Page_CopyDeck.pdf`)
      return console.log('PDF File Saved at: ', `${rootFolder}${rootFolder.replace('/Users/damianwhyte/Desktop/Projects/Unused-images-removal-tool/', '').replace('/', '_')}.pdf`)
    } catch (error) {
      console.error('Error Saving PDF File ', error)
    }
  })
}))()