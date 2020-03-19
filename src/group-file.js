"use strict";

const path = require("path-extra");
const fs = require("fs-extra");
const utilities = require("extra-utilities");
const ByteBuffer = require("bytebuffer");

class GroupFile {
	constructor(name, data) {
		const _properties = { };

		Object.defineProperty(this, "name", {
			enumerable: true,
			get() {
				return _properties.name;
			},
			set(name) {
				if(typeof name === "string") {
					_properties.name = utilities.truncateFileName(utilities.trimNullTerminatedString(name), GroupFile.MAX_FILE_NAME_LENGTH).toUpperCase();
				}
				else {
					_properties.name = null;
				}
			}
		});

		Object.defineProperty(this, "size", {
			enumerable: true,
			get() {
				return _properties.size;
			},
			set(size) {
				_properties.size = Number.isInteger(size) && size >= 0 ? size : 0;
			}
		});

		Object.defineProperty(this, "data", {
			enumerable: true,
			get() {
				return _properties.data;
			},
			set(data) {
				if(ByteBuffer.isByteBuffer(data)) {
					_properties.data = data.toBuffer();
				}
				else if(Buffer.isBuffer(data)) {
					_properties.data = Buffer.from(data);
				}
				else if(typeof data === "string") {
					_properties.data = Buffer.from(data);
				}
				else {
					_properties.data = null;
				}

				this.size = _properties.data === null ? 0 : _properties.data.length;
			}
		});

		this.name = name;

		if(Number.isInteger(data)) {
			this.data = null;
			this.size = data;
		}
		else {
			this.data = data;
		}
	}

	getFileName() {
		return this.name;
	}

	getSerializedFileName() {
		let serializedFileName = this.name;

		for(let i = this.name.length; i < GroupFile.MAX_FILE_NAME_LENGTH; i++) {
			serializedFileName += "\0";
		}

		return serializedFileName;
	}

	getExtension() {
		if(utilities.isEmptyString(this.name)) {
			return "";
		}

		return utilities.getFileExtension(this.name);
	}

	getFileSize() {
		return this.size;
	}

	getData() {
		return this.data;
	}

	getDataSize() {
		return this.data == null ? 0 : this.data.length;
	}

	setFileName(fileName) {
		this.name = fileName;
	}

	reverseFileExtension() {
		this.name = utilities.reverseFileExtension(this.name);
	}

	setData(data) {
		this.data = data;
	}

	clearData() {
		this.data = null;
	}

	static readFrom(file) {
		if(utilities.isEmptyString(file)) {
			throw new Error("Cannot read group file from empty path.");
		}

		return new GroupFile(file, fs.readFileSync(file));
	}

	writeTo(filePath, overwrite, fileName) {
		if(this.data === null) {
			throw new Error("Cannot write file that contains no data.");
		}

		overwrite = utilities.parseBoolean(overwrite, false);

		if(utilities.isEmptyString(fileName)) {
			fileName = utilities.getFileName(filePath);

			if(utilities.isEmptyString(fileName)) {
				fileName = this.name;

				if(utilities.isEmptyString(fileName)) {
					throw new Error("Must specify output file name.");
				}
			}
		}

		const outputDirectory = utilities.getFilePath(filePath);

		if(utilities.isNonEmptyString(outputDirectory)) {
			fs.ensureDirSync(outputDirectory);
		}

		const outputFilePath = utilities.joinPaths(outputDirectory, fileName);
		let outputFileStats = null;

		try {
			outputFileStats = fs.statSync(outputFilePath);
		}
		catch(error) {
			if(utilities.isObject(error) && error.code !== "ENOENT") {
				throw error;
			}
		}

		if(utilities.isValid(outputFileStats) && !overwrite) {
			throw new Error("File \"" + fileName + "\" already exists, must specify overwrite parameter.");
		}

		fs.writeFileSync(outputFilePath, this.data);

		return outputFilePath;
	}

	equals(value) {
		if(!GroupFile.isGroupFile(value)) {
			return false;
		}

		if(this.name !== value.name) {
			return false;
		}

		if(this.data === null && value.data === null) {
			return true;
		}
		else if(this.data === null && value.data !== null) {
			return false;
		}
		else if(this.data !== null && value.data === null) {
			return false;
		}

		return this.data.equals(value.data);
	}

	toString() {
		return this.name;
	}

	static isGroupFile(groupFile) {
		return groupFile instanceof GroupFile;
	}

	isValid() {
		return utilities.isNonEmptyString(this.name);
	}

	static isValid(groupFile) {
		return GroupFile.isGroupFile(groupFile) &&
			   groupFile.isValid();
	}
}

Object.defineProperty(GroupFile, "MAX_FILE_NAME_LENGTH", {
	value: 12,
	enumerable: true
});

module.exports = GroupFile;
