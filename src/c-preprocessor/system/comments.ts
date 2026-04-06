import { Processor } from '../processor';

declare global
{
	export interface MixinsProcessor
	{
		/**
		 * Go to the end of a multilines comment
		 */
		commentEnd(): void
	}
}

Processor.prototype.commentEnd = function (this: Processor)
{
	this.currentLine--;
	let line: string | string[];

	// Find the end of the comment
	while (this.currentLine < this.linesCount)
	{
		line = this.nextLine();

		if (line.indexOf('*/') !== -1)
		{
			break;
		}
	}
};
