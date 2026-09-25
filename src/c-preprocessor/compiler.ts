import { defaultFS, IFS } from './fs';
import { Processor } from './processor';
import { EventEmitter } from '../event/EventEmitter';

declare global
{
	export interface MixinsCompiler { }
}

export interface Compiler extends MixinsCompiler { }

export class Compiler extends EventEmitter
{
	fs: IFS;
	options: {
		includeSpaces: number;
		emptyLinesLimit: number;
		basePath: string;
		stopOnError: boolean;
		enumInHex: boolean;
		filename: any;
		commentEscape: boolean;
		newLine: string;
		constants: {};
		macros: {};
	};
	defines: { count: number; name: string; value: string; }[];
	stack: {};
	includeOnce: {};

	constructor(opt: {
		includeSpaces?: number;
		emptyLinesLimit?: number;
		basePath?: string;
		stopOnError?: boolean;
		enumInHex?: boolean;
		filename?: any;
		commentEscape?: boolean;
		newLine?: string;
		constants?: {};
		macros?: {};
	}, fs = defaultFS)
	{
		super();

		this.fs = fs;
		// Options object
		this.options = {} as any;
		this.options.newLine = '\n';
		this.options.commentEscape = true;
		this.options.includeSpaces = 0;
		this.options.emptyLinesLimit = 0;
		this.options.basePath = './';
		this.options.stopOnError = true;
		this.options.enumInHex = true;

		// Apply options
		opt = opt || {};
		for (const i in opt)
		{
			this.options[i] = opt[i];
		}

		// List of defined macros/constants
		this.defines = {} as any;

		// Stack for macros/constants
		this.stack = {};

		// List of #pragma once
		this.includeOnce = {};

		// Global constants
		const date = new Date();
		this._compConst('TIME', date.toLocaleTimeString());
		this._compConst('DATE', date.toLocaleDateString());
		this._compConst('LINE', '0');
		this._compConst('FILE', 'main');

		// User defined constants
		const c = opt.constants || {};
		for (const i in c)
		{
			this.createConstant(i, c[i].toString(), false);
		}

		// User defined macros
		const m = opt.macros || {};
		for (const i in m)
		{
			this.createMacro(i, m[i]);
		}
	}

	/**
	 * Compile a text code
	 *
	 * @param code
	 * @param filename
	 */
	compile(code: string, filename?: string)
	{
		if (filename)
		{
			this.options.filename = filename;
		}

		const processor = new Processor(this, code);
		processor.run();
	}

	/**
	 * Compile a file
	 *
	 * @param file
	 */
	compileFile(file: string)
	{
		this.fs.readFile(this.options.basePath + file, 'utf8', (err, code) =>
		{
			if (err)
			{
				return this.error(`can't read file "${file}"`);
			}

			this.options.filename = file;

			const processor = new Processor(this, code);
			processor.run();
		});
	}

	/**
	 * Emit an error
	 *
	 * @param text
	 */
	error(text: string)
	{
		this.emit('error', text);
	}

	/**
	 * Emit a success
	 *
	 * @param code
	 */
	success(code: string)
	{
		this.emit('success', code);
	}
}

