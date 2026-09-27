import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    decodeError, enableErrorDecoding, ErrorCode, Feng3dError, formatErrorCode,
    getDegradationCounts, isErrorDecodingEnabled, reportDegradation, resetDegradationCounts,
} from './CodedError';

/**
 * 编码错误（issue #94）。
 *
 * 关键契约：**默认不解码**（prod 语义：只带错误码、不打印上下文），
 * `enableErrorDecoding()` 之后才把完整上下文打到控制台。
 * 这两条都要钉住——否则"prod 只带错误码"就只是文档里的一句话。
 */
describe('CodedError（issue #94）', () =>
{
    afterEach(() =>
    {
        enableErrorDecoding(false);
        resetDegradationCounts();
        vi.restoreAllMocks();
    });

    it('错误码格式为 [F3D-<code>]', () =>
    {
        expect(formatErrorCode(ErrorCode.SubmitEvaluateFailed)).toBe('[F3D-1005]');
        expect(formatErrorCode(ErrorCode.LogicNotRegistered)).toBe('[F3D-1001]');
    });

    it('默认关闭解码：不打印，但计数照加（prod 语义）', () =>
    {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(isErrorDecodingEnabled()).toBe(false);

        const error = reportDegradation(ErrorCode.TextureLoadFailed, { url: 'a.png' });

        expect(spy).not.toHaveBeenCalled();
        expect(error.code).toBe(ErrorCode.TextureLoadFailed);
        expect(getDegradationCounts()[ErrorCode.TextureLoadFailed]).toBe(1);
    });

    it('开启解码：打印错误码与完整上下文（dev 语义）', () =>
    {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        enableErrorDecoding();
        expect(isErrorDecodingEnabled()).toBe(true);

        reportDegradation(ErrorCode.PrefabNotRegistered, { prefabId: 'tree' });

        expect(spy).toHaveBeenCalledTimes(1);
        const text = String(spy.mock.calls[0][0]);

        expect(text).toContain('[F3D-1003]');
        expect(text).toContain('prefabId: tree');
    });

    it('decodeError 能把上下文逐行展开，Error 值取 message', () =>
    {
        const error = new Feng3dError(ErrorCode.SubmitEvaluateFailed, {
            canvas: '#c',
            cause: new Error('boom'),
        });
        const text = decodeError(error);

        expect(text).toContain('[F3D-1005]');
        expect(text).toContain('canvas: #c');
        expect(text).toContain('cause: Error: boom');
    });

    it('decodeError 对普通 Error / 字符串退化处理', () =>
    {
        expect(decodeError(new Error('plain'))).toBe('plain');
        expect(decodeError('oops')).toBe('oops');
    });

    it('计数按错误码分组，且快照不可反向修改内部状态', () =>
    {
        reportDegradation(ErrorCode.TextureLoadFailed);
        reportDegradation(ErrorCode.TextureLoadFailed);
        reportDegradation(ErrorCode.RefNotRegistered);

        const snapshot = getDegradationCounts();

        expect(snapshot[ErrorCode.TextureLoadFailed]).toBe(2);
        expect(snapshot[ErrorCode.RefNotRegistered]).toBe(1);

        (snapshot as Record<number, number>)[ErrorCode.TextureLoadFailed] = 99;
        expect(getDegradationCounts()[ErrorCode.TextureLoadFailed]).toBe(2);

        resetDegradationCounts();
        expect(getDegradationCounts()[ErrorCode.TextureLoadFailed]).toBeUndefined();
    });
});
