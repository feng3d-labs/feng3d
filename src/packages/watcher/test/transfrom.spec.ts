import { equal } from 'assert';
import { watcher } from '../src';

describe('watcher.watchobject transform', () =>
{
    it('使用`watcher.watchobject`监听transform', () =>
    {
        // 变换
        const transform = {
            position: { x: 0, y: 0, z: 0 },
            angle: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
        };

        let changeCount = 0;

        // 变化回调
        function onChanged(_newValue: any, _oldValue: any, _host: any, _property: string)
        {
            console.warn(_newValue, _oldValue, _host, _property);
            changeCount++;
        }

        // 监听变化
        watcher.watchobject(transform, { position: { x: 0, y: 0, z: 0 }, angle: { x: 0, y: 0, z: 0 }, scale: { x: 0, y: 0, z: 0 } }, onChanged);
        //
        changeCount = 0;
        transform.position.x = Math.random();
        equal(changeCount, 1); // 触发改变一次

        changeCount = 0;
        transform.position.x = transform.position.x + 0;
        equal(changeCount, 0); // 赋予相同的值不会触发改变

        changeCount = 0;
        transform.position = { x: Math.random(), y: Math.random(), z: Math.random() };
        equal(changeCount, 3); // x、y、z均改变

        changeCount = 0;
        transform.position = { x: transform.position.x, y: transform.position.y, z: transform.position.z };
        equal(changeCount, 0); // x、y、z均未改变

        // 移除监听变化
        watcher.unwatchobject(transform, { position: { x: 0, y: 0, z: 0 }, angle: { x: 0, y: 0, z: 0 }, scale: { x: 0, y: 0, z: 0 } }, onChanged);

        changeCount = 0;
        transform.position = { x: Math.random(), y: Math.random(), z: Math.random() };
        equal(changeCount, 0); // 无法监听到x、y、z改变
    });
});
