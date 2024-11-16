const ROWS = [
	'apple',
	'apple',
	'apple',
	['apple', 'apple ', ' apple', ' apple ', 'apple'],
	['a pple', 'ap ple', 'app le', 'appl e' ,'apple'],
	['a pple', 'ap ple', 'app le', 'appl e' ,'apple'],
	1,
	9.99,
	true,
	false
];

export default async function({ Csvster, readFile, runAssert }) {
	let data = readFile('parse.csv', 'binary');
	await runAssert('', () => Csvster.read(data), ROWS);
}