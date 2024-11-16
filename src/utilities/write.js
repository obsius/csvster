import { DEFUALT_DELIM, DEFAULT_LINE_DELIM, QUOTE, DOUBLE_QUOTE, REGEX_QUOTE } from '../constants';
import CsvsterError from './CsvsterError';

export default function write(array, delimiter = DEFUALT_DELIM, lineDelimiter = DEFAULT_LINE_DELIM) {

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