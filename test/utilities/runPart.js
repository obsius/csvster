export default async function runPart(nameOrfn, fn) {

	let start = Date.now();

	try {
		return await (typeof nameOrfn == 'function' ? nameOrfn() : fn());

	} finally {

		let duration = Date.now() - start;

		if (typeof nameOrfn == 'string') {
			console.log(`↪ ${nameOrfn} [${duration} ms]`);
		} else {
			console.log(`[${duration} ms]`);
		}
	}
}