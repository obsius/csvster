export default function convertRowsToObjs(rows, header) {

	let objs = [];

	if (!header && rows.length) {
		header = rows[0];
		rows = rows.slice(1);
	}

	for (let row of rows) {

		let obj = {};

		for (let i = 0; i < header.length; ++i) {
			obj[header[i]] = row[i];
		}

		objs.push(obj);
	}

	return objs;
}