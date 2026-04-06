import { popupView, PopupviewParam } from './PopupView';
import { objectview } from 'feng3d';

/**
 * PopupView 适配器，兼容原有的 popupview API
 */
export class PopupViewAdapter {
    /**
     * 弹出一个 objectview
     */
    popupObject<T>(object: T, param: PopupviewParam<T> = {}) {
        return popupView.popupObject(object, param);
    }

    /**
     * 弹出一个界面
     */
    popupView(view: any, param: PopupviewParam<any> = {}) {
        return popupView.popupView(view, param);
    }

    /**
     * 弹出一个包含objectview的窗口
     */
    popupObjectWindow<T>(object: T, param: PopupviewParam<T> = {}) {
        return popupView.popupObjectWindow(object, param);
    }

    /**
     * 弹出一个包含给出界面的窗口
     */
    popupViewWindow(view: any, param: PopupviewParam<any> = {}) {
        return popupView.popupViewWindow(view, param);
    }
}

// 导出单例，兼容原有 API
export const popupview = new PopupViewAdapter();
