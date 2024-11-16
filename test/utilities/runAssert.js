import runPart from './runPart';

export default async function runAssert(name, fn, expectedRowsOrErrorCode, checkTypes = false) {

	let errors = [];
	let expectedError = typeof expectedRowsOrErrorCode == 'string';

	let rows;

	try {

		rows = await runPart(name, fn);

		// expected error but got rows
		if (expectedError) {
			errors.push([null, null, `Got rows but expected error "${expectedRowsOrErrorCode.message}"`]);

		// exected rows
		} else {

			if (rows.length > expectedRowsOrErrorCode.length) {
				errors.push([null, null, 'too many rows']);
			} else if (rows.length < expectedRowsOrErrorCode.length) {
				errors.push([null, null, 'missing rows']);
			}

			if (!errors.length) {
				for (let i = 0; i < rows.length; ++i) {

					let uniformExpected = typeof expectedRowsOrErrorCode[i] != 'object';
					let keys = Object.keys(rows[i]);

					for (let j = 0; j < keys.length; ++j) {

						let key = keys[j];
						let actual = rows[i][key];
						let expected = uniformExpected ? expectedRowsOrErrorCode[i] : expectedRowsOrErrorCode[i][key];

						if (checkTypes ? actual !== expected : actual !== '' + expected) {
							errors.push([i, j, `Mismatch: got "${actual}" expected "${expected}"`]);
						}
					}
				}
			}
		}

	// check error
	} catch (e) {

		// expected error
		if (expectedError) {

			// exception error not expected
			if  (e.code != expectedRowsOrErrorCode) {
				errors.push([null, null, `Got error "${e.code}" but expected error "${expectedRowsOrErrorCode}"`]);
			}

		// unknown error
		} else {
			throw e;
		}
	}

	for (let error of errors) {
		if (error[0] == null) {
			console.log(`Error: ${error[2]}`);
		} else if (error[1] == null) {
			console.log(`[line: ${error[0] + 1}]: ${error[2]}`);
		} else {
			console.log(`[line: ${error[0] + 1}, col: ${error[1] + 1}]: ${error[2]}`);
		}
	}

	return errors;
}