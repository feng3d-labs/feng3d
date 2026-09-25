import { Processor } from '../processor';

declare global
{
	export interface MixinsProcessor
	{
		/**
		 * Save the current value of a macro on top of the stack
		 *
		 * @param name
		 */
		pushMacro(name: string): boolean

		/**
		 * Set current value of the specified macro to previously saved value
		 *
		 * @param name
		 */
		popMacro(name: string): boolean
	}
}

Processor.prototype.pushMacro = function (this: Processor, name: string)
{
	if (this.defines[name] === undefined)
	{
		return this.error(`macro ${name} is not defined, cannot push it`);
	}

	if (this.stack[name] === undefined)
	{
		this.stack[name] = [];
	}

	this.stack[name].push(this.defines[name]);
};

Processor.prototype.popMacro = function (this: Processor, name: string)
{
	if (this.stack[name] === undefined || this.stack[name].length === 0)
	{
		return this.error(`stack for macro ${name} is empty, cannot pop from it`);
	}

	this.defines[name] = this.stack[name].pop();
};
