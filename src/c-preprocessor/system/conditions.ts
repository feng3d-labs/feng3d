import { Directives } from '../directives/directives';
import { Processor } from '../processor';

declare global
{
	export interface MixinsProcessor
	{
		/**
		 * Go to the next #elif, #else or #endif
		 */
		conditionNext(end?: boolean): void

		/**
		 * Call a #else or #elif condition
		 */
		callCondition(text: string): void

		/**
		 * Go to the end of the condtion (#endif)
		 */
		conditionEnd(): void
	}
}

Processor.prototype.conditionNext = function (this: Processor, end: boolean)
{
	// #if directives to start a condition
	const ifCmd = ['if', 'ifdef', 'ifndef'];

	// #else directives
	const elseCmd = ['elif', 'else'];

	// Local variables
	let line: string;
	let s: string;
	let n = 1;

	// Count unexploited conditions
	while (this.currentLine < this.linesCount)
	{
		line = this.nextLine().trimLeft();
		if (line[0] !== '#')
		{
			continue;
		}

		s = line.substr(1).trimLeft().split(' ')[0];

		if (ifCmd.indexOf(s) !== -1)
		{
			n++;
		}

		else if (!end && n === 1 && elseCmd.indexOf(s) !== -1)
		{
			return this.callCondition(line);
		}

		else if (s === 'endif')
		{
			n--;
			if (n === 0)
			{
				return;
			}
		}
	}
};

Processor.prototype.callCondition = function (this: Processor, text: string)
{
	// Get the directive name
	const split = text.substr(1).trimStart().split(' ');
	const name = split[0];

	// Get the remaining text (without the # directive)
	split.shift();
	text = split.join(' ').trimStart();

	// Call the corresponding directive
	Directives[name].call(this, text, true);
};

Processor.prototype.conditionEnd = function (this: Processor)
{
	this.conditionNext(true);
};
