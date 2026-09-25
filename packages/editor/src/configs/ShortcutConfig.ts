/**
 * 快捷键配置。
 *
 * **视口导航（环绕 / 平移 / 推拉 / 飞行）不在这里配置**——它们由
 * `ViewportNavigation` 按可插拔的「操作方案」执行（见
 * `configs/ViewportNavigationSchemes.ts`，内置 Unity / Unreal / Blender / PlayCanvas）。
 * 本文件只保留与视口无关的命令与状态规则。
 */
export const shortcutConfig = [ //
	//	key					[必须]	快捷键；用“+”连接多个按键，“!”表示没按下某键；例如 “a+!b”表示按下“a”与没按下“b”时触发。
	//	command				[可选]	要执行的command的id；使用“,”连接触发多个命令；例如 “commandA,commandB”表示满足触发条件后依次执行commandA与commandB命令。
	//	stateCommand		[可选]	要执行的状态命令id；使用“,”连接触发多个状态命令，没带“!”表示激活该状态，否则表示使其处于非激活状态；例如 “stateA,!stateB”表示满足触发条件后激活状态“stateA，使“stateB处于非激活状态。
	//	when				[可选]	快捷键激活的条件；使用“+”连接多个状态，没带“!”表示需要处于激活状态，否则需要处于非激活状态； 例如 “stateA+!stateB”表示stateA处于激活状态且stateB处于非激活状态时会判断按键是否满足条件。

	// ---- 视图工具（Unity：Q = View 工具，左键拖动平移；由 ViewportNavigation 消费该状态）----
	{ key: 'q', stateCommand: 'viewTool', when: '!fpsViewing' },
	//
	// ---- 聚焦（Frame Selected）与锁定跟随 ----
	{ key: 'f', command: 'lookToSelectedObject3D', when: '!fpsViewing' },
	{ key: 'shift+f', command: 'lockViewToSelectedObject3D', when: '!fpsViewing' },
	{ key: 'dblclick', command: 'lookToSelectedObject3D', when: 'mouseInView3D+!fpsViewing' },
	//
	// ---- 选择：单击（Ctrl/Shift 加选在命令实现里处理）、框选（Shift 加选同理）----
	{ key: '!alt+mousedown', stateCommand: 'selecting', when: '!inModal+mouseInView3D+!splitGroupDraging+!fpsViewing+!cameraNavigating' },
	{ key: 'mousemove', stateCommand: '!selecting', when: 'selecting' },
	{ key: 'mouseup', command: 'selectObject3D', stateCommand: '!selecting', when: 'selecting' },
	{ key: '!alt+mousedown', command: 'areaSelectStart', stateCommand: 'areaSelecting', when: '!inModal+mouseInView3D+!splitGroupDraging+!fpsViewing+!cameraNavigating' },
	{ key: 'mousemove', command: 'areaSelect', when: 'areaSelecting+!mouseInSceneRotateTool+!inTransforming+!selectInvalid' },
	{ key: 'mouseup', command: 'areaSelectEnd', stateCommand: '!areaSelecting', when: 'areaSelecting' },
	//
	// ---- 变换工具 ----
	{ key: 'w', command: 'object3DMoveTool', stateCommand: '!viewTool', when: '!fpsViewing' },
	{ key: 'e', command: 'object3DRotationTool', stateCommand: '!viewTool', when: '!fpsViewing' },
	{ key: 'r', command: 'object3DScaleTool', stateCommand: '!viewTool', when: '!fpsViewing' },
	//
	{ key: 'del', command: 'deleteSeletedObject3D', when: '' },
	//
	{ key: 'f12', command: 'openDevTools', stateCommand: '', when: '' },
	{ key: 'f5', command: 'refreshWindow', stateCommand: '', when: '' },
	//
	{ key: 'ctrl+c', command: 'copy' },
	{ key: 'ctrl+v', command: 'paste' },
	{ key: 'ctrl+z', command: 'undo' },

	// 可用命令
	// - lookToSelectedObject3D			聚焦选中目标（Frame Selected）
	// - lockViewToSelectedObject3D			锁定视角跟随选中目标（Lock View to Selected）
	// - object3DMoveTool					启动3D对象移动工具
	// - object3DRotationTool				启动3D对象旋转工具
	// - object3DScaleTool				启动3D对象缩放工具
	// - deleteSeletedObject3D			删除对象
	// - areaSelectStart					启动区域选择
	// - areaSelect							区域选择
	// - areaSelectEnd					结束区域选择

	// 可用状态
	// - mouseInView3D						鼠标在3D视图中
	// - fpsViewing						飞行中（由 ViewportNavigation 设置）
	// - cameraNavigating					视口导航拖动中（由 ViewportNavigation 设置）
	// - viewTool							Q 视图工具（左键拖动 = 平移）
	// - inModal							处于模式窗口时，比如menu.popup时，inMode处于激活状态
	// - inTransforming						使用变换工具中
	// - selectInvalid						选择失效
	// - areaSelecting						区域选择中

	// 可用按键（按键均为小写）
	// - a-z

	// - ctrl
	// - shift
	// - escape
	// - alt
	// - del

	// - doubleclick
	// - click
	// - mousedown
	// - mouseup
	// - middleclick
	// - middlemousedown
	// - middlemouseup
	// - rightclick
	// - rightmousedown
	// - rightmouseup
	// - mousemove
	// - mouseover
	// - mouseout
	// - mousewheel
];
