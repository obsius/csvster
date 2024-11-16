const WRITE_TIMEOUT = 5000;

const PARTS = [
	'alpha',
	'beta',
	'"ga mma"',
	'delta ',
	1,
	0,
	'"9.99"',
	(seed) => Math.floor(seed * 100),
	(seed) => (seed - .5) * 100,
	(seed) => seed > .5
];

export default function writeRandomRows(writer, stream, numRows = 0, header = false) {
	return new Promise((res, rej) => {
		try {

			let expectedRows = [];

			stream.on('error', rej);

			writer.pipe(stream);

			for (let i = 0; i < numRows; ++i) {

				let row = generateRow(PARTS.length, i == 0 && header);

				expectedRows.push(row);
				writer.write(row);
			}

			let timeout = setTimeout(() => {

				writer.destroy();
				stream.destroy();

				rej('Write timeout');

			}, WRITE_TIMEOUT);

			writer.end(() => {
				clearTimeout(timeout);
				res(expectedRows);
			});
		} catch (e) {
			rej(e);
		}
	});
}

/* internal */

function generateRow(numParts = 0, incrementingLetters = false) {

	let parts = [];

	for (let i = 0; i < numParts; ++i) {

		// incrementing letters
		if (incrementingLetters) {
			parts.push(String.fromCharCode(65 + i));

		// semi-random data
		} else {

			let part = PARTS[i % PARTS.length];

			if (typeof part == 'function') {
				parts.push(part(Math.random()));
			} else {
				parts.push(part);
			}
		}
	}

	return parts;
}