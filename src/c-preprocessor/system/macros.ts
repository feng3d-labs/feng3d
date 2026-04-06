import { Compiler } from '../compiler';
import { Processor } from '../processor';
import { isAlpha, splice } from '../string-helper';

declare global
{
	export interface MixinsProcessor
	{
		/**
		 * Create a macro (text must have the macro arguments, like this: '(a,b) a+b')
		 *
		 * @param name
		 * @param text
		 */
		createMacro(name: string, text: string): void

		/**
		 * Read a line and transform macro by adding their value
		 *
		 * @param line
		 * @param i
		 * @param macro
		 */
		addMacro(line: string, i: number, macro: { name: string; count: number; content?: string[]; pos?: number[]; }): { line: string; index: number; }
	}

	export interface MixinsCompiler
	{
		/**
		 * Create a macro (text must have the macro arguments, like this: '(a,b) a+b')
		 *
		 * @param name
		 * @param text
		 */
		createMacro(name: string, text: string): void

		/**
		 * Read a line and transform macro by adding their value
		 *
		 * @param line
		 * @param i
		 * @param macro
		 */
		addMacro(line: string, i: number, macro: { name: string; count: number; content?: string[]; pos?: number[]; }): { line: string; index: number; }
	}
}

Processor.prototype.createMacro
	= Compiler.prototype.createMacro = function (this: Compiler, name: string, text: string)
	{
		// First, get macro arguments
		const args: string[] = [];

		const end = text.indexOf(')');
		let i1 = 1;
		let i2 = 0;

		// If there is no closing parenthesis
		if (end === -1)
		{
			this.error(`no closing parenthesis in the #define of marcro ${name}`);

			return;
		}

		// Get arguments
		while ((i2 = text.indexOf(',', i2 + 1)) !== -1 && i2 < end)
		{
			args.push(text.substring(i1, i2).trim());
			i1 = i2 + 1;
		}

		if (end > i1) // If there is at least one argument.
		{
			args.push(text.substring(i1, end));
		}

		// Remove arguments in the text
		text = text.substr(end + 1).trimLeft();

		// Execute defined macros
		text = this.addDefines(text, false, true);

		// Secondly, makes breaks and store variables positions
		const breaks: number[][] = [];

		for (let i = 0, l = args.length, p; i < l; i++)
		{
			i1 = -1;
			p = args[i];
			i2 = p.length;

			for (; ;)
			{
				i1 = text.indexOf(p, i1 + 1);
				if (i1 === -1)
				{
					break;
				}

				if (isAlpha(text, i1 - 1) || isAlpha(text, i1 + i2))
				{
					continue;
				}

				breaks.push([i1, i, i2]);
			}
		}

		// Sort variables in order of their positions in the macro text
		breaks.sort(function (a, b)
		{
			return a[0] - b[0];
		});

		// Thirdly, cut the text into parts without variable and add defined constants
		let offset = 0;
		const content: string[] = [];
		const pos: number[] = [];
		let i = 0;

		for (; i < breaks.length; i++)
		{
			content[i] = this.addDefines(text.slice(offset, breaks[i][0]), true, false);
			offset = breaks[i][0] + breaks[i][2];
			pos[i] = breaks[i][1];
		}

		content[i] = this.addDefines(text.slice(offset));

		// Fourthly, store the macro
		this.defines[name] = {
			content,
			count: args.length,
			pos,
			name
		};
	};

Processor.prototype.addMacro
	= Compiler.prototype.addMacro = function (this: Compiler, line: string, i: number, macro: { name: string, count: number, content?: string[], pos?: number[] })
	{
		// Local variables
		let m = 0;
		let e = i + macro.name.length;
		let s = e;
		const args: string[] = [];

		// Get arguments between parenthesis (by counting parenthesis)
		for (let v: string, l = line.length; e < l; e++)
		{
			v = line[e];

			if (v === '(')
			{
				m++;
				if (m === 1)
				{
					s = e + 1;
				}
			}

			else if (v === ',' && m === 1)
			{
				args.push(line.slice(s, e));
				s = e + 1;
			}

			else if (v === ')')
			{
				if (m === 1)
				{
					break;
				}
				m--;
			}

			else if (v !== ' ' && m === 0)
			{
				this.error(`there is no openning parenthesis for macro ${macro.name}`);

				return;
			}
		}

		// If the closing parenthesis is missing
		if (m !== 1)
		{
			this.error(`the closing parenthesis is missing for macro ${macro.name}`);

			return;
		}

		// Add the last argument.
		const lastarg = line.slice(s, e);
		if (lastarg.trim())
		{
			args.push(lastarg);
		}

		// Check if there is the right number of arguments
		if (args.length > macro.count)
		{
			this.error(`too many arguments for macro ${macro.name}`);

			return;
		}

		if (args.length < macro.count)
		{
			this.error(`too few arguments for macro ${macro.name}`);

			return;
		}

		// Execute 'addDefines' on each argument
		for (let j = 0; j < macro.count; j++)
		{
			args[j] = this.addDefines(args[j]);
		}

		// Replace macro variables with the given arguments
		let str = macro.content[0];

		for (let s = 0, l = macro.pos.length; s < l; s++)
		{
			str += args[macro.pos[s]] + macro.content[s + 1];
		}

		// Add the result into the line
		line = splice(line, i, e - i + 1, str);
		i += str.length;

		return { line, index: i };
	};
