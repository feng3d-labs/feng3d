import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * TSL 生成结果的**规范化基线**（#712）。
 *
 * 背景：负责人要求「把 TSL 生成的着色器与原本的 wgsl 对比」。
 * 实测结论：**逐字节一致做不到**——差异分两层：
 *   1. **格式/风格层**（结构体大括号换行、字段尾逗号、@binding/@group 顺序、`vec4f` vs `vec4<f32>`、
 *      `uniforms : X` vs `uniforms: X`）→ 本文件用 normalize() 抹平；
 *   2. **生成策略层**（成员名大小写、var/let、常量折叠、广播折叠、表达式改写、括号、结构体名、
 *      绑定顺序、常量内联、顶点输入名）→ **无法抹平**，故用「基线对比」防退化。
 *
 * 本测试的作用：**TSL 生成结果一旦意外变化（换行/命名/折叠/顺序），这里立刻失败**，
 * 迫使改动者显式确认（`UPDATE_TSL_PARITY=1` 更新基线）——与 bundle-size / toplevel-new 的基线模式一致。
 *
 * 另外提供「与 git 历史里原 wgsl 对比」的本地模式（`TSL_PARITY_CHECK_ORIGINAL=1`），
 * 它会把剩余的生成策略差异打印出来供人工确认（CI 是 shallow clone，拿不到历史，故不进 CI）。
 */
const MODULES = [
    { fn: 'getBasicVertWGSL', path: '../packages/webgpu/examples/src/shaders/basic.vert.tsl' },
    { fn: 'getBlackFragWGSL', path: '../packages/webgpu/examples/src/shaders/black.frag.tsl' },
    { fn: 'getFullscreenTexturedQuadWGSL', path: '../packages/webgpu/examples/src/shaders/fullscreenTexturedQuad.tsl' },
    { fn: 'getHelloTriangleWGSL', path: '../packages/webgpu/examples/src/webgpu/helloTriangle/helloTriangle.tsl' },
    { fn: 'getMultipleCanvasesWGSL', path: '../packages/webgpu/examples/src/webgpu/multipleCanvases/multipleCanvases.tsl' },
    { fn: 'getRedFragWGSL', path: '../packages/webgpu/examples/src/shaders/red.frag.tsl' },
    { fn: 'getRenderObjectChangesVariantWGSL', path: '../packages/webgpu/examples/src/webgpu/RenderObjectChanges/variant.tsl' },
    { fn: 'getInstancedVertWGSL', path: '../packages/webgpu/examples/src/shaders/instanced.vert.tsl' },
    { fn: 'getSampleTextureMixColorFragWGSL', path: '../packages/webgpu/examples/src/shaders/sampleTextureMixColor.frag.tsl' },
    { fn: 'getTriangleVertWGSL', path: '../packages/webgpu/examples/src/shaders/triangle.vert.tsl' },
    { fn: 'getVertexPositionColorFragWGSL', path: '../packages/webgpu/examples/src/shaders/vertexPositionColor.frag.tsl' },
    { fn: 'getGameOfLifeComputeWGSL', path: '../packages/webgpu/examples/src/webgpu/gameOfLife/compute.tsl' },
    { fn: 'getComputeBoidsSpriteWGSL', path: '../packages/webgpu/examples/src/webgpu/computeBoids/sprite.tsl' },
    { fn: 'getUpdateSpritesWGSL', path: '../packages/webgpu/examples/src/webgpu/computeBoids/updateSprites.tsl' },
    { fn: 'getGameOfLifeRenderWGSL', path: '../packages/webgpu/examples/src/webgpu/gameOfLife/render.tsl' },
    { fn: 'getPointsOrangeFragWGSL', path: '../packages/webgpu/examples/src/webgpu/points/orange.frag.tsl' },
    { fn: 'getPointsTexturedFragWGSL', path: '../packages/webgpu/examples/src/webgpu/points/textured.frag.tsl' },
    { fn: 'getPointsDistanceSizedVertWGSL', path: '../packages/webgpu/examples/src/webgpu/points/distance-sized-points.vert.tsl' },
    { fn: 'getPointsFixedSizeVertWGSL', path: '../packages/webgpu/examples/src/webgpu/points/fixed-size-points.vert.tsl' },
    { fn: 'getReversedZFragmentWGSL', path: '../packages/webgpu/examples/src/webgpu/reversedZ/fragment.tsl' },
    { fn: 'getReversedZVertexWGSL', path: '../packages/webgpu/examples/src/webgpu/reversedZ/vertex.tsl' },
    { fn: 'getReversedZVertexDepthPrePassWGSL', path: '../packages/webgpu/examples/src/webgpu/reversedZ/vertexDepthPrePass.tsl' },
    { fn: 'getReversedZVertexPrecisionErrorPassWGSL', path: '../packages/webgpu/examples/src/webgpu/reversedZ/vertexPrecisionErrorPass.tsl' },
    { fn: 'getReversedZVertexTextureQuadWGSL', path: '../packages/webgpu/examples/src/webgpu/reversedZ/vertexTextureQuad.tsl' },
    { fn: 'getReversedZFragmentTextureQuadWGSL', path: '../packages/webgpu/examples/src/webgpu/reversedZ/fragmentTextureQuad.tsl' },
    { fn: 'getReversedZFragmentPrecisionErrorPassWGSL', path: '../packages/webgpu/examples/src/webgpu/reversedZ/fragmentPrecisionErrorPass.tsl' },
    { fn: 'getCheckerShaderWGSL', path: '../packages/webgpu/examples/src/webgpu/resizeObserverHDDPI/checker.tsl' },
    { fn: 'getSolidColorLitWGSL', path: '../packages/webgpu/examples/src/shaders/solidColorLit.tsl' },
    { fn: 'getCubemapSampleCubemapWGSL', path: '../packages/webgpu/examples/src/webgpu/cubemap/sampleCubemap.frag.tsl' },
    { fn: 'getFractalCubeSampleSelfWGSL', path: '../packages/webgpu/examples/src/webgpu/fractalCube/sampleSelf.frag.tsl' },
    { fn: 'getDeferredVertexTextureQuadWGSL', path: '../packages/webgpu/examples/src/webgpu/deferredRendering/vertexTextureQuad.tsl' },
    { fn: 'getDeferredVertexWriteGBuffersWGSL', path: '../packages/webgpu/examples/src/webgpu/deferredRendering/vertexWriteGBuffers.tsl' },
    { fn: 'getCamerasCubeWGSL', path: '../packages/webgpu/examples/src/webgpu/cameras/cube.tsl' },
    { fn: 'getShadowMappingVertexShadowWGSL', path: '../packages/webgpu/examples/src/webgpu/shadowMapping/vertexShadow.tsl' },
    { fn: 'getShadowMappingVertexWGSL', path: '../packages/webgpu/examples/src/webgpu/shadowMapping/vertex.tsl' },
    { fn: 'getBlendingTexturedQuadWGSL', path: '../packages/webgpu/examples/src/webgpu/blending/texturedQuad.tsl' },
    { fn: 'getRenderBundlesMeshWGSL', path: '../packages/webgpu/examples/src/webgpu/renderBundles/mesh.tsl' },
    { fn: 'getDeferredFragmentDeferredRenderingWGSL', path: '../packages/webgpu/examples/src/webgpu/deferredRendering/fragmentDeferredRendering.tsl' },
    { fn: 'getABufferOpaqueWGSL', path: '../packages/webgpu/examples/src/webgpu/a-buffer/opaque.tsl' },
    { fn: 'getAnimometerWGSL', path: '../packages/webgpu/examples/src/webgpu/animometer/animometer.tsl' },
    { fn: 'getBitonicDisplayFragWGSL', path: '../packages/webgpu/examples/src/webgpu/bitonicSort/bitonicDisplay.frag.tsl' },
    { fn: 'getShadowMappingFragmentWGSL', path: '../packages/webgpu/examples/src/webgpu/shadowMapping/fragment.tsl' },
    { fn: 'getFragmentGBuffersDebugViewWGSL', path: '../packages/webgpu/examples/src/webgpu/deferredRendering/fragmentGBuffersDebugView.tsl' },
    { fn: 'getVolumeWGSL', path: '../packages/webgpu/examples/src/webgpu/volumeRenderingTexture3D/volume.tsl' },
    { fn: 'getLightUpdateWGSL', path: '../packages/webgpu/examples/src/webgpu/deferredRendering/lightUpdate.tsl' },
    { fn: 'getTonemapperWGSL', path: '../packages/webgpu/examples/src/webgpu/cornell/tonemapper.tsl' },
];

const BASELINE = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'tsl-parity-baseline.json');

/** 规范化：抹平「格式/风格」差异，保留「生成策略」差异 */
function normalize(src: string): string[]
{
    const lines = src.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean)
        .map((l) => l
            .replace(/@binding\((\d+)\)\s*@group\((\d+)\)/g, '@group($2) @binding($1)')
            .replace(/@group\((\d+)\)\s*@binding\((\d+)\)/g, '@group($1) @binding($2)')
            .replace(/\bvec([234])f\b/g, 'vec$1<f32>')
            .replace(/\bmat([234])x([234])f\b/g, 'mat$1x$2<f32>')
            .replace(/\bmat([234])f\b/g, 'mat$1x$1<f32>')
            .replace(/\s*:\s*/g, ': ')
            .replace(/,\s*$/, '')
            .replace(/\s+/g, ' ')
            .trim());
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++)
    {
        if (/^struct\s+\w+$/.test(lines[i]) && lines[i + 1] === '{') { out.push(lines[i] + ' {'); i++; continue; }
        if (lines[i] === '}') { if (out.length && !out[out.length - 1].endsWith('{') && !out[out.length - 1].endsWith(';')) out.push('}'); continue; }
        out.push(lines[i]);
    }

    return out;
}

describe('TSL 生成结果的规范化基线（#712）', () =>
{
    it('与基线一致（防生成退化）', async () =>
    {
        const current: Record<string, string[]> = {};
        for (const mod of MODULES)
        {
            const loaded = await import(mod.path) as Record<string, () => unknown>;
            const value = loaded[mod.fn]() as string | { vertex: string; fragment: string };
            const text = typeof value === 'string' ? value : `${value.vertex}\n${value.fragment}`;

            current[mod.fn] = normalize(text);
        }

        if (process.env.UPDATE_TSL_PARITY)
        {
            const sorted = Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)));
            writeFileSync(BASELINE, `${JSON.stringify(sorted, null, 4)}\n`, 'utf8');

            return;
        }

        const baseline = JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, string[]>;
        for (const mod of MODULES)
        {
            expect(current[mod.fn], `${mod.fn} 的生成结果与基线不一致（如属有意改动，用 UPDATE_TSL_PARITY=1 更新基线）`)
                .toEqual(baseline[mod.fn]);
        }
    });

    /**
     * 本地模式：与 **git 历史里的原 wgsl** 对比，列出规范化后仍存在的差异，
     * 并**单独标注「表达式改写」**（同一行重排/结合顺序变化，如 `0.5 * (a + b)` → `(a + b) * 0.5`）。
     *
     * 该模式的目的是**人工审计浮点结合顺序**——这类改写格式规范化抹不掉、也可能影响精度，
     * 必须逐个确认。CI 是 shallow clone 拿不到历史，所以只在本地跑：
     * `TSL_PARITY_CHECK_ORIGINAL=1 npx vitest run test/tslWgslParity.spec.ts`
     */
    it.skipIf(!process.env.TSL_PARITY_CHECK_ORIGINAL)('与 git 历史里的原 wgsl 对比（本地审计模式）', async () =>
    {
        // 去掉所有非字母数字后排序：用于识别「同一组操作数、只是顺序/括号不同」的改写
        const signature = (l: string) => l.replace(/[^a-zA-Z0-9]/g, '').split('').sort().join('');
        let totalModules = 0, totalDiff = 0, totalRewrites = 0;

        for (const mod of MODULES)
        {
            const origPath = mod.path.replace(/^\.\.\//, '').replace(/\.tsl$/, '.wgsl');
            let orig = '';

            try
            {
                const commit = execFileSync('git', ['rev-list', '-n', '1', 'HEAD', '--', origPath], { encoding: 'utf8' }).trim();
                orig = execFileSync('git', ['show', `${commit}~1:${origPath}`], { encoding: 'utf8' });
            }
            catch { continue; }

            const loaded = await import(mod.path) as Record<string, () => unknown>;
            const value = loaded[mod.fn]() as string | { vertex: string; fragment: string };
            const text = typeof value === 'string' ? value : `${value.vertex}\n${value.fragment}`;
            const o = normalize(orig), g = normalize(text);
            const gSet = new Set(g);
            const onlyOrig = [...new Set(o)].filter((l) => !gSet.has(l));
            const oSet = new Set(o);
            const onlyGen = [...new Set(g)].filter((l) => !oSet.has(l));
            const gSigs = new Map(onlyGen.map((l) => [signature(l), l]));
            const rewrites = onlyOrig.filter((l) => gSigs.has(signature(l)));

            totalModules++;
            totalDiff += onlyOrig.length + onlyGen.length;
            totalRewrites += rewrites.length;

            if (process.env.TSL_PARITY_VERBOSE && (onlyOrig.length || onlyGen.length))
            {
                console.log(`\n=== ${mod.fn}：剩余差异 ${onlyOrig.length + onlyGen.length}（其中表达式改写 ${rewrites.length}）`);
                for (const r of rewrites) console.log(`  [改写] ${r.slice(0, 100)}\n      -> ${gSigs.get(signature(r))?.slice(0, 100)}`);
            }
        }

        console.log(`\n[TSL 与原 wgsl 对比] 覆盖 ${totalModules} 个模块；规范化后剩余差异 ${totalDiff} 行，其中**表达式改写 ${totalRewrites} 行**（格式层差异已抹平）`);
        expect(totalModules).toBeGreaterThan(0);
    });
});
