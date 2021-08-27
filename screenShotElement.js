// to run this script, simply type `node screenShotElement.js` in the terminal.
const puppeteer = require('puppeteer')
const fileUrl = require('file-url')
const path = require('path')
const {
  searchForFiles
} = require('./helperFunctions');

(() => searchForFiles('./', /\.html$/, async (filename) => {
  if (filename.includes('reference')) return
  // The element that the screen shot will be taken of.
  const targetElement = '.d4daecb'
  const rootFolder = path.join(__dirname, filename.replace(/([^\/]+$)/, ''))
  // the screen sizes at which screenshots will be taken.
  const breakpoints = [{ name: 'mobile', size: 500 }, { name: 'tablet', size: 736 }, { name: 'desktop', size: 1069 }]
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  for (let i = 0; i < breakpoints.length; i++) {
    await page.setViewport({
      width: breakpoints[i].size,
      height: 1200
    })
    await page.goto(fileUrl(filename), {
      waitUntil: 'networkidle0',
    })
    await page.waitForSelector(targetElement)
    const element = await page.$(targetElement)
    await element.screenshot({ path: `${rootFolder}/${breakpoints[i].name}_screenshot.png` })
  }
  await browser.close()
}))()