/**
 * 二分查找插入位置,如果有多个则返回第一个
 * @param array 数组
 * @param target 寻找的目标
 * @param compare 比较函数
 * @param start 起始位置
 * @param end 结束位置
 * @returns          目标所在位置（如果该位置上不是目标对象，则该索引为该目标可插入的位置）
 */
export function binarySearchInsert<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number
{
    if (start === undefined) start = 0;
    if (end === undefined) end = array.length;
    if (start == end)
        return start;
    if (compare(array[start], target) == 0)
    {
        return start;
    }
    var middle = ~~((start + end) / 2);
    if (compare(array[middle], target) < 0)
    {
        start = middle + 1;
    }
    else
    {
        end = middle;
    }
    return binarySearchInsert(array, target, compare, start, end);
}