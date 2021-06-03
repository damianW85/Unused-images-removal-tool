// to run this script, simply type `node unusedImages.js` in the terminal.
const puppeteer = require('puppeteer')
const fileUrl = require('file-url')
const path = require('path')
const fs = require('fs')
const {
  searchForFiles,
  deleteFile
} = require('./helperFunctions')

const checkForUnusedImages = async (breakpoints, browser, page, filePath) => {
  const usedImages = []
  const deviceScales = [1, 2]
  const rootFolder = path.join(__dirname, filePath.replace(/([^\/]+$)/, ''))
  // TODO: make the images array formation more dynamic.
  const allImages = Array.from(fs.readdirSync(`${rootFolder}images`)).map(t => t.replace(/\?.*/, ''))

  // Loop through deviceScales array
  for (let d = 0; d < deviceScales.length; d++) {
    // Loop through breakpoints and set the viewport to each point, to load all necessary images.
    for (let i = 0; i < breakpoints.length; i++) {
      await page.setViewport({
        width: breakpoints[i],
        height: 1200,
        deviceScaleFactor: deviceScales[d],
      })
      // Refresh the HTML at each breakpoint to load the relevant images.
      await page.goto(fileUrl(filePath), {
        waitUntil: 'networkidle0',
      })
      // Look for all select options in compare page.
      const options = await page.$$eval('select[id="0"] option', (options) =>
        options.map((option) => option.value)
      )

      if (options.length) {
        for (let p = 0; p < options.length; p++) {
          // Select each option in the first dropdown to load all assets.
          await page.select('select[id="0"]', options[p])
        }
      }

      // Store the name of each image requested in the usedImages array.
      page.on('request', (req) => {
        if (req.resourceType() === 'image') {
          usedImages.push(req._url.split(/(\\|\/)/g).pop().replace(/\?.*/, ''))
        }
      })

      if (i === breakpoints.length - 1 && d === deviceScales.length - 1) {
        await browser.close()
        // Create the unusedImages array.
        const unusedImages = allImages.filter(x => !usedImages.includes(x))
        const notFoundImages = usedImages.filter(d => !allImages.includes(d))
        // Log results at the end of the loop to the console.
        console.log('allImages: ', allImages.length)
        console.log('usedImages: ', [...new Set(usedImages)], [...new Set(usedImages)].length)
        console.log('unusedImages: ', [...new Set(unusedImages)], [...new Set(unusedImages)].length)

        if (notFoundImages.length) console.error('ERROR: Some images were requested but NOT FOUND!: ', [...new Set(notFoundImages)])
        // Loop through the unusedImages array and delete the images.
        return [...new Set(unusedImages)].map(imageName => deleteFile(`${rootFolder}images/${imageName}`))
      }
    }
  }
}

(() => searchForFiles('./', /\.html$/, async (filename) => {
  if (filename.includes('reference')) return

  console.log('-- found: ', filename)
  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()
  await page.goto(fileUrl(filename))
  const client = await page.target().createCDPSession()
  await client.send('DOM.enable')
  await client.send('CSS.enable')
  // Get all media query breakpoints from css.
  const mediaQueries = await client.send('CSS.getMediaQueries')
  let breakpoints = []
  mediaQueries.medias.forEach(mediaQuery => {
    mediaQuery.mediaList.forEach(item => {
      item.expressions.forEach(expression => {
        if (['max-width', 'min-width'].indexOf(expression.feature) !== -1) {
          breakpoints.push({
            type: expression.feature,
            value: expression.value,
            unit: expression.unit
          })
        }
      })
    })
  })
  // Start with 400px for loading the smallest assets, also add 1800px for largest assets.
  breakpoints = [400, ...new Set(breakpoints.map(point => point.value)), 1800].sort((a, b) => a - b)
  // Show the breakpoints we have found in css.
  console.log('Breakpoints: ', breakpoints)
  return checkForUnusedImages(breakpoints, browser, page, filename)
}))()