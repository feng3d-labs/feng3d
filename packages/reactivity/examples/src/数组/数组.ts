export function 数组取值(ref: <T>(value?: T) => { value: T }, computed: <T>(func: (oldValue?: T) => T) => { readonly value: T }, count: number)
{
    const result = { time: undefined, values: [] };

    const arr:{
        value: number;
    }[] = new Array(10000).fill(0).map(() => ref(0));

    const cb = computed(() =>
    {
        return arr.reduce((prev, curr) => prev + curr.value, 0);
    });

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // arr[0].value++; // 修改第一个元素
        arr[9999].value++; // 修改最后一个元素
        cb.value;
    }
    result.time = performance.now() - start;

    result.values.push(cb.value);

    return result;
}