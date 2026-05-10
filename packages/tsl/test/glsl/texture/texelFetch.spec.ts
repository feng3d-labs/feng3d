import { describe, expect, it } from 'vitest';
import { fragment } from '../../../src/shader/fragment';
import { sampler2D } from '../../../src/glsl/sampler/sampler2D';
import { texelFetch } from '../../../src/glsl/texture/texelFetch';
import { ivec2 } from '../../../src/types/vector/ivec2';
import { int } from '../../../src/types/scalar/int';
import { uniform } from '../../../src/variables/uniform';
import { return_ } from '../../../src/control/return';

describe('texelFetch', () =>
{
    it('应该生成正确的 GLSL 代码（无 lod 参数）', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));
        const coord = ivec2(10, 20);

        const frag = fragment('main', () =>
        {
            return_(texelFetch(diffuse, coord));
        });

        const glsl = frag.toGLSL(2);
        expect(glsl).toContain('texelFetch(diffuse, ivec2(10, 20), 0)');
    });

    it('应该生成正确的 WGSL 代码', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));
        const coord = ivec2(10, 20);

        const frag = fragment('main', () =>
        {
            return_(texelFetch(diffuse, coord));
        });

        const wgsl = frag.toWGSL();
        expect(wgsl).toContain('textureLoad(diffuse_texture, vec2<i32>(10, 20), 0u)');
    });

    it('应该支持 Int 类型的 lod', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));
        const coord = ivec2(10, 20);
        const lod = int(1);

        const frag = fragment('main', () =>
        {
            return_(texelFetch(diffuse, coord, lod));
        });

        const glsl = frag.toGLSL(2);
        expect(glsl).toContain('texelFetch(diffuse, ivec2(10, 20), 1)');

        const wgsl = frag.toWGSL();
        expect(wgsl).toContain('textureLoad(diffuse_texture, vec2<i32>(10, 20), u32(1))');
    });

    it('应该支持 number 类型的 lod', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));
        const coord = ivec2(10, 20);

        const frag = fragment('main', () =>
        {
            return_(texelFetch(diffuse, coord, 2));
        });

        const glsl = frag.toGLSL(2);
        expect(glsl).toContain('texelFetch(diffuse, ivec2(10, 20), 2)');

        const wgsl = frag.toWGSL();
        expect(wgsl).toContain('textureLoad(diffuse_texture, vec2<i32>(10, 20), 2u)');
    });
});

