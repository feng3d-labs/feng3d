import { reactive } from '@feng3d/reactivity';
import { ticker } from '../utils/Ticker';

/**
 * 全局时间源（框架设计文档 4.5）。
 *
 * 声明式动画等时间消费者的唯一上游：单一全局（多 View 共享），
 * 由 ticker 每帧推进；`timeScale` / `paused` 是数据（暂停即停止写入 t，
 * 动画渲染链静止，按需呈现自动停止提交）。
 *
 * 失效语义：t 未经消费时写入不产生属性通知（不推高按需呈现脏标记）；
 * 被动画 computed 消费后每帧推进 → 消费链失效 → 每帧提交（动画运行 =
 * 每帧有合法数据变化，与 G2 不冲突）。
 */
export const timeSource: {
    /** 累计时间（秒） */
    readonly t: number;
    /** 时间倍速 */
    readonly timeScale: number;
    /** 是否暂停（暂停时不推进 t） */
    readonly paused: boolean;
} = { t: 0, timeScale: 1, paused: false };

// ticker 驱动推进（模块加载即生效；原始读 + 代理写，规范 8.4）
ticker.onframe((interval: number) =>
{
    if (timeSource.paused) return;

    reactive(timeSource).t = timeSource.t + (interval / 1000) * timeSource.timeScale;
});
