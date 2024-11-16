const ROWS = [
	['a', 'b', 'c', 'd'],
	['\'1\'', '\'2\'', '\'3\'', '\'4\''],
	[1, 2, 3, 4],
	[1, 2, 3, 4],
	[0.1, -0.1, -.1, -0],
	[1e9, 2e10, 3e-1, 4e5],
	true,
	false
];

export default async function({ Csvster, readFile, runAssert }) {

	let data = readFile('cast.csv', 'binary');

	await runAssert(
		'cast csv',
		() => Csvster.read(data, { cast: true }),
		ROWS,
		true
	);
}