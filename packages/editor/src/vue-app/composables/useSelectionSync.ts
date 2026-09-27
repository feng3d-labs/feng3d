import { onMounted, onUnmounted } from 'vue';
import { globalEmitter } from 'feng3d';
import type { Object3D } from 'feng3d';
import type { AssetNode } from '../../ui/assets/AssetNode';
import { useEditorStore } from '../stores/editorStore';

/**
 * 订阅「选中对象变化」，并在**挂载时先按当前选中同步一次**（issue #173）。
 *
 * ## 为什么必须用它，不能自己 `globalEmitter.on`
 *
 * 读选中的那批消费者——检查器 / 层级树 / 资源管理器 / 相机预览 / 动画 / 粒子控制器——
 * 都是**异步加载**的 Vue 组件：`defineAsyncComponent` 的 chunk 到位、组件挂载，可能已经是
 * 几百毫秒之后。而"选中变化"是一次性事件：**在订阅之前发生的选中，订阅者永远收不到**。
 *
 * 慢机器上这个窗口就是"点了层级树，检查器一直显示未选择对象"（#173）。而且**它不会自愈**：
 * 再点同一个对象时 `editorStore.setSelectedObjects` 认为"选中没变"而不再发事件
 * （那是状态层的合理优化），面板就停在空状态，直到用户去点**另一个**对象。
 *
 * 所以订阅这件事有两条必须一起做的动作：**先订阅、挂载时补一次当前值**。
 * 放在这个 composable 里，消费者就不会再各自忘记第二条
 * （`test/selectionSync.spec.ts` 会拦下自己直接 `globalEmitter.on` 的写法）。
 *
 * ## 顺序上的讲究
 *
 * - **订阅放在 setup 期**（不是 `onMounted`）：组件"已创建但还没挂载"的那一小段里发生的
 *   选中变化也不能漏；
 * - **补值放在 `onMounted`**：回调通常要操作 DOM（`contentRef` 之类），setup 期拿不到。
 *
 * 回调读的是**当前**选中（而不是事件参数），所以重复调用是幂等的：同一份选中重复同步
 * 只会把界面刷成同样的内容。
 *
 * @param handler 选中变化回调；挂载时也会被调用一次（可能是空选中）
 */
export function useSelectionSync(handler: (selected: readonly (Object3D | AssetNode)[]) => void): void
{
    const editorStore = useEditorStore();

    const notify = () =>
    {
        handler([...(editorStore.selectedObjects as (Object3D | AssetNode)[])]);
    };

    // 先订阅：setup 期就位，"已创建未挂载"的窗口也不会漏
    globalEmitter.on('editor.selectedObjectsChanged', notify);
    // 再补值：挂载时按当前选中同步一次（此前发生的选中都要靠这一步补上）
    onMounted(notify);
    // 用同一个函数引用取消订阅：`off` 按引用匹配，传一个新的箭头函数是**取消不掉的**
    // （层级树就这么漏过监听器：每次重挂载都多一个，插件开关面板后重挂载很常见）
    onUnmounted(() =>
    {
        globalEmitter.off('editor.selectedObjectsChanged', notify);
    });
}
