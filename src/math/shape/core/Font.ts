namespace feng3d
{
	export class Font
	{
		data: FontData;
		isCCW = false;
		private charGeometryCache: {
			[char: string]: {
				geometry: {
					points: number[];
					indices: number[];
				};
				width: number;
			}
		} = {};

		constructor(data: FontData)
		{
			this.data = data;
		}

		generateShapes(text: string, size: number, lineHeight?: number, align: 'left' | 'center' | 'right' = 'left'): Shape2[]
		{
			if (size === undefined)
			{
				size = 100;
			}
			if (lineHeight === undefined)
			{
				lineHeight = size * 1.25;
			}

			const shapes: Shape2[] = [];
			const paths = createPaths(text, size, lineHeight, this.data, align);

			for (let p = 0, pl = paths.length; p < pl; p++)
			{
				const path_shapes = paths[p].toShapes(this.isCCW);
				for (let i = 0, il = path_shapes.length; i < il; i++)
				{
					shapes.push(path_shapes[i]);
				}
			}

			return shapes;
		}

		generateCharGeometry(char: string, geometry: { points: number[], indices: number[] } = { points: [], indices: [] })
		{
			if (this.charGeometryCache[char])
			{
				return this.charGeometryCache[char];
			}
			const { path, offsetX } = createPath(char, 1, 0, 0, this.data);
			const shapes = path.toShapes(this.isCCW);
			for (let i = 0, n = shapes.length; i < n; i++)
			{
				shapes[i].triangulate(geometry);
			}
			return this.charGeometryCache[char] = { geometry, width: offsetX };
		}

		calculateGeometry(text: string, fontSize: number, lineHeight?: number, align: 'left' | 'center' | 'right' = 'left', textBaseline: 'alphabetic' | 'top' | 'middle' | 'bottom' = 'alphabetic', tabCharWidth = 128)
		{
			if (lineHeight === undefined)
			{
				lineHeight = fontSize * 1.25;
			}
			lineHeight = lineHeight / fontSize * this.data.unitsPerEm;

			const textInfo = calculateTextInfo(this, text, tabCharWidth);
			const { vertices, indices } = calculateTextStyle(textInfo, fontSize, lineHeight, align, textBaseline);
			const { normals, uvs } = calculateNormalUV(vertices);

			return { vertices, normals, uvs, indices };
		}
	}

	function createPaths(text: string, size: number, lineHeight: number, data: FontData, align: 'left' | 'center' | 'right' = 'left'): ShapePath2[]
	{
		const scale = size / data.unitsPerEm;
		const line_height = lineHeight;
		const paths: ShapePath2[] = [];
		let offsetX = 0;
		let offsetY = 0;

		const lines = text.split('\n');

		const lineWidths: number[] = [];
		let maxLineWidth = 0;
		for (let i = 0, ni = lines.length; i < ni; i++)
		{
			const lineStr = lines[i];
			if (i > 0)
			{
				offsetX = 0;
			}
			const chars = Array.from ? Array.from(lineStr) : String(lineStr).split(''); // see #13988
			for (let j = 0, nj = chars.length; j < nj; j++)
			{
				const char = chars[j];
				if (char.charCodeAt(0) === 9)
				{
					offsetX += 20;
				}
				else
				{
					const glyph = data.glyphs[char] || data.glyphs['?'];
					if (glyph)
					{
						offsetX += glyph.ha * scale;
					}
				}
			}
			lineWidths[i] = offsetX;
			maxLineWidth = Math.max(maxLineWidth, offsetX);
		}

		for (let i = 0, ni = lines.length; i < ni; i++)
		{
			const lineStr = lines[i];
			offsetX = 0;
			offsetY = -line_height * i;
			if (align === 'center')
			{
				offsetX = (maxLineWidth - lineWidths[i]) / 2;
			} else if (align === 'right')
			{
				offsetX = maxLineWidth - lineWidths[i];
			}

			const chars = Array.from ? Array.from(lineStr) : String(lineStr).split(''); // see #13988
			for (let j = 0, nj = chars.length; j < nj; j++)
			{
				const char = chars[j];
				if (char.charCodeAt(0) === 9)
				{
					offsetX += 20;
				}
				else
				{
					const ret = createPath(char, scale, offsetX, offsetY, data);
					offsetX += ret.offsetX;
					paths.push(ret.path);
				}
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
					case 'z':
						path.closePath();
						break;
					default:
						console.assert(action.trim() == '');
						break;
				}
			}
		}
		return { offsetX: glyph.ha * scale, path: path };
	}

	export interface Glyph
	{
		ha: number,
		x_min: number,
		x_max: number,
		o: string,
		_cachedOutline?: any[]
	}

	interface FontData
	{
		glyphs: { [index: string]: Glyph },
		unitsPerEm: number,
		ascender: number,
		descender: number,
		underlinePosition: number,
		underlineThickness: number,
		familyName: string,
		boundingBox: {
			yMin: number,
			xMin: number,
			yMax: number,
			xMax: number,
		}
	}

	function calculateTextInfo(font: Font, text: string, tabCharWidth: number)
	{
		const textInfo: TextInfo = { text: text, font: font, width: 0, numVertices: 0, numIndices: 0, lines: [] };
		//
		const lines = text.split('\n');
		for (let i = 0, ni = lines.length; i < ni; i++)
		{
			textInfo.lines[i] = { text: lines[i], width: 0, numVertices: 0, numIndices: 0, chars: [] };
			const lineItem = textInfo.lines[i];
			if (i > 0)
			{
				lineItem.width = 0;
			}
			const chars = Array.from ? Array.from(lineItem.text) : String(lineItem.text).split(''); // see #13988
			for (let j = 0, nj = chars.length; j < nj; j++)
			{
				const char = chars[j];
				if (char === '\t')
				{
					lineItem.width += tabCharWidth;
				}
				else
				{
					const charVertices = font.generateCharGeometry(char);
					const charItem = lineItem.chars[j] = {
						text: char,
						width: charVertices.width,
						offsetX: lineItem.width,
						offsetVertices: textInfo.numVertices,
						offsetIndices: textInfo.numIndices,
						numVertices: charVertices.geometry.points.length,
						numIndices: charVertices.geometry.indices.length,
						geometry: charVertices.geometry,
					};
					lineItem.width += charItem.width;
					lineItem.numVertices += charItem.numVertices;
					lineItem.numIndices += charItem.numIndices;
					textInfo.numVertices += charItem.numVertices;
					textInfo.numIndices += charItem.numIndices;
				}
			}
			textInfo.width = Math.max(textInfo.width, lineItem.width);
		}
		return textInfo;
	}

	function calculateTextStyle(textInfo: TextInfo, fontSize: number, lineHeight: number, align: string, textBaseline: string)
	{
		const { unitsPerEm, ascender, descender } = textInfo.font.data;
		const scale = fontSize / unitsPerEm;
		const vertices = new Float32Array(textInfo.numVertices / 2 * 3);
		const indices = new Uint32Array(textInfo.numIndices);

		let baselineOffsetY = 0;
		if (textBaseline === 'top')
		{
			baselineOffsetY = ascender;
		} else if (textBaseline === 'bottom')
		{
			baselineOffsetY = descender;
		} else if (textBaseline === 'middle')
		{
			baselineOffsetY = (ascender + descender) / 2;
		} else if (textBaseline === 'alphabetic')
		{
			baselineOffsetY = 0;
		}

		//
		const { lines, width: maxLineWidth } = textInfo;
		for (let i = 0, ni = lines.length; i < ni; i++)
		{
			const { width: lineWidth, chars } = lines[i];
			let alignOffsetX = 0;
			const offsetY = -lineHeight * i;
			if (align === 'center')
			{
				alignOffsetX = (maxLineWidth - lineWidth) / 2;
			} else if (align === 'right')
			{
				alignOffsetX = maxLineWidth - lineWidth;
			}

			for (let j = 0, nj = chars.length; j < nj; j++)
			{
				const charItem = chars[j];
				if (!charItem)
				{
					continue;
				}
				const { offsetX: charOffsetX, offsetVertices, offsetIndices, geometry } = charItem;
				updateCharGeometry({
					offsetX: alignOffsetX + charOffsetX, offsetY: offsetY - baselineOffsetY, scale,
					targetVertices: vertices, targetIndices: indices,
					offsetVertices, offsetIndices,
					sourceVertices: geometry.points, sourceIndices: geometry.indices
				});
			}
		}
		return { vertices, indices };

		function updateCharGeometry({
			offsetX, offsetY, scale,
			targetVertices, targetIndices,
			offsetVertices, offsetIndices,
			sourceVertices, sourceIndices,
		}: {
			offsetX: number, offsetY: number, scale: number,
			targetVertices: Float32Array, targetIndices: Uint32Array,
			offsetVertices: number, offsetIndices: number,
			sourceVertices: number[], sourceIndices: number[],
		})
		{

			let offsetVertices3 = offsetVertices / 2 * 3;
			let offsetVertices2 = 0;

			for (let i = 0, n = sourceVertices.length / 2; i < n; i++)
			{
				targetVertices[offsetVertices3++] = (sourceVertices[offsetVertices2++] + offsetX) * scale;
				targetVertices[offsetVertices3++] = -(sourceVertices[offsetVertices2++] + offsetY) * scale;
				targetVertices[offsetVertices3++] = 0;
			}

			let offsetVerticesIndex = offsetVertices / 2;
			for (let i = 0, n = sourceIndices.length; i < n; i++)
			{
				targetIndices[offsetIndices + i] = sourceIndices[i] + offsetVerticesIndex;
			}
		}
	}

	function calculateNormalUV(vertices: Float32Array)
	{
		const normals = new Float32Array(vertices.length);
		const uvs = new Float32Array(vertices.length / 3 * 2);
		let verticesIndex = 0;
		let normalsIndex = 0;
		let uvsIndex = 0;
		for (let i = 0, n = vertices.length / 3; i < n; i++)
		{
			uvs[uvsIndex++] = vertices[verticesIndex++];
			uvs[uvsIndex++] = vertices[verticesIndex++];
			verticesIndex++;
			//
			normals[normalsIndex++] = 0;
			normals[normalsIndex++] = 0;
			normals[normalsIndex++] = 1;
		}
		return { normals, uvs };
	}

	interface TextInfo
	{
		text: string,
		font: Font,
		width: number,
		numVertices: number,
		numIndices: number,
		lines: {
			text: string,
			width: number,
			numVertices: number,
			numIndices: number,
			chars: {
				text: string,
				width: number;
				offsetX: number,
				offsetVertices: number,
				offsetIndices: number,
				numVertices: number,
				numIndices: number,
				geometry: {
					points: number[];
					indices: number[];
				},
			}[]
		}[],
	}
}


