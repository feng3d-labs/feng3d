import { assign, atomicAdd, builtin, compute, float, func, if_, let_, return_, statement, storageBuffer, struct, switch_, uint, uniform, uvec2, uvec3, var_, void_, workgroupBarrier } from '@feng3d/tsl';

export const computeArgKeys = ['width', 'height', 'algo', 'blockHeight'];

type FloatValue = ReturnType<typeof float>;
type UIntValue = ReturnType<typeof uint>;
type Uvec2Value = ReturnType<typeof uvec2>;

/** 按 workgroupSize 缓存生成结果（同一尺寸重复调用直接复用） */
let cache: Map<number, string> | null = null;

function getCache(): Map<number, string>
{
    if (cache === null) cache = new Map();

    return cache;
}

/**
 * Naive bitonic sort 的 compute 着色器（原 `bitonicCompute.ts` 内联手写 WGSL 的 TSL 版）。
 *
 * 与手写逐块对应：
 * - `struct Uniforms` → `struct('Uniforms', …)` + `uniform('uniforms', 0, 2)`；
 * - `var<workgroup> local_data: array<u32, N>` → `storageBuffer(…, { addressSpace: 'workgroup', length: N })`；
 * - `counter: atomic<u32>` → `storageBuffer(…, { atomic: true, array: false })` + `atomicAdd`；
 * - 4 个辅助函数 → `func()`（3 个无返回值用 `void_`，调用处用 `statement()` 挂成语句）；
 * - `switch uniforms.algo { case 1: … }` → `switch_(…, sw => { sw.case_(1, …) })`。
 *
 * **签名与手写保持一致**（返回 WGSL 字符串），所以三个调用点无需改动。
 *
 * 几处有意的等价改写（**语义不变**，都有注释说明）：
 * - `uniforms.algo <= 2` → `algo < 3`（UInt 没有 lessThanOrEqual；整数域上等价）；
 * - `var temp: u32 = local_data[a]` → `let temp = …`（只读一次，let 更合适）；
 * - 手写的 `const ALGO_*` 常量在 TS 侧用同名常量内联（生成的字面量相同）。
 *
 * @param workgroupSize 工作组尺寸（必须是偶数且 ≤ 256，否则回退到 256）
 * @returns 该尺寸对应的 WGSL 文本
 */
export const NaiveBitonicCompute = (workgroupSize: number) =>
{
    if (workgroupSize % 2 !== 0 || workgroupSize > 256)
    {
        workgroupSize = 256;
    }

    const cached = getCache().get(workgroupSize);

    if (cached !== undefined) return cached;
    const wgsl = build(workgroupSize);

    getCache().set(workgroupSize, wgsl);

    return wgsl;
};

/** 手写的 `const ALGO_*` 常量（TS 侧同名，生成时内联为字面量） */
const ALGO_LOCAL_DISPERSE = 2;

/** 生成指定 workgroupSize 的 WGSL */
function build(workgroupSize: number): string
{
    const Uniforms = struct('Uniforms', {
        width: float,
        height: float,
        algo: uint,
        blockHeight: uint,
    });

    // 工作组共享内存（同组内共享，无 @group/@binding）
    const localData = storageBuffer('local_data', {
        elementType: uint,
        addressSpace: 'workgroup',
        length: workgroupSize * 2,
    });
    const inputData = storageBuffer('input_data', { elementType: uint, group: 0, binding: 0 });
    const outputData = storageBuffer('output_data', { elementType: uint, group: 0, binding: 1, access: 'read_write' });
    const uniforms = Uniforms(uniform('uniforms', 0, 2)) as unknown as {
        width: FloatValue;
        algo: UIntValue;
        blockHeight: UIntValue;
    };
    const counter = storageBuffer('counter', {
        elementType: uint, group: 0, binding: 3, access: 'read_write', atomic: true, array: false,
    });

    /** local_data[i]（共享内存的读写都要经它） */
    const at = (i: ReturnType<typeof uint> | number) => localData.index(i as never) as UIntValue;

    // fn local_compare_and_swap(idx_before, idx_after)
    const localCompareAndSwap = func('local_compare_and_swap', [['idx_before', uint], ['idx_after', uint]], void_, (idxBefore, idxAfter) =>
    {
        if_(at(idxAfter).lessThan(at(idxBefore)), () =>
        {
            atomicAdd(counter, 1);

            const temp = let_('temp', at(idxBefore)) as UIntValue;

            assign(at(idxBefore) as never, at(idxAfter) as never);
            assign(at(idxAfter) as never, temp as never);
        });
        return_();
    });

    // fn get_flip_indices(invoke_id, block_height) -> vec2u
    const getFlipIndices = func('get_flip_indices', [['invoke_id', uint], ['block_height', uint]], uvec2, (invokeId, blockHeight) =>
    {
        // let block_offset: u32 = ((2 * invoke_id) / block_height) * block_height;
        const blockOffset = let_('block_offset', invokeId.multiply(uint(2)).divide(blockHeight).multiply(blockHeight) as UIntValue) as UIntValue;
        const halfHeight = let_('half_height', blockHeight.divide(uint(2)) as UIntValue) as UIntValue;
        const idx = var_('idx', uvec2(
            invokeId.modulo(halfHeight),
            blockHeight.subtract(invokeId.modulo(halfHeight)).subtract(uint(1)),
        ) as Uvec2Value) as Uvec2Value;

        assign(idx.x as never, idx.x.add(blockOffset) as never);
        assign(idx.y as never, idx.y.add(blockOffset) as never);

        return_(idx);
    });

    // fn get_disperse_indices(invoke_id, block_height) -> vec2u
    const getDisperseIndices = func('get_disperse_indices', [['invoke_id', uint], ['block_height', uint]], uvec2, (invokeId, blockHeight) =>
    {
        const blockOffset = var_('block_offset', invokeId.multiply(uint(2)).divide(blockHeight).multiply(blockHeight) as UIntValue) as UIntValue;
        const halfHeight = let_('half_height', blockHeight.divide(uint(2)) as UIntValue) as UIntValue;
        const idx = var_('idx', uvec2(
            invokeId.modulo(halfHeight),
            invokeId.modulo(halfHeight).add(halfHeight),
        ) as Uvec2Value) as Uvec2Value;

        assign(idx.x as never, idx.x.add(blockOffset) as never);
        assign(idx.y as never, idx.y.add(blockOffset) as never);

        return_(idx);
    });

    // fn global_compare_and_swap(idx_before, idx_after)
    const globalCompareAndSwap = func('global_compare_and_swap', [['idx_before', uint], ['idx_after', uint]], void_, (idxBefore, idxAfter) =>
    {
        if_(inputData.index(idxAfter as never).lessThan(inputData.index(idxBefore as never)), () =>
        {
            assign(outputData.index(idxBefore as never) as never, inputData.index(idxAfter as never) as never);
            assign(outputData.index(idxAfter as never) as never, inputData.index(idxBefore as never) as never);
        });
        return_();
    });

    return compute('computeMain', [workgroupSize, 1, 1], () =>
    {
        const globalId = uvec3(builtin('global_invocation_id')) as ReturnType<typeof uvec3>;
        const localId = uvec3(builtin('local_invocation_id')) as ReturnType<typeof uvec3>;
        const workgroupId = uvec3(builtin('workgroup_id')) as ReturnType<typeof uvec3>;

        // let offset = N * 2 * workgroup_id.x;
        const offset = let_('offset', workgroupId.x.multiply(uint(workgroupSize * 2)) as UIntValue) as UIntValue;

        // if (uniforms.algo <= 2) { local_data[...] = input_data[...] }（<= 2 等价于 < 3）
        if_(uniforms.algo.lessThan(uint(ALGO_LOCAL_DISPERSE + 1)), () =>
        {
            assign(at(localId.x.multiply(uint(2))) as never, inputData.index(offset.add(localId.x.multiply(uint(2))) as never) as never);
            assign(at(localId.x.multiply(uint(2)).add(uint(1))) as never, inputData.index(offset.add(localId.x.multiply(uint(2))).add(uint(1)) as never) as never);
        });

        workgroupBarrier();

        switch_(uniforms.algo, (sw) =>
        {
            sw.case_(1, () =>
            {
                const idx = let_('idx', getFlipIndices(localId.x, uniforms.blockHeight) as Uvec2Value) as Uvec2Value;

                statement(localCompareAndSwap(idx.x, idx.y));
            });
            sw.case_(2, () =>
            {
                const idx = let_('idx', getDisperseIndices(localId.x, uniforms.blockHeight) as Uvec2Value) as Uvec2Value;

                statement(localCompareAndSwap(idx.x, idx.y));
            });
            sw.case_(3, () =>
            {
                const idx = let_('idx', getFlipIndices(globalId.x, uniforms.blockHeight) as Uvec2Value) as Uvec2Value;

                statement(globalCompareAndSwap(idx.x, idx.y));
            });
            sw.case_(4, () =>
            {
                const idx = let_('idx', getDisperseIndices(globalId.x, uniforms.blockHeight) as Uvec2Value) as Uvec2Value;

                statement(globalCompareAndSwap(idx.x, idx.y));
            });
            sw.default_(() =>
            {
                // 手写是空分支
            });
        });

        // 确保所有调用都完成了各自区域的数据交换
        workgroupBarrier();

        // if (uniforms.algo <= ALGO_LOCAL_DISPERSE) { output_data[...] = local_data[...] }
        if_(uniforms.algo.lessThan(uint(ALGO_LOCAL_DISPERSE + 1)), () =>
        {
            assign(outputData.index(offset.add(localId.x.multiply(uint(2))) as never) as never, at(localId.x.multiply(uint(2))) as never);
            assign(outputData.index(offset.add(localId.x.multiply(uint(2))).add(uint(1)) as never) as never, at(localId.x.multiply(uint(2)).add(uint(1))) as never);
        });
    }).toWGSL();
}
