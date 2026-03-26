# @feng3d/shortcut
快捷键系统。

参考VSCode快捷键进行设计。

源码：https://gitee.com/feng3d/shortcut

文档：https://feng3d.com/shortcut

## 安装
```
npm install @feng3d/shortcut
```

## 示例
```
import { shortcut } from '@feng3d/shortcut';

const shortcuts = [ //
    // 点击触发命令click_command
    { key: 'click', command: 'click_command', when: '' },

    // 按下a键，更改 state_a 为激活状态
    { key: 'a', stateCommand: 'state_a', when: '' },

    // 按下d键且没按下e键，且状态state_a激活state_b不激活时触发command_d,command_e，更改state_a为不激活状态，state_b为激活状态。
    { key: 'd+ ! e', command: 'command_d,command_e', stateCommand: '!state_a,state_b', when: 'state_a+!state_b' },
];
// 添加快捷键
shortcut.addShortCuts(shortcuts);

let commandStr = "";
// 监听命令
shortcut.on('click_command', function (e): void {
    commandStr += "click_command";
});
shortcut.on('command_d', function (e): void {
    commandStr += "command_d";
});
shortcut.on('command_e', function (e): void {
    commandStr += "command_e";
});

commandStr = "";
// @ts-ignore
shortcut.keyCapture.onMouseOnce({ type: 'click', data: { type: "click", button: 0 } }); // 模拟单击事件，触发click_command
console.log(commandStr === "click_command"); // click_command

//
commandStr = "";
// @ts-ignore
shortcut.keyCapture.onKeydown({ type: 'keydown', data: { key: 'a' } }); // 模拟按下a键，激活state_a
// @ts-ignore
shortcut.keyCapture.onKeyup({ type: 'keydown', data: { key: 'a' } }); // 模拟弹起a键

// @ts-ignore
shortcut.keyCapture.onKeydown({ type: 'keydown', data: { key: 'e' } }); // 模拟按下e键

// @ts-ignore
shortcut.keyCapture.onKeydown({ type: 'keydown', data: { key: 'd' } }); // 模拟按下d键，此时按下了e键，不满足when条件，不触发command_d,command_e，所以commandStr为空

console.log(commandStr === ""); // 按下e键，不满足when条件，不触发command_d,command_e，所以commandStr为空

// @ts-ignore
shortcut.keyCapture.onKeyup({ type: 'keydown', data: { key: 'e' } }); // 模拟弹起e键，此时按下了d键，没有按下e键，满足when条件，触发command_d,command_e

console.log(commandStr === "command_dcommand_e"); // command_dcommand_e

// @ts-ignore
shortcut.keyCapture.onKeyup({ type: 'keydown', data: { key: 'd' } }); // 模拟弹起d键

```

## 支持按键
```
// 包含以下按键，还有没有被列入的。主要是有鼠标事件与键盘事件名称组成。

'mousemove', 'mouseover', 'mouseout', 'mousedown', 'mouseup', 'click', // 鼠标按键
`1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `0`, // 数字
'-', '=', '[', ']', '\\', ';', '\'', ',', '.', '/', // 符号
`\``, // 符号
`tab`, `capslock`, `shift`, `ctrl`, `meta`, `alt`, `escape`, `contextmenu`, `enter`, // 功能键 
`insert`, `del`, `home`, `end`, `pageup`, `pagedown`, // 功能键
`printscreen`, `scrolllock`, `pause`, // 功能键
`f1`, `f2`, `f3`, `f4`, `f5`, `f6`, `f7`, `f8`, `f9`, `f10`, `f11`, `f12`, // 功能键
'numlock', // 功能键
'arrowup', 'arrowdown', 'arrowleft', 'arrowright', // 方向键
'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', // 字母
```