"use strict";

const Group = require("../src/group.js");
const async = require("async");
const path = require("path-extra");
const fs = require("fs-extra");
const utilities = require("extra-utilities");
const ByteBuffer = require("bytebuffer");
const chai = require("chai");
const expect = chai.expect;

let testGroup = null;

let fakeGroup = new Group("FAKE.GRP");
const fakeFile = new Group.File("FAKE.CON", 28);
fakeGroup.files.push(fakeFile);

let invalidGroup = new Group("INVALID");
invalidGroup.files = [
	new Group.File(""),
	new Error("This is not the group file you are looking for."),
	new Group.File("FLEXTREK.WHIPSNAKE")
];

const testGroups = [
	new Group(),
	fakeGroup
];

const testFiles = [
	"invalid",
	"EMPTY.txt",
	"FAKE.con",
	"EMPTY",
	"readme.txt",
	"tEsT.JsOn",
	"test.TXT"
];

const testDate = new Date();

const emptyFunction = function() { };
const emptyFunctionString = emptyFunction.toString();

const testRegExp = new RegExp(".+");

const testData = [
	undefined,
	null,
	false,
	true,
	new Boolean(false),
	new Boolean(true),
	0,
	1,
	3.141592654,
	NaN,
	Infinity,
	-Infinity,
	"",
	"test",
	" trim\t",
	{ },
	{ nice: "meme" },
	[ ],
	[0],
	testDate,
	emptyFunction,
	testRegExp
];

const tempDirectory = path.join(__dirname, "temp/");

const verbose = false;

describe("Duke3D", function() {
	before(function() {
		testGroup = Group.readFrom(path.join("test", "data", "TEST.GRP"));

		testGroups.push(testGroup);

		testFiles.push(testGroup.getFile("test.png"));
	});

	afterEach(function(callback) {
		async.eachSeries(
			[tempDirectory, "TEMP.CON", "TEMP.GRP"],
			function(path, callback) {
				return fs.stat(
					path,
					function(error, stats) {
						if(error && error.code !== "ENOENT") {
							return callback(error);
						}

						if(!stats) {
							return callback();
						}

						return fs.remove(
							path,
							function(error) {
								if(error) {
									return callback(error);
								}

								if(verbose) {
									console.log("Removed temporary " + (stats.isDirectory() ? "directory" : "file") +": " + path);
								}

								return callback();
							}
						);
					}
				);
			},
			function(error) {
				if(error) {
					if(verbose) {
						console.error(error);
					}
				}

				return callback();
			}
		);
	});

	describe("Group", function() {
		describe("DEFAULT_FILE_EXTENSION", function() {
			it("should be a string", function() {
				expect(Group.DEFAULT_FILE_EXTENSION).to.be.a("string");
			});

			it("should contain the correct value", function() {
				expect(Group.DEFAULT_FILE_EXTENSION).to.equal("GRP");
			});

			it("should throw an error when trying to modify it", function() {
				expect(function() { Group.DEFAULT_FILE_EXTENSION = "BUTT"; }).to.throw();
			});
		});

		describe("HEADER_TEXT", function() {
			it("should be a string", function() {
				expect(Group.HEADER_TEXT).to.be.a("string");
			});

			it("should contain the correct value", function() {
				expect(Group.HEADER_TEXT).to.equal("KenSilverman");
			});

			it("should throw an error when trying to modify it", function() {
				expect(function() { Group.HEADER_TEXT = "KevinScroggins"; }).to.throw();
			});
		});

		describe("filePath setter", function() {
			it("should automatically trim values", function() {
				let group = new Group("\t  NOPE.AVI\t  ");

				expect(group.filePath).to.equal("NOPE.AVI");

				group.filePath = " TRIM.GRP\t";

				expect(group.filePath).to.equal("TRIM.GRP");
			});

			it("should replace non-string values with null", function() {
				let group = new Group(-Infinity);

				expect(group.filePath).to.equal(null);

				group.filePath = 420;

				expect(group.filePath).to.equal(null);
			});
		});

		describe("files setter", function() {
			it("should not modify the value of files for non-array values", function() {
				let group = new Group();
				const groupFile = new Group.File("FAKE.EXE", 420);
				group.files.push(groupFile);

				group.files = new Error("SEGFAULT");

				expect(group.files).to.deep.equal([groupFile]);
				expect(group.files[0]).to.equal(groupFile);
			});

			it("should replace the value of files with valid array values", function() {
				let group = new Group();
				const groupFile = new Group.File("2PIGONS.EXE", 255);
				const anotherGroupFile = new Group.File("SAMETIE.EXE", 3);
				group.files = [groupFile];

				expect(group.files).to.deep.equal([groupFile]);
				expect(group.files[0]).to.equal(groupFile);

				group.files = [groupFile, anotherGroupFile];

				expect(group.files).to.deep.equal([groupFile, anotherGroupFile]);
				expect(group.files[0]).to.equal(groupFile);
				expect(group.files[1]).to.equal(anotherGroupFile);
			});
		});

		describe("getFilePath", function() {
			it("should be a function", function() {
				expect(Group.prototype.getFilePath).to.be.a("function");
			});

			it("should return the correct file path for valid groups", function() {
				const newTestGroups = testGroups.concat(
					new Group("NEW.GRP")
				);

				for(let i = 0; i < newTestGroups.length; i++) {
					expect(newTestGroups[i].getFilePath()).to.equal(newTestGroups[i].filePath);
				}
			});
		});

		describe("getFileName", function() {
			it("should be a function", function() {
				expect(Group.prototype.getFileName).to.be.a("function");
			});

			it("should return the correct file name", function() {
				const newTestGroups = testGroups.concat(
					new Group("EMPTY.GRP")
				);

				const results = [
					null,
					"FAKE.GRP",
					"TEST.GRP",
					"EMPTY.GRP"
				];

				for(let i = 0; i < newTestGroups.length; i++) {
					expect(newTestGroups[i].getFileName()).to.equal(results[i]);
				}
			});
		});

		describe("getExtension", function() {
			it("should be a function", function() {
				expect(Group.prototype.getExtension).to.be.a("function");
			});

			it("should return the correct file extension", function() {
				const newTestGroups = testGroups.concat(
					new Group("FAKE_NEWS"),
					new Group("EMPTY.SSI")
				);

				const results = [
					Group.DEFAULT_FILE_EXTENSION,
					"GRP",
					"GRP",
					"",
					"SSI"
				];

				for(let i = 0; i < newTestGroups.length; i++) {
					expect(newTestGroups[i].getExtension()).to.equal(results[i]);
				}
			});
		});

		describe("setFilePath", function() {
			it("should be a function", function() {
				expect(Group.prototype.setFilePath).to.be.a("function");
			});

			it("should automatically trim values", function() {
				let group = new Group("\t  NOPE.AVI\t  ");

				expect(group.filePath).to.equal("NOPE.AVI");

				group.setFilePath(" TRIM.GRP\t");

				expect(group.filePath).to.equal("TRIM.GRP");
			});

			it("should replace non-string values with null", function() {
				let group = new Group(-Infinity);

				expect(group.filePath).to.equal(null);

				group.setFilePath(420);

				expect(group.filePath).to.equal(null);
			});
		});

		describe("verifyAllFiles", function() {
			it("should be a function", function() {
				expect(Group.prototype.verifyAllFiles).to.be.a("function");
			});

			it("should correctly validate all files in a group", function() {
				const newTestGroups = testGroups.concat(invalidGroup);

				const results = [true, true, true, false];

				for(let i = 0; i < newTestGroups.length; i++) {
					expect(newTestGroups[i].verifyAllFiles()).to.equal(results[i]);
				}
			});
		});

		describe("getGroupSize", function() {
			it("should be a function", function() {
				expect(Group.prototype.getGroupSize).to.be.a("function");
			});

			it("should correctly calculate the size of groups including headers and metadata", function() {
				const groupSizes = [16, 32, 326];

				for(let i = 0; i < testGroups.length; i++) {
					expect(testGroups[i].getGroupSize()).to.equal(groupSizes[i]);
				}
			});

			it("should correctly calculate the size of an invalid group", function() {
				expect(invalidGroup.getGroupSize()).to.equal(0);
			});
		});

		describe("getGroupFileSize", function() {
			it("should be a function", function() {
				expect(Group.prototype.getGroupFileSize).to.be.a("function");
			});

			it("should correctly calculate the combined data size of all files in a group", function() {
				const newTestGroups = testGroups.concat(invalidGroup);

				const results = [0, 0, 230, -1];

				for(let i = 0; i < newTestGroups.length; i++) {
					expect(newTestGroups[i].getGroupFileSize()).to.equal(results[i]);
				}
			});
		});

		describe("numberOfFiles", function() {
			it("should be a function", function() {
				expect(Group.prototype.numberOfFiles).to.be.a("function");
			});

			it("should return the correct number of files", function() {
				const results = [0, 1, 5];

				for(let i = 0; i < testGroups.length; i++) {
					expect(testGroups[i].numberOfFiles()).to.equal(results[i]);
				}
			});
		});

		describe("hasFile", function() {
			it("should be a function", function() {
				expect(Group.prototype.hasFile).to.be.a("function");
			});

			it("should return false for invalid values", function() {
				expect(testGroup.hasFile(new Date())).to.equal(false);
			});

			it("should return false for empty string values", function() {
				expect(testGroup.hasFile("")).to.equal(false);
			})

			it("should return true for groups with invalid files", function() {
				expect(invalidGroup.hasFile("FL.WHIPSNAKE")).to.equal(true);
			});

			it("should return true for files contained within the group", function() {
				const results = [
					[false, false, false, false, false, false, false, false],
					[false, false, true,  false, false, false, false, false],
					[false, false, false, true,  true,  true,  true,  true ]
				];

				for(let i = 0; i < testGroups.length; i++) {
					for(let j = 0; j < testFiles.length; j++) {
						expect(testGroups[i].hasFile(testFiles[j])).to.equal(results[i][j]);
					}
				}
			});
		});

		describe("indexOfFile", function() {
			it("should be a function", function() {
				expect(Group.prototype.indexOfFile).to.be.a("function");
			});

			it("should return -1 for invalid values", function() {
				expect(testGroup.indexOfFile([])).to.equal(-1);
			});

			it("should return -1 for empty string values", function() {
				expect(testGroup.indexOfFile("")).to.equal(-1);
			})

			it("should correctly retrieve group file indexes from groups with invalid files", function() {
				expect(invalidGroup.indexOfFile("FL.WHIPSNAKE")).to.equal(2);
			});

			it("should return the correct index for each file", function() {
				const results = [
					[-1, -1, -1, -1, -1, -1, -1, -1],
					[-1, -1,  0, -1, -1, -1, -1, -1],
					[-1, -1, -1,  0,  1,  2,  4,  3]
				];

				for(let i = 0; i < testGroups.length; i++) {
					for(let j = 0; j < testFiles.length; j++) {
						expect(testGroups[i].indexOfFile(testFiles[j])).to.equal(results[i][j]);
					}
				}
			});
		});

		describe("getFile", function() {
			it("should be a function", function() {
				expect(Group.prototype.getFile).to.be.a("function");
			});

			it("should return null for invalid values", function() {
				expect(testGroup.getFile(-Infinity)).to.equal(null);
			});

			it("should return null for empty string values", function() {
				expect(testGroup.getFile("")).to.equal(null);
			});

			it("should correctly retrieve group files from groups with invalid files", function() {
				expect(invalidGroup.getFile("FL.WHIPSNAKE")).to.not.equal(null);
			});

			it("should return null when using an out of bounds index", function() {
				expect(fakeGroup.getFile(-420)).to.equal(null);
				expect(fakeGroup.getFile(-1)).to.equal(null);
				expect(fakeGroup.getFile(69)).to.equal(null);
			});

			it("should return the correct file when requested by index", function() {
				expect(fakeGroup.getFile(0)).to.deep.equal(fakeFile);
			});

			it("should return the correct file when requested by file name", function() {
				expect(fakeGroup.getFile(fakeFile.name)).to.deep.equal(fakeFile);
			});

			it("should return the correct file when requested by instance", function() {
				expect(fakeGroup.getFile(fakeFile)).to.deep.equal(fakeFile);
			});
		});

		describe("getFiles", function() {
			it("should be a function", function() {
				expect(Group.prototype.getFiles).to.be.a("function");
			});

			it("should correctly return the list of files in a group", function() {
				const newTestGroups = testGroups.concat(
					new Group("NEW.GRP"),
					invalidGroup
				);

				for(let i = 0; i < newTestGroups.length; i++) {
					expect(newTestGroups[i].getFiles()).to.equal(newTestGroups[i].files);
				}
			});
		});

		describe("getFilesWithExtension", function() {
			it("should be a function", function() {
				expect(Group.prototype.getFilesWithExtension).to.be.a("function");
			});

			it("should return group files with the right extension in groups with invalid files", function() {
				expect(invalidGroup.getFilesWithExtension("WHIPSNAKE")).to.deep.equal([invalidGroup.files[2]]);
			});

			it("should return the correct files when requested by extension", function() {
				const extensions = ["", "dat", "txt", "CON", "jSoN", "PNG"];

				const fileCounts = [
					[0, 0, 0, 0, 0, 0],
					[0, 0, 0, 1, 0, 0],
					[0, 0, 2, 0, 1, 1]
				];

				for(let i = 0; i < testGroups.length; i++) {
					for(let j = 0; j < extensions.length; j++) {
						const files = testGroups[i].getFilesWithExtension(extensions[j]);

						expect(files.length).to.equal(fileCounts[i][j]);

						for(let k = 0; k < files.length; k++) {
							expect(files[k].getExtension()).to.equal(extensions[j].toUpperCase());
						}
					}
				}
			});
		});

		describe("getFileExtensions", function() {
			it("should be a function", function() {
				expect(Group.prototype.getFileExtensions).to.be.a("function");
			});

			it("should correctly return the list of file extensions for groups with invalid files", function() {
				expect(invalidGroup.getFileExtensions()).to.deep.equal(["WHIPSNAKE"]);
			});

			it("should return the correct list of file extensions", function() {
				const results = [
					[],
					["CON"],
					["TXT", "JSON", "PNG"],
				];

				for(let i = 0; i < testGroups.length; i++) {
					expect(testGroups[i].getFileExtensions()).to.deep.equal(results[i]);
				}
			});
		});

		describe("extractFile", function() {
			it("should be a function", function() {
				expect(Group.prototype.extractFile).to.be.a("function");
			});

			it("should extract group files by index", function() {
				expect(fs.readFileSync(testGroup.extractFile(1, tempDirectory))).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "readme.txt")));
			});

			it("should extract group files by file name", function() {
				expect(fs.readFileSync(testGroup.extractFile("test.JSON", tempDirectory))).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.json")));
			});

			it("should extract group files by instance", function() {
				expect(fs.readFileSync(testGroup.extractFile(testGroup.files[3], tempDirectory))).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.png")));
			});

			it("should extract group files to directories with alternate file names when specified in the destination path", function() {
				const extractedFilePath = testGroup.extractFile("test.txt", path.join(tempDirectory, "new.txt"));

				expect(extractedFilePath).to.equal(utilities.joinPaths(tempDirectory, "new.txt"));
				expect(fs.readFileSync(extractedFilePath)).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.txt")));
			});

			it("should extract group files to directories with alternate file names when specified as a parameter", function() {
				const extractedFilePath = testGroup.extractFile("test.txt", tempDirectory, false, "other.txt");

				expect(extractedFilePath).to.equal(utilities.joinPaths(tempDirectory, "other.txt"));
				expect(fs.readFileSync(extractedFilePath)).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.txt")));
			});

			it("should throw an error when attempting to overwrite an existing file", function() {
				testGroup.extractFile("README.TXT", tempDirectory);

				expect(function() { testGroup.extractFile("readme.txt", tempDirectory); }).to.throw();
				expect(function() { testGroup.extractFile("readme.txt", tempDirectory, false); }).to.throw();
			});

			it("should overwrite an existing file when specified", function() {
				const extractedFilePath = testGroup.extractFile("test.TXT", tempDirectory, false, "extracted.txt");

				expect(fs.readFileSync(extractedFilePath)).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.txt")));

				const newExtractedFilePath = testGroup.extractFile("readme.txt", tempDirectory, true);

				expect(fs.readFileSync(newExtractedFilePath)).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "readme.txt")));
			});

			it("should correctly extract valid group files from groups with invalid files", function() {
				let newInvalidGroup = new Group();
				newInvalidGroup.files = [
					new Group.File(),
					new Error("I'm here to kick bubblegum and chew ass, and I'm all outta ass."),
					new Group.File("VALID.CON", Buffer.from("ACTOR dank_nukem"))
				];

				expect(fs.readFileSync(newInvalidGroup.extractFile("VALID.CON", tempDirectory))).to.deep.equal(Buffer.from("ACTOR dank_nukem"));
			});

			it("should return null when trying to extract invalid group files", function() {
				expect(invalidGroup.extractFile(0, tempDirectory)).to.equal(null);
				expect(invalidGroup.extractFile(1, tempDirectory)).to.equal(null);
			});

			it("should throw an error when trying to extract group files with no data", function() {
				expect(function() { invalidGroup.extractFile(2, tempDirectory); }).to.throw();
			});
		});

		describe("extractAllFilesWithExtension", function() {
			it("should be a function", function() {
				expect(Group.prototype.extractAllFilesWithExtension).to.be.a("function");
			});

			it("should not extract any files if there are no files with the specified extension", function() {
				expect(testGroup.extractAllFilesWithExtension("ART", tempDirectory).length).to.equal(0);
			});

			it("should not extract a file with the specified extension if there are no matches", function() {
				const extractedFilePaths = testGroup.extractAllFilesWithExtension("aRt", tempDirectory);

				expect(extractedFilePaths.length).to.equal(0);
			});

			it("should extract a file matching the specified specified extension", function() {
				const extractedFilePaths = testGroup.extractAllFilesWithExtension("PNG", tempDirectory);

				expect(extractedFilePaths.length).to.equal(1);

				expect(extractedFilePaths[0]).to.equal(utilities.joinPaths(tempDirectory, "TEST.PNG"));

				expect(fs.readFileSync(extractedFilePaths[0])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.png")));
			});

			it("should extract all files matching the specified specified extension", function() {
				const extractedFilePaths = testGroup.extractAllFilesWithExtension("txt", tempDirectory);

				expect(extractedFilePaths.length).to.equal(2);

				expect(extractedFilePaths[0]).to.equal(utilities.joinPaths(tempDirectory, "README.TXT"));
				expect(extractedFilePaths[1]).to.equal(utilities.joinPaths(tempDirectory, "TEST.TXT"));

				expect(fs.readFileSync(extractedFilePaths[0])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "readme.txt")));
				expect(fs.readFileSync(extractedFilePaths[1])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.txt")));
			});

			it("should throw an error when trying to extract files by extension from an invalid group", function() {
				expect(function() { invalidGroup.extractAllFilesWithExtension("EXE", tempDirectory); }).to.throw();
			});

			it("should extract a file matching the specified specified extension", function() {
				const extractedFilePaths = testGroup.extractAllFilesWithExtension("PNG", tempDirectory);

				expect(extractedFilePaths.length).to.equal(1);

				expect(extractedFilePaths[0]).to.equal(utilities.joinPaths(tempDirectory, "TEST.PNG"));

				expect(fs.readFileSync(extractedFilePaths[0])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.png")));
			});

			it("should not overwrite an existing while when extracting a file matching the specified extension", function() {
				const extractedFilePaths = testGroup.extractAllFilesWithExtension("JSON", tempDirectory);

				let group = new Group();
				let groupFile = new Group.File("TEST.JSON", "It worked!");
				group.addFile(groupFile);

				expect(extractedFilePaths.length).to.equal(1);

				expect(extractedFilePaths[0]).to.equal(utilities.joinPaths(tempDirectory, "TEST.JSON"));

				expect(fs.readFileSync(extractedFilePaths[0])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.json")));

				const newExtractedFilePaths = group.extractAllFilesWithExtension("JSON", tempDirectory);

				expect(newExtractedFilePaths.length).to.equal(0);

				expect(fs.readFileSync(extractedFilePaths[0])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.json")));
			});

			it("should overwrite an existing while when extracting a file matching the specified extension when specified", function() {
				const extractedFilePaths = testGroup.extractAllFilesWithExtension("JSON", tempDirectory);

				let group = new Group();
				let groupFile = new Group.File("TEST.JSON", "It worked!");
				group.addFile(groupFile);

				expect(extractedFilePaths.length).to.equal(1);

				expect(extractedFilePaths[0]).to.equal(utilities.joinPaths(tempDirectory, "TEST.JSON"));

				expect(fs.readFileSync(extractedFilePaths[0])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", "test.json")));

				const newExtractedFilePaths = group.extractAllFilesWithExtension("JSON", tempDirectory, true);

				expect(newExtractedFilePaths.length).to.equal(1);

				expect(newExtractedFilePaths[0]).to.equal(utilities.joinPaths(tempDirectory, "TEST.JSON"));

				expect(fs.readFileSync(newExtractedFilePaths[0])).to.deep.equal(Buffer.from("It worked!"));
			});
		});

		describe("extractAllFiles", function() {
			it("should be a function", function() {
				expect(Group.prototype.extractAllFiles).to.be.a("function");
			});

			it("should not extract any files from an empty group", function() {
				expect(new Group().extractAllFiles(tempDirectory).length).to.equal(0);
			});

			it("should extract all files from a valid group", function() {
				const extractedFilePaths = testGroup.extractAllFiles(tempDirectory);

				expect(extractedFilePaths.length).to.equal(5);

				for(let i = 0; i < testGroup.files.length; i++) {
					expect(extractedFilePaths[i]).to.equal(utilities.joinPaths(tempDirectory, testGroup.files[i].name));
					expect(fs.readFileSync(extractedFilePaths[i])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", testGroup.files[i].name === "EMPTY" ? testGroup.files[i].name : testGroup.files[i].name.toLowerCase())));
				}
			});

			it("should throw an error when trying to extract all files from an invalid group", function() {
				expect(function() { invalidGroup.extractAllFiles(tempDirectory); }).to.throw();
			});

			it("should not overwrite any existing files when extracting all files from a valid group", function() {
				const extractedFilePaths = testGroup.extractAllFiles(tempDirectory);

				expect(extractedFilePaths.length).to.equal(5);

				for(let i = 0; i < testGroup.files.length; i++) {
					expect(extractedFilePaths[i]).to.equal(utilities.joinPaths(tempDirectory, testGroup.files[i].name));
					expect(fs.readFileSync(extractedFilePaths[i])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", testGroup.files[i].name === "EMPTY" ? testGroup.files[i].name : testGroup.files[i].name.toLowerCase())));
				}

				let group =  new Group();
				let groupFile = new Group.File("EMPTY", "YEP!");
				group.addFile(groupFile);

				const newExtractedFilePaths = group.extractAllFiles(tempDirectory);

				expect(newExtractedFilePaths.length).to.equal(0);

				expect(fs.readFileSync(path.join(tempDirectory, "EMPTY"))).to.deep.equal(Buffer.from(""));
			});

			it("should overwrite existings file when extracting all files from a valid group when specified", function() {
				const extractedFilePaths = testGroup.extractAllFiles(tempDirectory);

				expect(extractedFilePaths.length).to.equal(5);

				for(let i = 0; i < testGroup.files.length; i++) {
					expect(extractedFilePaths[i]).to.equal(utilities.joinPaths(tempDirectory, testGroup.files[i].name));
					expect(fs.readFileSync(extractedFilePaths[i])).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", testGroup.files[i].name === "EMPTY" ? testGroup.files[i].name : testGroup.files[i].name.toLowerCase())));
				}

				let group =  new Group();
				let groupFile = new Group.File("EMPTY", "JK");
				group.addFile(groupFile);

				const newExtractedFilePaths = group.extractAllFiles(tempDirectory, true);

				expect(newExtractedFilePaths.length).to.equal(1);

				expect(fs.readFileSync(newExtractedFilePaths[0])).to.deep.equal(groupFile.data);
			});
		});

		describe("addFile", function() {
			it("should be a function", function() {
				expect(Group.prototype.addFile).to.be.a("function");
			});

			it("should throw an error when trying to add an invalid file", function() {
				expect(function() { new Group().addFile(new Error("LIZTROOP.CON")); }).to.throw();
			});

			it("should add an empty group file to a group", function() {
				const groupFile = new Group.File("PIGCOP.CON");
				const groupFile2 = new Group.File("RECON.CON", "");
				const group = new Group();

				expect(group.addFile(groupFile)).to.equal(groupFile);
				expect(group.addFile(groupFile2)).to.equal(groupFile2);
				expect(group.files[0]).to.equal(groupFile);
				expect(group.files[1]).to.equal(groupFile2);
			});

			it("should add a non-empty group file to a group", function() {
				const groupFile = new Group.File("_ZOO.MAP", "DEMO1.DMO");
				const group = new Group();

				expect(group.addFile(groupFile)).to.equal(groupFile);
				expect(group.files[0]).to.equal(groupFile);
			});

			it("should throw an error when trying to add a file to a group that already exists", function() {
				const groupFile = new Group.File("SETUP.EXE", "GRAVIS ULTRASOUND");
				const replacementGroupFile = new Group.File("SETUP.EXE", "SOUNDBLASTER!");
				const group = new Group();

				expect(group.addFile(groupFile)).to.equal(groupFile);
				expect(function() { group.addFile(replacementGroupFile); }).to.throw();
			});

			it("should replace an existing file in a group when specified", function() {
				const groupFile = new Group.File("KEXTRACT.EXE", "BUILD_ENGINE");
				const replacementGroupFile = new Group.File("KEXTRACT.EXE", "BUILD_ENGINE!");
				const group = new Group();

				expect(group.addFile(groupFile)).to.equal(groupFile);
				expect(group.numberOfFiles()).to.equal(1);
				expect(group.files[0]).to.equal(groupFile);
				expect(group.addFile(replacementGroupFile, true)).to.equal(replacementGroupFile);
				expect(group.numberOfFiles()).to.equal(1);
				expect(group.files[0]).to.equal(replacementGroupFile);
			});

			it("should add a valid group file at a specified path to a group", function() {
				const filePath = path.join("test", "data", "contents", "test.txt");
				const group = new Group();

				expect(group.addFile(filePath).data).to.deep.equal(fs.readFileSync(filePath));
				expect(group.files[0].equals(new Group.File("test.txt", "NICE MEME"))).to.equal(true);
			});
		});

		describe("addFiles", function() {
			it("should be a function", function() {
				expect(Group.prototype.addFiles).to.be.a("function");
			});

			it("should not add any files when an invalid value is specified", function() {
				const group = new Group();
				expect(group.addFiles(16)).to.deep.equal([]);
				expect(group.numberOfFiles()).to.equal(0);
			});

			it("should not add any files when an empty array", function() {
				const group = new Group();
				expect(group.addFiles([])).to.deep.equal([]);
				expect(group.numberOfFiles()).to.equal(0);
			});

			it("should throw an error when trying to add a list with an invalid file", function() {
				expect(function() { new Group().addFiles([new Error("LIZTROOP.CON")]); }).to.throw();
			});

			it("should add empty files to a  group", function() {
				const groupFile = new Group.File("PIGCOP.CON");
				const groupFile2 = new Group.File("RECON.CON", "");
				const group = new Group();
				group.addFiles([groupFile, groupFile2]);

				expect(group.files[0]).to.equal(groupFile);
				expect(group.files[1]).to.equal(groupFile2);
			});

			it("should add a list with a non-empty group file to a group", function() {
				const groupFile = new Group.File("_ZOO.MAP", "DEMO1.DMO");
				const group = new Group();
				group.addFiles([groupFile]);

				expect(group.files[0]).to.equal(groupFile);
			});

			it("should throw an error when trying to add multiple files with the same name to a group", function() {
				const group = new Group();

				expect(function() { group.addFiles([new Group.File("SETUP.EXE", "GRAVIS ULTRASOUND"), new Group.File("SETUP.EXE", "SOUNDBLASTER!")]); }).to.throw();
			});

			it("should replace any existing group files when specified", function() {
				const groupFile = new Group.File("KEXTRACT.EXE", "BUILD_ENGINE");
				const replacementGroupFile = new Group.File("KEXTRACT.EXE", "BUILD_ENGINE!");
				const group = new Group();
				group.addFiles([groupFile, replacementGroupFile], true);

				expect(group.numberOfFiles()).to.equal(1);
				expect(group.files[0]).to.equal(replacementGroupFile);
			});

			it("should add files from a list of valid group file paths to a group", function() {
				const basePath = path.join("test", "data", "contents");
				const group = new Group();
				group.addFiles([
					path.join(basePath, "test.txt"),
					path.join(basePath, "readme.txt"),
					path.join(basePath, "EMPTY")
				]);

				expect(group.files[0].equals(new Group.File("test.txt", "NICE MEME"))).to.equal(true);
				expect(group.files[1].equals(new Group.File("readme.txt", "Slip slap slop!"))).to.equal(true);
				expect(group.files[2].equals(new Group.File("EMPTY", ""))).to.equal(true);
			});
		});

		describe("addDirectory", function() {
			it("should be a function", function() {
				expect(Group.prototype.addDirectory).to.be.a("function");
			});

			it("should throw an error when trying to add an invalid value as a directory", function() {
				const group = new Group();
				expect(function() { group.addDirectory(-Infinity); }).to.throw();
			});

			it("should throw an error when trying to add a file as a directory", function() {
				const group = new Group();
				expect(function() { group.addDirectory(path.join("test", "data", "contents", "EMPTY")); }).to.throw();
			});

			it("should throw an error when trying to add a non-existent directory", function() {
				const group = new Group();
				expect(function() { group.addDirectory(path.join("test", "data", "contents", "missing")); }).to.throw();
			});

			it("should add all files from a valid directory", function() {
				const basePath = path.join("test", "data", "contents");
				const group = new Group();
				const files = [
					Group.File.readFrom(path.join(basePath, "EMPTY")),
					Group.File.readFrom(path.join(basePath, "readme.txt")),
					Group.File.readFrom(path.join(basePath, "test.json")),
					Group.File.readFrom(path.join(basePath, "test.png")),
					Group.File.readFrom(path.join(basePath, "test.txt"))
				];

				expect(group.addDirectory(basePath)).to.deep.equal(files);
				expect(group.serialize()).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "TEST.GRP")));
			});

			it("should recursively add all files from a valid directory", function() {
				const basePath = path.join("test", "data", "contents");
				const emptyDir = path.join(basePath, "empty_dir");
				const testGroupPath = path.join(__dirname, "data", "TEST.GRP");
				const group = new Group();
				const files = [
					Group.File.readFrom(path.join(basePath, "art", "extra", "test.con")),
					Group.File.readFrom(path.join(basePath, "art", "TILES420.ART")),
					Group.File.readFrom(path.join(basePath, "EMPTY")),
					Group.File.readFrom(path.join(basePath, "readme.txt")),
					Group.File.readFrom(path.join(basePath, "test.json")),
					Group.File.readFrom(path.join(basePath, "test.png")),
					Group.File.readFrom(path.join(basePath, "test.txt"))
				];
				let newTestGroup = Group.readFrom(testGroupPath);
				newTestGroup.addFile(path.join(basePath, "art", "TILES420.ART"));
				newTestGroup.addFile(path.join(basePath, "art", "extra", "test.con"));

				fs.ensureDirSync(emptyDir);

				console.log("Created temporary empty directory: " + emptyDir);

				expect(group.addDirectory(basePath, true).length).to.deep.equal(files.length);
				expect(group.numberOfFiles()).to.equal(newTestGroup.numberOfFiles());

				for(let i = 0; i < group.files.length; i++) {
					expect(newTestGroup.getFile(group.files[i].name).equals(group.files[i])).to.equal(true);
				}

				fs.removeSync(path.join("empty_dir"));

				console.log("Removed temporary empty directory: " + emptyDir);
			});

			it("should throw when adding a file from a directory that already exists", function() {
				const basePath = path.join("test", "data", "contents");
				const group = new Group();
				group.addFile(new Group.File("EMPTY"));

				expect(function() { group.addDirectory(basePath); }).to.throw();
			});

			it("should throw when recursively adding a file from a directory that already exists in a subdirectory", function() {
				const basePath = path.join("test", "data", "contents");
				const group = new Group();
				group.addFile(new Group.File("TILES420.ART"));

				expect(function() { group.addDirectory(basePath, true); }).to.throw();
			});

			it("should replace any existing instances of files when adding a directory when specified", function() {
				const basePath = path.join("test", "data", "contents");
				const group = new Group();

				group.addFile(new Group.File("test.png"));
				group.addDirectory(basePath, false, true);

				expect(group.getFile("test.png").data).to.deep.equal(fs.readFileSync(path.join(basePath, "test.png")));
			});

			it("should replace any existing instances of files from subdirectories when recursively adding a directory when specified", function() {
				const basePath = path.join("test", "data", "contents");
				const group = new Group();

				group.addFile(new Group.File("TILES420.ART"));
				group.addDirectory(basePath, true, true);

				expect(group.getFile("TILES420.ART").data).to.deep.equal(fs.readFileSync(path.join(basePath, "art", "TILES420.ART")));
			});
		});

		describe("renameFile", function() {
			it("should be a function", function() {
				expect(Group.prototype.renameFile).to.be.a("function");
			});

			it("should do nothing to an empty group", function() {
				expect(new Group().renameFile("door", "stuck")).to.equal(false);
			});

			it("should do nothing when renaming a file that does not exist in a group", function() {
				let group = new Group();
				group.addFile(new Group.File("ayy", "lmao"))
				expect(group.renameFile("cant", "make_it")).to.equal(false);
			});

			it("should correctly rename a file in a group", function() {
				let group = new Group();
				group.addFile(new Group.File("KeTtLe"));
				expect(group.renameFile("KETTLE", "kettle.con")).to.equal(true);
				expect(group.hasFile("KETTLE")).to.equal(false);
				expect(group.hasFile("KETTLE.CON")).to.equal(true);
			});

			it("should correctly rename a file in a group with a propetly formatted name", function() {
				let group = new Group();
				group.addFile(new Group.File("TESTing.txt"));
				expect(group.renameFile("testing.txt", "TESTING123.con")).to.equal(true);
				expect(group.hasFile("testing.txt")).to.equal(false);
				expect(group.hasFile("testing1.con")).to.equal(true);
			});
		});

		describe("replaceFile", function() {
			it("should be a function", function() {
				expect(Group.prototype.replaceFile).to.be.a("function");
			});

			it("should return null when trying to replace a file that does not exist in a group", function() {
				let group = new Group();
				let newGroupFile = new Group.File("stairs", "go up");

				expect(group.replaceFile("stairs", newGroupFile)).to.equal(null);
				expect(group.getFile("stairs")).to.equal(null);
			});

			it("should throw an error when trying to replace a group file with an invalid file", function() {
				let group = new Group();
				let groupFile = new Group.File("sigmar", "Bless this shot.");
				group.addFile(groupFile);

				expect(function() { group.replaceFile("sigmar", new Error("Holy justice!")); }).to.throw();
				expect(group.getFile("sigmar").equals(groupFile)).to.equal(true);
			});

			it("should throw an error when trying to replace a group file with a file path that does not exist", function() {
				let group = new Group();
				let groupFile = new Group.File("BUBBLEGUM", "Crisis!");
				group.addFile(groupFile);

				expect(function() { group.replaceFile("BUBBLEGUM", "i dunno lol"); }).to.throw();
				expect(group.getFile("BUBBLEGUM").equals(groupFile)).to.equal(true);
			});

			it("should correctly replace a file in a group with another group file", function() {
				let group = new Group();
				let groupFile = new Group.File("a", "TOAST");
				let newGroupFile = new Group.File("a", "victory");
				group.addFile(groupFile);

				expect(group.replaceFile("a", newGroupFile)).to.equal(newGroupFile);
				expect(group.getFile("a").equals(newGroupFile)).to.equal(true);
			});

			it("should correctly replace a file in a group with another group file by path", function() {
				const basePath = path.join("test", "data", "contents");
				let group = new Group();
				let groupFile = new Group.File("test.json", "Canadian Carnage");
				const newGroupFilePath = path.join(basePath, "test.json");
				const newGroupFile = Group.File.readFrom(newGroupFilePath);
				group.addFile(groupFile);

				expect(group.replaceFile("TEST.JSON", newGroupFilePath).equals(newGroupFile)).to.equal(true);
				expect(group.getFile("TEST.JSON").equals(newGroupFile)).to.equal(true);
			});
		});

		describe("removeFile", function() {
			it("should be a function", function() {
				expect(Group.prototype.removeFile).to.be.a("function");
			});

			it("should not remove a file using an invalid value", function() {
				let group = new Group();
				expect(group.removeFile()).to.equal(false);
				expect(group.removeFile(NaN)).to.equal(false);
				expect(group.removeFile(Infinity)).to.equal(false);
				expect(group.removeFile([])).to.equal(false);
			});

			it("should not remove a file using an empty string", function() {
				let group = new Group();
				expect(group.removeFile("")).to.equal(false);
				expect(group.removeFile(" ")).to.equal(false);
				expect(group.removeFile("\t")).to.equal(false);
			});

			it("should not remove a file that does not exist in a group", function() {
				let group = new Group();
				group.addFile(new Group.File("nope"));
				expect(group.removeFile("avi")).to.equal(false);
				expect(group.numberOfFiles()).to.equal(1);
			});

			it("should not remove a file using an invalid or incorrect index", function() {
				let group = new Group();
				group.addFile(new Group.File("prrt"));
				expect(group.removeFile(-1)).to.equal(false);
				expect(group.removeFile(1)).to.equal(false);
				expect(group.numberOfFiles()).to.equal(1);
			});

			it("should successfully remove a file from a group using a valid index", function() {
				let group = new Group();
				group.addFile(new Group.File("( . Y . )"));
				expect(group.numberOfFiles()).to.equal(1);
				expect(group.removeFile(0)).to.equal(true);
				expect(group.numberOfFiles()).to.equal(0);
			});

			it("should successfully remove a file from a group using a valid name", function() {
				let group = new Group();
				group.addFile(new Group.File("purple.boyz"));
				expect(group.numberOfFiles()).to.equal(1);
				expect(group.removeFile("purple.boyz")).to.equal(true);
				expect(group.numberOfFiles()).to.equal(0);
			});

			it("should successfully remove a file from a group using a valid group file", function() {
				let group = new Group();
				let groupFile = new Group.File("tommy.cash");
				group.addFile(groupFile);
				expect(group.numberOfFiles()).to.equal(1);
				expect(group.removeFile(groupFile)).to.equal(true);
				expect(group.numberOfFiles()).to.equal(0);
			});
		});

		describe("removeFiles", function() {
			it("should be a function", function() {
				expect(Group.prototype.removeFiles).to.be.a("function");
			});

			it("should not remove any files when none are specified", function() {
				let group = new Group();
				group.addFile(new Group.File("N.I.B."));
				expect(group.removeFiles([])).to.equal(0);
				expect(group.numberOfFiles()).to.equal(1);
			});

			it("should not remove any files using invalid values", function() {
				let group = new Group();
				expect(group.removeFiles()).to.equal(0);
				expect(group.removeFiles(NaN)).to.equal(0);
				expect(group.removeFiles(-Infinity)).to.equal(0);
				expect(group.removeFiles(new Error())).to.equal(0);
				expect(group.removeFiles([undefined, NaN, -Infinity, new Error()])).to.equal(0);
			});

			it("should not remove any file using empty string values", function() {
				let group = new Group();
				group.addFile(new Group.File("nuclear.con"));
				expect(group.removeFiles(["", " ", "\t"])).to.equal(0);
				expect(group.numberOfFiles()).to.equal(1);
			});

			it("should not remove any files that do not exist in a group", function() {
				let group = new Group();
				group.addFile(new Group.File("uranium"));
				expect(group.removeFiles(["pak", "bmp", "zip"])).to.equal(0);
				expect(group.numberOfFiles()).to.equal(1);
			});

			it("should not remove a file using an invalid or incorrect index", function() {
				let group = new Group();
				group.addFile(new Group.File("Vixens.CON"));
				expect(group.removeFiles([4, 2, 1, -2, 8, -1])).to.equal(0);
				expect(group.numberOfFiles()).to.equal(1);
			});

			it("should successfully remove files from a group using valid indexes", function() {
				let group = new Group();
				let groupFile = new Group.File("8===D ~");
				let groupFile2 = new Group.File("Fusion");
				group.addFiles([groupFile, new Group.File("dukezone.con"), groupFile2, new Group.File("project.x"), new Group.File("Platoon.CON")]);
				expect(group.numberOfFiles()).to.equal(5);
				expect(group.removeFiles([1, 3, 4])).to.equal(3);
				expect(group.numberOfFiles()).to.equal(2);
				expect(group.getFile(0).equals(groupFile)).to.equal(true);
				expect(group.getFile(1).equals(groupFile2)).to.equal(true);
			});

			it("should successfully remove files from a group using a valid names", function() {
				let group = new Group();
				let groupFile = new Group.File("UBB.CON");
				group.addFiles([groupFile, new Group.File("UBB.2000"), new Group.File("00DUKE.con")]);
				expect(group.numberOfFiles()).to.equal(3);
				expect(group.removeFiles(["UBB.2000", "00DUKE.con"])).to.equal(2);
				expect(group.numberOfFiles()).to.equal(1);
				expect(group.getFile(0).equals(groupFile)).to.equal(true);
			});

			it("should successfully remove files from a group using valid group files", function() {
				let group = new Group();
				let groupFile = new Group.File("delta_force");
				let groupFile2 = new Group.File("evil.con");
				let groupFile3 = new Group.File("LRWB.con");
				group.addFiles([groupFile, groupFile2, groupFile3]);
				expect(group.numberOfFiles()).to.equal(3);
				expect(group.removeFiles([groupFile3, groupFile])).to.equal(2);
				expect(group.numberOfFiles()).to.equal(1);
				expect(group.getFile(0).equals(groupFile2)).to.equal(true);
			});

			it("should successfully remove files from a group using a combination of valid and invalid indexes, file names and group files", function() {
				let group = new Group();
				let groupFiles = [
					new Group.File("Oxidium.con"),
					new Group.File("MERC2.CON"),
					new Group.File("REDRUM.con"),
					new Group.File("weaponry.CON"),
					new Group.File("AGBT.con"),
					new Group.File("GL50.CON"),
					new Group.File("cranium.PAK")
				];
				group.addFiles(groupFiles);
				expect(group.numberOfFiles()).to.equal(7);
				expect(group.removeFiles([[], groupFiles[2], -1, groupFiles[0], NaN, 8, "MERC.con", "GL50.con", Infinity, "redrum.con", 5, new Error("?")])).to.equal(3);
				expect(group.numberOfFiles()).to.equal(4);
				expect(group.getFile(0).equals(groupFiles[1])).to.equal(true);
				expect(group.getFile(1).equals(groupFiles[3])).to.equal(true);
				expect(group.getFile(2).equals(groupFiles[4])).to.equal(true);
				expect(group.getFile(3).equals(groupFiles[6])).to.equal(true);
			});
		});

		describe("clearFiles", function() {
			it("should be a function", function() {
				expect(Group.prototype.clearFiles).to.be.a("function");
			});

			it("should clear all of the files", function() {
				let group = new Group();
				const groupFile = new Group.File("BOARDROOM.MAP", 320);
				group.files = [groupFile];

				expect(group.files.length).to.equal(1);

				group.clearFiles();

				expect(group.files.length).to.equal(0);
			});
		});

		describe("static createFrom", function() {
			it("should be a function", function() {
				expect(Group.createFrom).to.be.a("function");
			});

			it("should successfully create a group file from the contents of a valid directory", function() {
				expect(Group.createFrom(path.join(__dirname, "data", "contents")).serialize()).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "TEST.GRP")));
			});

			it("should successfully recursively create a group file from the contents of a valid directory", function() {
				const group = Group.createFrom(path.join(__dirname, "data", "contents"), true);
				const newTestGroup = Group.readFrom(path.join(__dirname, "data", "TEST2.GRP"));

				expect(group.numberOfFiles()).to.equal(newTestGroup.numberOfFiles());

				for(let i = 0; i < group.files.length; i++) {
					expect(newTestGroup.getFile(group.files[i].name).equals(group.files[i])).to.equal(true);
				}
			});
		});

		describe("static readFrom", function() {
			it("should be a function", function() {
				expect(Group.readFrom).to.be.a("function");
			});

			it("should throw an error for invalid file paths", function() {
				expect(function() { Group.readFrom(NaN); }).to.throw();
			});

			it("should throw an error for file paths that do not exist", function() {
				expect(function() { Group.readFrom(path.join(tempDirectory, "missing.GRP")); }).to.throw();
			});

			it("should throw an error for directory paths", function() {
				expect(function() { Group.readFrom(path.join(__dirname, "data", "contents")); }).to.throw();
			});

			it("should throw an error for missing header values", function() {
				const filePath = path.join(tempDirectory, "HEADER.GRP");

				fs.ensureDirSync(tempDirectory);
				fs.writeFileSync(filePath, Buffer.from(""));

				expect(function() { Group.readFrom(filePath); }).to.throw();
			});

			it("should throw an error for an invalid header value", function() {
				const filePath = path.join(tempDirectory, "HEADER.GRP");

				fs.ensureDirSync(tempDirectory);
				fs.writeFileSync(filePath, Buffer.from("AlenHBlumIII"));

				expect(function() { Group.readFrom(filePath); }).to.throw();
			});

			it("should throw an error for an missing number of files value", function() {
				const filePath = path.join(tempDirectory, "NUMFILES.GRP");

				fs.ensureDirSync(tempDirectory);
				fs.writeFileSync(filePath, Buffer.from("KenSilvermanX"));

				expect(function() { Group.readFrom(filePath); }).to.throw();
			});

			it("should throw an error for a group file with a file that is missing a name", function() {
				const filePath = path.join(tempDirectory, "FILENAME.GRP");

				fs.ensureDirSync(tempDirectory);
				const byteBuffer = new ByteBuffer().order(true).writeString("KenSilverman").writeUInt32(1).writeString("?").flip();
				fs.writeFileSync(filePath, byteBuffer.toBuffer());

				expect(function() { Group.readFrom(filePath); }).to.throw();
			});

			it("should throw an error for a group file with a file that is missing a name", function() {
				const filePath = path.join(tempDirectory, "FILENAME.GRP");

				fs.ensureDirSync(tempDirectory);
				const byteBuffer = new ByteBuffer().order(true).writeString("KenSilverman").writeUInt32(1).writeString("\0\0\0\0\0\0\0\0\0\0\0\0").flip();
				fs.writeFileSync(filePath, byteBuffer.toBuffer());

				expect(function() { Group.readFrom(filePath); }).to.throw();
			});

			it("should throw an error for a group file with a file that is missing a name", function() {
				const filePath = path.join(tempDirectory, "FILENAME.GRP");

				fs.ensureDirSync(tempDirectory);
				const byteBuffer = new ByteBuffer().order(true).writeString("KenSilverman").writeUInt32(1).writeString("@\0\0\0\0\0\0\0\0\0\0\0!").flip();
				fs.writeFileSync(filePath, byteBuffer.toBuffer());

				expect(function() { Group.readFrom(filePath); }).to.throw();
			});

			it("should successfully read a valid group file", function() {
				const filePath = path.join("test", "data", "TEST.GRP");

				expect(Group.readFrom(filePath).serialize()).to.deep.equal(fs.readFileSync(filePath));
			});
		});

		describe("serialize", function() {
			it("should be a function", function() {
				expect(Group.prototype.serialize).to.be.a("function");
			});

			it("should correctly serialize an empty group", function() {
				expect(new Group().serialize()).to.deep.equal(Buffer.from(Group.HEADER_TEXT + "\0\0\0\0"));
			});

			it("should correctly serialize a group with one file", function() {
				let group = new Group();
				group.files.push(new Group.File("BUBBLGUM.CON", Buffer.from("Where is it?!")));

				expect(group.serialize()).to.deep.equal(Buffer.from(Group.HEADER_TEXT + String.fromCharCode(1) + "\0\0\0" + "BUBBLGUM.CON" + String.fromCharCode(13) + "\0\0\0Where is it?!"))
			});

			it("should correctly serialize a group with multiple files", function() {
				let group = new Group();
				group.files.push(new Group.File("TILE1337.ART", Buffer.from("0000010100111001")));
				group.files.push(new Group.File("BUBBLGUM.CON", Buffer.from("Where is it?!")));
				group.files.push(new Group.File("DOOR.STUCK", Buffer.from("Can't make it!")));
				group.files.push(new Group.File("FAKE", 0));

				expect(group.serialize()).to.deep.equal(Buffer.from(Group.HEADER_TEXT + String.fromCharCode(4) + "\0\0\0" + "TILE1337.ART" + String.fromCharCode(16) + "\0\0\0" + "BUBBLGUM.CON" + String.fromCharCode(13) + "\0\0\0" + "DOOR.STUCK\0\0" + String.fromCharCode(14) + "\0\0\0" + "FAKE\0\0\0\0\0\0\0\0" + "\0\0\0\0" + "0000010100111001Where is it?!Can't make it!"))
			});

			it("should throw an error when trying to serialize an invalid group", function() {
				expect(function() { invalidGroup.serialize(); }).to.throw();
			});
		});

		describe("writeTo", function() {
			it("should be a function", function() {
				expect(Group.prototype.writeTo).to.be.a("function");
			});

			it("should successfully write an empty group to a file", function() {
				expect(fs.readFileSync(new Group().writeTo(path.join(tempDirectory, "empty.grp")))).to.deep.equal(Buffer.from(Group.HEADER_TEXT + "\0\0\0\0"));
			});

			it("should successfully write a valid group to a file", function() {
				expect(fs.readFileSync(testGroup.writeTo(path.join(tempDirectory, "test.grp")))).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "TEST.GRP")));
			});

			it("should throw an error when trying to write to an invalid path", function() {
				expect(function() { testGroup.writeTo(-Infinity); }).to.throw();
			});

			it("should throw an error when trying to write to an empty path", function() {
				expect(function() { testGroup.writeTo(""); }).to.throw();
			});

			it("should throw an error when trying to write an invalid group to a file", function() {
				expect(function() { invalidGroup.writeTo(path.join(tempDirectory, "error.grp")); }).to.throw();
			});
		});

		describe("save", function() {
			it("should be a function", function() {
				expect(Group.prototype.save).to.be.a("function");
			});

			it("should successfully save an empty group", function() {
				let newEmptyGroup = new Group(path.join(tempDirectory, "new_empty.grp"));
				newEmptyGroup.save();

				expect(fs.readFileSync(newEmptyGroup.filePath)).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "EMPTY.GRP")));
			});

			it("should successfully save a valid group", function() {
				let newTestGroup = new Group(path.join(tempDirectory, "new_test.grp"));
				newTestGroup.files = testGroup.files;
				newTestGroup.save();

				expect(fs.readFileSync(newTestGroup.filePath)).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "TEST.GRP")));
			});

			it("should throw an error when trying to save an invalid group", function() {
				expect(function() { invalidGroup.save(); }).to.throw();
			});
		});

		describe("static checkSameFileOrder", function() {
			it("should be a function", function() {
				expect(Group.checkSameFileOrder).to.be.a("function");
			});

			it("should return false if either or both values are not valid groups", function() {
				expect(Group.checkSameFileOrder(null, testGroup)).to.equal(false);
				expect(Group.checkSameFileOrder(testGroup, null)).to.equal(false);
				expect(Group.checkSameFileOrder(null, null)).to.equal(false);
				expect(Group.checkSameFileOrder(invalidGroup, testGroup)).to.equal(false);
				expect(Group.checkSameFileOrder(testGroup, invalidGroup)).to.equal(false);
				expect(Group.checkSameFileOrder(invalidGroup, invalidGroup)).to.equal(false);
			});

			it("should return false if two groups have a different number of files", function() {
				expect(Group.checkSameFileOrder(fakeGroup, testGroup)).to.equal(false);
			});

			it("should return false if two groups have the same files but in a different order", function() {
				let newTestGroup = new Group();

				for(let i = 0; i < testGroup.files.length; i++) {
					newTestGroup.files.push(testGroup.files[i]);
				}

				const tempFile = newTestGroup.files[newTestGroup.files.length - 1];
				newTestGroup.files[newTestGroup.files.length - 1] = newTestGroup.files[newTestGroup.files.length - 2];
				newTestGroup.files[newTestGroup.files.length - 2] = tempFile;

				expect(Group.checkSameFileOrder(testGroup, newTestGroup)).to.equal(false);
			});

			it("should return true if two groups have the same files in the same order", function() {
				expect(Group.checkSameFileOrder(testGroup, testGroup)).to.equal(true);
			});
		});

		describe("equals", function() {
			it("should be a function", function() {
				expect(Group.prototype.equals).to.be.a("function");
			});

			it("should return true when groups are compared to themselves", function() {
				for(let i = 0; i < testGroups.length; i++) {
					expect(testGroups[i].equals(testGroups[i])).to.equal(true);
				}
			});

			it("should return false for groups that have different file counts", function() {
				let groupA = new Group();

				groupA.files.push(new Group.File("A", 69));

				let groupB = new Group();
				groupB.files.push(new Group.File("B1", 420));
				groupB.files.push(new Group.File("B2", 1337));

				expect(groupA.equals(groupB)).to.equal(false);
			});

			it("should return false for groups that have different files", function() {
				let groupA = new Group();

				groupA.files.push(new Group.File("X", 31337));

				let groupB = new Group();
				groupB.files.push(new Group.File("Y", 8008135));

				expect(groupA.equals(groupB)).to.equal(false);
			});

			it("should return false when comparing to a non-group value", function() {
				const realFile = testGroup.getFile(2);
				const newTestGroups = testGroups.concat(new Group(), new Group("whered_you_find.THIS"));
				const newTestData = testData.concat(new Group.File(realFile.name, realFile.size), new Group.File("OTHER.JSON", realFile.data), fakeFile);

				for(let i = 0; i < newTestGroups.length; i++) {
					for(let j = 0; j < newTestData.length; j++) {
						expect(newTestGroups[i].equals(newTestData[j])).to.equal(false);
					}
				}
			});
		});

		describe("toString", function() {
			it("should return the file path of the group", function() {
				expect(new Group().toString()).to.equal(null);
				expect(new Group("data\\DUKEDC.GRP").toString()).to.equal("DUKEDC.GRP");
				expect(new Group("mods/VACATION.SSI").toString()).to.equal("VACATION.SSI");
			});
		});

		describe("static isGroup", function() {
			it("should be a function", function() {
				expect(Group.isGroup).to.be.a("function");
			});

			it("should return true for objects that are instances of the group class", function() {
				const newTestGroups = testGroups.concat(invalidGroup, null, new Error("I'm here to kick ass and chew bubblegum.. and I'm all outta gum."), Infinity, new Group.File("NUCLEAR.GRP"));

				const results = [true, true, true, true, false, false, false, false];

				for(let i = 0; i < newTestGroups.length; i++) {
					expect(Group.isGroup(newTestGroups[i])).to.equal(results[i]);
				}
			});
		});

		describe("isValid", function() {
			it("should be a function", function() {
				expect(Group.prototype.isValid).to.be.a("function");
			});

			it("should return true for valid groups", function() {
				const newTestGroups = testGroups.concat(invalidGroup);

				const results = [true, true, true, false];

				for(let i = 0; i < newTestGroups.length; i++) {
					expect(newTestGroups[i].isValid()).to.equal(results[i]);
				}
			});
		});

		describe("static isValid", function() {
			it("should be a function", function() {
				expect(Group.isValid).to.be.a("function");
			});

			it("should return true for values that are valid groups", function() {
				const newTestGroups = testGroups.concat(invalidGroup, undefined, null, Infinity, { }, [], new Error("I'm here to kick ass and chew bubblegum.. and I'm all outta gum."), new Group.File("NUCLEAR.GRP"));

				const results = [true, true, true, false, false, false, false, false, false, false, false, false];

				for(let i = 0; i < newTestGroups.length; i++) {
					expect(Group.isValid(newTestGroups[i])).to.equal(results[i]);
				}
			});
		});

		describe("File", function() {
			it("should be a function", function() {
				expect(Group.File).to.be.a("function");
			});

			it("should throw an error when trying to assign to it", function() {
				expect(function() { Group.File = Error; }).to.throw();
			});

			describe("MAX_FILE_NAME_LENGTH", function() {
				it("should be an integer", function() {
					expect(Number.isInteger(Group.File.MAX_FILE_NAME_LENGTH)).to.equal(true);
				});

				it("should contain the correct value", function() {
					expect(Group.File.MAX_FILE_NAME_LENGTH).to.equal(12);
				});

				it("should throw an error when trying to modify it", function() {
					expect(function() { Group.File.MAX_FILE_NAME_LENGTH = -1; }).to.throw();
				});
			});

			describe("name setter", function() {
				it("should automatically trim values", function() {
					let groupFile = new Group.File(" SURPRISE.ketchup\0\0\0");

					expect(groupFile.name).to.equal("SURP.KETCHUP");

					groupFile.name = "\tSLIP_SLAP.SLOP\0";

					expect(groupFile.name).to.equal("SLIP_SL.SLOP");
				});

				it("should replace non-string values with null", function() {
					let groupFile = new Group.File(NaN);

					expect(groupFile.name).to.equal(null);

					groupFile.name = new Date();

					expect(groupFile.name).to.equal(null);
				});
			});

			describe("data setter", function() {
				it("should allow assignment of valid byte buffer values", function() {
					let groupFile = new Group.File();
					const byteBuffer = new ByteBuffer().order(true).writeString("AYY LMAO").writeUInt32(420).flip();
					groupFile.data = byteBuffer;

					expect(groupFile.data).to.deep.equal(byteBuffer.toBuffer());
				});

				it("should allow assignment of valid buffer values", function() {
					let groupFile = new Group.File();
					const buffer = Buffer.from("Shall I pop on the kettle?");
					groupFile.data = buffer;

					expect(groupFile.data).to.not.equal(buffer);
					expect(groupFile.data).to.deep.equal(buffer);
				});

				it("should allow assignment of valid binary string values", function() {
					let groupFile = new Group.File();
					const data = "What do you think of this?\0I don't know, I think that's a little strong.\0";
					groupFile.data = data;

					expect(groupFile.data).to.deep.equal(Buffer.from(data));
				});

				it("should replace non-string, non-buffer, non-bytebuffer values with null", function() {
					let groupFile = new Group.File();
					groupFile.data = new Error("PICKLE SURPRISE!");

					expect(groupFile.data).to.equal(null);

					groupFile.data = [6, 9];

					expect(groupFile.data).to.equal(null);
				});
			});

			describe("getFileName", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.getFileName).to.be.a("function");
				});

				it("should return the correct name for valid group files", function() {
					for(let i = 0; i < testGroups.length; i++) {
						for(let j = 0; j < testGroups[i].files.length; j++) {
							expect(testGroups[i].files[j].getFileName()).to.equal(testGroups[i].files[j].name);
						}
					}
				});
			});

			describe("getSerializedFileName", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.getSerializedFileName).to.be.a("function");
				});

				it("should return the correct name for valid group files", function() {
					const serializedFileNames = [
						[],
						[
							"FAKE.CON\0\0\0\0"
						],
						[
							"EMPTY\0\0\0\0\0\0\0",
							"README.TXT\0\0",
							"TEST.JSON\0\0\0",
							"TEST.PNG\0\0\0\0",
							"TEST.TXT\0\0\0\0"
						]
					];

					for(let i = 0; i < testGroups.length; i++) {
						for(let j = 0; j < testGroups[i].files.length; j++) {
							expect(testGroups[i].files[j].getSerializedFileName()).to.equal(serializedFileNames[i][j]);
						}
					}
				});
			});

			describe("getExtension", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.getExtension).to.be.a("function");
				});

				it("should return an empty string for group files with no name", function() {
					expect(new Group.File("").getExtension()).to.equal("");
				});

				it("should return the correct file extension for each file in a group", function() {
					const results = [
						[],
						["CON"],
						["", "TXT", "JSON", "PNG", "TXT"],
					];

					for(let i = 0; i < testGroups.length; i++) {
						const testGroup = testGroups[i];

						for(let j = 0; j < testGroup.files.length; j++) {
							expect(testGroup.files[j].getExtension()).to.equal(results[i][j]);
						}
					}
				});
			});

			describe("getFileSize", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.getFileSize).to.be.a("function");
				});

				it("should return the correct file size for valid group files", function() {
					for(let i = 0; i < testGroups.length; i++) {
						for(let j = 0; j < testGroups[i].files.length; j++) {
							expect(testGroups[i].files[j].getFileSize()).to.equal(testGroups[i].files[j].size);
						}
					}
				});
			});

			describe("getData", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.getData).to.be.a("function");
				});

				it("should return the correct data for valid group files", function() {
					for(let i = 0; i < testGroups.length; i++) {
						for(let j = 0; j < testGroups[i].files.length; j++) {
							expect(testGroups[i].files[j].getData()).to.equal(testGroups[i].files[j].data);
						}
					}
				});
			});

			describe("getDataSize", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.getDataSize).to.be.a("function");
				});

				it("should return the correct data size for valid group files", function() {
					for(let i = 0; i < testGroups.length; i++) {
						for(let j = 0; j < testGroups[i].files.length; j++) {
							expect(testGroups[i].files[j].getDataSize()).to.equal(utilities.isValid(testGroups[i].files[j].data) ? testGroups[i].files[j].data.length : 0);
						}
					}
				});
			});

			describe("setFileName", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.setFileName).to.be.a("function");
				});

				it("should automatically trim values", function() {
					let groupFile = new Group.File(" JOHN.MADDEN\0\0\0");

					expect(groupFile.name).to.equal("JOHN.MADDEN");

					groupFile.setFileName("  \tfootball.MAP\0");

					expect(groupFile.name).to.equal("FOOTBALL.MAP");
				});

				it("should replace non-string values with null", function() {
					let groupFile = new Group.File(NaN);

					expect(groupFile.name).to.equal(null);

					groupFile.setFileName(NaN);

					expect(groupFile.name).to.equal(null);
				});
			});

			describe("reverseFileExtension", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.reverseFileExtension).to.be.a("function");
				});

				it("should correctly reverse group file name extensions", function() {
					const testGroupFiles = [
						new Group.File(""),
						new Group.File("TOO_MANY.ZOOZ"),
						new Group.File("lucky.CHOPS"),
						new Group.File("FAKE_NEWS")
					];

					const reversedFileNameExtensions = [
						"",
						"TOO_MAN.ZOOZ",
						"LUCKY.SPOHC",
						"FAKE_NEWS"
					];

					for(let i = 0; i < testGroupFiles.length; i++) {
						testGroupFiles[i].reverseFileExtension()

						expect(testGroupFiles[i].name).to.equal(reversedFileNameExtensions[i]);
					}
				});
			});

			describe("setData", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.setData).to.be.a("function");
				});

				it("should allow assignment of valid byte buffer values", function() {
					let groupFile = new Group.File();
					const byteBuffer = new ByteBuffer().order(true).writeString("DOOR STUCK").writeUInt32(420).flip();
					groupFile.setData(byteBuffer);

					expect(groupFile.data).to.deep.equal(byteBuffer.toBuffer());
				});

				it("should allow assignment of valid buffer values", function() {
					let groupFile = new Group.File();
					const buffer = Buffer.from("CAN'T MAKE IT!");
					groupFile.setData(buffer);

					expect(groupFile.data).to.not.equal(buffer);
					expect(groupFile.data).to.deep.equal(buffer);
				});

				it("should allow assignment of valid binary string values", function() {
					let groupFile = new Group.File();
					const data = "Ahhhh!\0Try to sneak through the door.\0Outta my way, son!\0";
					groupFile.setData(data);

					expect(groupFile.data).to.deep.equal(Buffer.from(data));
				});

				it("should replace non-string, non-buffer, non-bytebuffer values with null", function() {
					let groupFile = new Group.File();
					groupFile.setData(new Error("I'm adding this guy to friends."));

					expect(groupFile.data).to.equal(null);

					groupFile.setData({ please: "I beg you!" });

					expect(groupFile.data).to.equal(null);
				});
			});

			describe("clearData", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.clearData).to.be.a("function");
				});

				it("should clear the data buffer", function() {
					let groupFile = new Group.File();
					groupFile.data = "FINALLY";

					expect(groupFile.data).to.not.equal(null);

					groupFile.clearData();

					expect(groupFile.data).to.equal(null);
				});
			});

			describe("static readFrom", function() {
				it("should be a function", function() {
					expect(Group.File.readFrom).to.be.a("function");
				});

				it("should successfully create group files from actual files", function() {
					const basePath = path.join("test", "data", "contents");

					const files = [
						path.join(basePath, "EMPTY"),
						path.join(basePath, "readme.txt"),
						path.join(basePath, "test.json"),
						path.join(basePath, "test.png"),
						path.join(basePath, "test.txt"),
						path.join("test", "data", "ZERO_HOUR.JSON")
					];

					const fileNames = [
						"EMPTY",
						"README.TXT",
						"TEST.JSON",
						"TEST.PNG",
						"TEST.TXT",
						"ZERO_HO.JSON"
					];

					const fileSizes = [0, 15, 20, 186, 9, 21];

					for(let i = 0; i < files.length; i++) {
						const groupFile = Group.File.readFrom(files[i]);

						expect(groupFile.name).to.equal(fileNames[i]);
						expect(groupFile.size).to.equal(fileSizes[i]);
						expect(groupFile.getDataSize()).to.equal(fileSizes[i]);
					}
				});

				it("should throw an error when trying to read from a file that does not exist", function() {
					expect(function() { Group.File.readFrom(path.join("does", "not", "exist.txt")); }).to.throw();
				});

				it("should throw an error when trying to read from a directory", function() {
					expect(function() { Group.File.readFrom("src"); }).to.throw();
				});

				it("should throw an error when trying to read from an empty path", function() {
					expect(function() { Group.File.readFrom(""); }).to.throw();
				});
			});

			describe("static writeTo", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.writeTo).to.be.a("function");
				});

				it("should successfully write valid group files to a directory", function() {
					for(let i = 0; i < testGroup.files.length; i++) {
						expect(fs.readFileSync(testGroup.files[i].writeTo(tempDirectory))).to.deep.equal(fs.readFileSync(path.join(__dirname, "data", "contents", testGroup.files[i].name === "EMPTY" ? testGroup.files[i].name : testGroup.files[i].name.toLowerCase())));
					}
				});

				it("should successfully write valid group files to the current directory", function() {
					let groupFile = new Group.File("TEMP.CON");
					groupFile.data = "You must construct additional pylons!";

					expect(function() { groupFile.writeTo(); }).to.not.throw();

					expect(groupFile.data).to.deep.equal(fs.readFileSync("TEMP.CON"));
				});

				it("should successfully write a valid group file to a directory with a custom name", function() {
					let groupFile = new Group.File("REMOVED.NAME");
					groupFile.data = "RIDIN' HIGH!";

					expect(function() { groupFile.writeTo(tempDirectory, false, "new.NAME"); }).to.not.throw();

					expect(groupFile.data).to.deep.equal(fs.readFileSync(path.join(tempDirectory, "new.NAME")));
				});

				it("should successfully write a valid group file to a file path", function() {
					let groupFile = new Group.File("NAME.old");
					groupFile.data = "Rubber boots in motion!";

					expect(function() { groupFile.writeTo(path.join(tempDirectory, "OTHER.con"), false); }).to.not.throw();

					expect(groupFile.data).to.deep.equal(fs.readFileSync(path.join(tempDirectory, "OTHER.con")));
				});

				it("should throw an error when trying to write files that contain no data", function() {
					expect(function() { fakeFile.writeTo(tempDirectory); }).to.throw();
				});

				it("should throw an error when trying to write a file with no name specified", function() {
					let groupFile = new Group.File();
					groupFile.data = "SPICE MUST FLOW!";

					expect(function() { groupFile.writeTo(tempDirectory); }).to.throw();
				});

				it("should throw an error when trying to write a file to a path that already exists with overwriting disabled", function() {
					let groupFile = new Group.File("SAMETIE.CON");
					groupFile.data = "Did another pigeon get into the boardroom?";

					expect(function() { groupFile.writeTo(tempDirectory); }).to.not.throw();
					expect(function() { groupFile.writeTo(tempDirectory); }).to.throw();
				});

				it("should successfilly write a valid group file to a file path that already exists with overwriting enabled", function() {
					let groupFile = new Group.File("URBAN.CHAOS");
					groupFile.data = "Hi, my name is Quirky Purple.";

					expect(function() { groupFile.writeTo(tempDirectory); }).to.not.throw();

					groupFile.data = "I am indeed Geno Purple.";

					expect(function() { groupFile.writeTo(tempDirectory, true); }).to.not.throw();

					expect(new Group.File("?", "I am indeed Geno Purple.").data).to.deep.equal(fs.readFileSync(path.join(tempDirectory, "URBAN.CHAOS")));
				});
			});

			describe("equals", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.equals).to.be.a("function");
				});

				it("should return true when group files are compared to themselves", function() {
					for(let i = 0; i < testGroups.length; i++) {
						for(let j = 0; j < testGroups[i].files.length; j++) {
							expect(testGroups[i].files[j].equals(testGroups[i].files[j])).to.equal(true);
						}
					}
				});

				it("should return false when comparing group files that have different names", function() {
					const realFile = testGroup.getFile(2);
					const otherFile = new Group.File("OTHER.JSON", realFile.data);

					expect(realFile.equals(otherFile)).to.equal(false);
				});

				it("should correctly compare group files with null data with other group files", function() {
					const realFile = testGroup.getFile(1);
					const nullFile = new Group.File(realFile.name, realFile.size);

					expect(realFile.equals(nullFile)).to.equal(false);
					expect(nullFile.equals(realFile)).to.equal(false);
					expect(nullFile.equals(nullFile)).to.equal(true);
				});

				it("should return false when comparing to a non-group file value", function() {
					const realFile = testGroup.getFile(2);
					const testGroupFiles = testGroup.files.concat(new Group.File(realFile.name, realFile.size), new Group.File("OTHER.JSON", realFile.data), fakeFile);
					const newTestData = testData.concat(new Group(), new Group("damn.SON"));

					for(let i = 0; i < testGroupFiles.length; i++) {
						for(let j = 0; j < newTestData.length; j++) {
							expect(testGroupFiles[i].equals(newTestData[j])).to.equal(false);
						}
					}
				});
			});

			describe("toString", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.toString).to.be.a("function");
				});

				it("should return the name of the group file", function() {
					expect(new Group.File().toString()).to.equal(null);
					expect(new Group.File("PYP2000.CON").toString()).to.equal("PYP2000.CON");
				});
			});

			describe("static isGroupFile", function() {
				it("should be a function", function() {
					expect(Group.File.isGroupFile).to.be.a("function");
				});

				it("should return true for objects that are instance of the group class", function() {
					const newTestGroupFiles = [fakeFile, new Group.File("NUCLEAR.GRP"), null, new Error("I'm here to kick ass and chew bubblegum.. and I'm all outta gum."), Infinity];

					const results = [true, true, false, false, false];

					for(let i = 0; i < newTestGroupFiles.length; i++) {
						expect(Group.File.isGroupFile(newTestGroupFiles[i])).to.equal(results[i]);
					}
				});
			});

			describe("isValid", function() {
				it("should be a function", function() {
					expect(Group.File.isValid).to.be.a("function");
				});

				it("should return true for valid group files", function() {
					const newTestGroupFiles = [
						fakeFile,
						new Group.File("", 6),
						new Group.File("2SPOOKY", -4),
						new Group.File("4ME", 8675309),
						new Group.File("DOOT", -99),
						new Group.File(-Infinity, new Date()),
						new Group.File(/nope.av/i, 512),
						new Group.File(new Error("You cannot get off Mr. Bones' wild ride."), NaN)
					];

					const results = [true, false, true, true, true, false, false, false];

					for(let i = 0; i < newTestGroupFiles.length; i++) {
						expect(newTestGroupFiles[i].isValid()).to.equal(results[i]);
					}
				});
			});

			describe("static isValid", function() {
				it("should be a function", function() {
					expect(Group.File.prototype.isValid).to.be.a("function");
				});

				it("should return true for values that are valid group files", function() {
					const newTestGroupFiles = [
						undefined,
						null,
						-Infinity,
						{ },
						[],
						new Error("I'm here to kick bubblegum and chew ass.. and I'm all outta ass."),
						new Group.File("", 8),
						new Group.File("2SPOOKY", -1),
						new Group.File("4ME", 9499744),
						new Group.File("DOOT", -249),
						new Group.File(NaN, new Error("We need more meat.")),
						new Group.File(/nice.meme/, 1024),
						new Group.File(new Error("Collect wood."), -Infinity),
						new Group.File("DAYZ.GRP", 320),
						new Group.File("WASTELAND.SSI"),
						fakeFile
					];

					const results = [false, false, false, false, false, false, false, true, true, true, false, false, false, true, true, true];

					for(let i = 0; i < newTestGroupFiles.length; i++) {
						expect(Group.File.isValid(newTestGroupFiles[i])).to.equal(results[i]);
					}
				});
			});
		});
	});
});
