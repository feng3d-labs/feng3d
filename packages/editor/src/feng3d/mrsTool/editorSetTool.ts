import { EditorData, MRSToolType } from '../../global/EditorData';

/**
 * 桥接方法 `editor.setTool` 的实现——由**变换工具插件**贡献（issue #169）。
 *
 * ## 为什么归这个插件
 *
 * 没有变换工具插件时，"切换工具"这件事根本没有意义（工具对象都不存在）。
 * 它作为插件贡献的桥接方法，关掉插件就一起消失——而不是留一个必然报错的空壳
 * （这正是 issue #169 要验的"关干净"）。
 *
 * ## 为什么不算写方法
 *
 * 它只改编辑器的 UI 状态（当前工具），不碰场景数据，与核心的 `selection.set` 同一口径，
 * 因此**不受**「AI 写能力」开关约束。
 *
 * ## 名字映射
 *
 * 接受 `'move' | 'rotate' | 'scale'`（AI 侧可读）与 `0 | 1 | 2`（与 `editor.info.toolType` 对齐）。
 * 只接受这两种：多写一套别名，出错时报的错就更难懂。
 */

/** 工具名 → `MRSToolType` 值 */
const TOOL_TYPES: Record<string, MRSToolType> = {
    move: MRSToolType.MOVE,
    rotate: MRSToolType.ROTATION,
    scale: MRSToolType.SCALE,
};

/** 值 → 工具名（回传用；与 `editor.info.toolType` 的数值一一对应） */
const TOOL_NAMES: readonly string[] = ['move', 'rotate', 'scale'];

/**
 * 设置当前变换工具。
 *
 * @param params `{ tool: 'move' | 'rotate' | 'scale' | 0 | 1 | 2 }`
 * @returns `{ toolType, tool }`：实际生效的数值与名字
 * @throws `tool` 不是合法取值时抛出，错误信息里列出可选值
 */
export function editorSetTool(params: Record<string, unknown>): unknown
{
    const tool = params.tool;

    let type: MRSToolType | undefined;
    if (typeof tool === 'number') type = TOOL_NAMES[tool] === undefined ? undefined : (tool as MRSToolType);
    else if (typeof tool === 'string') type = TOOL_TYPES[tool];

    if (type === undefined)
    {
        throw new Error(`未知的工具 ${JSON.stringify(tool)}；可用：move / rotate / scale（或 0 / 1 / 2）`);
    }

    // 与工具栏按钮、快捷键走**同一条**写入路径（EditorData 的 setter 会转给 editorStore，
    // 后者触发 `editor.toolTypeChanged`，MRSTool 据此切换）——不要另开一条路，否则三条路会漂移
    EditorData.editorData.toolType = type;

    return { toolType: EditorData.editorData.toolType, tool: TOOL_NAMES[EditorData.editorData.toolType] };
}
