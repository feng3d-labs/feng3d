import { Compiler } from '../compiler';
import { Processor } from '../processor';
import { isAlpha } from '../string-helper';

declare global
{
	export interface MixinsProcessor
	{
		/**
		 * Add defined objects to a line
		 *
		 * @param line
		 * @param withConst
		 * @param withMacros
		 */
		addDefines(line: string, withConst?: boolean, withMacros?: boolean): string
	}

	export interface MixinsCompiler
	{
		/**
		 * Add defined objects to a line
		 *
		 * @param line
		 * @param withConst
		 * @param withMacros
		 */
		addDefines(line: string, withConst?: boolean, withMacros?: boolean): string
	}
}

Processor.prototype.addDefines
	= Compiler.prototype.addDefines = function (this: Compiler, line: string, withConst?: boolean, withMacros?: boolean)
	{
		// Local variables
		let i1 = -1; let i2: number;
		let d: { count: number; name: string; value: string; };
		let r: { line: string; index: number; };

		// Check if the constant is present in the line
		for (const i in this.defines)
		{
			d = this.defines[i];

			if (d.count !== undefined && withMacros === false)
			{
				continue;
			}
			if (d.count === undefined && withConst === false)
			{
				continue;
			}

			i2 = i.length;
			i1 = -1;

			// It can have the same constant more than one time
			for (; ;)
			{
				// Get the position of the constant (-1 if not present)
				i1 = line.indexOf(i, i1 + 1);
				if (i1 === -1)
				{
					break;
				}

				// Check that the constant isn't in a middle of a word and add the constant if not
				if (isAlpha(line, i1 - 1) || isAlpha(line, i1 + i2))
				{
					continue;
				}

				// Add the macro or the constant
				if (d.count !== undefined)
				{
					r = this.addMacro(line, i1, d);
				}
				else
				{
					r = this.addConstant(line, i1, d);
				}

				line = r.line;
				i1 = r.index;
			}
		}

		return line;
	};
