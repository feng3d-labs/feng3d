import { Processor } from '../processor';
import { getNextString } from '../string-helper';
import { createDirective } from './directives';

createDirective('include', function (text: string)
{
	// Get the name of the file to include
	const name = getNextString(text);
	if (!name)
	{
		return this.error('invalid include');
	}

	// File to read
	const file = this.path + name;

	// If the file is already included and #pragma once
	if (this.parent.includeOnce[file])
	{
		return;
	}
	// Read the file asynchronously and parse it
	this.fs.readFile(this.options.basePath + file, 'utf8', (err, code) =>
	{
		if (err)
		{
			return this.error(`can't read file "${file}"`);
		}

		this.options.filename = file;
		const processor = new Processor(this.parent, code);

		// On success: add the file content to the result
		processor.onsuccess = () =>
		{
			processor.onsuccess = null;

			let e = '';
			for (let i = 0, l = this.options.includeSpaces; i < l; i++)
			{
				e += this.options.newLine;
			}

			this.addLine(e + processor.result.trim() + e);

			this._compConst('FILE', this.currentFile);
			this.next();
		};

		processor.run();
	});

	// Block the synchronous loop
	return false;
});
