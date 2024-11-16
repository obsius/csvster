import read from './read';

const SAMPLE_LENGTH = 2048;

const DELIMITERS = [',', ';', '\t', '\s'];

export default function detect(bufferOrString) {

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

		read(buffer, delimiter, (row) => rows.push(row));

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
				score += (row[i].length - (parts[i] / length)) ** 2;
			}
		}

		return (score / length) ** .5;

	} catch (e) {
		return Number.POSITIVE_INFINITY;
	}
}