/**
 * Message 组件适配器
 * 用于在 Vue 组件挂载前提供向后兼容的接口
 * 一旦所有代码都迁移到直接使用 Vue 组件，可以删除此文件
 * 
 * 注意：旧的 Message 类只是监听 globalEmitter 事件，没有公共方法
 * Vue Message 组件也在监听相同的事件，所以适配器只需要是一个兼容的对象即可
 */

/**
 * Message 适配器类
 * 提供与旧 Message 类兼容的接口（空实现，因为 Message 主要通过事件工作）
 * @deprecated 请直接使用 Vue Message 组件，此适配器仅用于过渡期
 */
export class MessageAdapter {
    // 旧的 Message 类没有公共方法，只是监听 globalEmitter 事件
    // Vue Message 组件已经在 App.vue 中挂载并监听相同事件
    // 所以这里只需要一个兼容的空对象即可
}

/**
 * 创建 Message 适配器实例
 * @deprecated 请直接使用 Vue Message 组件
 */
export function createMessageAdapter(): MessageAdapter {
    return new MessageAdapter();
}

