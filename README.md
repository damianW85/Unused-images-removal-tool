# Unused-images-removal-tool
Find and test all css breakpoints using puppeteer to detect and delete unused images.

## Features

* Works with node.js.
* Searches recursively from root directory down:(inside subdirectories).
* Finds and deletes all unused images.
* Throws an error if images are requested by the browser but not found in images directory.

## Requirements

### node.js
This tool requires that you have node.js installed. If you don't already have it you can get it here: [https://nodejs.org/en/download]

### images directory
This tool also requires that you have all relevant images in a directory called `images` located at the same directory level as your `.html` file.

**Default usage**
You can use this tool by doing:

```bash
$ npm install
$ node unusedImages.js
```
**To run with the chromium browser open**

```javascript
// Change this in: unusedImages.js line 58
const browser = await puppeteer.launch() 

//To this:
const browser = await puppeteer.launch({ headless: false })
```


# Get-HTML-Text-Tool
This script finds and extracts text from `.html` files then writes the text to a PDF and saves it in the root directory of the `.html` file.

This script was written to work with the spring 2021 workshop html builds. Results may vary if used with other builds unless they are similar to the spring 2021 workshop builds.

No configuration is needed if trying to extract text from the iPhone 12, 12Pro or iPadPro builds, simply run the script as instructed below.

**Default usage**
You can use this tool by doing:

```bash
$ npm install
$ node getHtmlText.js
```

**Configuration for iMac**
Because of major differences in the iMac build, in order to get the comparison table to be laid ot correctly in the pdf document, the following configuration is required.

```javascript
// Change this in: getHtmlText.js line 23
const isiMacBuild = false 

//To this:
const isiMacBuild = true 
```

In `getHtmlText.js` line 22 there are a list of global variables which specifies classnames and configurations for the spring 2021 workshop builds. If the build you are working is different then these variables will need to be updated before the script will work correctly.