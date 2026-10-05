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
