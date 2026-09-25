import { Compiler } from '../compiler';
import { Processor } from '../processor';
import { splice } from '../string-helper';

declare global
{
	export interface MixinsProcessor
	{
		/**
		 * Create a constant
		 */
		createConstant(name: string, value: string, addDefines?: boolean): void

		/**
		 * Set a compiler constant
		 *
		 * @param name
		 * @param value
		 */
		_compConst(name: string, value: string | number): void;

		/**
		 * Add a constant in a line
		 */
		addConstant(line: string, i: number, constant: { name: string; value: string; }): { line: string; index: number; }
	}

	export interface MixinsCompiler
	{
		/**
		 * Create a constant
		 */
		createConstant(name: string, value: string, addDefines?: boolean): void

		/**
		 * Set a compiler constant
		 *
		 * @param name
		 * @param value
		 */
		_compConst(name: string, value: string | number): void;

		/**
		 * Add a constant in a line
		 */
		addConstant(line: string, i: number, constant: { name: string; value: string; }): { line: string; index: number; }
	}
}

Processor.prototype.createConstant
	= Compiler.prototype.createConstant = function (this: Compiler, name: string, value: string, addDefines: boolean)
	{
		// Add constants value to the constant value
		if (addDefines !== false)
		{
			value = this.addDefines(value);
		}

		// Store the constant
		this.defines[name] = {
			name,
			value
		};
	};

Processor.prototype._compConst
	= Compiler.prototype._compConst = function (this: Compiler, name: string, value: any)
	{
		this.createConstant(`__${name}__`, value, false);
	};

Processor.prototype.addConstant
	= Compiler.prototype.addConstant = function (line: string, i: number, constant: { name: string, value: string })
	{
		line = splice(line, i, constant.name.length, constant.value);
		i += constant.value.length;

		return { line, index: i };
	};
