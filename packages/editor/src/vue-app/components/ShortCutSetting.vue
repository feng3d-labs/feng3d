<template>
    <div class="shortcut-setting">
        <!-- 搜索框 -->
        <div class="shortcut-setting-header">
            <el-input
                v-model="searchText"
                :placeholder="t('shortcut.searchPlaceholder')"
                clearable
                size="small"
                class="shortcut-search-input"
            >
                <template #prefix>
                    <el-icon><Search /></el-icon>
                </template>
            </el-input>
        </div>

        <!-- 快捷键列表 -->
        <div class="shortcut-setting-content">
            <el-table
                :data="filteredShortcuts"
                stripe
                size="small"
                :empty-text="t('shortcut.empty')"
                class="shortcut-table"
            >
                <el-table-column
                    :label="t('shortcut.key')"
                    prop="key"
                    min-width="200"
                    show-overflow-tooltip
                />
                <el-table-column
                    :label="t('shortcut.command')"
                    prop="command"
                    min-width="200"
                    show-overflow-tooltip
                >
                    <template #default="{ row }">
                        <span v-if="row.command">{{ row.command }}</span>
                        <span v-else class="empty-text">-</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('shortcut.stateCommand')"
                    prop="stateCommand"
                    min-width="200"
                    show-overflow-tooltip
                >
                    <template #default="{ row }">
                        <span v-if="row.stateCommand">{{ row.stateCommand }}</span>
                        <span v-else class="empty-text">-</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('shortcut.when')"
                    prop="when"
                    min-width="200"
                    show-overflow-tooltip
                >
                    <template #default="{ row }">
                        <span v-if="row.when">{{ row.when }}</span>
                        <span v-else class="empty-text">-</span>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { shortcutConfig } from '../../configs/ShortcutConfig';
import { useI18n } from '../composables/useI18n';

/**
 * 快捷键配置项类型
 */
interface ShortcutItem {
    key: string;
    command?: string;
    stateCommand?: string;
    when?: string;
}

const { t } = useI18n();

// 搜索文本
const searchText = ref('');

// 过滤后的快捷键列表
const filteredShortcuts = computed<ShortcutItem[]>(() => {
    if (!searchText.value) {
        return shortcutConfig as ShortcutItem[];
    }

    const reg = new RegExp(searchText.value, 'i');
    
    return (shortcutConfig as ShortcutItem[]).filter((item) => {
        // 搜索所有字段（排除以 _ 开头的私有属性）
        for (const key in item) {
            if (key.charAt(0) !== '_') {
                const value = item[key as keyof ShortcutItem];
                if (typeof value === 'string' && value.search(reg) !== -1) {
                    return true;
                }
            }
        }
        return false;
    });
});
</script>

<style scoped>
.shortcut-setting {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--editor-background);
}

.shortcut-setting-header {
    padding: 8px;
    border-bottom: 1px solid var(--panel-border);
}

.shortcut-search-input {
    width: 100%;
}

.shortcut-setting-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.shortcut-table {
    flex: 1;
    overflow: auto;
}

.empty-text {
    color: var(--input-placeholderForeground);
    font-style: italic;
}
</style>
