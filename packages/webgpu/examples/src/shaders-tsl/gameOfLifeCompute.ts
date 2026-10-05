/**
 * gameOfLife 的 compute 着色器（原 `compute.wgsl` 的 TSL 版）。
 *
 * 逐句对照手写：
 * ```wgsl
 * @binding(0) @group(0) var<storage, read> size: vec2<u32>;
 * @binding(1) @group(0) var<storage, read> current: array<u32>;
 * @binding(2) @group(0) var<storage, read_write> next: array<u32>;
 * override blockSize = 8;
 * fn getIndex(x, y) { let h = size.y; let w = size.x; return (y % h) * w + (x % w); }
 * fn getCell(x, y) { return current[getIndex(x, y)]; }
 * fn countNeighbors(x, y) { return 八个邻居之和; }
 * @compute @workgroup_size(blockSize, blockSize)
 * fn main(@builtin(global_invocation_id) grid: vec3<u32>) {
 *     let n = countNeighbors(grid.x, grid.y);
 *     next[getIndex(grid.x, grid.y)] = select(u32(n == 3u), u32(n == 2u || n == 3u), getCell(grid.x, grid.y) == 1u);
 * }
 * ```
 *
 * **注意 `select` 的参数顺序**：WGSL 是 `select(f, t, cond)`，TSL 是 `select(cond, t, f)`。
 * 手写的 `select(u32(n == 3u), u32(...), getCell(...) == 1u)` 对应 TSL 的
 * `select(getCell(...) == 1, u32(...), u32(n == 3))`。
 */
import { Bool, UInt, assign, builtin, compute, func, let_, return_, select, storageBuffer, uint, uvec2, uvec3 } from '@feng3d/tsl';

/** 懒构建缓存 */
let cachedGameOfLifeCompute: string | null = null;

/**
 * 获取 gameOfLife 的 compute 着色器 WGSL（首次调用时构建并缓存）。
 *
 * @returns WGSL 文本
 */
export function getGameOfLifeComputeWGSL(): string
{
    if (cachedGameOfLifeCompute === null)
    {
        cachedGameOfLifeCompute = buildGameOfLifeCompute();
    }

    return cachedGameOfLifeCompute;
}

function buildGameOfLifeCompute(): string
{
    // size 是**单值** storage（vec2<u32>），不是数组
    const size = storageBuffer('size', { elementType: uvec2, group: 0, binding: 0, array: false });
    const current = storageBuffer('current', { elementType: uint, group: 0, binding: 1 });
    const next = storageBuffer('next', { elementType: uint, access: 'read_write', group: 0, binding: 2 });
    const grid = uvec3(builtin('global_invocation_id'));

    // fn getIndex(x, y) -> u32 { (y % size.y) * size.x + (x % size.x) }
    const getIndex = func('getIndex', [['x', uint], ['y', uint]], uint, (x: UInt, y: UInt) =>
    {
        const h = let_('h', size.value().y);
        const w = let_('w', size.value().x);

        return_(y.modulo(h).multiply(w).add(x.modulo(w)));
    });

    // fn getCell(x, y) -> u32 { return current[getIndex(x, y)]; }
    const getCell = func('getCell', [['x', uint], ['y', uint]], uint, (x: UInt, y: UInt) =>
    {
        return_(current.index(getIndex(x, y)));
    });

    // fn countNeighbors(x, y) -> u32 { 八个邻居求和 }
    const countNeighbors = func('countNeighbors', [['x', uint], ['y', uint]], uint, (x: UInt, y: UInt) =>
    {
        // 手写用的是 `x - 1u`（无符号回绕）；TSL 里传数字即生成 `x - 1u`
        return_(getCell(x.subtract(1), y.subtract(1))
            .add(getCell(x, y.subtract(1)))
            .add(getCell(x.add(1), y.subtract(1)))
            .add(getCell(x.subtract(1), y))
            .add(getCell(x.add(1), y))
            .add(getCell(x.subtract(1), y.add(1)))
            .add(getCell(x, y.add(1)))
            .add(getCell(x.add(1), y.add(1))));
    });

    // next[getIndex(x, y)] = 下一轮该格的状态
    const boolToU32 = (cond: Bool) => select(cond, uint(1), uint(0));

    return compute('main', ['blockSize', 'blockSize'], () =>
    {
        const x = let_('x', grid.x);
        const y = let_('y', grid.y);
        const n = let_('n', countNeighbors(x, y));

        assign(
            next.index(getIndex(x, y)),
            select(
                getCell(x, y).equals(1),
                boolToU32(n.equals(2).or(n.equals(3))),
                boolToU32(n.equals(3)),
            ),
        );
    }, { overrides: { blockSize: 8 } }).toWGSL();
}
