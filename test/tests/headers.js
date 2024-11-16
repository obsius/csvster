const ROWS = [
	['a', 'b', 'c c', 'dee', 'e e'],
	['a', 'b', 'c', 'd', 'e'],
	[1, 2, 3, 4, 5],
	[-1, -2, -3, -4, -5],
	[true, false, true, false, true],
	[false, true, false, true, false]
];

const HEADER = ['A', 'B', 'C', 'D', 'E'];

export default async function({ Csvster, readFile, convertRowsToObjs, runAssert }) {

	let data = readFile('headers.csv', 'binary');

	await runAssert(
		'without header',
		() => Csvster.read(data),
		ROWS
	);

	await runAssert(
		'with data header',
		() => Csvster.read(data, { header: true }),
		ROWS.slice(1)
	);

	await runAssert(
		'with data header as map',
		() => Csvster.read(data, { header: true, map: true }),
		convertRowsToObjs(ROWS)
	);

	await runAssert(
		'with provided header as map',
		() => Csvster.read(data, { header: HEADER, map: true }),
		convertRowsToObjs(ROWS, HEADER)
	);
}