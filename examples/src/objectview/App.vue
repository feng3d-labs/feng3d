<script setup lang="ts">
import { ref } from 'vue';
import { GameObject, GameObject1 } from './example/models';
import ObjectView from './ov/ObjectView.vue';
import './styles/App.css';

// 创建示例数据
const gameObject = ref(new GameObject());

(globalThis as any).r_gameObject = gameObject.value;

const gameObject1 = ref(new GameObject1());

(globalThis as any).r_gameObject1 = gameObject1.value;

</script>

<template>
    <div class="app">
        <div class="inspector-panel">
            <!-- 头部 -->
            <div class="panel-header">
                <div class="header-icon">
                    <span class="material-symbols-outlined">deployed_code</span>
                </div>
                <div class="header-info">
                    <div class="header-title">Inspector</div>
                    <div class="header-subtitle">GameObject 属性面板</div>
                </div>
                <button class="header-btn" title="更多选项">
                    <span class="material-symbols-outlined">more_vert</span>
                </button>
            </div>

            <!-- ObjectView 内容区域 -->
            <ObjectView v-if="gameObject" :object="gameObject" />

            <!-- 添加组件按钮 -->
            <button class="add-component-btn">
                <span class="material-symbols-outlined">add</span>
                添加组件
            </button>
        </div>
        <div class="inspector-panel">
            <!-- 头部 -->
            <div class="panel-header">
                <div class="header-icon">
                    <span class="material-symbols-outlined">deployed_code</span>
                </div>
                <div class="header-info">
                    <div class="header-title">Inspector</div>
                    <div class="header-subtitle">GameObject 属性面板</div>
                </div>
                <button class="header-btn" title="更多选项">
                    <span class="material-symbols-outlined">more_vert</span>
                </button>
            </div>

            <!-- ObjectView 内容区域 -->
            <ObjectView v-if="gameObject1" :object="gameObject1" />
        </div>
    </div>
</template>
