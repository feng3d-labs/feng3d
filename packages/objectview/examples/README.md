# @feng3d/objectview Vue 示例

这是 [@feng3d/objectview](https://www.npmjs.com/package/@feng3d/objectview) 的 Vue 3 实现示例，展示如何使用 ObjectView 框架构建类似 Unity Inspector 的属性面板。

## 🎯 功能演示

- ✅ 自动根据数据对象生成属性界面
- ✅ 支持多种属性类型（Boolean、Number、Enum、Vector3 等）
- ✅ 支持属性分组（Block）
- ✅ 支持嵌套组件（Components）
- ✅ 双向数据绑定

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📁 项目结构

```
examples/
├── src/
│   ├── main.ts              # 应用入口
│   ├── App.vue              # 根组件
│   ├── example/
│   │   └── models.ts        # 示例数据模型
│   ├── ov/                   # ObjectView Vue 组件
│   │   ├── ObjectView.vue   # 对象界面组件（OV）
│   │   ├── ObjectBlockView.vue  # 块界面组件
│   │   ├── ObjectAttributeView.vue  # 属性界面组件
│   │   ├── oav/              # OAV 组件（对象属性视图）
│   │   │   ├── OAVDefault.vue
│   │   │   ├── OAVBoolean.vue
│   │   │   ├── OAVNumber.vue
│   │   │   ├── OAVEnum.vue
│   │   │   ├── OAVVector3.vue
│   │   │   └── OAVComponents.vue
│   │   ├── obv/              # OBV 组件（对象块视图）
│   │   │   └── OBVDefault.vue
│   │   ├── ov/               # OV 组件（对象视图）
│   │   │   └── OVDefault.vue
│   │   └── utils/            # 工具函数
│   │       ├── createOAVComponent.ts
│   │       ├── createOBVComponent.ts
│   │       └── createOVComponent.ts
│   └── styles/               # 样式文件
│       ├── main.css
│       └── App.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 📖 使用说明

### 1. 定义数据模型

使用 `@ov` 和 `@oav` 装饰器标记类和属性：

```typescript
import { oav, ov } from '@feng3d/objectview';

@ov({ component: 'OVDefault' })
export class GameObject {
    @oav()
    name = 'MyObject';

    @oav({ component: 'OAVBoolean' })
    enabled = true;

    @oav({ component: 'OAVNumber' })
    value = 100;

    @oav({ component: 'OAVEnum', componentParam: { options: ['A', 'B', 'C'] } })
    type = 'A';
}
```

### 2. 在 Vue 中使用 ObjectView

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GameObject } from './example/models';
import ObjectView from './ov/ObjectView.vue';

const gameObject = ref(new GameObject());
</script>

<template>
    <ObjectView :object="gameObject" />
</template>
```

### 3. 属性分组

使用 `block` 参数将属性分组：

```typescript
@ov({ component: 'OVDefault' })
export class Transform {
    @oav({ block: 'Position', component: 'OAVNumber' })
    x = 0;

    @oav({ block: 'Position', component: 'OAVNumber' })
    y = 0;

    @oav({ block: 'Rotation', component: 'OAVNumber' })
    rotation = 0;
}
```

## 🧩 组件说明

### OV（Object View）

对象视图组件，负责渲染整个对象的界面。

| 组件 | 说明 |
|------|------|
| `OVDefault` | 默认对象视图，包含所有属性和块 |

### OBV（Object Block View）

对象块视图组件，负责渲染一组相关属性。

| 组件 | 说明 |
|------|------|
| `OBVDefault` | 默认块视图，可折叠的属性组 |

### OAV（Object Attribute View）

对象属性视图组件，负责渲染单个属性。

| 组件 | 说明 |
|------|------|
| `OAVDefault` | 默认属性视图（文本输入） |
| `OAVBoolean` | 布尔值开关 |
| `OAVNumber` | 数字输入 |
| `OAVEnum` | 枚举下拉选择 |
| `OAVVector3` | 三维向量编辑器（x, y, z） |
| `OAVComponents` | 组件数组渲染器 |

## 🎨 自定义组件

### 创建自定义 OAV 组件

1. 创建 Vue 组件文件：

```vue
<!-- oav/OAVColor.vue -->
<script setup lang="ts">
import { useOAVColor } from './useOAVColor';

const props = defineProps<{
    attributeViewInfo: any;
}>();

const { r_value, onChange } = useOAVColor(props);
</script>

<template>
    <div class="oav-color">
        <input type="color" :value="r_value" @input="onChange" />
    </div>
</template>
```

2. 创建组合式函数：

```typescript
// oav/useOAVColor.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useOAVColor(props: { attributeViewInfo: any }) {
    const r_value = ref('');

    const updateValue = () => {
        r_value.value = props.attributeViewInfo.owner[props.attributeViewInfo.name];
    };

    const onChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        props.attributeViewInfo.owner[props.attributeViewInfo.name] = target.value;
    };

    onMounted(() => {
        updateValue();
    });

    return { r_value, onChange };
}
```

3. 注册组件：

```typescript
// utils/createOAVComponent.ts
import OAVColor from '../oav/OAVColor.vue';

// 添加到组件映射
const componentMap = {
    // ...
    OAVColor,
};
```

## 🔧 开发建议

- 遵循 Vue 3 组合式 API 风格
- 使用 `use*.ts` 文件封装组件逻辑
- 响应式变量以 `r_` 前缀命名
- CSS 样式抽离到 `styles/` 目录

## 📄 License

[MIT](../LICENSE)

