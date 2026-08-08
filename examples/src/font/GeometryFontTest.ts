import { reactive, ticker, View, logic, Font } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';
import * as opentype from 'opentype.js';

const text1 = `
道可道，非常道。
名可名，非常名。
无名天地之始；
有名万物之母。
故常无，欲以观其妙；
常有，欲以观其徼。
此两者，同出而异名，同谓之玄。
玄之又玄，众妙之门。 `;

// 先 await 字体加载与几何体计算，再构造 View（保证赋值时数据已就绪）
const fontBuffer = await fetch('/fonts/simfang.ttf')
    .then(response =>
    {
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        return response.arrayBuffer();
    });
const font = opentype.parse(fontBuffer);
const fontData = extractFontData(font);
const contoursInfo = convert(fontData);
const font1 = new Font(contoursInfo);
const { vertices, normals, uvs, indices } = font1.calculateGeometry(text1, 1);

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: 10 },
            components: [{
                __type__: 'PerspectiveCamera',
            }, {
                __type__: 'FPSController',
            }],
        }, {
            __type__: 'Object3D',
            name: 'fontText',
            position: { x: -7, y: 7, z: 0 },
            rotation: { x: Math.PI, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'VertexDataGeometry' },
                material: { __type__: 'StandardMaterial' },
            }],
        }],
    },
};
const viewLogic = logic(view);

// 字体几何体顶点数据由 opentype.js + Font.calculateGeometry 计算，
// 在 logic(view) 创建 geometry logic 后通过 reactive(logic) 写入。
const fontTextObj = view.root.children[1];
const renderer = fontTextObj.components.find(c => c.__type__ === 'MeshRenderer') as any;
const gLogic = logic(renderer.geometry) as any;
gLogic.positions = Array.from(vertices);
gLogic.normals = Array.from(normals);
gLogic.uvs = Array.from(uvs);
gLogic.indices = Array.from(indices);

// 字体几何体为非闭合曲面（单面），关闭背面剔除 + 用 ccw 正面避免字体镜像
const materialLogic = logic(renderer.material) as any;
reactive(materialLogic.renderPipeline.primitive).frontFace = 'ccw';
reactive(materialLogic.renderPipeline.primitive).cullFace = 'none';

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });

function extractFontData(fontAll: opentype.Font)
{
    // get only the data we need in a better way
    const fontData = {
        glyphs: fontAll.glyphs,
        unitsPerEm: fontAll.unitsPerEm,
        familyName: fontAll['familyName'],
        ascender: fontAll.ascender,
        descender: fontAll.descender,
        tables: {
            name: fontAll.tables.name,
            post: {
                underlinePosition: fontAll.tables.post.underlinePosition,
                underlineThickness: fontAll.tables.post.underlineThickness
            },
            head: {
                yMin: fontAll.tables.head.yMin,
                xMin: fontAll.tables.head.xMin,
                yMax: fontAll.tables.head.yMax,
                xMax: fontAll.tables.head.xMax
            }
        },
        glyphsMap: {}
    };

    for (let i = 0; i < fontAll.glyphs.length; i++)
    {
        const glyph = fontAll.glyphs['glyphs'][i];
        if (glyph.unicode !== undefined)
        {
            fontData.glyphsMap[glyph.unicode] = glyph;
        }
    }

    return fontData;
}

function convert(font, restrict?: string)
{
    const result = {} as any;
    result.glyphs = {};

    const restriction = {
        range: null,
        set: null
    };

    if (restrict)
    {
        const restrictContent = restrict;
        const rangeSeparator = '-';
        if (restrictContent.indexOf(rangeSeparator) !== -1)
        {
            const rangeParts = restrictContent.split(rangeSeparator) as any;
            if (rangeParts.length === 2 && !isNaN(rangeParts[0]) && !isNaN(rangeParts[1]))
            {
                reactive(restriction).range = [parseInt(rangeParts[0]), parseInt(rangeParts[1])];
            }
        }
        if (restriction.range === null)
        {
            restriction.set = restrictContent;
        }
    }

    if (restriction.range)
    { // get characters from range, not use very often
        for (let i = 0; i < font.glyphs.length; i++)
        {
            const glyph = font.glyphs.glyphs[i];
            if (glyph.unicode !== undefined)
            {
                const glyphCharacter = String.fromCharCode(glyph.unicode);
                if ((glyph.unicode >= restriction.range[0] && glyph.unicode <= restriction.range[1]))
                {
                    result.glyphs[glyphCharacter] = fetchToken(glyph);
                }
            }
        }
    } else if (restriction.set)
    { // use quit a lot
        for (let char of restriction.set)
        {
            const charCode = char.codePointAt(0);
            const glyph = font.glyphsMap[charCode];
            if (glyph)
            {
                result.glyphs[char] = fetchToken(glyph);
            } else
            {
                console.warn(`char: ${char}, charCode: ${charCode}`);
            }
        }
    } else
    { // get all characters
        for (let i = 0; i < font.glyphs.length; i++)
        {
            const glyph = font.glyphs.glyphs[i];
            if (glyph.unicode !== undefined)
            {
                const glyphCharacter = String.fromCharCode(glyph.unicode);
                result.glyphs[glyphCharacter] = fetchToken(glyph);
            }
        }
    }

    result.familyName = font.familyName;
    result.ascender = Math.round(font.ascender);
    result.descender = Math.round(font.descender);
    result.underlinePosition = Math.round(font.tables.post.underlinePosition);
    result.underlineThickness = Math.round(font.tables.post.underlineThickness);
    result.boundingBox = {
        'yMin': Math.round(font.tables.head.yMin),
        'xMin': Math.round(font.tables.head.xMin),
        'yMax': Math.round(font.tables.head.yMax),
        'xMax': Math.round(font.tables.head.xMax)
    };
    result.unitsPerEm = font.unitsPerEm;
    result.original_font_information = font.tables.name;
    result.cssFontStyle = 'normal';

    return result;
}

function fetchToken(glyph)
{
    const token = {} as any;
    token.ha = Math.round(glyph.advanceWidth);
    token.x_min = Math.round(glyph.xMin);
    token.x_max = Math.round(glyph.xMax);
    token.o = '';
    glyph.path.commands.forEach(function (command, i)
    {
        if (command.type.toLowerCase() === 'c') { command.type = 'b'; }
        token.o += command.type.toLowerCase();
        token.o += ' ';
        if (command.x !== undefined && command.y !== undefined)
        {
            token.o += Math.round(command.x);
            token.o += ' ';
            token.o += Math.round(command.y);
            token.o += ' ';
        }
        if (command.x1 !== undefined && command.y1 !== undefined)
        {
            token.o += Math.round(command.x1);
            token.o += ' ';
            token.o += Math.round(command.y1);
            token.o += ' ';
        }
        if (command.x2 !== undefined && command.y2 !== undefined)
        {
            token.o += Math.round(command.x2);
            token.o += ' ';
            token.o += Math.round(command.y2);
            token.o += ' ';
        }
    });

    return token;
}
