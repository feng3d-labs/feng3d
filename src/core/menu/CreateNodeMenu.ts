import { Node3D } from '../core/Node3D';

/**
 *
 */
export interface MenuItem
{
    /**
     * 标签的路径
     */
    path: string;
    /**
     * 优先级，数字越大，显示越靠前，默认为0
     */
    priority?: number;
    /**
     * 点击事件
     */
    click?: () => Node3D,
    /**
     * 是否启用，禁用时显示灰色
     */
    enable?: () => boolean;
    /**
     * 是否显示，默认显示
     */
    show?: () => boolean;
}

export const createNodeMenu: MenuItem[] = [];
