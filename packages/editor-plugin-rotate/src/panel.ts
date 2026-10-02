import { defineComponent, h } from 'vue';

/**
 * 旋转面板的视图（界面端按需加载）。
 *
 * 刻意用 `render` 函数而不是 `.vue` 单文件：样板包不需要为它打开 SFC 编译，
 * 而"视图按需加载"的契约（`PanelViewLoader`）与写法无关。
 */
export default defineComponent({
    name: 'RotatePanel',

    render()
    {
        return h('div', { class: 'rotate-panel' }, '旋转（三端样板面板）');
    },
});
