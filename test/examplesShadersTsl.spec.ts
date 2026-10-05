import { describe, expect, it } from 'vitest';
import { getBasicVertWGSL } from '../packages/webgpu/examples/src/shaders-tsl/basicVert';
import { getBlackFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/blackFrag';
import { getFullscreenTexturedQuadWGSL } from '../packages/webgpu/examples/src/shaders-tsl/fullscreenTexturedQuad';
import { getHelloTriangleWGSL } from '../packages/webgpu/examples/src/shaders-tsl/helloTriangle';
import { getMultipleCanvasesWGSL } from '../packages/webgpu/examples/src/shaders-tsl/multipleCanvases';
import { getRedFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/redFrag';
import { getRenderObjectChangesVariantWGSL } from '../packages/webgpu/examples/src/shaders-tsl/renderObjectChangesVariant';
import { getInstancedVertWGSL } from '../packages/webgpu/examples/src/shaders-tsl/instancedVert';
import { getSampleTextureFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/sampleTextureFrag';
import { getSampleTextureMixColorFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/sampleTextureMixColorFrag';
import { getTriangleVertWGSL } from '../packages/webgpu/examples/src/shaders-tsl/triangleVert';
import { getVertexPositionColorFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/vertexPositionColorFrag';
import { getGameOfLifeComputeWGSL } from '../packages/webgpu/examples/src/shaders-tsl/gameOfLifeCompute';
import { getComputeBoidsSpriteWGSL } from '../packages/webgpu/examples/src/shaders-tsl/computeBoidsSprite';
import { getUpdateSpritesWGSL } from '../packages/webgpu/examples/src/shaders-tsl/computeBoidsUpdateSprites';
import { getGameOfLifeRenderWGSL } from '../packages/webgpu/examples/src/shaders-tsl/gameOfLifeRender';
import { getPointsOrangeFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/pointsOrangeFrag';
import { getPointsTexturedFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/pointsTexturedFrag';
import { getPointsDistanceSizedVertWGSL } from '../packages/webgpu/examples/src/shaders-tsl/pointsDistanceSizedVert';
import { getPointsFixedSizeVertWGSL } from '../packages/webgpu/examples/src/shaders-tsl/pointsFixedSizeVert';
import { getReversedZFragmentWGSL } from '../packages/webgpu/examples/src/shaders-tsl/reversedZFragment';
import { getReversedZVertexWGSL } from '../packages/webgpu/examples/src/shaders-tsl/reversedZVertex';
import { getReversedZVertexDepthPrePassWGSL } from '../packages/webgpu/examples/src/shaders-tsl/reversedZVertexDepthPrePass';
import { getReversedZVertexPrecisionErrorPassWGSL } from '../packages/webgpu/examples/src/shaders-tsl/reversedZVertexPrecisionErrorPass';
import { getReversedZVertexTextureQuadWGSL } from '../packages/webgpu/examples/src/shaders-tsl/reversedZVertexTextureQuad';
import { getReversedZFragmentTextureQuadWGSL } from '../packages/webgpu/examples/src/shaders-tsl/reversedZFragmentTextureQuad';
import { getReversedZFragmentPrecisionErrorPassWGSL } from '../packages/webgpu/examples/src/shaders-tsl/reversedZFragmentPrecisionErrorPass';
import { getCheckerShaderWGSL } from '../packages/webgpu/examples/src/shaders-tsl/checker';
import { getSolidColorLitWGSL } from '../packages/webgpu/examples/src/shaders-tsl/solidColorLit';
import { getCubemapSampleCubemapWGSL } from '../packages/webgpu/examples/src/shaders-tsl/cubemapSampleCubemap';
import { getFractalCubeSampleSelfWGSL } from '../packages/webgpu/examples/src/shaders-tsl/fractalCubeSampleSelf';
import { getDeferredVertexTextureQuadWGSL } from '../packages/webgpu/examples/src/shaders-tsl/deferredVertexTextureQuad';
import { getDeferredVertexWriteGBuffersWGSL } from '../packages/webgpu/examples/src/shaders-tsl/deferredVertexWriteGBuffers';
import { getCamerasCubeWGSL } from '../packages/webgpu/examples/src/shaders-tsl/camerasCube';
import { getShadowMappingVertexShadowWGSL } from '../packages/webgpu/examples/src/shaders-tsl/shadowMappingVertexShadow';
import { getShadowMappingVertexWGSL } from '../packages/webgpu/examples/src/shaders-tsl/shadowMappingVertex';
import { getBlendingTexturedQuadWGSL } from '../packages/webgpu/examples/src/shaders-tsl/blendingTexturedQuad';
import { getRenderBundlesMeshWGSL } from '../packages/webgpu/examples/src/shaders-tsl/renderBundlesMesh';
import { getDeferredFragmentDeferredRenderingWGSL } from '../packages/webgpu/examples/src/shaders-tsl/deferredFragmentDeferredRendering';
import { getABufferOpaqueWGSL } from '../packages/webgpu/examples/src/shaders-tsl/aBufferOpaque';
import { getAnimometerWGSL } from '../packages/webgpu/examples/src/shaders-tsl/animometer';
import { getBitonicDisplayFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/bitonicDisplayFrag';
import { getShadowMappingFragmentWGSL } from '../packages/webgpu/examples/src/shaders-tsl/shadowMappingFragment';
import { getFragmentGBuffersDebugViewWGSL } from '../packages/webgpu/examples/src/shaders-tsl/fragmentGBuffersDebugView';
import { getVolumeWGSL } from '../packages/webgpu/examples/src/shaders-tsl/volume';

/**
 * examples 共享着色器的 TSL 版验收（issue #712）。
 *
 * 这些 TSL 版替代 `packages/webgpu/examples/src/shaders/*.wgsl`，断言的是与原手写文件
 * **逐行对应**的关键片段（binding / location / 表达式顺序）。
 *
 * 注：examples 的 webgpu 示例**没有 e2e 画面覆盖**（e2e 清单里 0 条 webgpu 示例），
 * 所以这里用离线断言守住"生成结果与手写一致"，画面验证是 #712 的已知欠账。
 */
describe('examples 共享着色器的 TSL 版（#712）', () =>
{
    it('black.frag：常量黑色输出', () =>
    {
        const wgsl = getBlackFragWGSL();
        expect(wgsl).toContain('@fragment');
        expect(wgsl).toContain('return vec4<f32>(0.0, 0.0, 0.0, 1.0);');
    });

    it('triangle.vert：vertex_index + 3 顶点常量数组', () =>
    {
        const wgsl = getTriangleVertWGSL();
        expect(wgsl).toContain('@builtin(vertex_index) vertexIndex: u32');
        expect(wgsl).toContain('var pos: array<vec2<f32>, 3> = array<vec2<f32>, 3>(');
        expect(wgsl).toContain('let p = pos[i32(vertexIndex)]');
        expect(wgsl).toContain('output.position = vec4<f32>(vec3<f32>(p, 0.0), 1.0);');
    });

    it('basic.vert：uniform + 两个 attribute + 两个 varying', () =>
    {
        const wgsl = getBasicVertWGSL();
        expect(wgsl).toContain('struct Uniforms');
        expect(wgsl).toContain('modelViewProjectionMatrix: mat4x4<f32>');
        expect(wgsl).toContain('@group(0) @binding(0) var<uniform> uniforms: Uniforms;');
        expect(wgsl).toContain('@location(0) position: vec4<f32>');
        expect(wgsl).toContain('@location(1) uv: vec2<f32>');
        expect(wgsl).toContain('@location(0) fragUV: vec2<f32>');
        expect(wgsl).toContain('@location(1) fragPosition: vec4<f32>');
        expect(wgsl).toContain('output.position = uniforms.modelViewProjectionMatrix * position;');
        expect(wgsl).toContain('(position + vec4<f32>(1.0)) * 0.5');
    });

    it('instanced.vert：mat4 数组 + instance_index', () =>
    {
        const wgsl = getInstancedVertWGSL();
        expect(wgsl).toContain('modelViewProjectionMatrix: array<mat4x4<f32>, 16>');
        expect(wgsl).toContain('@builtin(instance_index) instanceIndex: u32');
        expect(wgsl).toContain('uniforms.modelViewProjectionMatrix[i32(instanceIndex)] * position');
    });

    it('vertexPositionColor.frag：保留 fragUV 的 varying 声明（否则 location 错位）', () =>
    {
        const wgsl = getVertexPositionColorFragWGSL();
        expect(wgsl).toContain('@location(0) fragUV: vec2<f32>');
        expect(wgsl).toContain('@location(1) fragPosition: vec4<f32>');
        expect(wgsl).toContain('return input.fragPosition;');
    });

    it('sampleTexture.frag / sampleTextureMixColor.frag：纹理采样（TSL 展开格式）', () =>
    {
        const plain = getSampleTextureFragWGSL();
        expect(plain).toContain(': texture_2d<f32>;');
        expect(plain).toContain(': sampler;');
        expect(plain).toContain('textureSample(');

        const mix = getSampleTextureMixColorFragWGSL();
        expect(mix).toContain('* input.fragPosition');
    });

    it('fullscreenTexturedQuad：两个数组字面量 + vertex / fragment 两个入口', () =>
    {
        const wgsl = getFullscreenTexturedQuadWGSL();
        expect(wgsl).toContain('fn vert_main(');
        expect(wgsl).toContain('fn frag_main(');
        expect((wgsl.match(/var (pos|uv): array<vec2<f32>, 6> = array<vec2<f32>, 6>\(/g) ?? []).length).toBe(2);
    });

    it('helloTriangle / RenderObjectChanges：裸 vec4 uniform + 最简三角形', () =>
    {
        const { vertex, fragment } = getHelloTriangleWGSL();
        expect(vertex).toContain('@location(0) position: vec2<f32>');
        expect(vertex).toContain('output.position = vec4<f32>(vec3<f32>(position, 0.0), 1.0);');
        expect(fragment).toContain('var<uniform> color : vec4<f32>;');
        expect(fragment).toContain('return color;');
    });

    it('multipleCanvases：vertex 与 fragment 各自自包含（同一 Uniforms 不去重）', () =>
    {
        const { vertex, fragment } = getMultipleCanvasesWGSL();
        expect(vertex).toContain('@vertex');
        expect(vertex).toContain('fn vs(');
        expect(vertex).toContain('worldViewProjectionMatrix');
        expect(fragment).toContain('@fragment');
        expect(fragment).toContain('fn fs(');
        // fragment 侧也带自己的 Uniforms 声明——引擎把两份 code 分别编译成两个 module，
        // 所以这不是重复定义（曾经把它们拼成一份导致全黑，见 PR 说明）
        expect(fragment).toContain('uniform> uni: Uniforms;');
    });

    it('RenderObjectChanges 的运行时替换变体：swizzle 赋值改成整体赋值', () =>
    {
        const { vertex, fragment } = getRenderObjectChangesVariantWGSL();
        expect(vertex).toContain('var pos = position;');
        expect(vertex).toContain('pos = vec2<f32>(position.x + 0.5, position.y);');
        expect(fragment).toContain('var col = color;');
        expect(fragment).toContain('col = vec4<f32>(0.5, 0.6, 0.7, color.w);');
    });

    it('red.frag：多输出（两个 @location）', () =>
    {
        const wgsl = getRedFragWGSL();
        expect(wgsl).toContain('struct FragmentOut {');
        expect(wgsl).toContain('@location(0) color0: vec4<f32>,');
        expect(wgsl).toContain('@location(1) color1: vec4<f32>,');
        expect(wgsl).toContain('output.color0 = vec4<f32>(1.0, 0.0, 0.0, 1.0);');
        expect(wgsl).toContain('output.color1 = vec4<f32>(1.0, 1.0, 0.0, 1.0);');
    });
});

/**
 * gameOfLife 的 compute 着色器（TSL 版）离线验收。
 *
 * **注意**：该示例目前**不在 e2e 的画面判据列表里**（`e2e/examples.spec.ts` 没有它），
 * 所以这里用"与手写逐句对照"作为验收手段，而不是截图。
 */
describe('gameOfLife compute 的 TSL 生成', () =>
{
    const wgsl = getGameOfLifeComputeWGSL();

    it('storage 声明与手写一致（含单值 size）', () =>
    {
        expect(wgsl).toContain('@binding(0) @group(0) var<storage, read> size: vec2<u32>;');
        expect(wgsl).toContain('@binding(1) @group(0) var<storage, read> current: array<u32>;');
        expect(wgsl).toContain('@binding(2) @group(0) var<storage, read_write> next: array<u32>;');
    });

    it('override 与 compute 入口', () =>
    {
        expect(wgsl).toContain('override blockSize = 8;');
        expect(wgsl).toContain('@compute @workgroup_size(blockSize, blockSize)');
        expect(wgsl).toContain('fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {');
    });

    it('三个辅助函数与手写一致', () =>
    {
        expect(wgsl).toContain('fn getIndex(x: u32, y: u32) -> u32 {');
        expect(wgsl).toContain('let h = size.y;');
        expect(wgsl).toContain('let w = size.x;');
        // 手写是 (y % h) * w + (x % w)；TSL 如实保留每一步的括号，语义相同
        expect(wgsl).toContain('return (((y % h) * w) + (x % w));');
        expect(wgsl).toContain('fn getCell(x: u32, y: u32) -> u32 {');
        expect(wgsl).toContain('return current[getIndex(x, y)];');
        expect(wgsl).toContain('fn countNeighbors(x: u32, y: u32) -> u32 {');
    });

    it('主体：select 的三个参数位置与手写等价（回归）', () =>
    {
        // 手写：next[getIndex(x,y)] = select(u32(n == 3u), u32(n == 2u || n == 3u), getCell(x,y) == 1u)
        // WGSL 的 select(f, t, cond) —— 即"getCell==1 时取 n==2||n==3，否则取 n==3"
        expect(wgsl).toContain('let n = countNeighbors(x, y);');
        expect(wgsl).toContain('select(select(0u, 1u, (n == 3u)), select(0u, 1u, ((n == 2u)) || ((n == 3u))), (getCell(x, y) == 1u))');
    });
});

/**
 * computeBoids 的 sprite 着色器（TSL 版）离线验收。
 *
 * **注意**：该示例**不在 e2e 的画面判据列表里**，所以用"与手写逐句对照"验收。
 */
describe('computeBoids sprite 的 TSL 生成', () =>
{
    const wgsl = getComputeBoidsSpriteWGSL();

    it('一份代码含 vertex 与 fragment 两个入口', () =>
    {
        expect(wgsl).toContain('@vertex');
        expect(wgsl).toContain('fn vert_main(');
        expect(wgsl).toContain('@fragment');
        expect(wgsl).toContain('fn frag_main(');
    });

    it('顶点输入 location 与手写一致（显式指定，顺序不同但位置正确）', () =>
    {
        expect(wgsl).toContain('@location(0) a_particlePos: vec2<f32>');
        expect(wgsl).toContain('@location(1) a_particleVel: vec2<f32>');
        expect(wgsl).toContain('@location(2) a_pos: vec2<f32>');
    });

    it('顶点数学与手写等价（atan2 的 y/x 顺序、-1.0 乘法位置）', () =>
    {
        expect(wgsl).toContain('let angle = atan2(a_particleVel.x, a_particleVel.y) * -1.0;');
        expect(wgsl).toContain('let pos = vec2<f32>(a_pos.x * cos(angle) - a_pos.y * sin(angle), a_pos.x * sin(angle) + a_pos.y * cos(angle));');
        expect(wgsl).toContain('output.color = vec4<f32>(1.0 - sin(angle + 1.0) - a_particleVel.y, pos.x * 100.0 - a_particleVel.y + 0.1, a_particleVel.x + cos(angle + 0.5), 1.0);');
    });

    it('vertex 与 fragment 的 color 在 @location(4) 对齐（回归）', () =>
    {
        // 手写两边都是 @location(4)——不显式指定 varying 的 location 就会错位
        expect(wgsl).toContain('@location(4) color: vec4<f32>,');
        expect(wgsl).toContain('return input.color;');
    });
});

/**
 * computeBoids 的 updateSprites（TSL 版）离线验收。
 *
 * **该示例不在 e2e 画面判据列表里**，所以用"与手写逐句对照"验收。
 */
describe('computeBoids updateSprites 的 TSL 生成', () =>
{
    const wgsl = getUpdateSpritesWGSL();

    it('结构体与绑定与手写一致', () =>
    {
        expect(wgsl).toContain('struct Particle');
        expect(wgsl).toContain('struct SimParams');
        expect(wgsl).toContain('@binding(0) @group(0) var<uniform> params : SimParams;');
        expect(wgsl).toContain('@binding(1) @group(0) var<storage, read> particlesA: array<Particle>;');
        expect(wgsl).toContain('@binding(2) @group(0) var<storage, read_write> particlesB: array<Particle>;');
    });

    it('元素成员访问（particlesA[index].pos）正确', () =>
    {
        expect(wgsl).toContain('let index = globalInvocationId.x;');
        expect(wgsl).toContain('var vPos = particlesA[index].pos;');
        expect(wgsl).toContain('var vVel = particlesA[index].vel;');
        expect(wgsl).toContain('pos = particlesA[i].pos;');
    });

    it('回归：continue 必须在 if 体内（if 体比 for 体更近）', () =>
    {
        // 曾经 for 优先，生成 if ((i == index)) { } continue; —— 会把后面的语句全跳过
        const idx = wgsl.indexOf('if ((i == index)) {');
        const cont = wgsl.indexOf('continue;', idx);
        const close = wgsl.indexOf('}', idx);
        expect(cont).toBeGreaterThan(idx);
        expect(cont).toBeLessThan(close);
    });

    it('回归：if 体内的赋值必须在 if 内（曾经 if 体是空的）', () =>
    {
        const ruleIdx = wgsl.indexOf('if (distance(pos, vPos) < params.rule1Distance) {');
        const bodyIdx = wgsl.indexOf('cMass = cMass + pos;', ruleIdx);
        const close = wgsl.indexOf('}', ruleIdx);
        expect(bodyIdx).toBeGreaterThan(ruleIdx);
        expect(bodyIdx).toBeLessThan(close);
    });

    it('arrayLength / 分量赋值 / 速度限制与手写一致', () =>
    {
        expect(wgsl).toContain('for (var i: u32 = 0u; i < arrayLength(&particlesA); i = i + 1u) {');
        expect(wgsl).toContain('vPos.x = 1.0;');
        expect(wgsl).toContain('vPos.y = -1.0;');
        expect(wgsl).toContain('vVel = normalize(vVel) * clamp(length(vVel), 0.0, 0.1);');
        expect(wgsl).toContain('particlesB[index].pos = vPos;');
    });
});

/**
 * gameOfLife 渲染着色器（TSL 版）离线验收。
 *
 * **该示例不在 e2e 画面判据列表里**，所以用"与手写逐句对照"验收。
 */
describe('gameOfLife 渲染着色器的 TSL 生成', () =>
{
    const wgsl = getGameOfLifeRenderWGSL();

    it('一份代码含 vertex 与 fragment 两个入口', () =>
    {
        expect(wgsl).toContain('@vertex');
        expect(wgsl).toContain('@fragment');
    });

    it('顶点输入与内建与手写一致', () =>
    {
        expect(wgsl).toContain('@location(0) cell: u32');
        expect(wgsl).toContain('@location(1) pos: vec2<u32>');
        expect(wgsl).toContain('@builtin(instance_index) instanceIndex: u32');
    });

    it('数学与手写等价（u32 的 max / 取模 / 整除）', () =>
    {
        expect(wgsl).toContain('let wh = max(w, h);');
        expect(wgsl).toContain('f32(((instanceIndex % w) + pos.x))');
        expect(wgsl).toContain('(instanceIndex - (instanceIndex % w)) / w');
    });

    it('varying cell 在 @location(0) 对齐', () =>
    {
        expect(wgsl).toContain('@location(0) cell: f32');
        expect(wgsl).toContain('return vec4<f32>(input.cell, input.cell, input.cell, 1.0);');
    });
});

/**
 * points 示例的 4 个着色器（TSL 版）离线验收。
 *
 * **该示例不在 e2e 画面判据列表里**，所以用"与手写逐句对照"验收。
 */
describe('points 示例的 TSL 生成', () =>
{
    it('orange.frag：常量橙色', () =>
    {
        const wgsl = getPointsOrangeFragWGSL();
        expect(wgsl).toContain('fn fs() -> @location(0) vec4<f32>');
        expect(wgsl).toContain('return vec4<f32>(1.0, 0.5, 0.2, 1.0);');
    });

    it('textured.frag：纹理采样 + discard', () =>
    {
        const wgsl = getPointsTexturedFragWGSL();
        expect(wgsl).toContain('@location(0) texcoord: vec2<f32>');
        // TSL 的采样器展开约定
        expect(wgsl).toContain('var t_texture: texture_2d<f32>;');
        expect(wgsl).toContain('var t: sampler;');
        expect(wgsl).toContain('let color = textureSample(t_texture, t, input.texcoord);');
        expect(wgsl).toContain('if (color.a < 0.1) {');
        expect(wgsl).toContain('discard;');
    });

    it('两个 vert：六个顶点的数组字面量 + vertex_index 取用', () =>
    {
        for (const wgsl of [getPointsDistanceSizedVertWGSL(), getPointsFixedSizeVertWGSL()])
        {
            expect(wgsl).toContain('@builtin(vertex_index) vertexIndex: u32');
            expect(wgsl).toContain('array<vec2<f32>, 6>(vec2<f32>(-1.0)');
            expect(wgsl).toContain('[vertexIndex]');
            expect(wgsl).toContain('let sizeVec = vec2<f32>(uni.size, uni.size);');
        }
        // 两者只在 pointPos 上有区别：fixed 版要乘 clipPos.w
        expect(getPointsDistanceSizedVertWGSL()).not.toContain('* clipPos.w');
        expect(getPointsFixedSizeVertWGSL()).toContain('* clipPos.w');
    });

    it('回归：局部数组（arrayWithValues）也能被 index() 渲染', () =>
    {
        // 曾经因为 Array 未设默认 toWGSL，局部数组索引会抛 "this.toWGSL is not a function"
        const wgsl = getPointsDistanceSizedVertWGSL();
        expect(wgsl).toContain('array<vec2<f32>, 6>');
    });
});

/**
 * reversedZ 示例的 5 个着色器（TSL 版）离线验收。
 *
 * **该示例不在 e2e 画面判据列表里**，所以用"与手写逐句对照"验收。
 * （另外 2 个深度相关着色器仍是 .wgsl——它们需要深度纹理的 texelFetch，留待后续。）
 */
describe('reversedZ 示例的 TSL 生成', () =>
{
    it('三个 vert：mat4 数组 uniform + instance_index', () =>
    {
        for (const wgsl of [getReversedZVertexWGSL(), getReversedZVertexDepthPrePassWGSL(), getReversedZVertexPrecisionErrorPassWGSL()])
        {
            expect(wgsl).toContain('modelMatrix: array<mat4x4<f32>, 5>');
            expect(wgsl).toContain('var<uniform> uniforms: Uniforms;');
            expect(wgsl).toContain('var<uniform> camera: Camera;');
            expect(wgsl).toContain('@builtin(instance_index) instanceIndex: u32');
            // 与手写一致：camera.viewProjectionMatrix * uniforms.modelMatrix[instanceIdx] * position
            expect(wgsl).toContain('camera.viewProjectionMatrix * uniforms.modelMatrix[instanceIndex] * position');
        }
    });

    it('vertex：输出 fragColor varying；depthPrePass：没有 varying', () =>
    {
        expect(getReversedZVertexWGSL()).toContain('@location(0) fragColor: vec4<f32>');
        expect(getReversedZVertexWGSL()).toContain('output.fragColor = color;');
        // depthPrePass 的 VertexOutput 里只有 position（没有 @location 输出 varying）
        const dp = getReversedZVertexDepthPrePassWGSL();
        const outputStruct = dp.slice(dp.indexOf('struct VertexOutput'), dp.indexOf('}', dp.indexOf('struct VertexOutput')));
        expect(outputStruct).toContain('@builtin(position)');
        expect(outputStruct).not.toContain('@location');
    });

    it('precisionErrorPass：clipPos 是位置本身', () =>
    {
        const wgsl = getReversedZVertexPrecisionErrorPassWGSL();
        expect(wgsl).toContain('@location(0) clipPos: vec4<f32>');
        expect(wgsl).toContain('output.clipPos = clipPos;');
    });

    it('vertexTextureQuad：常量数组 + vertex_index + vec4(pos, 0, 1)', () =>
    {
        const wgsl = getReversedZVertexTextureQuadWGSL();
        expect(wgsl).toContain('@builtin(vertex_index) vertexIndex: u32');
        expect(wgsl).toContain('array<vec2<f32>, 6>(vec2<f32>(-1.0)');
        expect(wgsl).toContain('output.position = vec4<f32>(pos, 0.0, 1.0);');
    });

    it('fragment：把 varying 原样返回', () =>
    {
        const wgsl = getReversedZFragmentWGSL();
        expect(wgsl).toContain('@location(0) fragColor: vec4<f32>');
        expect(wgsl).toContain('return input.fragColor;');
    });
});

/**
 * reversedZ 示例的深度读取片元着色器（TSL 版）离线验收。
 *
 * 这两个是"深度纹理读取"能力的直接消费者，也是 reversedZ 最后两个 .wgsl。
 */
describe('reversedZ 的深度读取片元着色器', () =>
{
    it('深度纹理声明为 texture_depth_2d，且**不**附带 sampler 绑定', () =>
    {
        for (const wgsl of [getReversedZFragmentTextureQuadWGSL(), getReversedZFragmentPrecisionErrorPassWGSL()])
        {
            expect(wgsl).toContain('var depthTexture_texture: texture_depth_2d;');
            // 深度纹理不需要配套 sampler（普通纹理才需要）
            expect(wgsl).not.toContain('var depthTexture: sampler;');
        }
    });

    it('textureLoad + floor + vec2<i32> 与手写一致', () =>
    {
        const wgsl = getReversedZFragmentTextureQuadWGSL();
        expect(wgsl).toContain('@builtin(position) fragCoord: vec4<f32>');
        expect(wgsl).toContain('let depthValue = textureLoad(depthTexture_texture, vec2<i32>(floor(fragCoord)), 0u);');
        expect(wgsl).toContain('return vec4<f32>(depthValue, depthValue, depthValue, 1.0);');
    });

    it('precisionErrorPass：abs(clipPos.z / clipPos.w - depth) * 2000000.0', () =>
    {
        const wgsl = getReversedZFragmentPrecisionErrorPassWGSL();
        expect(wgsl).toContain('@location(0) clipPos: vec4<f32>');
        expect(wgsl).toContain('var v = abs(input.clipPos.z / input.clipPos.w - depthValue) * 2000000.0;');
        expect(wgsl).toContain('return vec4<f32>(v, v, v, 1.0);');
    });
});

/**
 * resizeObserverHDDPI 的棋盘格着色器（TSL 版）离线验收。
 *
 * 该示例不在 e2e 画面判据列表里，用"与手写逐句对照"验收。
 */
describe('resizeObserverHDDPI 棋盘格着色器', () =>
{
    const shader = getCheckerShaderWGSL();

    it('顶点：三个顶点覆盖全屏 + vertex_index 取用', () =>
    {
        expect(shader.vertex).toContain('@builtin(vertex_index) vertexIndex: u32');
        expect(shader.vertex).toContain('array<vec2<f32>, 3>(vec2<f32>(-1.0), vec2<f32>(3.0, -1.0)');
        expect(shader.vertex).toContain('output.position = vec4<f32>(pos, 0.0, 1.0);');
    });

    it('uniform：size 是 u32', () =>
    {
        expect(shader.fragment).toContain('size: u32');
        expect(shader.fragment).toContain('var<uniform> uni: Uniforms;');
    });

    it('片元：vec2u(position.xy) / uni.size + 棋盘判定 + select', () =>
    {
        expect(shader.fragment).toContain('let grid = vec2<u32>(fragCoord.xy) / uni.size;');
        expect(shader.fragment).toContain('let checker = (((grid.x + grid.y) % 2u) == 1u);');
        // WGSL 的 select(f, t, cond)：cond 为 true 取 color1——与手写一致
        expect(shader.fragment).toContain('return select(uni.color0, uni.color1, checker);');
    });
});

/**
 * solidColorLit 着色器（TSL 版）离线验收。
 *
 * 三份手写 WGSL（multipleCanvases / occlusionQuery / wireframe）逐字节相同，
 * 现在共用一份 TSL 实现；multipleCanvases 那份是**孤儿文件**（无人 import），一并删除。
 */
describe('solidColorLit 着色器', () =>
{
    const shader = getSolidColorLitWGSL();

    it('顶点：变换与法线', () =>
    {
        expect(shader.vertex).toContain('@location(0) position: vec4<f32>');
        expect(shader.vertex).toContain('@location(1) normal: vec3<f32>');
        expect(shader.vertex).toContain('output.position = uni.worldViewProjectionMatrix * position;');
        expect(shader.vertex).toContain('output.normal = (uni.worldMatrix * vec4<f32>(normal, 0.0)).xyz;');
    });

    it('片元：朗伯光照 + color.rgb 相乘、alpha 直取', () =>
    {
        expect(shader.fragment).toContain('let lightDirection = normalize(vec3<f32>(4.0, 10.0, 6.0));');
        expect(shader.fragment).toContain('let light = dot(normalize(input.normal), lightDirection) * 0.5 + 0.5;');
        expect(shader.fragment).toContain('return vec4<f32>(uni.color.xyz * light, uni.color.w);');
    });

    it('uniform 布局与手写一致', () =>
    {
        expect(shader.vertex).toContain('worldViewProjectionMatrix: mat4x4<f32>');
        expect(shader.vertex).toContain('worldMatrix: mat4x4<f32>');
        expect(shader.vertex).toContain('color: vec4<f32>');
        expect(shader.vertex).toContain('@group(0) @binding(0) var<uniform> uni: Uniforms;');
    });
});

/**
 * cubemap / fractalCube 的片元着色器（TSL 版）离线验收。
 *
 * 这两个示例的顶点着色器（basic.vert）早已迁过，本批是"接入 + 补 frag"。
 */
describe('cubemap / fractalCube 的片元着色器', () =>
{
    it('cubemap：立方体纹理采样，采样器展开顺序与手写相反', () =>
    {
        const wgsl = getCubemapSampleCubemapWGSL();
        expect(wgsl).toContain('var myTexture_texture: texture_cube<f32>;');
        expect(wgsl).toContain('var myTexture: sampler;');
        expect(wgsl).toContain('let cubemapVec = input.fragPosition.xyz - vec3<f32>(0.5);');
        expect(wgsl).toContain('return textureSample(myTexture_texture, myTexture, cubemapVec);');
    });

    it('fractalCube：自采样 + 阈值 select', () =>
    {
        const wgsl = getFractalCubeSampleSelfWGSL();
        expect(wgsl).toContain('@location(0) fragUV: vec2<f32>');
        expect(wgsl).toContain('@location(1) fragPosition: vec4<f32>');
        expect(wgsl).toContain('let uv = input.fragUV * vec2<f32>(0.8) + vec2<f32>(0.1);');
        // 与手写逐字相同：select(1.0, 0.0, length(...) < 0.01)
        expect(wgsl).toContain('let f = select(1.0, 0.0, length(texColor.xyz - vec3<f32>(0.5)) < 0.01);');
        expect(wgsl).toContain('return (1.0 - f) * input.fragPosition + f * texColor;');
    });
});

/**
 * deferredRendering / cameras 的顶点着色器（TSL 版）离线验收。
 */
describe('deferredRendering / cameras 的着色器', () =>
{
    it('deferredRendering 全屏四边形：常量数组 + vertex_index', () =>
    {
        const wgsl = getDeferredVertexTextureQuadWGSL();
        expect(wgsl).toContain('@builtin(vertex_index) vertexIndex: u32');
        expect(wgsl).toContain('array<vec2<f32>, 6>(vec2<f32>(-1.0), vec2<f32>(1.0, -1.0)');
        expect(wgsl).toContain('output.position = vec4<f32>(pos, 0.0, 1.0);');
    });

    it('deferredRendering G-Buffer 顶点：世界空间位置/法线 + uv', () =>
    {
        const wgsl = getDeferredVertexWriteGBuffersWGSL();
        expect(wgsl).toContain('@group(0) @binding(0) var<uniform> uniforms: Uniforms;');
        expect(wgsl).toContain('@group(0) @binding(1) var<uniform> camera: Camera;');
        expect(wgsl).toContain('let fragPosition = (uniforms.modelMatrix * vec4<f32>(position, 1.0)).xyz;');
        expect(wgsl).toContain('output.position = camera.viewProjectionMatrix * vec4<f32>(fragPosition, 1.0);');
        expect(wgsl).toContain('output.fragNormal = normalize((uniforms.normalModelMatrix * vec4<f32>(normal, 1.0)).xyz);');
        expect(wgsl).toContain('output.fragUV = uv;');
    });

    it('cameras/cube：两个入口 + 采样器展开顺序与手写相反', () =>
    {
        const shader = getCamerasCubeWGSL();
        expect(shader.vertex).toContain('fn vertex_main(');
        expect(shader.fragment).toContain('fn fragment_main(');
        expect(shader.vertex).toContain('output.position = uniforms.modelViewProjectionMatrix * position;');
        expect(shader.fragment).toContain('var myTexture_texture: texture_2d<f32>;');
        expect(shader.fragment).toContain('var myTexture: sampler;');
        expect(shader.fragment).toContain('return textureSample(myTexture_texture, myTexture, input.fragUV);');
    });
});

/**
 * shadowMapping / blending 的着色器（TSL 版）离线验收。
 */
describe('shadowMapping / blending 的着色器', () =>
{
    it('shadowMapping 阴影 Pass 顶点：两个 uniform（不同 group）', () =>
    {
        const wgsl = getShadowMappingVertexShadowWGSL();
        expect(wgsl).toContain('@group(0) @binding(0) var<uniform> scene: Scene;');
        expect(wgsl).toContain('@group(1) @binding(0) var<uniform> model: Model;');
        expect(wgsl).toContain('output.position = scene.lightViewProjMatrix * model.modelMatrix * vec4<f32>(position, 1.0);');
    });

    it('shadowMapping 主顶点：光源空间 XY 转换 + 三个 varying', () =>
    {
        const wgsl = getShadowMappingVertexWGSL();
        expect(wgsl).toContain('@location(0) shadowPos: vec3<f32>');
        expect(wgsl).toContain('@location(1) fragPos: vec3<f32>');
        expect(wgsl).toContain('@location(2) fragNorm: vec3<f32>');
        expect(wgsl).toContain('let shadowXY = posFromLight.xy * (vec2<f32>(0.5, -0.5)) + vec2<f32>(0.5);');
        expect(wgsl).toContain('output.position = clipPos;');
    });

    it('blending 纹理四边形：uniform 在 binding 2 + 采样器展开顺序与手写相反', () =>
    {
        const shader = getBlendingTexturedQuadWGSL();
        expect(shader.vertex).toContain('@group(0) @binding(2) var<uniform> uni: Uniforms;');
        expect(shader.vertex).toContain('array<vec2<f32>, 6>(vec2<f32>(0.0), vec2<f32>(1.0, 0.0)');
        expect(shader.fragment).toContain('var ourTexture_texture: texture_2d<f32>;');
        expect(shader.fragment).toContain('var ourTexture: sampler;');
        expect(shader.fragment).toContain('return textureSample(ourTexture_texture, ourTexture, input.texcoord);');
    });
});

/**
 * renderBundles 的网格着色器（TSL 版）离线验收。
 */
describe('renderBundles 网格着色器', () =>
{
    const shader = getRenderBundlesMeshWGSL();

    it('两个 uniform：struct @group(0) 与裸 mat4 @group(1)', () =>
    {
        expect(shader.vertex).toContain('@group(0) @binding(0) var<uniform> uniforms: Uniforms;');
        expect(shader.vertex).toContain('var<uniform> modelMatrix : mat4x4<f32>;');
        expect(shader.vertex).toContain('output.position = uniforms.viewProjectionMatrix * modelMatrix * vec4<f32>(position, 1.0);');
    });

    it('法线变换 + uv 传递', () =>
    {
        expect(shader.vertex).toContain('output.normal = normalize((modelMatrix * vec4<f32>(normal, 0.0)).xyz);');
        expect(shader.vertex).toContain('output.uv = uv;');
    });

    it('片元：saturate 展开成 clamp + 采样器顺序与手写相反', () =>
    {
        expect(shader.fragment).toContain('var meshTexture_texture: texture_2d<f32>;');
        expect(shader.fragment).toContain('var meshTexture: sampler;');
        expect(shader.fragment).toContain('clamp(ambientColor + max(dot(input.normal, lightDir), 0.0) * dirColor, vec3<f32>(0.0), vec3<f32>(1.0))');
        expect(shader.fragment).toContain('return vec4<f32>(textureColor.xyz * lightColor, textureColor.w);');
    });
});

/**
 * deferredRendering 的延迟着色片元（TSL 版）离线验收。
 *
 * 本批顺带修了两个 TSL 根因（都由探针发现）：
 * - forU32_ 没收集循环上界的依赖 → 上界里的 uniform 不会被声明；
 * - fragment.ts 没输出 storage 的"元素结构体" → array<LightData> 引用不到 LightData。
 */
describe('deferredRendering 延迟着色片元', () =>
{
    const wgsl = getDeferredFragmentDeferredRenderingWGSL();

    it('三张 G-Buffer 是裸纹理（只声明 texture_2d，无 sampler）', () =>
    {
        expect(wgsl).toContain('var gBufferPosition_texture: texture_2d<f32>;');
        expect(wgsl).toContain('var gBufferNormal_texture: texture_2d<f32>;');
        expect(wgsl).toContain('var gBufferAlbedo_texture: texture_2d<f32>;');
        expect(wgsl).not.toContain('var gBufferPosition: sampler;');
    });

    it('回归：storage 的元素结构体已输出 + 循环上界的 uniform 已声明', () =>
    {
        // fragment.ts 原先不输出 storage 的元素 struct
        expect(wgsl).toContain('struct LightData');
        // forU32_ 原先不收集上界依赖
        expect(wgsl).toContain('struct Config');
        expect(wgsl).toContain('@group(1) @binding(1) var<uniform> config: Config;');
        expect(wgsl).toContain('for (var i: u32 = 0u; i < config.numLights; i = i + 1u) {');
    });

    it('光照循环与手写逐行一致', () =>
    {
        expect(wgsl).toContain('let L = lightsBuffer[i].position.xyz - position;');
        expect(wgsl).toContain('if (distance > lightsBuffer[i].radius) {');
        expect(wgsl).toContain('continue;');
        expect(wgsl).toContain('let lambert = max(dot(normal, normalize(L)), 0.0);');
        expect(wgsl).toContain('let falloff = pow(1.0 - distance / lightsBuffer[i].radius, 2.0);');
        expect(wgsl).toContain('result = result + falloff * lambert * lightsBuffer[i].color * albedo;');
    });

    it('discard 与手动环境光', () =>
    {
        expect(wgsl).toContain('if (position.z > 10000.0) {');
        expect(wgsl).toContain('discard;');
        expect(wgsl).toContain('result = result + vec3<f32>(0.2);');
    });
});

/**
 * a-buffer 不透明几何着色器（TSL 版）离线验收。
 */
describe('a-buffer 不透明几何着色器', () =>
{
    const shader = getABufferOpaqueWGSL();

    it('flat 插值的 u32 varying（vertex 输出 / fragment 输入都要显式 location + flat）', () =>
    {
        expect(shader.vertex).toContain('@location(0) @interpolate(flat) instance: u32,');
        expect(shader.fragment).toContain('@location(0) @interpolate(flat) instance: u32,');
    });

    it('实例分布到 4x4 网格（编译期常量已内联）', () =>
    {
        expect(shader.vertex).toContain('let row = instanceIndex / 2u;');
        expect(shader.vertex).toContain('let xOffset = -62.5 + 15.625 + 62.5 * f32(col) + rowOdd * 31.25;');
        expect(shader.vertex).toContain('let zOffset = -62.5 + 15.625 + 2.0 + f32(row) * 31.25;');
        expect(shader.vertex).toContain('output.position = uniforms.modelViewProjectionMatrix * offsetPos;');
    });

    it('f32(row % 2u != 0u) 写成 f32(row % 2u)（row%2 只有 0/1，等价）', () =>
    {
        expect(shader.vertex).toContain('let rowOdd = f32((row % 2u));');
    });

    it('片元按 instance % 6 取调色板', () =>
    {
        expect(shader.fragment).toContain('array<vec3<f32>, 6>(vec3<f32>(1.0, 0.0, 0.0)');
        expect(shader.fragment).toContain('[(input.instance % 6u)]');
        expect(shader.fragment).toContain('return vec4<f32>(color, 1.0);');
    });
});

/**
 * animometer 着色器（TSL 版）离线验收。
 */
describe('animometer 着色器', () =>
{
    const shader = getAnimometerWGSL();

    it('两个 uniform 在不同 group（binding 都是 0）', () =>
    {
        expect(shader.vertex).toContain('@group(0) @binding(0) var<uniform> time: Time;');
        expect(shader.vertex).toContain('@group(1) @binding(0) var<uniform> uniforms: Uniforms;');
    });

    it('回归：Float.modulo 生成浮点 %', () =>
    {
        expect(shader.vertex).toContain('var fade = (uniforms.scalarOffset + time.value * uniforms.scalar / 10.0) % 1.0;');
    });

    it('if/else 里对同一个 var 重新赋值（容器落到 if/else 体内）', () =>
    {
        expect(shader.vertex).toContain('if (fade < 0.5) {');
        expect(shader.vertex).toContain('fade = fade * 2.0;');
        expect(shader.vertex).toContain('} else {');
        expect(shader.vertex).toContain('fade = (1.0 - fade) * 2.0;');
    });

    it('旋转 + 平移 + 颜色', () =>
    {
        expect(shader.vertex).toContain('let xrot = xpos * cos(angle) - ypos * sin(angle);');
        expect(shader.vertex).toContain('let yrot = xpos * sin(angle) + ypos * cos(angle);');
        expect(shader.vertex).toContain('xpos = xrot + uniforms.offsetX;');
        expect(shader.vertex).toContain('output.v_color = vec4<f32>(fade, 1.0 - fade, 0.0, 1.0) + color;');
    });
});

/**
 * bitonicSort 结果可视化片元（TSL 版）离线验收。
 */
describe('bitonicSort 可视化片元', () =>
{
    const wgsl = getBitonicDisplayFragWGSL();

    it('storage 数组 + 两个 uniform（不同 group）', () =>
    {
        expect(wgsl).toContain('var<storage, read> data: array<u32>;');
        expect(wgsl).toContain('@group(0) @binding(2) var<uniform> uniforms: ComputeUniforms;');
        expect(wgsl).toContain('@group(1) @binding(0) var<uniform> fragment_uniforms: FragmentUniforms;');
    });

    it('像素坐标 → 元素下标（f32→u32 用 uint）', () =>
    {
        expect(wgsl).toContain('var uv = vec2<f32>(input.fragUV.x * uniforms.width, input.fragUV.y * uniforms.height);');
        expect(wgsl).toContain('let pixel = vec2<u32>(u32(floor(uv.x)), u32(floor(uv.y)));');
        expect(wgsl).toContain('let elementIndex = ((u32(uniforms.width) * pixel.y) + pixel.x);');
    });

    it('回归：select 的参数顺序与手写一致（WGSL 语义 cond 为真取 t）', () =>
    {
        // 手写 select(绿, 红, cond)：TSL 侧必须写成 select(cond, 红, 绿) 才等价
        expect(wgsl).toContain('return select(vec4<f32>(vec3<f32>(0.0, oneMinus, 0.0), 1.0), vec4<f32>(vec3<f32>(oneMinus, 0.0, 0.0), 1.0), inFirstHalf);');
    });

    it('非高亮分支：灰度输出', () =>
    {
        expect(wgsl).toContain('let oneMinus = 1.0 - subtracter;');
        expect(wgsl).toContain('let color = vec3<f32>(oneMinus, oneMinus, oneMinus);');
        expect(wgsl).toContain('return vec4<f32>(color, 1.0);');
    });
});

/**
 * shadowMapping 阴影片元（TSL 版）离线验收。
 *
 * 本批新增两项能力：fragment 的 override 声明、min()。
 */
describe('shadowMapping 阴影片元', () =>
{
    const wgsl = getShadowMappingFragmentWGSL();

    it('回归：fragment 支持 override 声明（值为字符串时原样输出，f32 要写 1024.0）', () =>
    {
        expect(wgsl).toContain('override shadowDepthTextureSize = 1024.0;');
    });

    it('深度比较采样：texture_depth_2d + sampler_comparison（binding 1 / 2）', () =>
    {
        expect(wgsl).toContain('@binding(1) @group(0) var shadowMap_texture: texture_depth_2d;');
        expect(wgsl).toContain('@binding(2) @group(0) var shadowMap: sampler_comparison;');
        expect(wgsl).toContain('textureSampleCompare(shadowMap_texture, shadowMap, coord, depthRef)');
    });

    it('3x3 PCF：两层 forRange_（<= 1 对应 to = 2）', () =>
    {
        expect(wgsl).toContain('for (var y = -1; y < 2; y = y + 1) {');
        expect(wgsl).toContain('for (var x = -1; x < 2; x = x + 1) {');
        expect(wgsl).toContain('let offset = vec2<f32>(f32(x), f32(y)) * vec2<f32>(oneOverShadowDepthTextureSize, oneOverShadowDepthTextureSize);');
        expect(wgsl).toContain('visibility = visibility / 9.0;');
    });

    it('回归：min() 已补 + 照明合成', () =>
    {
        expect(wgsl).toContain('let lightDir = normalize(scene.lightPos - input.fragPos);');
        expect(wgsl).toContain('let lambertFactor = max(dot(lightDir, input.fragNorm), 0.0);');
        expect(wgsl).toContain('let lightingFactor = min(0.2 + visibility * lambertFactor, 1.0);');
    });
});

/**
 * deferredRendering 的 G-Buffer 调试视图片元（TSL 版）离线验收。
 *
 * 本批新增两项能力：override 的"只声明类型"形式、overrideF32 引用。
 */
describe('G-Buffer 调试视图片元', () =>
{
    const wgsl = getFragmentGBuffersDebugViewWGSL();

    it('回归：无默认值的 override（只声明类型）', () =>
    {
        expect(wgsl).toContain('override canvasSizeWidth: f32;');
        expect(wgsl).toContain('override canvasSizeHeight: f32;');
    });

    it('回归：overrideF32 在表达式里引用', () =>
    {
        expect(wgsl).toContain('let c = fragCoord.xy / vec2<f32>(canvasSizeWidth, canvasSizeHeight);');
    });

    it('三张 G-Buffer 是裸纹理', () =>
    {
        expect(wgsl).toContain('var gBufferPosition_texture: texture_2d<f32>;');
        expect(wgsl).toContain('var gBufferNormal_texture: texture_2d<f32>;');
        expect(wgsl).toContain('var gBufferAlbedo_texture: texture_2d<f32>;');
        expect(wgsl).not.toContain('var gBufferPosition: sampler;');
    });

    it('else if 用嵌套 if_ 表达 + 分量赋值', () =>
    {
        expect(wgsl).toContain('if (c.x < 0.33333) {');
        expect(wgsl).toContain('} else {');
        expect(wgsl).toContain('if (c.x < 0.66667) {');
        expect(wgsl).toContain('result.x = (result.x + 1.0) * 0.5;');
        expect(wgsl).toContain('result.y = (result.y + 1.0) * 0.5;');
        expect(wgsl).toContain('result.z = (result.z + 1.0) * 0.5;');
    });
});

/**
 * volumeRenderingTexture3D 体渲染着色器（TSL 版）离线验收。
 */
describe('体渲染着色器', () =>
{
    const shader = getVolumeWGSL();

    it('顶点：逆 MVP 反投影 near/far + 步长', () =>
    {
        expect(shader.vertex).toContain('@builtin(vertex_index) vertexIndex: u32');
        expect(shader.vertex).toContain('var near = uniforms.inverseModelViewProjectionMatrix * clipXY;');
        expect(shader.vertex).toContain('near = near / near.w;');
        expect(shader.vertex).toContain('output.step = (far.xyz - near.xyz) / 64.0;');
    });

    it('3D 纹理采样（texture_3d + sampler）', () =>
    {
        expect(shader.fragment).toContain('var myTexture_texture: texture_3d<f32>;');
        expect(shader.fragment).toContain('var myTexture: sampler;');
        expect(shader.fragment).toContain('textureSample(myTexture_texture, myTexture, texCoord)');
    });

    it('回归：lessThanAll / greaterThanAll + Bool.and 组合', () =>
    {
        expect(shader.fragment).toContain('let intersects = (all((rayPos < vec3<f32>(1.0)))) && (all((rayPos > vec3<f32>(-1.0))));');
    });

    it('循环与前后混合', () =>
    {
        expect(shader.fragment).toContain('for (var i = 0; i < 64; i = i + 1) {');
        expect(shader.fragment).toContain('let blended = (1.0 - result) * sample;');
        expect(shader.fragment).toContain('result = result + select(0.0, blended, (intersects) && (result < 1.0));');
        expect(shader.fragment).toContain('rayPos = rayPos + input.step;');
    });
});
