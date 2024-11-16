const NUM_ROWS = 1000;

export default async function({ Csvster, readStream, writeStream, convertRowsToObjs, writeRandomRows, runAssert, runPart }) {

	let expectedRows = [];

	let outStream = writeStream();

	// write to file for arrays
	await runPart('writing for array', async () => {
		expectedRows = await writeRandomRows(Csvster.writer(), outStream, NUM_ROWS);
	});

	// read as arrays
	await runAssert(
		'reading as array',
		async () => {

			let rows = [];

			let stream = readStream(outStream.path, {
				encoding: 'utf8',
				highWaterMark: 1024
			});

			let pipe = stream.pipe(Csvster.reader());

			pipe.on('error', (e) => { throw e; });
			pipe.on('data', (row) => rows.push(row));

			// wait for finish
			return await new Promise((res, rej) => {
				pipe.on('end', () => {
					res(rows);
				});
			});
		},
		expectedRows
	);

	outStream = writeStream();

	// write to file for objects
	await runPart('writing for objects', async () => {
		expectedRows = convertRowsToObjs(await writeRandomRows(Csvster.writer(), outStream, NUM_ROWS, true));
	});

	// read as objects
	await runAssert(
		'reading as objects',
		async () => {

			let rows = [];

			let stream = readStream(outStream.path, {
				encoding: 'utf8',
				highWaterMark: 1024
			});

			let pipe = stream.pipe(Csvster.reader({
				header: true,
				map: true
			}));

			pipe.on('error', (e) => { throw e; });
			pipe.on('data', (row) => rows.push(row));

			// wait for finish
			return await new Promise((res) => {
				pipe.on('end', () => {
					res(rows);
				});
			});
		},
		expectedRows
	);
}