<script setup lang="ts">
import type { BlockViewInfo } from 'feng3d';
import ObjectBlockView from '../ObjectBlockView.vue';

const props = defineProps<{
    /** 对象的所有属性块信息 */
    objectBlockInfos: BlockViewInfo[];
    /** 所有者对象 */
    owner?: any;
    /** 对象视图信息 */
    objectViewInfo?: any;
}>();
</script>

<template>
    <div class="ov-default">
        <ObjectBlockView
            v-for="(blockInfo, index) in props.objectBlockInfos"
            :key="index"
            :blockInfo="blockInfo"
        />
    </div>
</template>

<style scoped>
.ov-default {
    display: flex;
    flex-direction: column;
    width: 100%;
}
</style>
