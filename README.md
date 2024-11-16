# Csvster

Quick and simple CSV reader and writer.

## Usage

Most use cases are accomodated by the static class methods, but the class can be instantiated for other cases.

### API

```js
import Csvster from 'csvster';

// static methods (easiest)

// read a buffer or string that is the entirety of the dataset
// onRow is optional
Csvster.read(bufferOrString, options, onRow);

// read from a stream
// onRow is optional
Csvster.reader(options, onRow);

// write rows (array of arrays or objects)
// onRow is optional
Csvster.write(arraysOrObjects, options, onRow);

// write from a stream
// onRow is optional
Csvster.writer(options, onRow);

// class methods (for custom implementations and not normally needed)

// read a buffer or string that is the entirety of the dataset
// optionally each row is passed to onRow
(new Csvster(options)).readAll(bufferOrString, onRow);

// read a buffer or string that is a chunk of the dataset
// optionally each completed row is passed to onRow
(new Csvster(options)).readPartial(bufferOrString, onRow);

// write the header to a string
// optionally provide a header to set it on the object
(new Csvster(options)).writeHeader(header);

// write a row of array or object data
(new Csvster(options)).writeRow(arrayOrObject);

// write rows of array of arrays or objects
// optionally provide a header (or true flag to use the header on the object) to write a header row
// optionally passes each row to onRow
(new Csvster(options)).writeRows(arraysOrObjects, headerOrFlag, onRow);
```

### Options

Option         | Default | Description
---            | ---     | ---
header         | `false` | Array of header names or a true flag indicating to use the first row as a header.
map            | `false` | Map rows to header names.
cast           | `false` | Cast values to their most likely json types (`bool`, `number`, or `string`).
skipEmptyLines | `false` | Skip empty lines (lines with no columns or all empty columns).
keepBom        | `false` | Keep a file `BOM` (byte order mark) in returned rows (if found in file).
delimiter      | `,`     | CSV column delimiter, set to `null` to autodetect.
lineDelimeter  | `\r\n`  | CSV line column delimiter (only used for write mode).

## Examples

```js
import fs from 'fs';
import Csvster from 'csvster';

// read a file
function readFromFile() {
	let data = fs.readFileSync('test.csv', 'utf8');
	let rows = Csvster.read(data, { header: true });
}

// read a file stream
async function fileStreamExample() {
	return new Promise((res, rej) => {

		let rows = [];

		let stream = fs.createReadStream('test.csv', 'utf8');
		let pipe = stream.pipe(Csvster.reader());

		stream.on('error', rej);
		pipe.on('error', rej);

		pipe.on('data', (row) => rows.push(row));
		pipe.on('done', () => res(rows));
	});
}

// read a file stream (callback)
async function fileStreamExample() {
	return new Promise((res) => {

		let rows = [];

		let stream = fs.createReadStream('filename.csv', 'utf8');
		stream.pipe(Csvster.reader(undefined, (row) => {
			if (row == null) {
				res(rows);
			} else {
				rows.push(row);
			}
		}));
	});
}

// write array or arrays
function writeArrays() {
	let data = [['a', 'b', 'c'], [1, 2, 3], [4, 5, 6]];
	fs.writeFileSync('filename.csv', Csvster.write(data));
}

// write array of objects
function writeObjects() {
	let data = [{ a: 1, b: 2, c: 3 }, { a : 4, b: 5, c: 6 }];
	fs.writeFileSync('filename.csv', Csvster.write(data));
}

// write a stream
async function writeStream() {
	return new Promise((res, rej) => {

		let stream = fs.createWriteStream('filename.csv', 'utf8');
		let data = [['a', 'b', 'c'], [1, 2, 3], [4, 5, 6]];

		let writer = Csvster.writer();
		let pipe = writer.pipe(stream);

		writer.on('error', rej);
		stream.on('error', rej);

		for (let row of data) {
			writer.push(row);
		}

		writer.end(() => res());
	});
}
```

## Benchmarks

Reading a stream of semi-randomized data set of `10 cols` x `1M rows`.  
All packages initialized with their respective defaults.  
Row data contains strings, escaped strings, numbers, and booleans.  
Benchmark code can be found in `test/tests/benchmarks.js`.

NPM Package    | Time
---            | ---
csvster        | 2,558 ms
papaparse      | 2,846 ms
csv-parser     | 5,912 ms
csv-parse      | 6,281 ms
fast-csv       | 12,614 ms

## Contributing

Feel free to make changes and submit pull requests whenever.

## License

Csvster uses the [MIT](https://opensource.org/licenses/MIT) license.