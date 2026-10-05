/**
 * WGSL 保留关键字集合（惰性创建：模块顶层不执行 `new Set`，见 AGENTS.md §15 R2 零模块级副作用）
 * @see https://www.w3.org/TR/WGSL/#reserved-words
 */
let wgslReservedKeywords: Set<string> | undefined;

/**
 * 获取 WGSL 保留关键字集合（首次调用时创建并缓存）
 * @returns WGSL 保留关键字集合
 */
export function getWgslReservedKeywords(): Set<string>
{
    if (wgslReservedKeywords === undefined)
    {
        wgslReservedKeywords = new Set([
    // 基本保留关键字
    'alias', 'break', 'case', 'const', 'const_assert', 'continue', 'continuing',
    'default', 'diagnostic', 'discard', 'else', 'enable', 'false', 'fn', 'for',
    'if', 'let', 'loop', 'override', 'return', 'struct', 'switch', 'true', 'var',
    'while',
    // 未来保留关键字
    'NULL', 'Self', 'abstract', 'active', 'alignas', 'alignof', 'as', 'asm',
    'assert', 'auto', 'await', 'become', 'binding_array', 'cast', 'catch', 'class',
    'co_await', 'co_return', 'co_yield', 'coherent', 'column_major', 'common',
    'compile', 'compile_fragment', 'concept', 'const_cast', 'consteval', 'constexpr',
    'constinit', 'crate', 'debugger', 'decltype', 'delete', 'demote', 'demote_to_helper',
    'do', 'dynamic_cast', 'enum', 'explicit', 'export', 'extends', 'extern', 'external',
    'fallthrough', 'filter', 'final', 'finally', 'friend', 'from', 'fxgroup', 'get',
    'goto', 'groupshared', 'highp', 'impl', 'implements', 'import', 'inline', 'instanceof',
    'interface', 'layout', 'lowp', 'macro', 'macro_rules', 'match', 'mediump', 'meta',
    'mod', 'module', 'move', 'mut', 'mutable', 'namespace', 'new', 'nil', 'noexcept',
    'noinline', 'nointerpolation', 'noperspective', 'null', 'nullptr', 'of', 'operator',
    'package', 'packoffset', 'partition', 'pass', 'patch', 'pixelfragment', 'precise',
    'precision', 'premerge', 'priv', 'protected', 'pub', 'public', 'readonly', 'ref',
    'regardless', 'register', 'reinterpret_cast', 'require', 'resource', 'restrict',
    'row_major', 'self', 'set', 'shared', 'sizeof', 'smooth', 'snorm', 'static',
    'static_assert', 'static_cast', 'std', 'subroutine', 'super', 'target', 'template',
    'this', 'thread_local', 'throw', 'trait', 'try', 'type', 'typedef', 'typeid',
    'typename', 'typeof', 'union', 'unless', 'unorm', 'unsafe', 'unsized', 'use',
    'using', 'varying', 'virtual', 'volatile', 'wgsl', 'where', 'with', 'writeonly',
    'yield',
        ]);
    }

    return wgslReservedKeywords;
}

/**
 * 检查变量名是否是 WGSL 保留关键字，如果是则发出警告
 * @param name 变量名
 */
export function checkWGSLReservedKeyword(name: string): void
{
    if (getWgslReservedKeywords().has(name))
    {
        console.warn(`[TSL 警告] 变量名 '${name}' 是 WGSL 保留关键字，可能导致生成的 WGSL 代码解析错误。建议使用其他变量名。`);
    }
}

