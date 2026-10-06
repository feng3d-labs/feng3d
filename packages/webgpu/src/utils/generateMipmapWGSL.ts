import { arrayWithValues, assign, builtin, compute, float, fragment, gl_Position, if_, let_, return_, sampler2D, sampler2DArray, sampler3D, storageTexture3D, texture, textureDimensions, textureLod, textureStore, uint, uniform, uvec3, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;
type Uvec3Value = ReturnType<typeof uvec3>;
type FloatValue = ReturnType<typeof float>;

/**
 * mipmap 生成所用的着色器（TSL 构建，懒加载缓存）。
 *
 * 对应原 generate-mipmap.ts 里的**三段内联 WGSL**（2D / 2D-array / 3D 计算）。
 *
 * 与手写 WGSL 的差异说明（**语义一致**）：
 * - 2D / 2D-array：手写按 `view` 拼字符串切换 texture 类型与`采样参数`；
 *   这里按 view 分支生成（数组用 `textureSample(tex, s, vec3(uv, 0.0))`，
 *   与手写的 `textureSample(tex, s, uv, 0u)` 等价——z 分量即层号）；
 * - 3D：手写的输入纹理与采样器是**两个独立绑定**（texture_3d 与裸 sampler），
 *   TSL 的模型是"纹理 + 采样器成对"，故绑定重排为 inputTexture@0 + 采样器@1 + outputTexture@2，
 *   数据侧的 bindGroup 同步调整。
 */
// 缓存一律 lazy-init：模块级 `new Map()` 属「import 即执行」（R2，issue #88）
let cache2D: Map<string, { vertex: string; fragment: string }> | null = null;

function getCache2D(): Map<string, { vertex: string; fragment: string }>
{
    if (cache2D === null) cache2D = new Map();

    return cache2D;
}

/**
 * 获取 2D / 2D-array 纹理生成 mipmap 所用的 vertex / fragment WGSL。
 *
 * @param isArray 是否 2D 纹理数组（决定 texture 类型与采样坐标）
 * @returns vertex / fragment 的 WGSL 文本
 */
export function getGenerateMipmapWGSL(isArray: boolean): { vertex: string; fragment: string }
{
    const key = isArray ? '2d-array' : '2d';
    const cached = getCache2D().get(key);

    if (cached !== undefined) return cached;

    const vertexIndex = uint(builtin('gl_VertexID'));
    const positions = arrayWithValues(vec2, [
        vec2(-1.0, -1.0), vec2(-1.0, 3.0), vec2(3.0, -1.0),
    ]);

    const vout_texcoord = vec2(varying('texcoord', 0));

    const vertexShader = vertex('vs', () =>
    {
        const xy = let_('xy', positions.index(vertexIndex) as Vec2Value) as Vec2Value;

        gl_Position.assign(vec4(xy, 0.0, 1.0) as Vec4Value);
        // texcoord = xy * vec2f(0.5, -0.5) + vec2f(0.5)
        vout_texcoord.assign(xy.multiply(vec2(0.5, -0.5)).add(vec2(0.5, 0.5)) as Vec2Value);
    });

    const vin_texcoord = vec2(varying('texcoord', 0));

    const fragmentShader = fragment('fs', () =>
    {
        if (isArray)
        {
            const arraySampler = sampler2DArray(uniform('ourSampler', 0, 0));

            // 与手写的 textureSample(tex, s, uv, 0u) 等价：z 分量即层号
            return_(texture(arraySampler, vec3(vin_texcoord, 0.0) as Vec3Value) as Vec4Value);

            return;
        }
        const ourSampler = sampler2D(uniform('ourSampler', 0, 0));

        return_(texture(ourSampler, vin_texcoord) as Vec4Value);
    });

    const result = { vertex: vertexShader.toWGSL(), fragment: fragmentShader.toWGSL(vertexShader) };

    getCache2D().set(key, result);

    return result;
}

/** 3D 版本的缓存（按存储格式分别缓存）；同样 lazy-init（R2） */
let cache3D: Map<string, string> | null = null;

function getCache3D(): Map<string, string>
{
    if (cache3D === null) cache3D = new Map();

    return cache3D;
}

/**
 * 获取 3D 纹理生成 mipmap 所用的计算着色器 WGSL。
 *
 * @param storageFormat 输出存储纹理的格式（如 'rgba8unorm'）
 * @returns WGSL 文本
 */
export function getGenerateMipmap3DWGSL(storageFormat: string): string
{
    const cached = getCache3D().get(storageFormat);

    if (cached !== undefined) return cached;

    const inputTexture = sampler3D(uniform('inputTexture', 0, 0));
    const outputTexture = storageTexture3D(uniform('outputTexture', 0, 2), storageFormat);

    const wgsl = compute('main', [4, 4, 4], () =>
    {
        const globalId = uvec3(builtin('global_invocation_id')) as Uvec3Value;
        const outputSize = let_('outputSize', textureDimensions(outputTexture)) as Uvec3Value;

        // if (x >= size.x || y >= size.y || z >= size.z) { return; }
        const outOfBounds = (globalId.x as ReturnType<typeof uint>).greaterThan(outputSize.x as ReturnType<typeof uint>)
            .or((globalId.y as ReturnType<typeof uint>).greaterThan(outputSize.y as ReturnType<typeof uint>))
            .or((globalId.z as ReturnType<typeof uint>).greaterThan(outputSize.z as ReturnType<typeof uint>));

        if_(outOfBounds, () =>
        {
            return_();
        });

        // texCoord = (vec3<f32>(globalId) + vec3<f32>(0.5)) / vec3<f32>(outputSize)
        const idF = let_('idF', vec3(
            float(globalId.x as ReturnType<typeof uint>),
            float(globalId.y as ReturnType<typeof uint>),
            float(globalId.z as ReturnType<typeof uint>),
        ) as Vec3Value) as Vec3Value;
        const sizeF = let_('sizeF', vec3(
            float(outputSize.x as ReturnType<typeof uint>),
            float(outputSize.y as ReturnType<typeof uint>),
            float(outputSize.z as ReturnType<typeof uint>),
        ) as Vec3Value) as Vec3Value;
        const texCoord = let_('texCoord', idF.add(vec3(0.5, 0.5, 0.5)).divide(sizeF) as Vec3Value) as Vec3Value;

        // textureSampleLevel(inputTexture, textureSampler, texCoord, 0.0)
        const color = let_('color', textureLod(inputTexture, texCoord, 0.0) as Vec4Value) as Vec4Value;

        textureStore(outputTexture, globalId, color);
    }).toWGSL();

    getCache3D().set(storageFormat, wgsl);

    return wgsl;
}
