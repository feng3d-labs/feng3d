/**
 * 快捷键配置
 */
export const shortcutConfig = [ //
	//	key					[必须]	快捷键；用“+”连接多个按键，“!”表示没按下某键；例如 “a+!b”表示按下“a”与没按下“b”时触发。
	//	command				[可选]	要执行的command的id；使用“,”连接触发多个命令；例如 “commandA,commandB”表示满足触发条件后依次执行commandA与commandB命令。
	//	stateCommand		[可选]	要执行的状态命令id；使用“,”连接触发多个状态命令，没带“!”表示激活该状态，否则表示使其处于非激活状态；例如 “stateA,!stateB”表示满足触发条件后激活状态“stateA，使“stateB处于非激活状态。
	//	when				[可选]	快捷键激活的条件；使用“+”连接多个状态，没带“!”表示需要处于激活状态，否则需要处于非激活状态； 例如 “stateA+!stateB”表示stateA处于激活状态且stateB处于非激活状态时会判断按键是否满足条件。
	{ key: 'alt+rightmousedown', command: 'sceneCameraForwardBackMouseMoveStart', stateCommand: 'sceneCameraForwardBackMouseMoving', when: 'mouseInView3D+!fpsViewing' },
	{ key: 'mousemove', command: 'sceneCameraForwardBackMouseMove', when: 'sceneCameraForwardBackMouseMoving' },
	{ key: 'rightmouseup', command: 'sceneCameraForwardBackMouseMoveEnd', stateCommand: '!sceneCameraForwardBackMouseMoving', when: 'sceneCameraForwardBackMouseMoving' },
	//
	{ key: 'rightmousedown', command: 'fpsViewStart', stateCommand: 'fpsViewing', when: '!sceneCameraForwardBackMouseMoving' },
	{ key: 'rightmouseup', command: 'fpsViewStop', stateCommand: '!fpsViewing', when: 'fpsViewing' },
	//
	{ key: 'alt+mousedown', command: 'mouseRotateSceneStart', stateCommand: 'mouseRotateSceneing', when: 'mouseInView3D' },
	{ key: 'mousemove', command: 'mouseRotateScene', when: 'mouseRotateSceneing' },
	{ key: 'mouseup', command: 'mouseRotateSceneEnd', stateCommand: '!mouseRotateSceneing', when: 'mouseRotateSceneing' },
	//
	{ key: 'middlemousedown', command: 'dragSceneStart', stateCommand: 'dragSceneing', when: 'mouseInView3D' },
	{ key: 'mousemove', command: 'dragScene', when: 'dragSceneing' },
	{ key: 'middlemouseup', command: 'dragSceneEnd', stateCommand: '!dragSceneing', when: 'dragSceneing' },
	//
	{ key: 'wheel', command: 'mouseWheelMoveSceneCamera', when: 'mouseInView3D' },
	//
	{ key: 'f', command: 'lookToSelectedGameObject', when: '' },
	{ key: 'w', command: 'gameobjectMoveTool', when: '!fpsViewing' },
	{ key: 'e', command: 'gameobjectRotationTool', when: '!fpsViewing' },
	{ key: 'r', command: 'gameobjectScaleTool', when: '!fpsViewing' },
	//
	{ key: 'del', command: 'deleteSeletedGameObject', when: '' },
	//
	{ key: '!alt+mousedown', stateCommand: 'selecting', when: '!inModal+mouseInView3D+!splitGroupDraging' },
	{ key: 'mousemove', stateCommand: '!selecting', when: 'selecting' },
	{ key: 'mouseup', command: 'selectGameObject', stateCommand: '!selecting', when: 'selecting' },
	//
	{ key: '!alt+mousedown', command: 'areaSelectStart', stateCommand: 'areaSelecting', when: '!inModal+mouseInView3D+!splitGroupDraging' },
	{ key: 'mousemove', command: 'areaSelect', when: 'areaSelecting+!mouseInSceneRotateTool+!inTransforming+!selectInvalid' },
	{ key: 'mouseup', command: 'areaSelectEnd', stateCommand: '!areaSelecting', when: 'areaSelecting' },
	//
	{ key: 'f12', command: 'openDevTools', stateCommand: '', when: '' },
	{ key: 'f5', command: 'refreshWindow', stateCommand: '', when: '' },
	//
	{ key: 'ctrl+c', command: 'copy' },
	{ key: 'ctrl+v', command: 'paste' },
	{ key: 'ctrl+z', command: 'undo' },

	// 可用命令
	// - fpsViewStart						启动fps浏览场景
	// - fpsViewStop						停止fps浏览场景
	// - lookToSelectedGameObject			看向选中目标
	// - gameobjectMoveTool					启动3D对象移动工具
	// - gameobjectRotationTool				启动3D对象旋转工具
	// - gameobjectScaleTool				启动3D对象缩放工具
	// - mouseRotateSceneStart				启动场景旋转
	// - mouseRotateScene					旋转场景
	// - dragSceneStart						启动拖拽场景
	// - dragScene							拖拽场景
	// - mouseWheelMoveSceneCamera			鼠标滚轮前后移动摄像机
	// - deleteSeletedGameObject			删除对象
	// - areaSelectStart					启动区域选择
	// - areaSelect							区域选择
	// - areaSelectEnd						结束区域选择

	// 可用状态
	// - mouseInView3D						鼠标在3D视图中
	// - fpsViewing							fps浏览场景中
	// - mouseRotateSceneing				旋转场景中
	// - dragSceneing						拖拽场景中
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
