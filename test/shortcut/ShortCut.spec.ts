import { EventEmitter } from '../../src/event/EventEmitter';
import { shortcut } from '../../src/shortcut/ShortCut';

import { assert, describe, it } from 'vitest';
const { ok } = assert;

describe('test', () =>
{
    it('test', () =>
    {
        const shortcuts = [ //
            // 在按下key1时触发命令command1
            { key: 'key1', command: 'command1', when: '' }, //
            // 在按下key1时触发状态命令改变stateCommand1为激活状态
            { key: 'key1', stateCommand: 'stateCommand1', when: 'state1' }, //
            // 处于state1状态时按下key1触发命令command1
            { key: 'key1', command: 'command1', when: 'state1' }, //
            // 处于state1状态不处于state2时按下key1与没按下key2触发command1与command2，改变stateCommand1为激活状态，stateCommand2为非激活状态
            { key: 'key1+ ! key2', command: 'command1,command2', stateCommand: 'stateCommand1,!stateCommand2', when: 'state1+!state2' }, //
        ];
        // 添加快捷键
        shortcut.addShortCuts(shortcuts);
        // 监听命令
        shortcut.on('command1', function (e): void
        {
        });

        ok(!!EventEmitter);

        ok(true);
    });
});
