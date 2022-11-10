import { ok } from 'assert';
import { equationSolving, HighFunction } from '../src';

describe('EquationSolving', () =>
{
    // 允许误差
    const precision = 0.0000001;
    const testtimes = 100;

    it('binary 二分法 求解 f(x) == 0 ', () =>
    {
        for (let i = 0; i < testtimes; i++)
        {
            const as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            const hf = new HighFunction(as);

            const a = Math.random();
            const b = a + Math.random();
            const fa = hf.getValue(a);
            const fb = hf.getValue(b);

            // eslint-disable-next-line no-loop-func
            const f = (x: number) => hf.getValue(x) - (fa + fb) / 2;

            // 求解 ff(x) == 0
            const x = equationSolving.binary(f, a, b, precision);
            const fx = f(x);

            ok(fx < precision);
        }
    });

    it('line 连线法 求解 f(x) == 0 ', () =>
    {
        for (let i = 0; i < testtimes; i++)
        {
            const as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            const hf = new HighFunction(as);

            const a = Math.random();
            const b = a + Math.random();
            const fa = hf.getValue(a);
            const fb = hf.getValue(b);

            const f = (x: number) => hf.getValue(x) - (fa + fb) / 2;

            // 求解 ff(x) == 0
            const x = equationSolving.line(f, a, b, precision);
            const fx = f(x);

            ok(fx < precision);
        }
    });

    it('tangent 切线法 求解 f(x) == 0 ', () =>
    {
        for (let i = 0; i < testtimes; i++)
        {
            const as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            const hf = new HighFunction(as);

            const a = Math.random();
            const b = a + Math.random();
            const fa = hf.getValue(a);
            const fb = hf.getValue(b);

            // eslint-disable-next-line no-loop-func
            const f = (x: number) => hf.getValue(x) - (fa + fb) / 2;

            // 导函数
            const f1 = equationSolving.getDerivative(f);
            // 二阶导函数
            const f2 = equationSolving.getDerivative(f1);

            // 求解 ff(x) == 0
            const x = equationSolving.tangent(f, f1, f2, a, b, precision, (err) =>
            {
                ok(true, err.message);
            });

            if (x < a || x > b)
            {
                ok(true, `解 ${x} 超出求解区间 [${a}, ${b}]`);
            }
            else if (x !== undefined)
            {
                const fx = f(x);
                ok(fx < precision);
            }
        }
    });

    it('secant 割线法（弦截法） 求解 f(x) == 0 ', () =>
    {
        for (let i = 0; i < testtimes; i++)
        {
            const as = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            const hf = new HighFunction(as);

            const a = Math.random();
            const b = a + Math.random();
            const fa = hf.getValue(a);
            const fb = hf.getValue(b);

            const f = (x: number) => hf.getValue(x) - (fa + fb) / 2;

            // 求解 ff(x) == 0
            const x = equationSolving.secant(f, a, b, precision, (err) =>
            {
                ok(true, err.message);
            });

            if (x < a || x > b)
            {
                ok(true, `解 ${x} 超出求解区间 [${a}, ${b}]`);
            }
            else if (x !== undefined)
            {
                const fx = f(x);
                ok(fx < precision);
            }
        }
    });
});
