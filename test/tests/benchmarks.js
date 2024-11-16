const NUM_ROWS = 1000000;
const WAIT_TIMEOUT = 2000;

// install and uncomment to run benchmarks on other csv parsers
// npm install -D csv-parse csv-parser fast-csv papaparse
// import csvParse from 'csv-parse';
// import csvParser from 'csv-parser';
// import * as fastCsv from 'fast-csv';
// import papaparse from 'papaparse';

export default async function({ Csvster, readStream, writeStream, writeRandomRows, runPart, filename }) {

	// write to file
	if (!filename) {

		let stream = writeStream();

		await runPart('writing', async () => {
			await writeRandomRows(Csvster.writer(), stream, NUM_ROWS);
		});

		filename = stream.path;

	}

	await wait();

	// csvster
	await runPart('csvster', async () => {

		let rows = [];

		let stream = readStream(filename, 'utf8');

		let pipe = stream.pipe(Csvster.reader());

		pipe.on('error', (e) => { throw e; });
		pipe.on('data', (row) => rows.push(row));

		// wait for finish
		return await new Promise((res) => {
			pipe.on('end', res);
		});
	});

	// papaparse
	if (typeof papaparse != 'undefined') {

		await wait();

		await runPart('papaparse', async () => {

			let rows = [];

			let stream = readStream(filename, 'utf8');

			let pipe = stream.pipe(papaparse.parse(1));

			pipe.on('error', (e) => { throw e; });
			pipe.on('data', (row) => rows.push(row));

			// wait for finish
			return await new Promise((res) => {
				pipe.on('end', res);
			});
		});
	}

	// csv parser
	if (typeof csvParser != 'undefined') {

		await wait();

		await runPart('csv-parser', async () => {

			let rows = [];

			let stream = readStream(filename, 'utf8');

			let pipe = stream.pipe(csvParser());

			pipe.on('error', (e) => { throw e; });
			pipe.on('data', (data) => rows.push(data));

			// wait for finish
			return await new Promise((res) => {
				pipe.on('end', res);
			});
		});
	}

	// csv parse
	if (typeof csvParse != 'undefined') {

		await wait();

		await runPart('csv-parse', async () => {

			let rows = [];

			let stream = readStream(filename, 'utf8');

			let pipe = stream.pipe(csvParse.parse());

			pipe.on('error', (e) => { throw e; });
			pipe.on('data', (data) => rows.push(data));

			// wait for finish
			return await new Promise((res) => {
				pipe.on('end', res);
			});
		});
	}

	// fast csv
	if (typeof fastCsv != 'undefined') {

		await wait();

		await runPart('fast-csv', async () => {

			let rows = [];

			let stream = readStream(filename, 'utf8');

			let pipe = stream.pipe(fastCsv.parse());

			pipe.on('error', (e) => { throw e; });
			pipe.on('data', (data) => rows.push(data));

			// wait for finish
			return await new Promise((res) => {
				pipe.on('end', res);
			});
		});
	}
}

/* internal */

function wait() {
	return new Promise((res) => {
		setTimeout(res, WAIT_TIMEOUT);
	});
}