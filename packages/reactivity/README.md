# @feng3d/reactivity

feng3d的响应式库，使用方式以及API与@vue/reactivity基本保持一致。

源码：https://gitee.com/feng3d/reactivity

文档：https://feng3d.com/reactivity

## 网站

https://feng3d.com/reactivity

## 安装
```
npm install @feng3d/reactivity
```

## 快速开始

```ts
import { ref, computed } from "@feng3d/reactivity";

const a = ref(1);
const b = ref(2);
const c = computed(() => a.value + b.value);

console.log(c.value); // 3
a.value = 3;
console.log(c.value); // 5
```

## 缘由
在feng3d引擎中使用`@vue/reactivity`代替`@feng3d/watcher`来维护数据驱动功能时发现性能严重下降。

为了解决这个问题，我重新实现了一个响应式库，并且在性能上进行了优化。

### 问题示例

示例： https://feng3d.com/reactivity/#复杂情况取值

| 运行库 | 性能(ms) | 速度(x) |
| --- | --- | --- |
| @feng3d/reactivity | 2.8 | 286 |
| @vue/reactivity | 801 | 1 |

### 测试代码
```ts
复杂情况取值(ref, computed, 10000);

export function 复杂情况取值(ref: <T>(value?: T) => { value: T }, computed: <T>(func: (oldValue?: T) => T) => { readonly value: T }, count: number)
{
    const result = { time: undefined, values: [] };

    const b = ref(2);

    function 递归(depth = 10)
    {
        if (depth <= 0) return computed(() =>
        {
            return b.value
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
```

### 分析
@feng3d/reactivity自下而上的使用脏标记进行维护状态，当发生变化时只会冒泡一次到父节点，全局有变化时（ref(1).value++ 标记变化）并不会触发重新计算。
@vue/reactivity自上而下的使用版本号进行维护状态，当全局有变化时（ref(1).value++ 标记变化）每次取值时都会遍历整个树的子节点比对版本号判断是否需要重新计算。

## 性能情况
### 使用不同方式维护子节点

// 修改第一个元素 `arr[0].value++;`
| 方式 | 性能(ms) | 速度(x) | 隐患 |
| --- | --- | --- | --- |
| 失效子节点字典 | 126 | 8.8 | 当节点失效时无法完全清除子节点，并且无法保障检查节点的顺序，导致触发过时的依赖性能或许更差，但一般情况性能最佳。 |
| 全量子节点链表 | 679 | 1.6 | 无 |
| 全量子节点字典 | 1110 | 1 | 无 |
| @vue/reactivity | 216 | 5.1 | 无 |

// 修改最后一个元素 `arr[9999].value++`
| 方式 | 性能(ms) | 速度(x) | 隐患 |
| --- | --- | --- | --- |
| 失效子节点字典 | 125 | 9.68 | 当节点失效时无法完全清除子节点，并且无法保障检查节点的顺序，导致触发过时的依赖性能或许更差，但一般情况性能最佳。 |
| 全量子节点链表 | 730 | 1.65 | 无 |
| 全量子节点字典 | 1210 | 1 | 无 |
| @vue/reactivity | 253 | 4.78 | 无 |

```ts
import { computed, ref } from "@feng3d/reactivity";

数组取值(ref, computed, 1000)

export function 数组取值(ref: <T>(value?: T) => { value: T }, computed: <T>(func: (oldValue?: T) => T) => { readonly value: T },count: number)
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

```

## 为了库的简单易用性不支持以下内容
- markRaw
- shallowRef
- shallowReactive
- shallowReadonly
- readonly
- computed 中 setter
- __v_skip

## 扩展
- 扩大被反应式的对象的类型范围，只有`Object.isExtensible`不通过的对象不被响应化。Float32Array等都允许被响应化。