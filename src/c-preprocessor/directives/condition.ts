import { createDirective, Directives } from './directives';

// #if directive
// See README to know how to use this directive
createDirective('if', function (expr: string)
{
	// Exectute 'defined' function
	expr = expr.replace(/defined\s*\(\s*([\s\S]+?)\s*\)/g,
		(_match, p1) => (this.defines[p1] === undefined ? 'false' : 'true'));

	// Replace constants by their values
	expr = this.addDefines(expr);

	// Evaluate the expression
	let r: boolean;
	try
	{
		// eslint-disable-next-line no-new-func
		r = Function(`"use strict";return (${expr})`)();
	}
	catch (e)
	{
		return this.error('error when evaluating #if expression');
	}

	// If the expr is 'false', go to the next #elif, #else or #endif
	if (!r)
	{
		this.conditionNext();
	}
});

// #ifdef directive (note: '#ifdef VARIABLE' is faster than '#if defined(VARIABLE)')
createDirective('ifdef', function (text: string)
{
	// Get the constant/macro name
	const name = text.split(' ')[0];

	// Check if the constant/macro exists
	if (this.defines[name] === undefined)
	{
		this.conditionNext();
	}
});

// #ifndef directive (note: '#ifndef VARIABLE' is faster than '#if !defined(VARIABLE)')
createDirective('ifndef', function (text: string)
{
	// Get the constant/macro name
	const name = text.split(' ')[0];

	// Check if the constant/macro doesn't exist
	if (this.defines[name] !== undefined)
	{
		this.conditionNext();
	}
});

// #elif directive
createDirective('elif', function (expr: string, called)
{
	// If this directive wasn't callaed by 'this.callCondition'
	if (!called)
	{
		return this.conditionEnd();
	}

	// Else: execute this directive as an #if directive
	Directives.if.call(this, expr);
});

// #else directive
createDirective('else', function (_expr: string, called: boolean)
{
	// If this directive wasn't called by 'this.callCondition'
	if (!called)
	{
		return this.conditionEnd();
	}

	// Else: nothing to compute, parse the next line
});

// #endif directive
createDirective('endif', function (_expr: string, _called: boolean)
{
	// Do nothing beacause this directive is already evaluated by 'this.conditionNext'
});
