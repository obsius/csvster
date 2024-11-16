import { CARRIAGE_RETURN, NEWLINE, SPACE, TAB, QUOTE, DOUBLE_QUOTE } from '../constants';
import CsvsterError from './CsvsterError';

export default function read(bufferOrString, delimiter, onRow) {

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

						onRow(parts);

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