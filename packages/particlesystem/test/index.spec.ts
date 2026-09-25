import { assert, describe, it } from 'vitest';
const { ok, equal } = assert;
import { isParticleBillboard } from '../src/isParticleBillboard';

describe('test', () =>
{
    it('test', () =>
    {
        ok(true);
    });
});

describe('isParticleBillboard', () =>
{
    it('四边形几何体（含默认值）且未对齐发射方向时为公告牌', () =>
    {
        ok(isParticleBillboard({ __type__: 'QuadGeometry' }, false));
        // 默认 geometry 每次构造都是新字面量，必须按 __type__ 判别而非引用比较
        ok(isParticleBillboard({ __type__: 'QuadGeometry' } as { __type__: string }, false));
    });

    it('对齐发射方向时不为公告牌', () =>
    {
        equal(isParticleBillboard({ __type__: 'QuadGeometry' }, true), false);
    });

    it('非四边形几何体时不为公告牌', () =>
    {
        equal(isParticleBillboard({ __type__: 'CubeGeometry' }, false), false);
        equal(isParticleBillboard({}, false), false);
    });
});
