const ROWS = [
	['a', 'b', 'c', 'd', 'e', 'f'],
	['a', 'b', 'c', 'd', 'e', 'f'],
	['a', 'b\t', '\tc', '\td\t', ' \te', ' f '],
	[1, 2, 3, 4, 5, 6],
	[true, false, true, false, true, false],
	[false, true, false, true, false, true]
];

export default async function({ Csvster, readFile, runAssert }) {

	let data = readFile('tabs.csv', 'binary');

	await runAssert(
		'delimiter provided',
		() => Csvster.read(data, { delimiter: '\t' }),
		ROWS
	);

	await runAssert(
		'autodetect',
		() => Csvster.read(data, { delimiter: null }),
		ROWS
	);
}