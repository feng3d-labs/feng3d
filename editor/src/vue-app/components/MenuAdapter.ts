/**
 * Menu 组件适配器
 * 用于在 Vue 组件挂载前提供向后兼容的接口
 */
import { globalEmitter, windowEventProxy } from 'feng3d';

export interface MenuItem {
  label?: string;
  priority?: number;
  type?: 'separator';
  click?: () => void;
  submenu?: MenuItem[];
  enable?: boolean;
  show?: boolean;
}

/**
 * Menu 适配器类
 * 提供与旧 Menu 类兼容的接口
 * @deprecated 请直接使用 Vue Menu 组件，此适配器仅用于过渡期
 */
export class MenuAdapter {
  private currentPlaceholder: any = null;

  /**
   * 弹出菜单
   * @param menuItems 菜单数据
   * @returns 返回一个占位对象，用于兼容旧代码
   */
  popup(menuItems: MenuItem[]): any {
    // 默认使用鼠标当前位置
    let menuX = windowEventProxy.clientX;
    let menuY = windowEventProxy.clientY;
    let menuShown = false;
    
    // 创建占位对象，用于兼容旧代码（如 TopView.ts）
    // 使用 any 类型以避免类型检查问题
    const placeholder: any = {
      _items: menuItems, // 保存菜单项，以便后续设置位置时使用
      addEventListener: () => {}, // 空实现，Vue 组件会自动处理
      removeEventListener: () => {},
      parent: null,
      stage: null,
    };
    
    // 显示菜单的函数
    const showMenu = () => {
      if (!menuShown) {
        menuShown = true;
        globalEmitter.emit('menu.show', {
          items: placeholder._items,
          x: menuX,
          y: menuY,
        } as any);
      }
    };
    
    // 使用 Object.defineProperty 让 x, y 的设置能够更新菜单位置
    Object.defineProperty(placeholder, 'x', {
      get: () => menuX,
      set: (value: number) => {
        menuX = value;
        // 如果菜单还没显示，立即显示；如果已显示，更新位置
        if (!menuShown) {
          showMenu();
        } else {
          // 如果菜单已显示，触发更新事件
          globalEmitter.emit('menu.show', {
            items: placeholder._items,
            x: menuX,
            y: menuY,
          } as any);
        }
      },
    });
    
    Object.defineProperty(placeholder, 'y', {
      get: () => menuY,
      set: (value: number) => {
        menuY = value;
        // 如果菜单还没显示，立即显示；如果已显示，更新位置
        if (!menuShown) {
          showMenu();
        } else {
          // 如果菜单已显示，触发更新事件
          globalEmitter.emit('menu.show', {
            items: placeholder._items,
            x: menuX,
            y: menuY,
          } as any);
        }
      },
    });
    
    // 如果调用 popup() 后没有设置 x, y，立即显示菜单（使用鼠标当前位置）
    // 使用 setTimeout 确保在下一个事件循环中执行，这样如果后续设置了 x, y，可以覆盖
    setTimeout(() => {
      if (!menuShown) {
        showMenu();
      }
    }, 0);
    
    this.currentPlaceholder = placeholder;
    return placeholder;
  }

  /**
   * 弹出枚举选择菜单
   * @param enumDefinition 枚举定义
   * @param currentValue 当前枚举值
   * @param selectCallBack 选择回调
   */
  popupEnum(enumDefinition: Object, currentValue: any, selectCallBack: (v: any) => void) {
    const menu: MenuItem[] = [];
    for (const key in enumDefinition) {
      if (enumDefinition.hasOwnProperty(key)) {
        if (isNaN(Number(key))) {
          menu.push({
            label: (currentValue === enumDefinition[key] ? '√ ' : '   ') + key,
            click: ((v) => () => selectCallBack(v))(enumDefinition[key])
          });
        }
      }
    }

    this.popup(menu);
  }

  /**
   * 处理菜单中 show==false的菜单项
   * @param menuItem 菜单数据
   */
  handleShow(menuItem: MenuItem): MenuItem {
    if (menuItem.submenu) {
      const submenu = menuItem.submenu.filter((v) => v.show !== false);

      for (let i = submenu.length - 1; i >= 0; i--) {
        if (submenu[i].type === 'separator') {
          if (i === 0 || i === submenu.length - 1) {
            submenu.splice(i, 1);
          } else if (submenu[i - 1].type === 'separator') {
            submenu.splice(i, 1);
          }
        }
      }
      menuItem.submenu = submenu;
      menuItem.submenu.forEach((v) => this.handleShow(v));
    }

    return menuItem;
  }
}

/**
 * 创建 Menu 适配器实例
 * @deprecated 请直接使用 Vue Menu 组件
 */
export function createMenuAdapter(): MenuAdapter {
  return new MenuAdapter();
}

