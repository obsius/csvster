const ROWS = [
	['a', 'b', 'c', 'd'],
	['', '', '', ''],
	[1, 2, 3, 4],
	[''],
	['aa', 'bb', 'cc', 'dd']
];

export default async function({ Csvster, readFile, runAssert }) {

	let data = readFile('empty.csv', 'utf8');

	await runAssert(
		'empty file without line skipping',
		() => Csvster.read(data),
		[]
	);

	await runAssert(
		'empty file with line skipping',
		() => Csvster.read(data, { skipEmptyLines: true }),
		[]
	);

	data = readFile('empty-lines.csv', 'utf8');

	await runAssert(
		'empty lines',
		() => Csvster.read(data, { skipEmptyLines: true }),
		[
			ROWS[0],
			ROWS[2],
			ROWS[4]
		]
	);
}