import { describe, expect, it } from 'vitest';
import { fragment } from '../../../src/shader/fragment';
import { sampler2D } from '../../../src/glsl/sampler/sampler2D';
import { textureSize } from '../../../src/glsl/texture/textureSize';
import { int } from '../../../src/types/scalar/int';
import { uniform } from '../../../src/variables/uniform';
import { vec4 } from '../../../src/types/vector/vec4';
import { return_ } from '../../../src/control/return';

describe('textureSize', () =>
{
    it('应该生成正确的 GLSL 代码（无 lod 参数）', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));

        const frag = fragment('main', () =>
        {
            const size = textureSize(diffuse);
            return_(vec4(size.x, size.y, 0.0, 1.0));
        });

        const glsl = frag.toGLSL(2);
        expect(glsl).toContain('textureSize(diffuse, 0)');
    });

    it('应该生成正确的 WGSL 代码', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));

        const frag = fragment('main', () =>
        {
            const size = textureSize(diffuse);
            return_(vec4(size.x, size.y, 0.0, 1.0));
        });

        const wgsl = frag.toWGSL();
        expect(wgsl).toContain('textureDimensions(diffuse_texture, 0)');
    });

    it('应该支持 Int 类型的 lod', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));
        const lod = int(1);

        const frag = fragment('main', () =>
        {
            const size = textureSize(diffuse, lod);
            return_(vec4(size.x, size.y, 0.0, 1.0));
        });

        const glsl = frag.toGLSL(2);
        expect(glsl).toContain('textureSize(diffuse, 1)');
    });

    it('应该支持 number 类型的 lod', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));

        const frag = fragment('main', () =>
        {
            const size = textureSize(diffuse, 2);
            return_(vec4(size.x, size.y, 0.0, 1.0));
        });

        const glsl = frag.toGLSL(2);
        expect(glsl).toContain('textureSize(diffuse, 2)');
    });
});

