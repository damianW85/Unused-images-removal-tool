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
  const allImages = Array.from(fs.readdirSync(`${rootFolder}images`))

  // Loop through deviceScales array
  for (let d = 0; d < deviceScales.length; d++) {
    console.log('deviceScalkes ', deviceScales.length, d)
    // Loop through breakpoints and set the viewport to each point, to load all necessary images.
    for (let i = 0; i < breakpoints.length; i++) {
      console.log('breakpointses ', breakpoints.length, i)
      await page.setViewport({
        width: breakpoints[i],
        height: 1200,
        deviceScaleFactor: deviceScales[d],
      })
      // Refresh the HTML at each breakpoint to load the relevant images.
      await page.goto(fileUrl(filePath), {
        waitUntil: 'networkidle0',
      })
      // Store the name of each image requested in the usedImages array.
      page.on('request', (req) => {
        if (req.resourceType() === 'image') {
          usedImages.push(req._url.split(/(\\|\/)/g).pop())
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
  // Start with 400px for loading the smallest assets.
  breakpoints = [400, ...new Set(breakpoints.map(point => point.value))].sort((a, b) => a - b)
  // If for some reason we only find 1 breakpoint in the css, add some generic ones to test.
  if (breakpoints.length < 2) breakpoints = [...breakpoints, 800, 1200, 1600]
  // Show the breakpoints we have found in css.
  console.log('Breakpoints: ', breakpoints)
  return checkForUnusedImages(breakpoints, browser, page, filename)
}))()