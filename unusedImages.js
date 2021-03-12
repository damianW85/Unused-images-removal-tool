// to run this script, simply type `node unusedImages.js` in the terminal.
const puppeteer = require('puppeteer');
const fileUrl = require('file-url');
const path = require('path');
const fs = require('fs');

const checkForUnusedImages = async (breakpoints, browser, page, filePath) => {
  const usedImages = [];
  const deviceScales = [1, 2];
  const folderName = path.join(__dirname, filePath.replace('/index.html', ''));
  const allImages = Array.from(fs.readdirSync(`${folderName}/images`));
  console.log(folderName);

  // Loop through deviceScales array
  for (let d = 0; d < deviceScales.length; d++) {
    // Loop through breakpoints and set the viewport to each point, to load all necessary images.
    for (let i = 0; i < breakpoints.length; i++) {
      await page.setViewport({
        width: breakpoints[i],
        height: 1200,
        deviceScaleFactor: deviceScales[d],
      });
      // Refresh the HTML at each breakpoint to load the relevant images.
      await page.goto(fileUrl(filePath), {
        waitUntil: 'networkidle0',
      });
      // Store the name of each image requested in the usedImages array.
      page.on('request', (req) => {
        if (req.resourceType() === 'image') {
          usedImages.push(req._url.split(/(\\|\/)/g).pop())
        }
      })

      if (i === breakpoints.length - 1 && d === deviceScales.length - 1) {
        await browser.close();
        // Create the unusedImages array.
        const unusedImages = allImages.filter(x => !usedImages.includes(x)).concat(usedImages.filter(d => !allImages.includes(d)));
        // Log results at the end of the loop to the console.
        console.log('allImages: ', allImages.length);
        console.log('usedImages: ', [...new Set(usedImages)], [...new Set(usedImages)].length);
        console.log('unusedImages: ', unusedImages, unusedImages.length);
        // Loop through the unusedImages array and delete the images.
        return unusedImages.map(imageName => {
          fs.unlink(`${folderName}/images/${imageName}`, (err) => {
            if (err) {
              console.error('File DELETION ERROR: ', err);
              return;
            }
            console.log('File DELETED: ', `${folderName}/images/${imageName}`);
          })
        })
      }
    }
  }
}

const searchForFiles = (startPath, filter, callback) => {

  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }

  const files = fs.readdirSync(startPath);

  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);

    if (stat.isDirectory() && !filename.includes('node_modules')) searchForFiles(filename, filter, callback); //recurse

    else if (filter.test(filename)) callback(filename);
  }
}

(() => {
  searchForFiles('./', /\.html$/, async (filename) => {
    console.log('-- found: ', filename);
    const browser = await puppeteer.launch({
      // Remove this object completely if you do not want top see the browser.
      headless: false
    });
    const page = await browser.newPage();
    await page.goto(fileUrl(filename));
    const client = await page.target().createCDPSession();
    await client.send('DOM.enable');
    await client.send('CSS.enable');
    // Get all media query breakpoints from css.
    const mediaQueries = await client.send('CSS.getMediaQueries');
    let breakpoints = [];
    mediaQueries.medias.forEach(mediaQuery => {
      mediaQuery.mediaList.forEach(item => {
        item.expressions.forEach(expression => {
          if (['max-width', 'min-width'].indexOf(expression.feature) !== -1) {
            breakpoints.push({
              type: expression.feature,
              value: expression.value,
              unit: expression.unit
            });
          }
        });
      });
    });
    // Start with 400px for loading the smallest assets.
    breakpoints = [400, ...new Set(breakpoints.map(point => point.value))].sort((a, b) => a - b);
    // Show the breakpoints we have found in css.
    console.log('Breakpoints: ', breakpoints);
    return checkForUnusedImages(breakpoints, browser, page, filename);
  });
})();