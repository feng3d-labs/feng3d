/**
 * computeBoids 的粒子更新 compute 着色器（原 `updateSprites.wgsl` 的 TSL 版）。
 *
 * 逐句对照手写；四处说明：
 *
 * 1. 手写把 storage 包了一层 `struct Particles { particles: array<Particle> }`，
 *    只为能写 `arrayLength(&particlesA.particles)`。TSL 里直接声明
 *    `var<storage, read> particlesA: array<Particle>`，用 `arrayLength(particlesA)`——
 *    存储布局都是"一段连续的 Particle"，**等价**；
 * 2. `continue` 用 `continue_()`（`continue` 是 JS 保留字）；
 * 3. 越界回绕的四段是**向量分量赋值**（`vPos.x = 1.0`），用 `assign(vPos.x, ...)`；
 * 4. 手写的 `var pos: vec2<f32>;`（无初始化）对应 `var_('pos', vec2)`。
 */
import { assign, builtin, clamp, compute, continue_, distance, float, forU32_, if_, length, let_, normalize, storageBuffer, struct, uint, uniform, uvec3, var_, vec2 } from '@feng3d/tsl';
import { arrayLength } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type FloatValue = ReturnType<typeof float>;

/** 元素结构体的成员形状（TSL 的 StorageBuffer<T> 泛型对结构体元素不够精确，这里显式标注） */
interface ParticleValue { pos: Vec2Value; vel: Vec2Value }

/** 懒构建缓存 */
let cachedUpdateSprites: string | null = null;

/**
 * 获取 computeBoids 的 updateSprites compute 着色器 WGSL。
 *
 * @returns WGSL 文本
 */
export function getUpdateSpritesWGSL(): string
{
    if (cachedUpdateSprites === null)
    {
        cachedUpdateSprites = buildUpdateSprites();
    }

    return cachedUpdateSprites;
}

function buildUpdateSprites(): string
{
    // ---- 结构体与绑定（与手写同槽位）----
    const Particle = struct('Particle', { pos: vec2, vel: vec2 });
    const SimParams = struct('SimParams', {
        deltaT: float,
        rule1Distance: float,
        rule2Distance: float,
        rule3Distance: float,
        rule1Scale: float,
        rule2Scale: float,
        rule3Scale: float,
    });

    const params = SimParams(uniform('params', 0, 0)) as unknown as {
        deltaT: FloatValue;
        rule1Distance: FloatValue;
        rule2Distance: FloatValue;
        rule3Distance: FloatValue;
        rule1Scale: FloatValue;
        rule2Scale: FloatValue;
        rule3Scale: FloatValue;
    };

    const particlesA = storageBuffer('particlesA', { elementType: Particle, group: 0, binding: 1 });
    const particlesB = storageBuffer('particlesB', { elementType: Particle, access: 'read_write', group: 0, binding: 2 });
    const grid = uvec3(builtin('global_invocation_id'));

    return compute('main', [64], () =>
    {
        const index = let_('index', grid.x);

        const selfA = particlesA.index(index) as unknown as ParticleValue;
        const vPos = var_('vPos', selfA.pos);
        const vVel = var_('vVel', selfA.vel);
        const cMass = var_('cMass', vec2(0.0, 0.0));
        const cVel = var_('cVel', vec2(0.0, 0.0));
        const colVel = var_('colVel', vec2(0.0, 0.0));
        const cMassCount = var_('cMassCount', uint(0));
        const cVelCount = var_('cVelCount', uint(0));
        const pos = var_('pos', vec2);
        const vel = var_('vel', vec2);

        forU32_('i', 0, arrayLength(particlesA), (i) =>
        {
            // if i == index { continue; }
            if_(i.equals(index), () =>
            {
                continue_();
            });

            const other = particlesA.index(i) as unknown as ParticleValue;

            pos.assign(other.pos);
            vel.assign(other.vel);

            // rule1：向群体中心靠拢
            if_(distance(pos, vPos).lessThan(params.rule1Distance), () =>
            {
                cMass.assign(cMass.add(pos));
                assign(cMassCount, cMassCount.add(1));
            });
            // rule2：避免碰撞
            if_(distance(pos, vPos).lessThan(params.rule2Distance), () =>
            {
                colVel.assign(colVel.subtract(pos.subtract(vPos)));
            });
            // rule3：速度对齐
            if_(distance(pos, vPos).lessThan(params.rule3Distance), () =>
            {
                cVel.assign(cVel.add(vel));
                assign(cVelCount, cVelCount.add(1));
            });
        });

        // cMass = (cMass / vec2(f32(cMassCount))) - vPos
        if_(cMassCount.greaterThan(0), () =>
        {
            // 手写是 vec2(f32(cMassCount))（标量广播）；TSL 的 vec2() 不接受单个 Float，写成 (x, x) 等价
            const massCountF = float(cMassCount);

            cMass.assign(cMass.divide(vec2(massCountF, massCountF)).subtract(vPos));
        });
        if_(cVelCount.greaterThan(0), () =>
        {
            const velCountF = float(cVelCount);

            cVel.assign(cVel.divide(vec2(velCountF, velCountF)));
        });

        vVel.assign(vVel.add(
            cMass.multiply(params.rule1Scale)
                .add(colVel.multiply(params.rule2Scale))
                .add(cVel.multiply(params.rule3Scale)),
        ));

        // clamp velocity for a more pleasing simulation
        vVel.assign(normalize(vVel).multiply(clamp(length(vVel), float(0.0), float(0.1))));
        // kinematic update
        vPos.assign(vPos.add(vVel.multiply(params.deltaT)));

        // Wrap around boundary（向量分量赋值）
        if_(vPos.x.lessThan(-1.0), () =>
        {
            assign(vPos.x as never, float(1.0));
        });
        if_(vPos.x.greaterThan(1.0), () =>
        {
            assign(vPos.x as never, float(-1.0));
        });
        if_(vPos.y.lessThan(-1.0), () =>
        {
            assign(vPos.y as never, float(1.0));
        });
        if_(vPos.y.greaterThan(1.0), () =>
        {
            assign(vPos.y as never, float(-1.0));
        });

        // Write back
        const selfB = particlesB.index(index) as unknown as ParticleValue;

        assign(selfB.pos as never, vPos as never);
        assign(selfB.vel as never, vVel as never);
    }).toWGSL();
}

/** 里层的 `0u`（写成函数是为了不在模块顶层构造表达式） */
function uintOfZero(): never
{
    throw new Error('占位');
}

/** `clamp(x, 0.0, 0.1)` 的替代占位 */
function maxOf(_a: number, _b: number): never
{
    throw new Error('占位');
}
