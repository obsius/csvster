const ROWS = [
	['A', 'B', 'C', 'D', 'E'],
	['a', 'b', '\ufeffc', 'd', 'e'],
	[1, 2, 3, 4, 5]
];

export default async function({ Csvster, readFile, runAssert }) {

	let data = readFile('bom-utf8.csv', 'utf8');

	await runAssert(
		'utf8 remove bom',
		() => Csvster.read(data),
		ROWS
	);

	await runAssert(
		'utf8 keep bom',
		() => Csvster.read(data, { keepBom: true }),
		insertLeadingChar(ROWS, '\ufeff')
	);

	data = readFile('bom-utf16le.csv', 'utf16le');

	await runAssert(
		'utf16le remove bom',
		() => Csvster.read(data),
		ROWS
	);

	await runAssert(
		'utf16le keep bom',
		() => Csvster.read(data, { keepBom: true }),
		insertLeadingChar(ROWS, '\ufeff')
	);
}

/* internal */

function insertLeadingChar(rows, char = '') {

	rows = clone(rows);

	if (rows.length && rows[0].length) {
		rows[0][0] = '' + char + rows[0][0];
	}

	return rows;
}

function clone(obj) {
	if (typeof obj == 'object' && obj != null) {
		if (Array.isArray(obj)) {

			let retArray = [];

			for (let element of obj) {
				retArray.push(clone(element));
			}

			return retArray;

		} else {

			let retObj = {};

			for (let key in obj) {
				retObj[key] = clone(obj[key]);
			}

			return retObj;
		}
	} else {
		return obj;
	}
}