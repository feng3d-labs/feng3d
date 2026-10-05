/**
 * deferredRendering 示例的灯光更新计算着色器（原 `lightUpdate.wgsl` 的 TSL 版）。
 *
 * 对照手写：每帧把每盏灯沿 y 下移一点，落到下限就回到上限——一个简单的循环动画。
 *
 * 四处说明：
 * 1. `@compute @workgroup_size(64, 1, 1)` 用 compute(name, [64, 1, 1], body)；
 * 2. `GlobalInvocationID.x` 用 builtin('global_invocation_id')；
 * 3. storage 用 access: 'read_write'；`lightsBuffer.lights[index].position.y` 这类
 *    成员分量赋值——storageBuffer.index(i) 返回的就是结构体实例，分量可直接赋值；
 * 4. 越界提前 `return;` 用 return_()。
 */
import { assign, builtin, compute, float, floor, if_, let_, return_, storageBuffer, struct, uint, uniform, uvec3, var_, vec3, vec4 } from '@feng3d/tsl';

type Vec4Value = ReturnType<typeof vec4>;
type FloatValue = ReturnType<typeof float>;
type UIntValue = ReturnType<typeof uint>;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取灯光更新的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getLightUpdateWGSL(): string
{
    if (cached === null)
    {
        const LightData = struct('LightData', { position: vec4, color: vec3, radius: float });
        const lightExtentStruct = struct('LightExtent', { min: vec4, max: vec4 });
        const Config = struct('Config', { numLights: uint });

        const lightsBuffer = storageBuffer('lightsBuffer', {
            elementType: LightData,
            access: 'read_write',
            group: 0,
            binding: 0,
        });
        const config = Config(uniform('config', 0, 1)) as unknown as { numLights: UIntValue };
        const lightExtent = lightExtentStruct(uniform('lightExtent', 0, 2)) as unknown as {
            min: Vec4Value;
            max: Vec4Value;
        };

        cached = compute('main', [64, 1, 1], () =>
        {
            const globalId = uvec3(builtin('global_invocation_id'));
            const index = var_('index', globalId.x as UIntValue) as UIntValue;

            // if (index >= config.numLights) return;
            if_(index.greaterThan(config.numLights), () =>
            {
                return_();
            });

            const light = lightsBuffer.index(index) as unknown as { position: Vec4Value };

            // position.y -= 0.5 + 0.003 * (f32(index) - 64.0 * floor(f32(index) / 64.0))
            const indexF = let_('indexF', float(index) as FloatValue) as FloatValue;
            const wrapped = let_('wrapped', indexF.subtract(float(64.0).multiply(floor(indexF.divide(float(64.0))) as FloatValue)) as FloatValue) as FloatValue;
            const delta = let_('delta', float(0.5).add(float(0.003).multiply(wrapped) as FloatValue) as FloatValue) as FloatValue;

            assign(light.position.y as never, (light.position.y as FloatValue).subtract(delta) as never);

            // if (position.y < lightExtent.min.y) position.y = lightExtent.max.y;
            if_((light.position.y as FloatValue).lessThan(lightExtent.min.y as FloatValue), () =>
            {
                assign(light.position.y as never, lightExtent.max.y as never);
            });
        }).toWGSL();
    }

    return cached;
}
