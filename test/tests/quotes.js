const ROWS = [
	['a', 'b"', '"c', '"d"', 'e"e"e', '"f"f"f"f"', '""g""']
];

export default async function({ Csvster, readFile, runAssert }) {
	let data = readFile('quotes.csv', 'binary');
	await runAssert('', () => Csvster.read(data), ROWS);
}