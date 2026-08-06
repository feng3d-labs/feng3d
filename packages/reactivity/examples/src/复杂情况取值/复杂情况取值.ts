export function 复杂情况取值(ref: <T>(value?: T) => { value: T }, computed: <T>(func: (oldValue?: T) => T) => { readonly value: T }, count: number)
{
    const result = { time: undefined, values: [] };

    const b = ref(2);

    function 递归(depth = 10)
    {
        if (depth <= 0) return computed(() =>
        {
            return b.value;
        }).value;

        return computed(() =>
        {
            return 递归(depth - 1) + 递归(depth - 2);
        }).value;
    }

    const cb = computed(() =>
    {
        return 递归(16);
    });

    b.value++;
    cb.value;

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        ref(1).value++; // 添加此行代码将会导致 @vue/reactivity 版本的性能下降，而 @feng3d/reactivity 版本的性能保持不变

        cb.value;
    }
    result.time = performance.now() - start;

    result.values.push(cb.value);

    return result;
}