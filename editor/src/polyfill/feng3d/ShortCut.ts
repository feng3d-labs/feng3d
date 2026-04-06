/**
 * (快捷键)状态列表
 */
export const shortCutStates = {
    disableScroll: '禁止滚动',
    splitGroupDraging: '正在拖拽分割界面',
    draging: '正在拖拽中'
};

/**
 * (快捷键)状态列表
 */
export type ShortCutStates = typeof shortCutStates;

export interface ShortCut
{
    activityState<K extends keyof ShortCutStates>(state: K): void;

    deactivityState<K extends keyof ShortCutStates>(state: K): void;

    getState<K extends keyof ShortCutStates>(state: K): boolean
}
