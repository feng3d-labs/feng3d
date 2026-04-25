import { createApp, App, Component } from 'vue';
import { objectview, mathUtil } from 'feng3d';
import WindowView from './WindowView.vue';
import MaskView from './MaskView.vue';

export interface PopupviewParam<T> {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    /**
     * 默认为true
     */
    mode?: boolean;
    /**
     * 窗口标题
     */
    title?: string;
    closecallback?: (object: T) => void;
    /**
     * 传递给 Vue 组件的 props
     */
    props?: Record<string, any>;
}

/**
 * 弹出视图管理器
 */
class PopupViewManager {
    private popupContainer: HTMLElement | null = null;
    private activePopups: Map<HTMLElement, { app: App; maskApp?: App }> = new Map();

    /**
     * 初始化弹出层容器
     */
    init(container: HTMLElement) {
        this.popupContainer = container;
    }

    /**
     * 弹出一个 objectview
     */
    popupObject<T>(object: T, param: PopupviewParam<T> = {}) {
        const view: any = objectview.getObjectView(object);
        const width = param.width || 300;
        const height = param.height || 300;
        
        // 创建窗口包装
        const windowProps = {
            title: `${(object as any).constructor?.name || 'Object'}`,
            width,
            height,
            x: param.x,
            y: param.y,
        };
        
        return this.popupViewWindow(view, param);
    }

    /**
     * 弹出一个界面
     */
    popupView(view: HTMLElement | Component, param: PopupviewParam<any> = {}) {
        if (!this.popupContainer) {
            console.error('PopupView container not initialized');
            return;
        }

        const width = param.width || 300;
        const height = param.height || 300;
        
        // 计算位置（居中或指定位置）
        let x = param.x;
        let y = param.y;
        
        if (x === undefined || y === undefined) {
            x = (window.innerWidth - width) / 2;
            y = (window.innerHeight - height) / 2;
        }
        
        // 限制在视口内
        x = mathUtil.clamp(x, 0, window.innerWidth - width);
        y = mathUtil.clamp(y, 0, window.innerHeight - height);

        // 创建容器元素
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        container.style.zIndex = '9999';
        
        // 如果是 Vue 组件
        if (typeof view === 'object' && 'setup' in view) {
            const app = createApp(view as Component);
            app.mount(container);
            this.popupContainer.appendChild(container);
            
            // 创建遮罩
            let maskApp: App | undefined;
            if (param.mode !== false) {
                maskApp = this.createMask(container);
            }
            
            this.activePopups.set(container, { app, maskApp });
            
            // 关闭回调
            if (param.closecallback) {
                const cleanup = () => {
                    this.closePopup(container);
                    param.closecallback?.(container);
                };
                // 可以添加关闭事件监听
                container.addEventListener('close', cleanup);
            }
        } else if (view instanceof HTMLElement) {
            // DOM 元素
            container.appendChild(view);
            this.popupContainer.appendChild(container);
            
            // 创建遮罩
            if (param.mode !== false) {
                this.createMask(container);
            }
            
            // 关闭回调
            if (param.closecallback) {
                const cleanup = () => {
                    this.closePopup(container);
                    param.closecallback?.(container);
                };
                container.addEventListener('close', cleanup);
            }
        }
        
        return container;
    }

    /**
     * 弹出一个包含objectview的窗口
     */
    popupObjectWindow<T>(object: T, param: PopupviewParam<T> = {}) {
        const view: any = objectview.getObjectView(object);
        return this.popupViewWindow(view, param);
    }

    /**
     * 弹出一个包含给出界面的窗口
     */
    popupViewWindow(view: HTMLElement | Component, param: PopupviewParam<any> = {}) {
        if (!this.popupContainer) {
            console.error('PopupView container not initialized');
            return;
        }

        const width = param.width || 400;
        const height = param.height || 300;
        
        // 计算位置
        let x = param.x;
        let y = param.y;
        
        if (x === undefined || y === undefined) {
            x = (window.innerWidth - width) / 2;
            y = (window.innerHeight - height) / 2;
        }
        
        x = mathUtil.clamp(x, 0, window.innerWidth - width);
        y = mathUtil.clamp(y, 0, window.innerHeight - height);

        // 创建窗口组件
        const windowContainer = document.createElement('div');
        windowContainer.style.position = 'fixed';
        windowContainer.style.left = `${x}px`;
        windowContainer.style.top = `${y}px`;
        windowContainer.style.width = `${width}px`;
        windowContainer.style.height = `${height}px`;
        windowContainer.style.zIndex = '9999';
        
        // 创建 WindowView 组件
        const windowTitle = (param as any).title || (view as any).title || '窗口';
        const windowApp = createApp(WindowView, {
            title: windowTitle,
            width,
            height,
            x,
            y,
            resizable: true,
            onClose: () => {
                this.closePopup(windowContainer);
                param.closecallback?.(windowContainer);
            },
        });
        
        windowApp.mount(windowContainer);
        
        // 添加内容
        const contentElement = windowContainer.querySelector('.window-view-content');
        if (contentElement) {
            if (view instanceof HTMLElement) {
                // DOM 元素
                contentElement.appendChild(view);
            } else if (typeof view === 'object' && 'setup' in view) {
                // Vue 组件作为内容
                const contentApp = createApp(view as Component, (param as any).props || {});
                contentApp.mount(contentElement);
            } else if (view && typeof view === 'object' && 'dom' in view) {
                // ObjectView 组件（有 dom 属性）
                const dom = (view as any).dom;
                if (dom instanceof HTMLElement) {
                    contentElement.appendChild(dom);
                }
            }
        }
        
        this.popupContainer.appendChild(windowContainer);
        
        // 创建遮罩
        let maskApp: App | undefined;
        if (param.mode !== false) {
            maskApp = this.createMask(windowContainer);
        }
        
        this.activePopups.set(windowContainer, { app: windowApp, maskApp });
        
        return windowContainer;
    }

    /**
     * 创建遮罩
     */
    private createMask(target: HTMLElement): App {
        if (!this.popupContainer) {
            throw new Error('PopupView container not initialized');
        }

        const maskContainer = document.createElement('div');
        maskContainer.style.position = 'fixed';
        maskContainer.style.top = '0';
        maskContainer.style.left = '0';
        maskContainer.style.right = '0';
        maskContainer.style.bottom = '0';
        maskContainer.style.backgroundColor = 'transparent';
        maskContainer.style.zIndex = '9998';
        maskContainer.style.pointerEvents = 'auto';
        
        // 点击遮罩关闭
        maskContainer.addEventListener('click', () => {
            this.closePopup(target);
        });
        
        this.popupContainer.appendChild(maskContainer);
        
        const maskApp = createApp(MaskView, {
            target,
        });
        maskApp.mount(maskContainer);
        
        return maskApp;
    }

    /**
     * 关闭弹出窗口
     */
    closePopup(container: HTMLElement) {
        const popup = this.activePopups.get(container);
        if (popup) {
            popup.app.unmount();
            if (popup.maskApp) {
                popup.maskApp.unmount();
            }
            this.activePopups.delete(container);
        }
        
        if (container.parentElement) {
            container.parentElement.removeChild(container);
        }
    }

    /**
     * 关闭所有弹出窗口
     */
    closeAll() {
        const containers = Array.from(this.activePopups.keys());
        for (const container of containers) {
            this.closePopup(container);
        }
    }
}

export const popupView = new PopupViewManager();
