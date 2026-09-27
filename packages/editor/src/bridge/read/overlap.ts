/** 一个可渲染对象的世界中心（`scene.validate` 的重叠检测用它） */
export interface ObjectCenter
{
    readonly objectId: string;
    readonly center: { readonly x: number, readonly y: number, readonly z: number };
}

/** 中心距离小于它就算"完全重合"（三轴都要满足） */
export const OVERLAP_EPSILON = 1e-4;

/**
 * 找出"中心完全重合"的对象配对（`A / B` 形式的字符串，已排序）。
 *
 * ## 为什么要抽出来
 *
 * 原实现是两两比较（O(n²)）：206 个可渲染对象约 2.1 万次尚可，上千个就是百万级，
 * 而桥接在浏览器主线程**同步**执行——足以让长轮询超时（issue #139 项 8）。
 *
 * ## 为什么排序 + 滑动窗口是**等价的**
 *
 * 判据要求 x / y / z 三轴差值都小于 {@link OVERLAP_EPSILON}。先按 x 升序排列后，
 * 对每个 i 只需要向后看 x 差仍小于阈值的那些 j（一旦达到阈值就 `break`）——
 * x 不接近的配对本来就不可能满足判据，因此**配对集合与两两比较完全一致**。
 * 比较次数从 O(n²) 降到"每个对象与 x 相近的少数几个"（最坏情形仍是 O(n²)，例如所有对象 x 相同）。
 *
 * 输出按字符串排序，使结果与输入顺序无关（原先依赖 `renderCenters` 的数组顺序）。
 *
 * @param entries 参与检测的对象及其世界中心
 * @returns 重合配对（`idA / idB`，已排序）
 */
export function findOverlappingPairs(entries: readonly ObjectCenter[]): string[]
{
    const byX = [...entries].sort((a, b) => a.center.x - b.center.x);
    const overlaps: string[] = [];

    for (let i = 0; i < byX.length; i++)
    {
        for (let j = i + 1; j < byX.length; j++)
        {
            // 已排序：x 差一旦达到阈值，后面的只会更远
            if (byX[j].center.x - byX[i].center.x >= OVERLAP_EPSILON) break;

            const a = byX[i].center;
            const b = byX[j].center;
            if (Math.abs(a.y - b.y) < OVERLAP_EPSILON && Math.abs(a.z - b.z) < OVERLAP_EPSILON)
            {
                // 配对内部也排序：否则 "A / B" 还是 "B / A" 取决于 x 排序结果，
                // 同一份数据换个输入顺序就会给出不同的字符串（输出应当完全确定）
                const pair = [byX[i].objectId, byX[j].objectId].sort();
                overlaps.push(`${pair[0]} / ${pair[1]}`);
            }
        }
    }

    return overlaps.sort();
}
