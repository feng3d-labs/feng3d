import { Compiler } from './compiler';
import './directives/condition';
import './directives/define';
import './directives/directives';
import './directives/extra';
import './directives/include';
import { defaultFS } from './fs';
import './parse-next-line';
import './processor';
import './string-helper';
import './system/comments';
import './system/conditions';
import './system/constants';
import './system/defines';
import './system/macros';
import './system/stack';

export function compile(code: string, options?: {
    includeSpaces?: number;
    emptyLinesLimit?: number;
    basePath?: string;
    stopOnError?: boolean;
    enumInHex?: boolean;
    filename?: any;
    commentEscape?: boolean;
    newLine?: string;
    constants?: {};
    macros?: {};
}, callback?: (errorMsg: string, result: string) => void, fs = defaultFS)
{
    // If there isn't an option but a callback
    if (typeof options === 'function')
    {
        callback = options;
        options = null;
    }

    // Create the compiler and attach it the callback
    const compiler = new Compiler(options, fs);

    compiler.once('error', function (e)
    {
        callback && callback(e.data, null);
    });

    compiler.once('success', function (e)
    {
        callback && callback(null, e.data);
    });

    compiler.compile(code);
}

// Quick access: compile a file
export function compileFile(file: string, options?: {
    includeSpaces?: number;
    emptyLinesLimit?: number;
    basePath?: string;
    stopOnError?: boolean;
    enumInHex?: boolean;
    filename?: any;
    commentEscape?: boolean;
    newLine?: string;
    constants?: {};
    macros?: {};
}, callback?: (errorMsg: string, result: string) => void, fs = defaultFS)
{
    // If there isn't an option but a callback
    if (typeof options === 'function')
    {
        callback = options;
        options = null;
    }

    // Create the compiler and attach it the callback
    const compiler = new Compiler(options, fs);

    compiler.once('error', function (e)
    {
        callback && callback(e.data, null);
    });

    compiler.once('success', function (e)
    {
        callback && callback(null, e.data);
    });

    compiler.compileFile(file);
}
