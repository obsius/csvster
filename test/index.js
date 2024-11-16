import { createReadStream, createWriteStream, readFileSync, rmSync } from 'fs';
import path from 'path';

import Csvster from '../src';
import convertRowsToObjs from './utilities/convertRowsToObjs';
import runAssert from './utilities/runAssert';
import runPart from './utilities/runPart';
import writeRandomRows from './utilities/writeRandomRows';

import bom from './tests/bom';
import benchmarks from './tests/benchmarks';
import cast from './tests/cast';
import empty from './tests/empty';
import errors from './tests/errors';
import headers from './tests/headers';
import newline from './tests/newline';
import parse from './tests/parse';
import quotes from './tests/quotes';
import stream from './tests/stream';
import tabs from './tests/tabs';

const DATA_PATH = 'test/data';

let filenames = [];

(async function() {
	try {

		console.log('Testing...\n');

		let start = Date.now();

		// run benchmarks
		if (process.argv.length > 2 && process.argv[2] == '--benchmarks') {
			await run(benchmarks, 'benchmarks', { filename: process.argv.length > 3 ? process.argv[3] : undefined });

		// run tests
		} else {
			await run(parse, 'parse');
			await run(quotes, 'quotes');
			await run(empty, 'empty');
			await run(newline, 'newline');
			await run(tabs, 'tabs');
			await run(cast, 'cast');
			await run(headers, 'headers');
			await run(bom, 'bom');
			await run(stream, 'stream');
			await run(errors, 'errors');
		}

		console.log(`Done [${Date.now() - start} ms]`);

	} catch (e) {
		console.error('Error: ', e);

	} finally {

		// cleanup
		for (let filename of filenames) {
			try {
				rmSync(filename);
			} catch (e) {}
		}
	}
})();

/* internal */

async function run(fn, name, extra = {}) {
	console.log(`Running ${name}...`);
	await fn({ Csvster, readFile, readStream, writeStream, convertRowsToObjs, writeRandomRows, runAssert, runPart, ...extra });
	console.log();
}

function readFile(filename, encoding) {
	return readFileSync(path.join(DATA_PATH, filename), encoding);
}

function readStream(filename, options, dataDir = false) {
	let filepath = dataDir ? path.join(DATA_PATH, filename) : filename;
	return createReadStream(filepath, options);
}

function writeStream() {
	let filename = `${Date.now()}.tmp.csv`;
	filenames.push(filename);
	return createWriteStream(filename);
}