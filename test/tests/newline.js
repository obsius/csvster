const ROWS = [
	['a', 'b', 'c', 'd'],
	[1, 2, 3, 4]
];

export default async function({ Csvster, readFile, readStream, runAssert }) {

	let data = readFile('newline.csv', 'utf8');

	await runAssert(
		'as file string',
		() => Csvster.read(data),
		ROWS
	);

	await runAssert(
		'as file stream',
		async () => {

			let rows = [];

			let stream = readStream('newline.csv', 'utf8', true);

			let pipe = stream.pipe(Csvster.reader());

			pipe.on('error', (e) => { throw e; });
			pipe.on('data', (row) => rows.push(row));

			// wait for finish
			return await new Promise((res) => {
				pipe.on('end', () => {
					res(rows);
				});
			});
		},
		ROWS
	);
}