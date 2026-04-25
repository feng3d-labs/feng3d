import { createDirective } from './directives';

// #pragma directive
createDirective('pragma', function (text: string)
{
	text = text.trim();

	// #pragma once: include a file once
	if (text === 'once')
	{
		this.parent.includeOnce[this.currentFile] = true;
	}

	// #pragma push_macro(...): save value of a macro on top of the stack
	else if (text.startsWith('push_macro'))
	{
		const match = text.match(/push_macro\("([^"]+)"\)/);

		if (match === null || match[1].length === 0)
		{
			this.error(`wrong pragma format`);
		}
		else
		{
			this.pushMacro(match[1]);
		}
	}

	// #pragma pop_macro(...): set value of the a macro to saved value
	else if (text.startsWith('pop_macro'))
	{
		const match = text.match(/pop_macro\("([^"]+)"\)/);

		if (match === null || match[1].length === 0)
		{
			this.error(`wrong pragma format`);
		}
		else
		{
			this.popMacro(match[1]);
		}
	}

	// Else: error
	else
	{
		this.error(`unknown pragma "${text}"`);
	}
});

// #error directive
createDirective('error', function (text: string)
{
	this.error(text.trim());
});

// #enum directive: c like enumeration
createDirective('enum', function (text: string)
{
	// Get the enum options
	let opt: { start?: number, step?: number } = {};
	try
	{
		opt = text.split(',').reduce((pv, cv) =>
		{
			const cvs = cv.split('=').map((v) => v.trim());
			if (cvs.length === 2)
			{
				pv[cvs[0]] = Number(cvs[1]);
			}

			return pv;
		}, {});
	}
	catch (e)
	{
		opt = {};
	}

	// Default options
	opt.start = opt.start || 0;
	opt.step = opt.step || 1;

	// Get all names of constants to create
	let line: string; let str = '';

	while (this.currentLine < this.linesCount)
	{
		line = this.nextLine();
		if (line.trimLeft().startsWith('#endenum'))
		{
			break;
		}

		str += line;
	}

	// Create an array of constant names
	const split = str.split(',');
	let name: string; let v: number;

	// Create the constants and add their value
	for (let i = 0, l = split.length; i < l; i++)
	{
		name = split[i].trim();
		v = opt.start + i * opt.step;

		this.defines[name] = {
			value: this.options.enumInHex ? `0x${v.toString(16)}` : v.toString(),
			name
		};
	}
});

// #endenum directive
createDirective('endenum', function ()
{
	// Do nothing beacause this directive is already evaluated by #enum
});
