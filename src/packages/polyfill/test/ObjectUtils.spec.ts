/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ok, equal } from 'assert';
import { ObjectUtils } from '../src';

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
        ok(o.a === 1);

        const o1 = { a: 1, v2: new Vector2() };
        const v2 = new Vector2();
        ObjectUtils.assignShallow(o1, { v2 });

        ok(o1.v2 === v2);
    });

    it('assignDeep', () =>
    {
        const o = { a: 1, b: 2 };
        ObjectUtils.assignDeep(o, { a: 1 });
        ok(o.a === 1);

        const v20 = new Vector2();
        const o1 = { a: 1, v2: v20, str: '' };
        const v21 = new Vector2();
        ObjectUtils.assignDeep(o1, { v2: v21, str: 'asjdlskj' });
        ok(o1.v2 === v21);

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

        ok(o2.v2 === v20);
        ok(o2.v2.y === 2);
        ok(o2.v3 !== v3);
        ok(o2.v3.x === 1);

        // function
        const fo = { f: () => 1 };
        const o3 = { a: 3, fo };
        ObjectUtils.assignDeep(o3, { fo: { f: () => 3 } });

        ok(o3.fo === fo);
        ok(o3.fo.f() === 3);
    });

    it('isObject', () =>
    {
        class A { }

        ok(!ObjectUtils.isObject(1));
        ok(!ObjectUtils.isObject([]));
        ok(!ObjectUtils.isObject(new A()));
        ok(!ObjectUtils.isObject(false));
        if (typeof window !== 'undefined')
        {
            ok(!ObjectUtils.isObject(window));
            ok(!ObjectUtils.isObject('window'));

            ok(ObjectUtils.isObject({}));
            ok(ObjectUtils.isObject({ a: 1 }));

            // 测试 参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
            const iframe = document.createElement('iframe');
            iframe.name = 'test ObjectUtils.isObject IFrame';
            document.body.appendChild(iframe);
            // @ts-ignore
            const XObject = window.frames[window.frames.length - 1].Object;
            const obj = new XObject();
            ok(ObjectUtils.isObject(obj));
            ok(Object !== obj.constructor);

            iframe.remove();
        }
    });

    it('equalDeep', () =>
    {
        const o = { a: 1, b: { c: true, d: [1, 2, true, 'abc'], e: 'f' } };
        const o1 = JSON.parse(JSON.stringify(o));

        ok(ObjectUtils.equalDeep(o, o1));

        o.b.e = 'a';
        ok(!ObjectUtils.equalDeep(o, o1));

        const v = new Vector3(1, 2, 3);
        const v1 = new Vector3(1, 2, 3);

        ok(ObjectUtils.equalDeep(v, v1));

        v1.z = 4;
        ok(!ObjectUtils.equalDeep(v, v1));
    });

    it('getPropertyValue', () =>
    {
        // 对象
        const o = { a: 1, b: { c: true, d: [1, 2, true, 'abc'], e: 'f' } };

        ok(ObjectUtils.getPropertyValue(o, 'b.e') === o.b.e);
        ok(ObjectUtils.getPropertyValue(o, ['b', 'e']) === o.b.e);
        ok(ObjectUtils.getPropertyValue(o, 'b.f') === undefined);

        // 数组
        const arr = [[1, 2, [3, 4, 5, [6, 7]]]];
        ok(ObjectUtils.getPropertyValue(arr, '0.1') === 2);
        ok(ObjectUtils.getPropertyValue(arr, ['0', '1']) === 2);

        ok(ObjectUtils.getPropertyValue(arr, '0.2.3.1') === 7);
        ok(ObjectUtils.getPropertyValue(arr, ['0', '2', '3', '1']) === 7);

        ok(ObjectUtils.getPropertyValue(arr, '2.2.3.1') === undefined);
    });

    it('getPropertyChains', () =>
    {
        // 对象
        const o = { a: 1, b: { c: true, d: [1, 2, true, 'abc'], e: 'f' } };

        const chains = ObjectUtils.getPropertyChains(o);

        equal(chains.length, 7);

        const o1 = { a: 1, b: { c: true } };

        const chains1 = ObjectUtils.getPropertyChains(o1);
        equal(chains1.length, 2);
        ok(chains1.indexOf('a') !== -1);
        ok(chains1.indexOf('b.c') !== -1);
    });
});
