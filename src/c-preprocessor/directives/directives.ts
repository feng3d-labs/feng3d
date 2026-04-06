import { Processor } from '../processor';

// List of all directives
export const Directives: { [name: string]: any } = {};

// Create a directive
export function createDirective(name: string, fn: (this: Processor, text: string, called: boolean) => any)
{
	Directives[name] = fn;
}
