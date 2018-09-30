# Duke3D Group

[![NPM version][npm-version-image]][npm-url]
[![Build Status][build-status-image]][build-status-url]
[![Coverage Status][coverage-image]][coverage-url]
[![Known Vulnerabilities][vulnerabilities-image]][vulnerabilities-url]
[![Downloads][npm-downloads-image]][npm-url]

A module for reading Duke Nukem 3D group files.

## Usage

```javascript
var Group = require("duke3d-group");

// creating and writing a group to a file:
var group = new Group("TEST.GRP");
group.addFile(new Group.File("GAME.CON", Buffer.from("define MAXPLAYERHEALTH 420")));
group.addDirectory("C:\\TCs\Awesome_TC\\");
group.writeTo("C:\\TCs\\AWESOME.GRP");

// reading, interacting and extracting files with / from a group:
var group = Group.readFrom("C:\\TCs\EPICNUKE.GRP");
console.log("Number of Files: " + group.numberOfFiles());
group.extractAllFiles("C:\\TCs\\EpicNukem\\");
var conFiles = group.getFilesWithExtension("CON");
for(var i = 0; i < conFiles.length; i++) {
    console.log(conFiles[i].name);
}
```

## Installation

To install this module:
```bash
npm install duke3d-group
```

[npm-url]: https://www.npmjs.com/package/duke3d-group
[npm-version-image]: https://img.shields.io/npm/v/duke3d-group.svg
[npm-downloads-image]: http://img.shields.io/npm/dm/duke3d-group.svg

[build-status-url]: https://travis-ci.org/nitro404/duke3d-group
[build-status-image]: https://travis-ci.org/nitro404/duke3d-group.svg?branch=master

[coverage-url]: https://coveralls.io/github/nitro404/duke3d-group?branch=master
[coverage-image]: https://coveralls.io/repos/github/nitro404/duke3d-group/badge.svg?branch=master

[vulnerabilities-url]: https://snyk.io/test/github/nitro404/duke3d-group?targetFile=package.json
[vulnerabilities-image]: https://snyk.io/test/github/nitro404/duke3d-group/badge.svg?targetFile=package.json
