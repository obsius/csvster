import { Transform, Writable } from 'stream';

import { DEFUALT_DELIM, DEFAULT_LINE_DELIM, BOM, NEWLINE, REGEX_BOOL_TRUE, REGEX_BOOL_FALSE, REGEX_NUMBER } from './constants';
import detect from './utilities/detect';
import read from './utilities/read';
import write from './utilities/write';
import CsvsterError from './utilities/CsvsterError';

export default class Csvster {

	charIndex = 0;
	lineCharIndex = 0;
	rowIndex = 0;
	lineNum = 0;
	rowLength = 0;

	/**
	 * Return a new Csvster object. Easier to use the static class methods when possible.
	 * 
	 * @param { object } params - destructured parameters
	 * @param { array | boolean } [params.header] - array of header names or a true flag indicating to use the first row as a header
	 * @param { boolean } [params.map] - map rows to header names
	 * @param { boolean } [params.cast] - cast values to their most likely json types (bool, number, or string)
	 * @param { boolean } [params.skipEmptyLines] - skip empty lines (lines with no columns or all empty columns)
	 * @param { boolean } [params.keepBom] - keep a file byte order mark in returned rows (if found in file)
	 * @param { string | null } [params.delimeter] - csv column delimiter, set to null to autodetect
	 * @param { string } [params.lineDelimeter] - csv line column delimiter (only used for write mode)
	 */
	constructor({
		header = false,
		map = false,
		cast = false,
		skipEmptyLines = false,
		keepBom = false,
		delimiter = DEFUALT_DELIM,
		lineDelimiter = DEFAULT_LINE_DELIM
	} = {}) {
		this.header = header;
		this.map = map;
		this.cast = cast;
		this.skipEmptyLines = skipEmptyLines;
		this.keepBom = keepBom;
		this.delimiter = delimiter;
		this.lineDelimiter = lineDelimiter;
	}

	/**
	 * If a string or stream does not terminate on a newline, calling this will return the last (undeliminated) line.
	 * 
	 * @param { fn } [onRow] - optional callback
	 */
	flush(onRow) {
		if (this.buffer && this.buffer.length) {
			return this.readPartial(NEWLINE, onRow);
		}
	}

	/**
	 * Reset byte, row, and column tracking.
	 */
	reset() {
		this.charIndex = 0;
		this.lineCharIndex = 0;
		this.rowIndex = 0;
		this.lineNum = 0;
		this.rowLength = 0;
	}

	/**
	 * Read csv data from a buffer or string. Returns rows if no callback is provided.
	 * 
	 * @param { buffer | string } bufferOrString - part of the csv source to read
	 * @param { fn } [onRow] - optional callback
	 */
	readPartial(bufferOrString, onRow) {
		try {

			let rows = [];

			let buffer = this.buffer ? this.buffer.concat(bufferOrString) : bufferOrString;

			// skip bom
			if (!this.keepBom && this.charIndex == 0 && buffer.length && buffer[0] == BOM) {
				buffer = buffer.slice(++this.charIndex);
			}

			// detect delimeter
			if (!this.delimiter) {

				let delimiter = detect(buffer);

				if (delimiter) {
					this.delimiter = delimiter;
				} else {
					throw CsvsterError.cannotDetermineDeliminator();
				}
			}

			let i = read(buffer, this.delimiter, (row) => {

				++this.lineNum;

				// skip empty lines
				if (this.skipEmptyLines) {

					let empty = true;

					if (row.length) {
						for (let part of row) {
							if (part.length) {
								empty = false;
								break;
							}
						}
					}

					if (empty) {
						return;
					}
				}

				// set header
				if (this.rowIndex++ == 0) {
					if (this.header === true) {

						this.header = checkHeader(row);
						this.rowLength = this.header.length;

						return;
					}
				}

				// check row length
				if (this.rowLength) {
					checkRowLength(row.length, this.rowLength);
				} else {
					this.rowLength = row.length;
				}

				// cast datatypes
				if (this.cast) {
					for(let i = 0; i < row.length; ++i) {
						if (REGEX_BOOL_TRUE.test(row[i])) {
							row[i] = true;
						} else if (REGEX_BOOL_FALSE.test(row[i])) {
							row[i] = false;
						} else if (REGEX_NUMBER.test(row[i])) {
							row[i] = parseFloat(row[i]);
						}
					}
				}

				// convert array to header map
				if (this.header && this.map) {

					let obj = {};

					for (let i = 0; i < this.header.length; ++i) {
						obj[this.header[i]] = row[i];
					}

					row = obj;
				}

				if (onRow) {
					onRow(row);
				} else {
					rows.push(row);
				}
			});

			// buffer remaining data for next read
			if (i < buffer.length) {
				this.buffer = buffer.slice(i);
			} else {
				this.buffer = null;
			}

			this.lineCharIndex = this.charIndex;
			this.charIndex += i;

			if (!onRow) {
				return rows;
			}

		} catch (e) {
			throwError(this, e);
		}
	}

	/**
	 * Read csv data from a buffer or string. The csv source must be complete. Returns rows if no callback is provided.
	 * 
	 * @param { buffer | string } bufferOrString - complete csv source to read
	 * @param { fn } [onRow] - optional callback
	 */
	readAll(bufferOrString, onRow = null) {

		this.reset();

		let rows = this.readPartial(bufferOrString, onRow);

		// flush possible undeliminated row and check for unterminated quotes
		if (this.charIndex < bufferOrString.length) {

			let flushedRows = this.flush(onRow);

			if (rows && flushedRows) {
				rows.push(flushedRows[0]);
			}

			if (this.charIndex < bufferOrString.length) {
				throwError(this, CsvsterError.unterminatedQuotes());
			}
		}

		if (!onRow) {
			return rows;
		}
	}

	/**
	 * Returns the csv header as a string.
	 * 
	 * @param { array } [header] - array of header names, else uses the header set at the class level
	 */
	writeHeader(header = this.header) {
		try {

			// check header
			if (header && Array.isArray(header)) {
				this.header = checkHeader(header);
				this.rowLength = this.header.length;

			// missing header
			} else {
				throw CsvsterError.missingHeader();
			}

			let string = write(this.header, this.delimiter, this.lineDelimiter);

			this.lineNum++;

			return string;

		} catch (e) {
			throwError(this, e);
		}
	}

	/**
	 * Returns a row as a string.
	 * 
	 * @param { array | object } arrayOrObject - row data to write
	 */
	writeRow(arrayOrObject) {
		try {

			// object
			if (!Array.isArray(arrayOrObject)) {

				// set the header
				if (!this.header) {
					this.header = checkHeader(arrayOrObject);
					this.rowLength = this.header.length;
				}

				// use header order
				if (this.header) {

					let array = [];

					for (let key of this.header) {
						array.push(arrayOrObject[key]);
					}

					arrayOrObject = array;

				// missing header
				} else {
					throw CsvsterError.missingHeader();
				}
			}

			// check row length (only enforce arrays, objects will write out empty values)
			if (Array.isArray(arrayOrObject)) {
				if (this.rowLength) {
					checkRowLength(arrayOrObject.length, this.rowLength);
				} else {
					this.rowLength = arrayOrObject.length;
				}
			}

			let string = write(arrayOrObject, this.delimiter, this.lineDelimiter);

			this.lineNum++;

			return string;

		} catch (e) {
			throwError(this, e);
		}
	}

	/**
	 * Write rows to a string. Returns a string if no callback is provided.
	 * 
	 * @param { []array | []object } arraysOrObjects - array of arrays or objects of row data to write
	 * @param { []array | boolean } [headerOrFlag] - array of header names or a flag indicating to use existing headers
	 * @param { fn } [onRow] - optional callback
	 */
	writeRows(arraysOrObjects, headerOrFlag = false, onRow = null) {

		let string = '';

		this.reset();

		// write header
		if (headerOrFlag === true ? Array.isArray(this.header) : headerOrFlag !== false) {

			let header = this.writeHeader(headerOrFlag === true ? undefined : headerOrFlag);

			if (onRow) {
				onRow(header);
			} else {
				string += header;
			}
		}

		// write rows
		for (let element of arraysOrObjects) {

			let row = this.writeRow(element);

			if (onRow) {
				onRow(row);
			} else {
				string += row;
			}
		}

		if (!onRow) {
			return string;
		}
	}

	/**
	 * Read csv data from a buffer or string. The csv source must be complete. Returns rows if no callback is provided.
	 * 
	 * @param { buffer | string } bufferOrString - complete csv source to read
	 * @param { object } [options] - optional constructor properties
	 * @param { fn } [onRow] - optional callback
	 */
	static read(bufferOrString, options, onRow = null) {
		let reader = new Csvster(options);
		return reader.readAll(bufferOrString, onRow);
	}

	/**
	 * Returns a stream transform object that will read a buffer or string and write row data in array form.
	 * An optional callback can be provided to instead return a stream writable object.
	 * 
	 * @param { object } [options] - optional constructor properties
	 * @param { fn } [onRow] - optional callback
	 */
	static reader(options, onRow = null) {

		let csvster = new Csvster(options);
		let controller = new AbortController();

		let reader;

		// stream writable
		if (onRow) {
			
			reader = new Writable({
				objectMode: true,
				signal: controller.signal,
				write: function (chunk, encoding, callback) {
					csvster.readPartial(chunk, onRow);
					callback();
				},
				final: function (callback) {
					csvster.flush(onRow);
					callback();
				}
			});

			reader.on('close', () => onRow(null));

		// stream transform
		} else {
			reader = new Transform({
				objectMode: true,
				signal: controller.signal,
				transform: function (chunk, encoding, callback) {
					csvster.readPartial(chunk, (row) => this.push(row));
					callback();
				},
				final: function (callback) {
					csvster.flush((row) => this.push(row));
					callback();
				}
			});
		}

		reader.abort = () => controller.abort();

		return reader;
	}

	/**
	 * Write rows to a string. Returns a string if no callback is provided.
	 * 
	 * @param { []array | []object } arraysOrObjects - array of arrays or objects for each row to write
	 * @param { object } [options] - optional constructor properties
	 * @param { fn } [onRow] - optional callback
	 */
	static write(arraysOrObjects, options, onRow = null) {
		let csvster = new Csvster(options);
		return csvster.writeRows(arraysOrObjects, true, onRow);
	}

	/**
	 * Returns a stream transform object that will read arrays or objects and write string data.
	 * An optional callback can be provided to instead return a stream writable object.
	 * 
	 * @param { object } [options] - optional constructor properties
	 * @param { fn } [onRow] - optional callback
	 */
	static writer(options, onRow = null) {

		let csvster = new Csvster(options);
		let controller = new AbortController();

		let writer;

		if (onRow) {

			writer = new Writable({
				objectMode: true,
				signal: controller.signal,
				write: function (chunk, encoding, callback) {
					onRow(csvster.writeRow(chunk));
					callback();
				}
			});

			writer.on('close', () => onRow(null));

		} else {
			writer = new Transform({
				writableObjectMode: true,
				signal: controller.signal,
				transform: function (chunk, encoding, callback) {
					callback(null, csvster.writeRow(chunk));
				}
			});
		}

		writer.abort = () => controller.abort();

		return writer;
	}
}

Csvster.ERRORS = CsvsterError.CODES;

/* internal */

function throwError(csvster, error) {

	if (error instanceof CsvsterError) {
		error.set(
			csvster.charIndex,
			csvster.rowIndex,
			csvster.charIndex - csvster.lineCharIndex,
			csvster.lineNum
			
		);
	} else {
		error = CsvsterError.unknownError(error);
	}

	throw error;
}

function checkHeader(header) {

	let clone = [];
	let names = {};

	for (let part of header) {
		if (names[part]) {
			throw CsvsterError.duplicateHeaders();
		} else {
			clone.push(part);
			names[part] = true;
		}
	}

	return clone;
}

function checkRowLength(rowLength, length) {
	if (rowLength < length) {
		throw CsvsterError.missingColumns();
	} else if (rowLength > length) {
		throw CsvsterError.extraColumns();
	}
}