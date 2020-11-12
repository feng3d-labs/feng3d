namespace feng3d
{
	export class Font
	{
		data: FontData;

		constructor(data: FontData)
		{
			this.data = data;
		}

		generateShapes(text: string, size: number)
		{
			if (size === undefined) size = 100;

			const shapes: ShapePath2[] = [];
			const paths = createPaths(text, size, this.data);

			for (let p = 0, pl = paths.length; p < pl; p++)
			{
				Array.prototype.push.apply(shapes, paths[p].toShapes());
			}
			return shapes;
		}
	}

	function createPaths(text: string, size: number, data: FontData)
	{
		const chars = Array.from ? Array.from(text) : String(text).split(''); // workaround for IE11, see #13988
		const scale = size / data.resolution;
		const line_height = (data.boundingBox.yMax - data.boundingBox.yMin + data.underlineThickness) * scale;

		const paths: ShapePath2[] = [];

		let offsetX = 0, offsetY = 0;

		for (let i = 0; i < chars.length; i++)
		{
			const char = chars[i];

			if (char === '\n')
			{
				offsetX = 0;
				offsetY -= line_height;
			} else
			{
				const ret = createPath(char, scale, offsetX, offsetY, data);
				offsetX += ret.offsetX;
				paths.push(ret.path);
			}
		}

		return paths;
	}

	function createPath(char: string, scale: number, offsetX: number, offsetY: number, data: FontData)
	{
		const glyph = data.glyphs[char] || data.glyphs['?'];

		if (!glyph)
		{
			console.error('THREE.Font: character "' + char + '" does not exists in font family ' + data.familyName + '.');

			return;
		}

		const path = new ShapePath2();

		let x: number, y: number, cpx: number, cpy: number, cpx1: number, cpy1: number, cpx2: number, cpy2: number;

		if (glyph.o)
		{
			const outline = glyph._cachedOutline || (glyph._cachedOutline = glyph.o.split(' '));
			for (let i = 0, l = outline.length; i < l;)
			{
				const action = outline[i++];
				switch (action)
				{
					case 'm': // moveTo
						x = outline[i++] * scale + offsetX;
						y = outline[i++] * scale + offsetY;
						path.moveTo(x, y);
						break;
					case 'l': // lineTo
						x = outline[i++] * scale + offsetX;
						y = outline[i++] * scale + offsetY;
						path.lineTo(x, y);
						break;
					case 'q': // quadraticCurveTo
						cpx = outline[i++] * scale + offsetX;
						cpy = outline[i++] * scale + offsetY;
						cpx1 = outline[i++] * scale + offsetX;
						cpy1 = outline[i++] * scale + offsetY;
						path.quadraticCurveTo(cpx1, cpy1, cpx, cpy);
						break;
					case 'b': // bezierCurveTo
						cpx = outline[i++] * scale + offsetX;
						cpy = outline[i++] * scale + offsetY;
						cpx1 = outline[i++] * scale + offsetX;
						cpy1 = outline[i++] * scale + offsetY;
						cpx2 = outline[i++] * scale + offsetX;
						cpy2 = outline[i++] * scale + offsetY;
						path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, cpx, cpy);
						break;
				}
			}
		}
		return { offsetX: glyph.ha * scale, path: path };
	}

	interface FontData
	{
		underlineThickness: number;
		resolution: number;

		boundingBox: {
			yMax: number
			yMin: number
		};

		familyName: string;
		glyphs: {
			[k: string]: {
				o: string;
				_cachedOutline: any;
				ha: number;
			};
		}
	}
}


