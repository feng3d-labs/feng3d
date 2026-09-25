import { path } from '../path/Path';
import { Compiler } from './compiler';

declare global
{
	export interface MixinsProcessor { }
}

export interface Processor extends MixinsProcessor { }

export class Processor
{
	parent: Compiler;
	fs: { readFile: (path: string, encoding: 'utf8', callback: (err: Error, code: string) => void) => void };
	options: {
		includeSpaces: number;
		emptyLinesLimit: number;
		basePath: string;
		stopOnError: boolean;
		enumInHex: boolean;
		filename: string;
		commentEscape: boolean;
		newLine: string;
		constants: {};
		macros: {};
	};
	defines: { count: number; name: string; value: string; }[];
	stack: {};
	running: boolean;
	code: string;
	result: string;
	emptyLines: number;
	currentLine: number;
	linesCount: number;
	currentFile: string;
	path: string;
	nextLine: () => string;
	onsuccess: () => void;

	constructor(parent: Compiler, code: string)
	{
		// Parent compiler
		this.parent = parent;
		this.fs = parent.fs;
		this.options = parent.options;

		// List of defined macros/constants & stack
		this.defines = parent.defines;
		this.stack = parent.stack;

		// Is the processor running ?
		this.running = false;

		// Code & result text
		this.code = code;
		this.result = '';

		// Number of empty lines
		this.emptyLines = 0;

		// Current line & file
		this.currentLine = 0;
		this.currentFile = this.options.filename || 'main';
		this._compConst('FILE', this.currentFile);

		// Current path
		const p = path.dirname(this.currentFile);
		this.path = (p === '.') ? '' : `${p}/`;

		// Bind some functions
		this.parseNext = this.parseNext.bind(this);
		this.next = this.next.bind(this);
	}

	/**
	 * Run the processor
	 */
	run()
	{
		// Set the processor as running
		this.running = true;

		// Get an array of all lines
		const lines = this.code.split(/\r?\n/);
		this.linesCount = lines.length;

		// Return the next line
		const nextLine = () =>
		{
			this._compConst('LINE', this.currentLine + 1);

			return lines[this.currentLine++];
		};

		this.nextLine = nextLine;

		// Parse the first line
		this.next();
	}

	/**
	 * Parse the next lines (doing it synchronously until an asynchronous command)
	 */
	next()
	{
		let running = true;
		while (this.running && running && this.currentLine < this.linesCount)
		{
			running = (this.parseNext() !== false);
		}

		if (this.running && running && this.currentLine >= this.linesCount)
		{
			this.success();
		}
	}

	/**
	 * Append a line to the result
	 *
	 * @param line
	 */
	addLine(line: string)
	{
		this.result += line + this.options.newLine;
		this.emptyLines = 0;
	}

	/**
	 * Emit an error
	 *
	 * @param msg
	 * @returns
	 */
	error(msg: string)
	{
		if (this.options.stopOnError)
		{
			this.running = false;
		}

		msg = `(line ${this.currentLine} in "${this.currentFile}") ${msg}`;
		this.parent.error(msg);

		return !this.options.stopOnError;
	}

	// Emit the success
	success()
	{
		this.running = false;

		if (this.onsuccess)
		{
			this.onsuccess();
		}
		else
		{
			this.parent.success(this.result);
		}
	}
}
