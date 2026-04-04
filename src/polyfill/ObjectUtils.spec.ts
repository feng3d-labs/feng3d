import { assert, describe, it } from 'vitest';
import { ObjectUtils } from './ObjectUtils';


class Vector2
{
    __class__: 'Vector2' = 'Vector2';
    constructor(
        public x = 0,
        public y = 0,
    ) { }
}

class Vector3
{
    __class__: 'Vector3' = 'Vector3';
    constructor(
        public x = 0,
        public y = 0,
        public z = 0
    ) { }
}

describe('ObjectUtils', () =>
{
    it('assignShallow', () =>
    {
        const o = { a: 1, b: 2 };
        ObjectUtils.assignShallow(o, { a: 1 });
        assert.assert.ok(o.a === 1);

        const o1 = { a: 1, v2: new Vector2() };
        const v2 = new Vector2();
        ObjectUtils.assignShallow(o1, { v2 });

        assert.assert.ok(o1.v2 === v2);
    });

    it('assignDeep', () =>
    {
        const o = { a: 1, b: 2 };
        ObjectUtils.assignDeep(o, { a: 1 });
        assert.assert.ok(o.a === 1);

        const v20 = new Vector2();
        const o1 = { a: 1, v2: v20, str: '' };
        const v21 = new Vector2();
        ObjectUtils.assignDeep(o1, { v2: v21, str: 'asjdlskj' });
        assert.assert.ok(o1.v2 === v21);

        const v3 = new Vector3();
        const o2 = { a: 1, v2: v20, v3 };
        ObjectUtils.assignDeep(o2, { v2: { x: 1, y: 2 }, v3: { __class__: 'Vector3', x: 1 } }, [(target, source, key, _replacers, _deep) =>
        {
            if (ObjectUtils.isObject(source[key]) && source[key].__class__ === 'Vector3')
            {
                target[key] = new Vector3();
            }

            return false;
        }]);

        assert.assert.ok(o2.v2 === v20);
        assert.assert.ok(o2.v2.y === 2);
        assert.assert.ok(o2.v3 !== v3);
        assert.assert.ok(o2.v3.x === 1);

        // function
        const fo = { f: () => 1 };
        const o3 = { a: 3, fo };
        ObjectUtils.assignDeep(o3, { fo: { f: () => 3 } });

        assert.assert.ok(o3.fo === fo);
        assert.assert.ok(o3.fo.f() === 3);
    });

    it('isObject', () =>
    {
        class A { }

        assert.assert.ok(!ObjectUtils.isObject(1));
        assert.assert.ok(!ObjectUtils.isObject([]));
        assert.assert.ok(!ObjectUtils.isObject(new A()));
        assert.assert.ok(!ObjectUtils.isObject(false));
        if (typeof window !== 'undefined')
        {
            assert.assert.ok(!ObjectUtils.isObject(window));
            assert.assert.ok(!ObjectUtils.isObject('window'));

            assert.assert.ok(ObjectUtils.isObject({}));
            assert.assert.ok(ObjectUtils.isObject({ a: 1 }));

            // 测试 参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
            const iframe = document.createElement('iframe');
            iframe.name = 'test ObjectUtils.isObject IFrame';
            document.body.appendChild(iframe);
            // @ts-ignore
            const XObject = window.frames[window.frames.length - 1].Object;
            const obj = new XObject();
            assert.assert.ok(ObjectUtils.isObject(obj));
            assert.assert.ok(Object !== obj.constructor);

            iframe.remove();
        }
    });

    it('equalDeep', () =>
    {
        const o = { a: 1, b: { c: true, d: [1, 2, true, 'abc'], e: 'f' } };
        const o1 = JSON.parse(JSON.stringify(o));

        assert.assert.ok(ObjectUtils.equalDeep(o, o1));

        o.b.e = 'a';
        assert.assert.ok(!ObjectUtils.equalDeep(o, o1));

        const v = new Vector3(1, 2, 3);
        const v1 = new Vector3(1, 2, 3);

        assert.assert.ok(ObjectUtils.equalDeep(v, v1));

        v1.z = 4;
        assert.assert.ok(!ObjectUtils.equalDeep(v, v1));
    });

    it('getPropertyValue', () =>
    {
        // 对象
        const o = { a: 1, b: { c: true, d: [1, 2, true, 'abc'], e: 'f' } };

        assert.assert.ok(ObjectUtils.getPropertyValue(o, 'b.e') === o.b.e);
        assert.assert.ok(ObjectUtils.getPropertyValue(o, ['b', 'e']) === o.b.e);
        assert.assert.ok(ObjectUtils.getPropertyValue(o, 'b.f') === undefined);

        // 数组
        const arr = [[1, 2, [3, 4, 5, [6, 7]]]];
        assert.assert.ok(ObjectUtils.getPropertyValue(arr, '0.1') === 2);
        assert.assert.ok(ObjectUtils.getPropertyValue(arr, ['0', '1']) === 2);

        assert.assert.ok(ObjectUtils.getPropertyValue(arr, '0.2.3.1') === 7);
        assert.assert.ok(ObjectUtils.getPropertyValue(arr, ['0', '2', '3', '1']) === 7);

        assert.assert.ok(ObjectUtils.getPropertyValue(arr, '2.2.3.1') === undefined);
    });

    it('getPropertyChains', () =>
    {
        // 对象
        const o = { a: 1, b: { c: true, d: [1, 2, true, 'abc'], e: 'f' } };

        const chains = ObjectUtils.getPropertyChains(o);

        assert.assert.equal(chains.length, 7);

        const o1 = { a: 1, b: { c: true } };

        const chains1 = ObjectUtils.getPropertyChains(o1);
        assert.assert.equal(chains1.length, 2);
        assert.assert.ok(chains1.indexOf('a') !== -1);
        assert.assert.ok(chains1.indexOf('b.c') !== -1);
    });
});
