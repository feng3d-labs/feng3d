/**
 * 三端**共享**的契约（#276 阶段 3）。
 *
 * 这是三端形态能成立的关键：同一个 `__type__`、同一份数据接口、同一条 API 版本契约，
 * 被宿主半、界面半、游戏端各入口共同 import——**"编辑格式 = 运行格式"就落在这一层**。
 * 三端各自的入口只决定"在哪一端做什么"，不各自重新定义类型。
 *
 * （本文件不得 import Vue / 插槽 / cordis：它是三端公约数，拖进任何一端的依赖都会破坏边界。）
 */

/** 插件 id（与包名一致；清单与宿主侧都用它） */
export const ROTATE_PLUGIN_ID = '@feng3d/editor-plugin-rotate';

/** 插件所依赖的编辑器插件 API 版本（与清单 `apiVersion` 同一条规则） */
export const ROTATE_API_VERSION = '^1.0.0';

/** 旋转数据的 `__type__`（编辑格式与运行格式**同一个**字符串） */
export const ROTATE_TYPE = 'Rotate';

/**
 * 旋转（纯数据）。
 *
 * 编辑器把这份字面量存进场景，游戏端读同一份字面量跑行为——
 * 只要插件引入了新的 `__type__`，第三端（游戏端）就不是可选项。
 */
export interface Rotate
{
    /** 类型标记（`registerLogic` 按它分发） */
    readonly __type__: typeof ROTATE_TYPE;

    /** 每秒旋转角度 */
    readonly speed?: number;
}
