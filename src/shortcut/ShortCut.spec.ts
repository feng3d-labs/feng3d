import { EventEmitter } from '../event/EventEmitter';

import { assert, describe, it } from 'vitest';
import { shortcut } from './ShortCut';

describe('test', () =>
{
    it('test', () =>
    {
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

        let commandStr = '';
        // 监听命令
        shortcut.on('click_command', function (e): void
        {
            commandStr += 'click_command';
        });
        shortcut.on('command_d', function (e): void
        {
            commandStr += 'command_d';
        });
        shortcut.on('command_e', function (e): void
        {
            commandStr += 'command_e';
        });

        commandStr = '';
        // @ts-ignore
        shortcut.keyCapture.onMouseOnce({ type: 'click', data: { type: 'click', button: 0 } }); // 模拟单击事件，触发click_command
        assert.ok(commandStr === 'click_command'); // click_command

        //
        commandStr = '';
        // @ts-ignore
        shortcut.keyCapture.onKeydown({ type: 'keydown', data: { key: 'a' } }); // 模拟按下a键，激活state_a
        // @ts-ignore
        shortcut.keyCapture.onKeyup({ type: 'keydown', data: { key: 'a' } }); // 模拟弹起a键

        // @ts-ignore
        shortcut.keyCapture.onKeydown({ type: 'keydown', data: { key: 'e' } }); // 模拟按下e键

        // @ts-ignore
        shortcut.keyCapture.onKeydown({ type: 'keydown', data: { key: 'd' } }); // 模拟按下d键，此时按下了e键，不满足when条件，不触发command_d,command_e，所以commandStr为空
        // @ts-ignore
        shortcut.keyCapture.onKeyup({ type: 'keydown', data: { key: 'd' } }); // 模拟弹起d键
        assert.ok(commandStr === ''); // 按下e键，不满足when条件，不触发command_d,command_e，所以commandStr为空

        //
        commandStr = '';
        // @ts-ignore
        shortcut.keyCapture.onKeyup({ type: 'keydown', data: { key: 'e' } }); // 模拟弹起e键

        // @ts-ignore
        shortcut.keyCapture.onKeydown({ type: 'keydown', data: { key: 'd' } }); // 模拟按下d键，此时state_a激活，state_b不激活，满足when条件，触发command_d,command_e,更改state_a为不激活状态，state_b为激活状态。
        // @ts-ignore
        shortcut.keyCapture.onKeyup({ type: 'keydown', data: { key: 'd' } }); // 模拟弹起d键
        assert.ok(commandStr === 'command_dcommand_e'); // command_dcommand_e

        //
        commandStr = '';
        // @ts-ignore
        shortcut.keyCapture.onKeydown({ type: 'keydown', data: { key: 'd' } }); // 模拟按下d键,此时state_a不激活，state_b激活，不满足when条件，不触发command_d,command_e，所以commandStr为空
        // @ts-ignore
        shortcut.keyCapture.onKeyup({ type: 'keydown', data: { key: 'd' } }); // 模拟弹起d键
        assert.ok(commandStr === ''); // 状态不满足when条件，不触发command_d,command_e，所以commandStr为空
    });
});
