import { Camera, CustomGeometry, FPSController, Font, Object3D, reactive, Renderable, Scene, StandardMaterial, StandardMaterialLogic, createStandardMaterial, View, logic, createObject3D, createCamera, createScene, createMeshRenderer, createFPSController, createCustomGeometry, ticker} from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';
import * as opentype from 'opentype.js';

var sceneObject3D = createObject3D(); reactive(sceneObject3D).name = "Untitled";
var scene = createScene(); reactive(sceneObject3D).components.push(scene);
reactive(scene).background = { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 };

var cameraObject3D = createObject3D(); reactive(cameraObject3D).name = "Main Camera";
var camera = createCamera(); reactive(cameraObject3D).components.push(camera);
{ const _r = reactive((logic(camera).entity).position); _r.x = 0; _r.y = 1; _r.z = -10; }
reactive(logic(scene).entity).children.push(logic(camera).entity);

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const view: View = { __type__: 'View', canvas: webgpuCanvas, root: sceneObject3D };
const viewLogic = logic(view);

{ const c = createFPSController(); reactive(logic(camera).entity).components.push(c); }

// 使用 fetch + opentype.parse 替代已弃用的 opentype.load
fetch('/fonts/simfang.ttf')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.arrayBuffer();
    })
    .then(buffer => {
        const font = opentype.parse(buffer);
        const fontData = extractFontData(font);
        const contoursInfo = convert(fontData);
        const font1 = new Font(contoursInfo);
        // font1.isCCW = !!font['isCIDFont'];

        // const { vertices, normals, uvs, indices } = font1.calculateGeometry('图', 1);
        // const { vertices, normals, uvs, indices } = font1.calculateGeometry('图纸!', 1);
        const { vertices, normals, uvs, indices } = font1.calculateGeometry(text1, 1);

        const geometry = createCustomGeometry();
        const gLogic = logic(geometry);

        gLogic.positions = Array.from(vertices);
        gLogic.normals = Array.from(normals);
        gLogic.uvs = Array.from(uvs);
        gLogic.indices = Array.from(indices);

        const _o = createObject3D();
        logic(_o);
        const cube = createMeshRenderer();
        reactive(_o).components.push(cube);
        reactive(_o.position).x = -7;
        reactive(_o.position).y = 7;
        reactive(_o.rotation).x = 180;
        reactive(logic(scene).entity).children.push(_o);

        //材质
        var material = reactive(cube).material = createStandardMaterial();
        const materialLogic = logic(material) as StandardMaterialLogic;
        reactive(materialLogic.renderPipeline.primitive).frontFace = 'ccw';
        reactive(materialLogic.renderPipeline.primitive).cullFace = 'none';

        reactive(cube).geometry = geometry;
    })
    .catch(err => {
        alert('Font could not be loaded: ' + err);
    });


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
const text1 = `
道可道，非常道。
名可名，非常名。
无名天地之始；
有名万物之母。
故常无，欲以观其妙；
常有，欲以观其徼。
此两者，同出而异名，同谓之玄。
玄之又玄，众妙之门。 `;

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
