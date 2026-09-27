import { describe, expect, it } from 'vitest';
import { pathUtils } from '../src/PathUtils';

/**
 * filesystem 原先只有一个 `assert.ok(true)` 的占位用例（describe 还是从别的包拷来的
 * "anyEmitter"），断言恒真、零覆盖却计入统计。这里换成 `PathUtils` 的真实行为。
 */
describe('pathUtils.nameWithOutExt', () =>
{
    it('去掉扩展名只保留文件名', () =>
    {
        expect(pathUtils.nameWithOutExt('a/b/c.txt')).toBe('c');
        expect(pathUtils.nameWithOutExt('model.glb')).toBe('model');
    });

    it('多级扩展名只去掉最后一段', () =>
    {
        expect(pathUtils.nameWithOutExt('assets/scene.tar.gz')).toBe('scene.tar');
    });

    it('没有扩展名时原样返回', () =>
    {
        expect(pathUtils.nameWithOutExt('assets/README')).toBe('README');
    });

    it('带目录的隐藏文件按名称处理', () =>
    {
        // path.basename('.gitignore', path.extname('.gitignore')) —— 扩展名判定交给 @feng3d/path，
        // 这里锁定的是"结果不做二次加工"这一契约
        expect(pathUtils.nameWithOutExt('dir/.gitignore')).toBe('.gitignore');
    });
});
