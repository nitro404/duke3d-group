"use strict";

const async = require("async");
const path = require("path-extra");
const fs = require("fs-extra");
const utilities = require("extra-utilities");
const ByteBuffer = require("bytebuffer");
const GroupFile = require("./group-file");

class Group {
	constructor(filePath) {
		let _properties = { };

		Object.defineProperty(this, "filePath", {
			enumerable: true,
			get() {
				return _properties.filePath;
			},
			set(filePath) {
				if(typeof filePath === "string") {
					_properties.filePath = filePath.trim();
				}
				else {
					_properties.filePath = null;
				}
			}
		});

		Object.defineProperty(this, "files", {
			enumerable: true,
			get() {
				return _properties.files;
			},
			set(files) {
				if(!Array.isArray(files)) {
					return;
				}

				if(Array.isArray(_properties.files)) {
					_properties.files.length = 0;
				}
				else {
					_properties.files = [];
				}

				for(let i = 0; i < files.length; i++) {
					_properties.files.push(files[i]);
				}
			}
		});

		this.filePath = filePath;
		this.files = [];
	}

	getFilePath() {
		return this.filePath;
	}

	getFileName() {
		if(utilities.isEmptyString(this.filePath)) {
			return null;
		}

		return utilities.getFileName(this.filePath);
	}

	getExtension() {
		if(utilities.isEmptyString(this.filePath)) {
			return Group.DEFAULT_FILE_EXTENSION;
		}

		return utilities.getFileExtension(this.filePath);
	}

	setFilePath(filePath) {
		this.filePath = filePath;
	}

	verifyAllFiles() {
		for(let i = 0; i < this.files.length; i++) {
			if(!Group.File.isValid(this.files[i])) {
				return false;
			}
		}

		return true;
	}

	getGroupSize() {
		if(!this.isValid()) {
			return 0;
		}

		return Group.HEADER_TEXT.length + 4 + (this.files.length * (Group.File.MAX_FILE_NAME_LENGTH + 4)) + this.getGroupFileSize()
	}

	getGroupFileSize() {
		let fileSize = 0;

		for(let i = 0; i < this.files.length; i++) {
			if(!Group.File.isValid(this.files[i])) {
				return -1;
			}

			fileSize += this.files[i].getDataSize();
		}

		return fileSize;
	}

	numberOfFiles() {
		return this.files.length;
	}

	hasFile(file) {
		return this.indexOfFile(file) !== -1;
	}

	indexOfFile(file) {
		if(this.files.length === 0) {
			return -1;
		}

		if(typeof file === "string") {
			if(utilities.isEmptyString(file)) {
				return -1;
			}

			const fileName = file.trim();

			for(let i = 0; i < this.files.length; i++) {
				const currentFile = this.files[i];

				if(!Group.File.isGroupFile(currentFile) || utilities.isEmptyString(currentFile.name)) {
					continue;
				}

				if(currentFile.name.localeCompare(fileName, { }, { usage: "search", sensitivity: "accent" }) === 0) {
					return i;
				}
			}

			return -1;
		}
		else if(file instanceof Group.File) {
			return this.indexOfFile(file.name);
		}

		return -1;
	}

	getFile(file) {
		if(Number.isInteger(file)) {
			if(file < 0 || file >= this.files.length) {
				return null;
			}

			return this.files[file];
		}

		const fileIndex = this.indexOfFile(file);

		if(fileIndex === -1) {
			return null;
		}

		return this.files[fileIndex];
	}

	getFiles() {
		return this.files;
	}

	getFilesWithExtension(extension) {
		if(this.files.length === 0 || utilities.isEmptyString(extension)) {
			return [];
		}

		let filesWithExtension = [];

		for(let i = 0; i < this.files.length; i++) {
			const currentFile = this.files[i];

			if(!Group.File.isGroupFile(currentFile)) {
				continue;
			}

			if(utilities.isEmptyString(currentFile.name)) {
				continue;
			}

			const currentFileExtension = currentFile.getExtension();

			if(utilities.isEmptyString(currentFileExtension)) {
				continue;
			}

			if(currentFileExtension.localeCompare(extension, { }, { usage: "search", sensitivity: "accent" }) === 0) {
				filesWithExtension.push(currentFile);
			}
		}

		return filesWithExtension;
	}

	getFileExtensions() {
		if(this.files.length === 0) {
			return [];
		}

		let fileExtensions = { };

		for(let i = 0; i < this.files.length; i++) {
			const currentFile = this.files[i];

			if(!Group.File.isGroupFile(currentFile) || utilities.isEmptyString(currentFile.name)) {
				continue;
			}

			const currentFileExtension = currentFile.getExtension();

			if(utilities.isEmptyString(currentFileExtension)) {
				continue;
			}

			fileExtensions[currentFileExtension.toUpperCase()] = true;
		}

		return Object.keys(fileExtensions);
	}

	extractFile(file, filePath, overwrite, newFileName) {
		const groupFile = this.getFile(file);

		if(!Group.File.isValid(groupFile)) {
			return null;
		}

		return groupFile.writeTo(filePath, overwrite, newFileName);
	}

	extractAllFilesWithExtension(extension, directory, overwrite) {
		if(!this.isValid()) {
			throw new Error("Cannot extract all files from invalid group.");
		}

		const filesWithExtension = this.getFilesWithExtension(extension);

		if(utilities.isEmptyArray(filesWithExtension)) {
			return [];
		}

		let extractedFilePaths = [];

		for(let i = 0; i < filesWithExtension.length; i++) {
			let fileStats = null;

			try {
				fileStats = fs.statSync(utilities.joinPaths(directory, filesWithExtension[i].name));
			}
			catch(error) { }

			if(utilities.isValid(fileStats) && !overwrite) {
				continue;
			}

			extractedFilePaths.push(filesWithExtension[i].writeTo(directory, overwrite));
		}

		return extractedFilePaths;
	}

	extractAllFiles(directory, overwrite) {
		if(!this.isValid()) {
			throw new Error("Cannot extract all files from invalid group.");
		}

		let extractedFilePaths = [];

		for(let i = 0; i < this.files.length; i++) {
			let fileStats = null;

			try {
				fileStats = fs.statSync(utilities.joinPaths(directory, this.files[i].name));
			}
			catch(error) { }

			if(utilities.isValid(fileStats) && !overwrite) {
				continue;
			}

			extractedFilePaths.push(this.files[i].writeTo(directory, overwrite));
		}

		return extractedFilePaths;
	}

	addFile(file, replace) {
		let groupFile = file;

		if(typeof file === "string") {
			groupFile = Group.File.readFrom(file);
		}

		if(!Group.File.isValid(groupFile)) {
			throw new Error("Cannot add invalid group file.");
		}

		const groupFileIndex = this.indexOfFile(groupFile);

		if(groupFileIndex !== -1) {
			if(!replace) {
				throw new Error("Group file with same name already present in group.");
			}

			this.files[groupFileIndex] = groupFile;
		}
		else {
			this.files.push(groupFile);
		}

		return groupFile;
	}

	addFiles(files, replace) {
		if(utilities.isEmptyArray(files)) {
			return [];
		}

		let filesAdded = [];

		for(let i = 0; i < files.length; i++) {
			filesAdded.push(this.addFile(files[i], replace));
		}

		return filesAdded;
	}

	addDirectory(directory, recursive, replace) {
		recursive = utilities.parseBoolean(recursive, false);

		if(!fs.statSync(directory).isDirectory()) {
			throw new Error("Can only create group from valid directory.");
		}

		const directoryContents = fs.readdirSync(directory);
		let filesAdded = [];

		for(let i = 0; i < directoryContents.length; i++) {
			const filePath = path.join(directory, directoryContents[i]);
			const fileStats = fs.statSync(filePath);

			if(fileStats.isFile()) {
				filesAdded.push(this.addFile(filePath, replace));
			}
			else if(fileStats.isDirectory() && recursive) {
				const directoryGroupFiles = this.addDirectory(filePath, recursive, replace);

				if(utilities.isNonEmptyArray(directoryGroupFiles)) {
					Array.prototype.push.apply(filesAdded, directoryGroupFiles);
				}
			}
		}

		return filesAdded;
	}

	renameFile(file, newFileName) {
		let groupFile = this.getFile(file);

		if(!Group.File.isValid(groupFile)) {
			return false;
		}

		groupFile.name = newFileName;

		return true;
	}

	replaceFile(file, newFile) {
		let indexOfFileToReplace = this.indexOfFile(file);

		if(indexOfFileToReplace == -1) {
			return null;
		}

		let groupFile = newFile;

		if(typeof newFile === "string") {
			groupFile = Group.File.readFrom(newFile);
		}

		if(!Group.File.isValid(groupFile)) {
			throw new Error("Cannot replace with invalid group file.");
		}

		this.files[indexOfFileToReplace] = groupFile;

		return groupFile;
	}

	removeFile(file) {
		let fileIndex = -1;

		if(Number.isInteger(file)) {
			if(file < 0 || file >= this.files.length) {
				return false;
			}

			fileIndex = file;
		}
		else {
			fileIndex = this.indexOfFile(file);
		}

		if(fileIndex === -1) {
			return false;
		}

		this.files.splice(fileIndex, 1);

		return true;
	}

	removeFiles(files) {
		if(utilities.isEmptyArray(files)) {
			return 0;
		}

		let fileIndexes = [];

		for(let i = 0; i < files.length; i++) {
			let file = files[i];
			let fileIndex = -1;

			if(Number.isInteger(file)) {
				fileIndex = file;
			}
			else {
				fileIndex = this.indexOfFile(file);
			}

			if(fileIndex >= 0 && fileIndex < this.files.length && fileIndexes.indexOf(fileIndex) === -1) {
				if(fileIndexes.length === 0) {
					fileIndexes.push(fileIndex);
				}
				else {
					let insertAtIndex = 0;

					for(; insertAtIndex < fileIndexes.length; insertAtIndex++) {
						if(fileIndexes[insertAtIndex] >= fileIndex) {
							break;
						}
					}

					fileIndexes.splice(insertAtIndex, 0, fileIndex);
				}
			}
		}

		let newFiles = [];

		for(let i = 0; i < this.files.length; i++) {
			let keepFile = true;

			for(let j = 0; j < fileIndexes.length; j++) {
				if(fileIndexes[j] > i) {
					break;
				}

				if(fileIndexes[j] == i) {
					keepFile = false;
					break;
				}
			}

			if(keepFile) {
				newFiles.push(this.files[i]);
			}
		}

		this.files = newFiles;

		return fileIndexes.length;
	}

	clearFiles() {
		this.files.length = 0;
	}

	static createFrom(directory, recursive) {
		let group = new Group();
		group.addDirectory(directory, recursive);
		return group;
	}

	static readFrom(filePath) {
		if(utilities.isEmptyString(filePath)) {
			throw new Error("Missing or invalid group file path.");
		}

		const fileStats = fs.statSync(filePath);

		if(!fileStats.isFile()) {
			throw new Error("Group file path is not a file!");
		}

		const groupData = fs.readFileSync(filePath);

		let groupByteBuffer = new ByteBuffer();
		groupByteBuffer.order(true);
		groupByteBuffer.append(groupData, "binary");
		const groupSize = groupByteBuffer.offset;
		let offset = 0;
		groupByteBuffer.flip();

		if(groupSize < Group.HEADER_TEXT.length) {
			throw new Error("Group \"" + utilities.getFileName(filePath) + "\" is missing header text.");
		}

		const headerText = groupByteBuffer.readString(Group.HEADER_TEXT.length);

		offset += Group.HEADER_TEXT.length;

		if(headerText !== Group.HEADER_TEXT) {
			throw new Error("Group \"" + utilities.getFileName(filePath) + "\" has invalid header text.");
		}

		if(groupSize < offset + 4) {
			throw new Error("Group \"" + utilities.getFileName(filePath) + "\" is missing the number of files value.");
		}

		const numberOfFiles = groupByteBuffer.readUint32();

		offset += 4;

		if(!Number.isInteger(numberOfFiles)) {
			throw new Error("Group \"" + utilities.getFileName(filePath) + "\" has an invalid number of files.");
		}

		const fileDataOffset = offset + (numberOfFiles * (Group.File.MAX_FILE_NAME_LENGTH + 4));
		let fileOffset = fileDataOffset;
		let files = [];

		for(let i = 0; i < numberOfFiles; i++) {
			if(groupSize < offset + Group.File.MAX_FILE_NAME_LENGTH) {
				throw new Error("Group \"" + utilities.getFileName(filePath) + "\" is incomplete or corrupted: missing file #" + (i + 1) + " name.");
			}

			const fileName = utilities.trimNullTerminatedString(groupByteBuffer.readString(Group.File.MAX_FILE_NAME_LENGTH));

			offset += Group.File.MAX_FILE_NAME_LENGTH;

			if(utilities.isEmptyString(fileName)) {
				throw new Error("Group \"" + utilities.getFileName(filePath) + "\" is incomplete or corrupted: file #" + (i + 1) + " name is invalid or empty.");
			}

			if(groupSize < offset + 4) {
				throw new Error("Group \"" + utilities.getFileName(filePath) + "\" is incomplete or corrupted: missing file #" + (i + 1) + " size value.");
			}

			const fileSize = groupByteBuffer.readUint32();

			offset += 4;

			if(!Number.isInteger(fileSize)) {
				throw new Error("Group \"" + utilities.getFileName(filePath) + "\" is incomplete or corrupted: file #" + (i + 1) + " size is invalid.");
			}

			files.push(new Group.File(fileName, fileSize));

			fileOffset += fileSize;
		}

		fileOffset = fileDataOffset;

		for(let i = 0; i < files.length; i++) {
			let file = files[i];

			const fileData = groupByteBuffer.copy(fileOffset, fileOffset + file.size).toBuffer();

			fileOffset += file.size;

			file.data = fileData;
		}

		let group = new Group(filePath);
		group.files = files;

		return group;
	}

	serialize() {
		if(!this.isValid()) {
			throw new Error("Cannot save invalid group.");
		}

		let groupByteBuffer = new ByteBuffer(this.getGroupSize());
		groupByteBuffer.order(true);

		groupByteBuffer.writeString(Group.HEADER_TEXT);
		groupByteBuffer.writeUint32(this.files.length);

		for(let i = 0; i < this.files.length; i++) {
			groupByteBuffer.writeString(this.files[i].getSerializedFileName());
			groupByteBuffer.writeUint32(this.files[i].getDataSize());
		}

		for(let i = 0; i < this.files.length; i++) {
			if(Buffer.isBuffer(this.files[i].data)) {
				groupByteBuffer.append(this.files[i].data, "binary");
			}
		}

		groupByteBuffer.flip();

		return groupByteBuffer.toBuffer();
	}

	writeTo(filePath) {
		if(utilities.isEmptyString(filePath)) {
			throw new Error("Must specify file path to save to.");
		}

		const outputDirectory = utilities.getFilePath(filePath);

		if(utilities.isNonEmptyString(outputDirectory)) {
			fs.ensureDirSync(outputDirectory);
		}

		fs.writeFileSync(filePath, this.serialize());

		return filePath;
	}

	save() {
		this.writeTo(this.filePath);
	}

	static checkSameFileOrder(groupA, groupB) {
		if(!Group.isValid(groupA) || !Group.isValid(groupB)) {
			return false;
		}

		if(groupA.files.length !== groupB.files.length) {
			return false;
		}

		for(let i = 0; i < groupA.files.length; i++) {
			if(!groupA.files[i].equals(groupB.files[i])) {
				return false;
			}
		}

		return true;
	}

	equals(value) {
		if(!this.isValid() || !Group.isValid(value)) {
			return false;
		}

		if(this.files.length !== value.files.length) {
			return false;
		}

		for(let i = 0; i < this.files.length; i++) {
			if(!value.hasFile(this.files[i])) {
				return false;
			}
		}

		return true;
	}

	toString() {
		return this.getFileName();
	}

	static isGroup(group) {
		return group instanceof Group;
	}

	isValid() {
		for(let i = 0; i < this.files.length; i++) {
			if(!Group.File.isValid(this.files[i])) {
				return false;
			}
		}

		return true;
	}

	static isValid(group) {
		return Group.isGroup(group) &&
			   group.isValid();
	}
}

Object.defineProperty(Group, "DEFAULT_FILE_EXTENSION", {
	value: "GRP",
	enumerable: true
});

Object.defineProperty(Group, "HEADER_TEXT", {
	value: "KenSilverman",
	enumerable: true
});

Object.defineProperty(Group, "File", {
	value: GroupFile,
	enumerable: true
});

module.exports = Group;
