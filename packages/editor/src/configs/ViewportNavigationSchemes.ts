/**
 * 视口导航方案（可插拔的编辑器操作风格）。
 *
 * 设计目标：把「操作方式」与「执行逻辑」解耦，接入新编辑器风格（Unreal / Blender /
 * PlayCanvas…）时**只需新增一份 {@link ViewportNavigationScheme} 定义**，不必改
 * {@link ViewportNavigation} 的导航实现，也不必改 SceneView。
 *
 * 一套方案描述三件事：
 * 1. `gestures`：鼠标手势 → 导航动作（按住哪些键、要不要 Alt/Ctrl/Shift）；
 * 2. `flyKeys` / `walkKeys`：飞行与方向键行走的按键映射；
 * 3. 速度相关参数：Shift 加速倍率、滚轮缩放步长、飞行中滚轮是否调速。
 */

/**
 * 视口导航动作。
 *
 * 手势只负责「选中哪个动作」，具体行为由 `ViewportNavigation` 统一实现，
 * 因此新增动作需要在实现侧补一个分支（当前集合已覆盖主流编辑器的全部视口操作）。
 */
export type ViewportAction =
    /** 环绕：绕视点中心（选中对象中心 / 相机前方 lookDistance 处）旋转 */
    | 'orbit'
    /** 平移：相机上下左右平移 */
    | 'pan'
    /** 推拉：沿视线前后移动（等价于缩放） */
    | 'dolly'
    /** 飞行：按住期间鼠标转向 + 按键位移（Unity / Unreal 的右键） */
    | 'fly'
    /** 仅环顾：拖动转向，不产生位移 */
    | 'look';

/**
 * 鼠标手势绑定。
 *
 * `buttons` 为需要按住的鼠标键集合（0=左键，1=中键，2=右键）；
 * 多项表示需要**同时**按住（如 Unreal 的「左键+右键拖动 = 平移」）。
 */
export interface MouseGestureBinding
{
    readonly action: ViewportAction;

    /** 需要按住的鼠标键（0=左 1=中 2=右） */
    readonly buttons: readonly (0 | 1 | 2)[];

    readonly alt?: boolean;
    readonly ctrl?: boolean;
    readonly shift?: boolean;
}

/**
 * 按键映射（键名用 `KeyboardEvent.key` 的小写形式，如 `'w'` / `'arrowup'`）。
 */
export interface NavigationKeyMap
{
    readonly forward: string;
    readonly back: string;
    readonly left: string;
    readonly right: string;
    /** 全局上升（可缺省） */
    readonly up?: string;
    /** 全局下降（可缺省） */
    readonly down?: string;
}

/**
 * 一套视口导航方案。
 */
export interface ViewportNavigationScheme
{
    /** 方案标识（`sceneControlConfig.navigationScheme` 使用） */
    readonly id: string;

    /** 显示名（设置面板 / 提示用） */
    readonly label: string;

    /** 鼠标手势绑定（按声明顺序匹配，先命中者生效） */
    readonly gestures: readonly MouseGestureBinding[];

    /**
     * 「视图工具」激活时的左键拖动行为（Unity：按 Q 进入 View 工具，左键拖动 = 平移）。
     *
     * 该工具由快捷键状态 `viewTool` 表示，缺省表示此方案没有该工具。
     */
    readonly viewToolGesture?: MouseGestureBinding;

    /** 飞行按键（右键飞行期间生效） */
    readonly flyKeys: NavigationKeyMap;

    /** 方向键行走按键（非飞行状态下生效） */
    readonly walkKeys: NavigationKeyMap;

    /** 飞行中滚轮是否调速（Unity / Unreal 为 true：飞行时滚轮调速度而不是缩放） */
    readonly wheelAdjustsFlySpeed: boolean;

    /** Shift 加速倍率 */
    readonly speedBoost: number;

    /** 滚轮推拉步长（相对 `lookDistance` 的比例） */
    readonly wheelDollyStep: number;
}

/**
 * Unity Scene view 方案。
 *
 * 依据 Unity 官方 *Scene view navigation*：
 * - Orbit = Alt + 左键拖动；Pan = 中键拖动（无中键设备用 Alt+Ctrl+左键）；
 * - Zoom = 滚轮 / Alt + 右键拖动；
 * - Flythrough = 右键按住 + WASD（Q/E 升降）+ 鼠标转向，Shift 加速，滚轮调速；
 * - Frame Selected = F，Lock View to Selected = Shift+F。
 */
export const UNITY_SCHEME: ViewportNavigationScheme = {
    id: 'unity',
    label: 'Unity',
    gestures: [
        { action: 'orbit', buttons: [0], alt: true },
        { action: 'fly', buttons: [2] },
        { action: 'dolly', buttons: [2], alt: true },
        { action: 'pan', buttons: [1] },
        { action: 'pan', buttons: [0], alt: true, ctrl: true },
    ],
    viewToolGesture: { action: 'pan', buttons: [0] },
    flyKeys: { forward: 'w', back: 's', left: 'a', right: 'd', up: 'e', down: 'q' },
    walkKeys: { forward: 'arrowup', back: 'arrowdown', left: 'arrowleft', right: 'arrowright' },
    wheelAdjustsFlySpeed: true,
    speedBoost: 3,
    wheelDollyStep: 0.004,
};

/**
 * Unreal Engine 方案。
 *
 * 依据 Unreal 官方 *Viewport Controls*：
 * - Orbit = Alt + 左键拖动；Pan = 左键+右键同按拖动 / 中键拖动；
 * - Dolly = Alt + 右键拖动；Zoom = 滚轮；
 * - Flythrough = 右键按住 + WASD（Q/E 全局升降）+ 鼠标转向，右键+滚轮调速。
 *
 * 与 Unity 的差异主要是平移手势与加速倍率，因此复用同一套执行逻辑。
 */
export const UNREAL_SCHEME: ViewportNavigationScheme = {
    id: 'unreal',
    label: 'Unreal Engine',
    gestures: [
        { action: 'orbit', buttons: [0], alt: true },
        { action: 'fly', buttons: [2] },
        { action: 'dolly', buttons: [2], alt: true },
        { action: 'pan', buttons: [0, 2] },
        { action: 'pan', buttons: [1] },
    ],
    flyKeys: { forward: 'w', back: 's', left: 'a', right: 'd', up: 'e', down: 'q' },
    walkKeys: { forward: 'arrowup', back: 'arrowdown', left: 'arrowleft', right: 'arrowright' },
    wheelAdjustsFlySpeed: true,
    speedBoost: 4,
    wheelDollyStep: 0.005,
};

/**
 * Blender 方案（社区常见绑定：中键旋转、Shift+中键平移、Ctrl+中键缩放、滚轮缩放）。
 *
 * Blender 无「按住右键飞行」的默认绑定，因此不声明 `fly` 手势；
 * 飞行按键映射仍保留，供后续通过菜单 / 快捷键显式进入飞行时复用。
 */
export const BLENDER_SCHEME: ViewportNavigationScheme = {
    id: 'blender',
    label: 'Blender',
    gestures: [
        { action: 'orbit', buttons: [1] },
        { action: 'pan', buttons: [1], shift: true },
        { action: 'dolly', buttons: [1], ctrl: true },
    ],
    flyKeys: { forward: 'w', back: 's', left: 'a', right: 'd', up: 'e', down: 'q' },
    walkKeys: { forward: 'arrowup', back: 'arrowdown', left: 'arrowleft', right: 'arrowright' },
    wheelAdjustsFlySpeed: false,
    speedBoost: 2,
    wheelDollyStep: 0.004,
};

/**
 * PlayCanvas 方案。
 *
 * 依据 PlayCanvas 官方 *Controls and Keyboard Shortcuts*：
 * - Orbit = 左键拖动；Look Around = 右键拖动；Pan = 中键拖动 / Shift+左键拖动；
 * - Zoom / Dolly = 滚轮；WASD 移动（Shift 加速）。
 */
export const PLAY_CANVAS_SCHEME: ViewportNavigationScheme = {
    id: 'playcanvas',
    label: 'PlayCanvas',
    gestures: [
        { action: 'orbit', buttons: [0] },
        { action: 'fly', buttons: [2] },
        { action: 'pan', buttons: [1] },
        { action: 'pan', buttons: [0], shift: true },
    ],
    flyKeys: { forward: 'w', back: 's', left: 'a', right: 'd', up: 'e', down: 'q' },
    walkKeys: { forward: 'arrowup', back: 'arrowdown', left: 'arrowleft', right: 'arrowright' },
    wheelAdjustsFlySpeed: true,
    speedBoost: 3,
    wheelDollyStep: 0.004,
};

/** 方案标识 */
export type ViewportNavigationSchemeId = 'unity' | 'unreal' | 'blender' | 'playcanvas';

/** 可选方案表（新增编辑器风格时在此注册即可） */
export const viewportNavigationSchemes: Readonly<Record<ViewportNavigationSchemeId, ViewportNavigationScheme>> = {
    unity: UNITY_SCHEME,
    unreal: UNREAL_SCHEME,
    blender: BLENDER_SCHEME,
    playcanvas: PLAY_CANVAS_SCHEME,
};

/**
 * 按标识取方案（未知标识回退到 Unity）。
 *
 * @param id 方案标识
 */
export function getNavigationScheme(id?: string): ViewportNavigationScheme
{
    return viewportNavigationSchemes[id as ViewportNavigationSchemeId] ?? UNITY_SCHEME;
}
