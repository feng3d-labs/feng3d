import { EventProxy } from './EventProxy';

/**
 * 键盘鼠标输入
 */
export const windowEventProxy = new EventProxy<WindowEventMap>(self);
