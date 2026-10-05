import { describe, expect, it } from 'vitest';
import { Func } from '../src/shader/func';

describe('Func', () =>
{
    describe('Func 类', () =>
    {
        it('应该能够创建 Func 实例', () =>
        {
            const funcInstance = new Func('test', () => 'result');
            expect(funcInstance.name).toBe('test');
        });

    });
});

