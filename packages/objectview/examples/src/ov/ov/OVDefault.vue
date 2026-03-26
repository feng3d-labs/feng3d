<script setup lang="ts">
import type { BlockViewInfo } from '@feng3d/objectview';
import ObjectBlockView from '../ObjectBlockView.vue';

const props = defineProps<{
    /** 对象的所有属性块信息 */
    objectBlockInfos: BlockViewInfo[];
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
