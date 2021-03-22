# Unused-images-removal-tool
Find and test all css breakpoints using puppeteer to detect and delete unused images.

## Features

* Works with node.js.
* Searches recursively from root directory down:(inside subdirectories).
* Finds and deletes all unused images and deletes them.
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
