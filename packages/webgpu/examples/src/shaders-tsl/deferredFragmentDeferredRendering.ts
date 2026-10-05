/**
 * deferredRendering 示例的延迟着色片元着色器（原 \`fragmentDeferredRendering.wgsl\` 的 TSL 版）。
 *
 * 对照手写：读三张 G-Buffer（**裸纹理**，只被 textureLoad 读取）、
 * 遍历灯光 storage 数组做 Lambert 光照、最后加一点环境光。
 *
 * 三处说明：
 * 1. 三张 G-Buffer 是**裸纹理**（本批新增 textureOnly 能力）；
 * 2. 手写把 storage 包成 \`struct LightsBuffer { lights: array<LightData> }\` 只为写
 *    \`lightsBuffer.lights[i]\`；TSL 直接声明 \`array<LightData>\`（存储布局相同）；
 * 3. \`continue\` 用 continue_()、丢弃用 discard()；循环用 forU32_（上界是运行期的 config.numLights）。
 */
import { builtin, continue_, discard, dot, float, floor, forU32_, fragment, if_, ivec2, length, let_, max, normalize, pow, return_, sampler2D, storageBuffer, struct, texelFetch, uint, uniform, var_, vec2, vec3, vec4 } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取片元着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getDeferredFragmentDeferredRenderingWGSL(): string
{
    if (cached === null)
    {
        // 三张 G-Buffer：裸纹理（只声明 texture_2d，不带 sampler）
        const gBufferPosition = sampler2D(uniform('gBufferPosition', 0, 0), { textureOnly: true });
        const gBufferNormal = sampler2D(uniform('gBufferNormal', 0, 1), { textureOnly: true });
        const gBufferAlbedo = sampler2D(uniform('gBufferAlbedo', 0, 2), { textureOnly: true });

        const LightData = struct('LightData', { position: vec4, color: vec3, radius: float });
        const lightsBuffer = storageBuffer('lightsBuffer', { elementType: LightData, access: 'read', group: 1, binding: 0 });

        const Config = struct('Config', { numLights: uint });
        const config = Config(uniform('config', 1, 1)) as unknown as { numLights: ReturnType<typeof uint> };

        const coord = vec4(builtin('gl_FragCoord'));

        cached = fragment('main', () =>
        {
            const texel = let_('texel', ivec2(floor(coord.xy as Vec2Value)));
            const position = let_('position', texelFetch(gBufferPosition, texel).xyz as Vec3Value);

            if_(position.z.greaterThan(10000.0), () =>
            {
                discard();
            });

            const normal = let_('normal', texelFetch(gBufferNormal, texel).xyz as Vec3Value);
            const albedo = let_('albedo', texelFetch(gBufferAlbedo, texel).xyz as Vec3Value);

            const result = var_('result', vec3(0.0, 0.0, 0.0) as Vec3Value);

            forU32_('i', 0, config.numLights, (i) =>
            {
                // storageBuffer.index() 的返回类型是 ShaderValue；这里断言成结构体元素的形状（与 round 35 同类处理）
                const light = lightsBuffer.index(i) as unknown as {
                    position: Vec4Value;
                    color: Vec3Value;
                    radius: ReturnType<typeof float>;
                };
                const L = let_('L', (light.position.xyz as Vec3Value).subtract(position) as Vec3Value);
                const distance = let_('distance', length(L));

                if_(distance.greaterThan(light.radius), () =>
                {
                    continue_();
                });

                const lambert = let_('lambert', max(dot(normal, normalize(L) as Vec3Value), float(0.0)));
                // lambert * pow(1 - distance / radius, 2) * lightColor * albedo
                const falloff = let_('falloff', pow(float(1.0).subtract(distance.divide(light.radius)), float(2.0)));

                result.assign(result.add(
                    falloff.multiply(lambert).multiply(light.color).multiply(albedo) as Vec3Value,
                ));
            });

            // some manual ambient
            result.assign(result.add(vec3(0.2, 0.2, 0.2) as Vec3Value));

            return_(vec4(result, 1.0) as Vec4Value);
        }).toWGSL();
    }

    return cached;
}
