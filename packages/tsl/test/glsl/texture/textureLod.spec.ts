import { describe, expect, it } from 'vitest';
import { fragment } from '../../../src/shader/fragment';
import { sampler2D } from '../../../src/glsl/sampler/sampler2D';
import { textureLod } from '../../../src/glsl/texture/textureLod';
import { float } from '../../../src/types/scalar/float';
import { vec2 } from '../../../src/types/vector/vec2';
import { uniform } from '../../../src/variables/uniform';
import { return_ } from '../../../src/control/return';

describe('textureLod', () =>
{
    it('应该生成正确的 GLSL 代码（Float lod）', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));
        const coord = vec2(0.5, 0.5);
        const lod = float(1.0);

        const frag = fragment('main', () =>
        {
            return_(textureLod(diffuse, coord, lod));
        });

        const glsl = frag.toGLSL(2);
        expect(glsl).toContain('textureLod(diffuse, vec2(0.5), 1.0)');
    });

    it('应该生成正确的 WGSL 代码', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));
        const coord = vec2(0.5, 0.5);
        const lod = float(1.0);

        const frag = fragment('main', () =>
        {
            return_(textureLod(diffuse, coord, lod));
        });

        const wgsl = frag.toWGSL();
        expect(wgsl).toContain('textureSampleLevel(diffuse_texture, diffuse, vec2<f32>(0.5), 1.0)');
    });

    it('应该支持 number 类型的 lod', () =>
    {
        const diffuse = sampler2D(uniform('diffuse'));
        const coord = vec2(0.5, 0.5);

        const frag = fragment('main', () =>
        {
            return_(textureLod(diffuse, coord, 2.0));
        });

        const glsl = frag.toGLSL(2);
        expect(glsl).toContain('textureLod(diffuse, vec2(0.5), 2.0)');

        const wgsl = frag.toWGSL();
        expect(wgsl).toContain('textureSampleLevel(diffuse_texture, diffuse, vec2<f32>(0.5), 2.0)');
    });
});

