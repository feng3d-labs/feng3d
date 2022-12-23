import { ok } from 'assert';
import { HighFunction } from '../src';

describe('HighFunction', () =>
{
    // 允许误差
    const deviation = 0.0000001;

    it('getValue 获取函数 f(x) 的值 ', () =>
    {
        for (let i = 0; i < 100; i++)
        {
            const as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];

            // eslint-disable-next-line no-loop-func
            const f = (x: number) =>
                as[0] * x * x * x * x * x
                + as[1] * x * x * x * x
                + as[2] * x * x * x
                + as[3] * x * x
                + as[4] * x
                + as[5];

            const hf = new HighFunction(as);

            const x = Math.random();
            const fx = f(x);
            const hfx = hf.getValue(x);
            ok(Math.abs(fx - hfx) < deviation);
        }
    });
});
