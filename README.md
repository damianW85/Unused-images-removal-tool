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

It is essential that the `.html` files are either in the same directory as `getHtmlText.js` or a subdirectory.

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


# Get-Attribute-Text-Tool
This script finds and extracts text from a specified attribute type within `.html` files then writes the text to a CSV and saves it in the root directory of the `.html` file. This script works with all `.html` files.

It is essential that the `.html` files are either in the same directory as `getAttributeText.js` or a subdirectory.

**Configuration**
The only necessary configuration is to specify the attribute from which you require the text content as a string. see below for the default which is set to `aria-label`.

```javascript
// getAttributeText.js line 12
const attributeName = 'aria-label'
```

# Screne-Shot-Element-Tool
This script finds finds an element within `.html` files then takes a screenshot at the specified breakpoints and saves it in the root directory of the `.html` file.

It is essential that the `.html` files are either in the same directory as `screenShotElements.js` or a subdirectory.

**Configuration**
The only necessary configuration is to specify the class or id of the element you would like to screenshot. See below for the details.

```javascript
// screenShotElements.js line 12
const targetElement = '.d4daecb'
```
If necessary you may also add additional breakpoints at which to take screenshots to the breakpoints array. See below for the details.

```javascript
// screenShotElements.js line 15
const breakpoints = [
  { name: 'mobile', size: 500 },
  { name: 'tablet', size: 736 },
  { name: 'desktop', size: 1069 }
]
```