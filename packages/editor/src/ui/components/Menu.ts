/**
 * Menu 适配器
 * 导出 Vue Menu 适配器，保持向后兼容
 */
export { createMenuAdapter, MenuAdapter } from '../../vue-app/components/MenuAdapter';
export type { MenuItem } from '../../vue-app/components/MenuAdapter';

/**
 * Menu 实例（向后兼容）
 */
let menuInstance: any = null;

/**
 * 获取 Menu 实例
 */
export const menu = new Proxy({} as any, {
    get(_target, prop) {
        if (!menuInstance) {
            // 延迟加载适配器
            import('../../vue-app/components/MenuAdapter').then((module) => {
                menuInstance = module.createMenuAdapter();
            });
            // 返回一个临时对象
            return () => {};
        }
        return menuInstance[prop];
    }
});

// 立即加载适配器
import('../../vue-app/components/MenuAdapter').then((module) => {
    menuInstance = module.createMenuAdapter();
});
