<script setup lang="ts">
import { useOBVInline, type OBVInlineProps } from './useOBVInline';
import ObjectAttributeView from '../ObjectAttributeView.vue';

const props = defineProps<OBVInlineProps>();
const { title, showTitle } = useOBVInline(props);
</script>

<template>
    <div class="obv-inline">
        <span v-if="showTitle" class="obv-inline-title" :title="title">{{ title }}</span>
        <div class="obv-inline-items">
            <div v-for="(attrInfo, index) in props.itemList" :key="index" class="obv-inline-item">
                <ObjectAttributeView :attrInfo="attrInfo" />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 一行装下一组字段：标题占行首一窄列，字段等宽平分且**不换行**（始终紧凑）。 */
.obv-inline {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
    margin-bottom: 4px;
    padding: 4px 6px;
    background-color: var(--sideBar-background, #252526);
    /* 面板很窄时宁可挤也不要换行——"同一行"是这个块视图的语义 */
    flex-wrap: nowrap;
    overflow: hidden;
    /* 让下面的容器查询按本行的实际宽度生效（不是按视口） */
    container-type: inline-size;
}

.obv-inline-title {
    flex: 0 0 auto;
    max-width: 40px;
    font-size: 10px;
    font-weight: 500;
    color: var(--descriptionForeground, #9d9d9d);
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/*
 * 面板窄到一行放不下"标题 + 四个字段"时，先让标题让位：
 * 标题是给自己看的，输入框太窄就没法用了。这一条是"始终紧凑"的兜底——
 * 无论如何都保持一行，牺牲的是可读性最低的那一项。
 */
@container (max-width: 320px) {
    .obv-inline-title {
        display: none;
    }
}

.obv-inline-items {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
}

.obv-inline-item {
    flex: 1 1 0;
    /* min-width:0 是能真正压缩的前提：默认 min-width:auto 会让内容把行撑开、触发换行 */
    min-width: 0;
    overflow: hidden;
}

/*
 * 字段控件（OAVString / OAVBoolean…）在自己的 SFC 里是"标签占 120px + 值占剩余"的整行布局。
 * 这里改成**标签在上、控件在下**：一列只有几十像素宽时，横排的 120px 标签会把输入框挤没。
 * 用 `:deep()` 是因为字段 DOM 由 ObjectAttributeView 命令式挂载，不是本组件的模板节点。
 */
.obv-inline-item :deep(.oav-row) {
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 0;
    min-height: 0;
}

.obv-inline-item :deep(.oav-label) {
    flex: 0 0 auto;
    font-size: 11px;
    line-height: 14px;
}

.obv-inline-item :deep(.oav-value) {
    width: 100%;
    min-width: 0;
}
</style>
