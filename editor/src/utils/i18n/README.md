# 多语言支持（i18n）

本项目已实现完整的多语言支持系统，支持中文（简体）和英文。

## 功能特性

- ✅ 支持 Vue 组件
- ✅ 响应式语言切换
- ✅ 语言设置持久化（保存到本地存储）
- ✅ 自动检测浏览器语言
- ✅ 支持嵌套的翻译键（如 `common.ok`）
- ✅ 支持参数替换（如 `Hello {name}`）

## 使用方法

### 在 Vue 组件中使用

```vue
<template>
  <div>
    <button :title="t('toolbar.move')">{{ t('toolbar.move') }}</button>
    <p>{{ t('common.welcome', { name: 'World' }) }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../composables/useI18n';

const { t, language, setLanguage, toggleLanguage } = useI18n();
</script>
```

### 在 TypeScript 代码中使用

```typescript
import { t } from '../utils/i18n';

// 简单翻译
const text = t('common.ok');

// 带参数的翻译
const greeting = t('common.welcome', { name: 'World' });

// 带默认文本的翻译
const text2 = t('some.key', undefined, '默认文本');
```


## 添加新的翻译

### 1. 在语言资源文件中添加翻译

编辑 `src/utils/i18n/zh_CN.ts` 和 `src/utils/i18n/en_US.ts`：

```typescript
// zh_CN.ts
export const zh_CN: LanguageResources = {
    myModule: {
        title: '我的标题',
        description: '描述文本',
    },
};

// en_US.ts
export const en_US: LanguageResources = {
    myModule: {
        title: 'My Title',
        description: 'Description text',
    },
};
```

### 2. 在组件中使用

```vue
<template>
  <div>
    <h1>{{ t('myModule.title') }}</h1>
    <p>{{ t('myModule.description') }}</p>
  </div>
</template>
```

## 切换语言

### 在组件中切换

```typescript
import { useI18n } from '../composables/useI18n';

const { setLanguage, toggleLanguage } = useI18n();

// 设置为中文
setLanguage('zh_CN');

// 设置为英文
setLanguage('en_US');

// 切换语言（在中文和英文之间切换）
toggleLanguage();
```

### 在设置对话框中添加语言切换

可以在 `SettingsDialog.vue` 中添加语言选择选项：

```vue
<template>
  <div class="settings-item">
    <label class="settings-label">{{ t('settings.language') }}</label>
    <el-select :model-value="language" @update:model-value="setLanguage">
      <el-option label="简体中文" value="zh_CN" />
      <el-option label="English" value="en_US" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../composables/useI18n';

const { language, setLanguage, t } = useI18n();
</script>
```

## 翻译键命名规范

建议使用以下命名规范：

- 使用点分隔的嵌套路径：`module.submodule.key`
- 使用小写字母和下划线：`common.ok`、`toolbar.move`
- 按功能模块组织：`toolbar.*`、`settings.*`、`inspector.*`

## 参数替换

支持在翻译文本中使用占位符：

```typescript
// 语言资源
{
    greeting: 'Hello {name}, welcome to {app}!'
}

// 使用
t('greeting', { name: 'World', app: 'Editor' })
// 结果: "Hello World, welcome to Editor!"
```

## 注意事项

1. **响应式**：在 Vue 模板中使用 `t()` 函数时，会自动响应语言变化
2. **持久化**：语言设置会自动保存到 `localStorage`，下次打开应用时会自动恢复
3. **默认语言**：如果找不到翻译，会返回翻译键本身或提供的默认文本
4. **浏览器语言检测**：首次打开应用时，会根据浏览器语言自动设置

## 文件结构

```
src/utils/i18n/
├── index.ts          # 导出入口
├── i18n.ts           # 核心模块
├── zh_CN.ts          # 简体中文资源
├── en_US.ts          # 英文资源
└── README.md         # 本文档
```
