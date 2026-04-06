import { isAlpha, last } from '../string-helper';
import { createDirective } from './directives';

// #define directive
createDirective('define', function (text: string)
{
	// Get the constant/macro name
	let i = 0;
	while (isAlpha(text, i))
	{
		i++;
	}

	const name = text.substr(0, i);
	const isMacro = text[i] === '(';

	text = text.substr(name.length).trimLeft();

	// Read a multilines constants/macro if there is an '\' at the end of the line
	let str = text.trimRight();
	text = '';

	while (last(str) === '\\')
	{
		text += str.substr(0, str.length - 1) + this.options.newLine;
		str = this.nextLine().trimRight();
	}

	text += str;

	// Strip comments from the definition
	let posBegin;
	let posEnd;

	while ((posBegin = text.indexOf('/*')) !== -1)
	{
		posEnd = text.indexOf('*/', 1 + posBegin);
		if (posEnd === -1)
		{ posEnd = text.length; }

		text = `${text.substring(0, posBegin)} ${text.substring(2 + posEnd)}`;
	}

	if ((posBegin = text.indexOf('//')) !== -1)
	{
		text = `${text.substring(0, posBegin)} `;
	}

	text.trimRight();

	// If there is an '(' after the name: define a macro
	if (isMacro)
	{
		this.createMacro(name, text);
	}

	// Else: create a constant
	else
	{
		this.createConstant(name, text);
	}
});

// #undef directive
createDirective('undef', function (text: string)
{
	// Get the constant/macro name
	let i = 0;
	while (isAlpha(text, i))
	{
		i++;
	}

	const name = text.substr(0, i);

	// Delete the constant/macro
	delete this.defines[name];
});
