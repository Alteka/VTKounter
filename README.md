# Alteka VT Kounter
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub release](https://img.shields.io/github/release/Alteka/VTKounter.svg)](https://GitHub.com/Alteka/VTKounter/releases/)
[![GitHub issues](https://img.shields.io/github/issues/Alteka/VTKounter.svg)](https://GitHub.com/Alteka/VTKounter/issues/)

## About
VT Kounter is designed to help video operators see a nice, large, clear countdown timer for the current video playout. It can also send that timer information to OBS - this is useful for remote productions where you might use OBS to create a 'presenter return' style layout.

We currently support QLab and Mitti, as these are our preferred options, but we're looking to add more. If you have specific requests do have a look at the issues section on GitHub.

## Download
Get the latest release here: [Latest Release](https://github.com/Alteka/VTKounter/releases/)

### Design
The app is based around Electron to create and manage the windows. The content is heavily Vue.js driven.

#### Build Setup
``` bash
#Clone the repo into a folder
# cd into the folder and run the below
#You'll need to have node.js installed

# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run build
```

---

For more information please see our website: [Alteka Solutions](https://alteka.solutions/)
