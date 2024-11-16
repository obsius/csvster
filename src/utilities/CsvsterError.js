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

export default class CsvsterError extends Error {

	constructor(code, subError, tempOffset) {

		super(MESSAGES[code]);

		this.code = code;

		if (subError) { this.subError = subError; }
		if (tempOffset) { this.tempOffset = tempOffset; }
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