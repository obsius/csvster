export default async function({ Csvster, runAssert }) {

	await runAssert(
		'read duplicate headers',
		() => Csvster.read('a,b,c,a\n1,2,3,4\n', { header: true }),
		Csvster.ERRORS.DUPLICATE_HEADERS
	);

	await runAssert(
		'read untermianted quotes',
		() => Csvster.read('a,b,c,d\n,"a","b,c,d\n'),
		Csvster.ERRORS.UNTERMINATED_QUOTES
	);

	await runAssert(
		'read missing columns',
		() => Csvster.read('a,b,c,d\n1,2,3\n'),
		Csvster.ERRORS.MISSING_COLUMNS
	);

	await runAssert(
		'read too many columns',
		() => Csvster.read('a,b,c,d\n,1,2,3,4,5\n'),
		Csvster.ERRORS.EXTRA_COLUMNS
	);

	await runAssert(
		'write duplicate headers',
		() => Csvster.write([
				[1, 2, 3, 4]
			], {
				header: ['a', 'b', 'c', 'a']
			}
		),
		Csvster.ERRORS.DUPLICATE_HEADERS
	);

	await runAssert(
		'write missing columns',
		() => Csvster.write([
			['a', 'b', 'c', 'd'],
			[1, 2, 3]
		]),
		Csvster.ERRORS.MISSING_COLUMNS
	);

	await runAssert(
		'write extra columns',
		() => Csvster.write([
			['a', 'b', 'c', 'd'],
			[1, 2, 3, 4, 5]
		]),
		Csvster.ERRORS.EXTRA_COLUMNS
	);
}