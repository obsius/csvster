'use strict';

var stream = require('stream');

function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}

const CARRIAGE_RETURN = '\r';
const NEWLINE = '\n';
const TAB = '\t';
const SPACE = ' ';
const BOM = '\ufeff';
const QUOTE = '"';
const DOUBLE_QUOTE = QUOTE + QUOTE;
const REGEX_BOOL_TRUE = /^true$/i;
const REGEX_BOOL_FALSE = /^false$/i;
const REGEX_NUMBER = /^[+\-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:\d[eE][+\-]?\d+)?$/;
const REGEX_QUOTE = new RegExp(`[\\s${QUOTE}]`);
const DEFUALT_DELIM = ',';
const DEFAULT_LINE_DELIM = CARRIAGE_RETURN + NEWLINE;

const CODES = {
  CANNOT_WRITE: 'cannot-write',
  DUPLICATE_HEADERS: 'duplicate-headers',
  EXTRA_COLUMNS: 'extra-columns',
  INVALID_QUOTE: 'invalid-quote',
  MISSING_COLUMNS: 'missing-columns',
  MISSING_HEADER: 'missing-header',
  UNKNOWN_DELIMINATOR: 'unknown-deliminator',
  UNKNOWN_ERROR: 'unknown-error',
  UNTERMINATED_QUOTES: 'unterminated-quotes'
};
const MESSAGES = {
  [CODES.CANNOT_WRITE]: 'Cannot write',
  [CODES.DUPLICATE_HEADERS]: 'Duplicate headers',
  [CODES.EXTRA_COLUMNS]: 'Extra columns',
  [CODES.INVALID_QUOTE]: 'Invalid Quote',
  [CODES.MISSING_COLUMNS]: 'Missing columns',
  [CODES.MISSING_HEADER]: 'Missing header',
  [CODES.UNKNOWN_DELIMINATOR]: 'Unknown deliminator',
  [CODES.UNKNOWN_ERROR]: 'Unknown error',
  [CODES.UNTERMINATED_QUOTES]: 'Unterminated quotes'
};
class CsvsterError extends Error {
  constructor(code, subError, tempOffset) {
    super(MESSAGES[code]);
    this.code = code;
    if (subError) {
      this.subError = subError;
    }
    if (tempOffset) {
      this.tempOffset = tempOffset;
    }
  }
  set(charIndex, rowNum, colNum, lineNum) {
    this.charIndex = charIndex;
    this.rowNum = rowNum;
    this.colNum = colNum;
    this.lineNum = lineNum;
    if (this.colNum != null && this.tempOffset) {
      this.colNum += this.tempOffset;
      delete this.tempOffset;
    }
    return this;
  }
  static cannotWrite(tempOffset) {
    return new CsvsterError(CODES.CANNOT_WRITE, undefined, tempOffset);
  }
  static duplicateHeaders() {
    return new CsvsterError(CODES.DUPLICATE_HEADERS);
  }
  static extraColumns() {
    return new CsvsterError(CODES.EXTRA_COLUMNS);
  }
  static invalidQuote(tempOffset) {
    return new CsvsterError(CODES.INVALID_QUOTE, undefined, tempOffset);
  }
  static missingColumns() {
    return new CsvsterError(CODES.MISSING_COLUMNS);
  }
  static missingHeader() {
    return new CsvsterError(CODES.MISSING_HEADER);
  }
  static unknownDeliminator() {
    return new CsvsterError(CODES.UNKNOWN_DELIMINATOR);
  }
  static unknownError(error) {
    return new CsvsterError(CODES.UNKNOWN_ERROR, error);
  }
  static unterminatedQuotes() {
    return new CsvsterError(CODES.UNTERMINATED_QUOTES);
  }
}
CsvsterError.CODES = CODES;

function read(bufferOrString, delimiter, onRow) {
  let parts = [];
  let leading = true;
  let quoting = false;
  let escaped = false;
  let j = 0;
  let k = 0;
  let l = 0;
  for (let i = 0; i < bufferOrString.length; ++i) {
    switch (bufferOrString[i]) {
      // newline
      case NEWLINE:
      case delimiter:
        if (!quoting) {
          // handle empty line case by enforcing leading
          let buffer = leading ? '' : bufferOrString.slice(j, k + 1);

          // remove escaped characters
          if (escaped) {
            buffer = buffer.replaceAll(DOUBLE_QUOTE, QUOTE);
            escaped = false;
          }
          parts.push(buffer);
          if (bufferOrString[i] == NEWLINE) {
            onRow(parts, i - l + 1);
            parts = [];
            l = i + 1;
          }
          j = i + 1;
          k = i + 1;
          leading = true;
        }
        break;

      // quote
      case QUOTE:
        if (leading) {
          j = i + 1;
          quoting = true;
          leading = false;
        } else if (quoting) {
          // escaped quote (skip it)
          if (bufferOrString.length > i + 1 && bufferOrString[i + 1] == QUOTE) {
            ++i;
            escaped = true;

            // end quoting
          } else {
            k = i - 1;
            quoting = false;
          }
        } else {
          throw CsvsterError.invalidQuote(i);
        }
        break;

      // whitespace
      case CARRIAGE_RETURN:
      case SPACE:
      case TAB:
        break;

      // character
      default:
        if (leading) {
          j = i;
          k = i;
          leading = false;
        } else if (!quoting) {
          k = i;
        }
    }
  }
  return l;
}

const SAMPLE_LENGTH = 2048;
const DELIMITERS = [',', ';', '\t', '\s'];
function detect(bufferOrString) {
  let buffer = bufferOrString.slice(0, SAMPLE_LENGTH);
  let bestScore = Number.POSITIVE_INFINITY;
  let bestIndex;
  for (let i = 0; i < DELIMITERS.length; ++i) {
    let score = scoreDelimiter(buffer, DELIMITERS[i]);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  // only return a value if a delimeter was found
  if (bestIndex != null) {
    return DELIMITERS[bestIndex];
  }
}

/* internal */

function scoreDelimiter(buffer, delimiter) {
  try {
    let rows = [];
    let parts = [];
    let length;
    let score = 0;
    read(buffer, delimiter, row => rows.push(row));
    for (let row of rows) {
      // check for row length consistency
      if (!length) {
        length = row.length;
        for (let part of row) {
          parts.push(part.length);
        }
      } else if (row.length != length) {
        return Number.POSITIVE_INFINITY;
      }
      for (let i = 0; i < row.length; ++i) {
        parts[i] += row[i].length;
      }
    }

    // calculate score

    for (let row of rows) {
      for (let i = 0; i < length; ++i) {
        score += (row[i].length - parts[i] / length) ** 2;
      }
    }
    return (score / length) ** .5;
  } catch (e) {
    return Number.POSITIVE_INFINITY;
  }
}

function write(array, delimiter = DEFUALT_DELIM, lineDelimiter = DEFAULT_LINE_DELIM) {
  let string = '';
  for (let i = 0; i < array.length; ++i) {
    let element = array[i];
    switch (typeof element) {
      case 'boolean':
        string += element ? 'true' : 'false';
        break;
      case 'number':
        string += element;
        break;
      case 'string':
        if (REGEX_QUOTE.test(element)) {
          element = element.replaceAll(QUOTE, DOUBLE_QUOTE);
          string += QUOTE + element + QUOTE;
        } else {
          string += element;
        }
        break;
      case 'object':
      case 'undefined':
        if (element == null) {
          string += 'null';
          break;
        }
      default:
        throw CsvsterError.cannotWrite(i);
    }
    if (i < array.length - 1) {
      string += delimiter;
    }
  }
  string += lineDelimiter;
  return string;
}

class Csvster {
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
    _defineProperty(this, "charIndex", 0);
    _defineProperty(this, "lineCharIndex", 0);
    _defineProperty(this, "rowIndex", 0);
    _defineProperty(this, "lineNum", 0);
    _defineProperty(this, "rowLength", 0);
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
      let charsRead = read(buffer, this.delimiter, (row, rowCharsRead) => {
        this.lineNum++;
        this.lineCharIndex = this.charIndex;
        this.charIndex += rowCharsRead;

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
          for (let i = 0; i < row.length; ++i) {
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
      if (charsRead < buffer.length) {
        this.buffer = buffer.slice(charsRead);
      } else {
        this.buffer = null;
      }
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
      this.charIndex += row.length;
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
      this.charIndex += string.length;
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
      reader = new stream.Writable({
        objectMode: true,
        signal: controller.signal,
        write: function (chunk, encoding, callback) {
          csvster.readPartial(chunk, row => {
            if (!this.aborted) {
              onRow(row, csvster.rowIndex, csvster.charIndex);
            }
          });
          callback();
        },
        final: function (callback) {
          csvster.flush(row => onRow(row, csvster.rowIndex, csvster.charIndex));
          callback();
        }
      });

      // stream transform
    } else {
      reader = new stream.Transform({
        objectMode: true,
        signal: controller.signal,
        transform: function (chunk, encoding, callback) {
          csvster.readPartial(chunk, row => {
            if (!this.aborted) {
              this.push(row);
            }
          });
          callback();
        },
        final: function (callback) {
          csvster.flush(row => this.push(row));
          callback();
        }
      });
    }
    reader.abort = () => {
      if (!reader.aborted) {
        reader.aborted = true;
        controller.abort();
      }
    };
    return reader;
  }

  /**
   * Returns a promise that resolves when the read stream closes.
   * 
   * @param { stream } stream - read stream
   * @param { fn } onRow - callback
   * @param { object } [options] - optional constructor properties
   */
  static readStream(stream, onRow, options) {
    return new Promise((res, rej) => {
      try {
        let reader = Csvster.reader(options, onRow);
        let pipe = stream.pipe(reader);
        stream.on('error', rej);
        pipe.on('error', rej);
        pipe.on('close', res);
      } catch (e) {
        rej(e);
      }
    });
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
      writer = new stream.Writable({
        objectMode: true,
        signal: controller.signal,
        write: function (chunk, encoding, callback) {
          if (!this.aborted) {
            onRow(csvster.writeRow(chunk), csvster.rowIndex, csvster.charIndex);
          }
          callback();
        }
      });
    } else {
      writer = new stream.Transform({
        writableObjectMode: true,
        signal: controller.signal,
        transform: function (chunk, encoding, callback) {
          if (this.aborted) {
            callback();
          } else {
            callback(null, csvster.writeRow(chunk));
          }
        }
      });
    }
    writer.abort = () => {
      if (!writer.aborted) {
        writer.aborted = true;
        controller.abort();
      }
    };
    return writer;
  }

  /**
   * Returns a promise that resolves when the write stream closes. 
   * 
   * @param { stream } stream - write stream
   * @param { fn } pushRow - callback to accept a row (write null to finish)
   * @param { object } [options] - optional constructor properties
   */
  static writeStream(stream, pushRow, options) {
    return new Promise(async (res, rej) => {
      try {
        let writer = Csvster.writer(options);
        let pipe = writer.pipe(stream);
        stream.on('error', rej);
        pipe.on('error', rej);
        pipe.on('close', res);
        pushRow(row => {
          if (row) {
            if (!writer.write(row)) {
              return new Promise(res => writer.once('drain', res));
            }
          } else {
            writer.end();
          }
        });
      } catch (e) {
        rej(e);
      }
    });
  }
}
Csvster.ERRORS = CsvsterError.CODES;

/* internal */

function throwError(csvster, error) {
  if (error instanceof CsvsterError) {
    error.set(csvster.charIndex, csvster.rowIndex, csvster.charIndex - csvster.lineCharIndex, csvster.lineNum);
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

module.exports = Csvster;
