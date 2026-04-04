import { assert, describe, it } from 'vitest';
import { FormatInputPathObject, path, Path } from './Path';
const { ok, equal, deepEqual } = assert;

describe('path', () =>
{
    it('basename', () =>
    {
        // equal(path.basename(__filename), 'test-path-basename.js');
        // equal(path.basename(__filename, '.js'), 'test-path-basename');
        equal(path.basename('.js', '.js'), '');
        equal(path.basename(''), '');
        equal(path.basename('/dir/basename.ext'), 'basename.ext');
        equal(path.basename('/basename.ext'), 'basename.ext');
        equal(path.basename('basename.ext'), 'basename.ext');
        equal(path.basename('basename.ext/'), 'basename.ext');
        equal(path.basename('basename.ext//'), 'basename.ext');
        equal(path.basename('aaa/bbb', '/bbb'), 'bbb');
        equal(path.basename('aaa/bbb', 'a/bbb'), 'bbb');
        equal(path.basename('aaa/bbb', 'bbb'), 'bbb');
        equal(path.basename('aaa/bbb//', 'bbb'), 'bbb');
        equal(path.basename('aaa/bbb', 'bb'), 'b');
        equal(path.basename('aaa/bbb', 'b'), 'bb');
        equal(path.basename('/aaa/bbb', '/bbb'), 'bbb');
        equal(path.basename('/aaa/bbb', 'a/bbb'), 'bbb');
        equal(path.basename('/aaa/bbb', 'bbb'), 'bbb');
        equal(path.basename('/aaa/bbb//', 'bbb'), 'bbb');
        equal(path.basename('/aaa/bbb', 'bb'), 'b');
        equal(path.basename('/aaa/bbb', 'b'), 'bb');
        equal(path.basename('/aaa/bbb'), 'bbb');
        equal(path.basename('/aaa/'), 'aaa');
        equal(path.basename('/aaa/b'), 'b');
        equal(path.basename('/a/b'), 'b');
        equal(path.basename('//a'), 'a');
        equal(path.basename('a', 'a'), '');

        // On Windows a backslash acts as a path separator.
        equal(path.win32.basename('\\dir\\basename.ext'), 'basename.ext');
        equal(path.win32.basename('\\basename.ext'), 'basename.ext');
        equal(path.win32.basename('basename.ext'), 'basename.ext');
        equal(path.win32.basename('basename.ext\\'), 'basename.ext');
        equal(path.win32.basename('basename.ext\\\\'), 'basename.ext');
        equal(path.win32.basename('foo'), 'foo');
        equal(path.win32.basename('aaa\\bbb', '\\bbb'), 'bbb');
        equal(path.win32.basename('aaa\\bbb', 'a\\bbb'), 'bbb');
        equal(path.win32.basename('aaa\\bbb', 'bbb'), 'bbb');
        equal(path.win32.basename('aaa\\bbb\\\\\\\\', 'bbb'), 'bbb');
        equal(path.win32.basename('aaa\\bbb', 'bb'), 'b');
        equal(path.win32.basename('aaa\\bbb', 'b'), 'bb');
        equal(path.win32.basename('C:'), '');
        equal(path.win32.basename('C:.'), '.');
        equal(path.win32.basename('C:\\'), '');
        equal(path.win32.basename('C:\\dir\\base.ext'), 'base.ext');
        equal(path.win32.basename('C:\\basename.ext'), 'basename.ext');
        equal(path.win32.basename('C:basename.ext'), 'basename.ext');
        equal(path.win32.basename('C:basename.ext\\'), 'basename.ext');
        equal(path.win32.basename('C:basename.ext\\\\'), 'basename.ext');
        equal(path.win32.basename('C:foo'), 'foo');
        equal(path.win32.basename('file:stream'), 'file:stream');
        equal(path.win32.basename('a', 'a'), '');

        // On unix a backslash is just treated as any other character.
        equal(path.posix.basename('\\dir\\basename.ext'),
            '\\dir\\basename.ext');
        equal(path.posix.basename('\\basename.ext'), '\\basename.ext');
        equal(path.posix.basename('basename.ext'), 'basename.ext');
        equal(path.posix.basename('basename.ext\\'), 'basename.ext\\');
        equal(path.posix.basename('basename.ext\\\\'), 'basename.ext\\\\');
        equal(path.posix.basename('foo'), 'foo');

        // POSIX filenames may include control characters
        // c.f. http://www.dwheeler.com/essays/fixing-unix-linux-filenames.html
        const controlCharFilename = `Icon${String.fromCharCode(13)}`;
        equal(path.posix.basename(`/a/b/${controlCharFilename}`),
            controlCharFilename);
    });

    it('dirname', () =>
    {
        // equal(path.dirname(__filename).substr(-13),
        //                    common.isWindows ? 'test\\parallel' : 'test/parallel');

        equal(path.posix.dirname('/a/b/'), '/a');
        equal(path.posix.dirname('/a/b'), '/a');
        equal(path.posix.dirname('/a'), '/');
        equal(path.posix.dirname(''), '.');
        equal(path.posix.dirname('/'), '/');
        equal(path.posix.dirname('////'), '/');
        equal(path.posix.dirname('//a'), '//');
        equal(path.posix.dirname('foo'), '.');

        equal(path.win32.dirname('c:\\'), 'c:\\');
        equal(path.win32.dirname('c:\\foo'), 'c:\\');
        equal(path.win32.dirname('c:\\foo\\'), 'c:\\');
        equal(path.win32.dirname('c:\\foo\\bar'), 'c:\\foo');
        equal(path.win32.dirname('c:\\foo\\bar\\'), 'c:\\foo');
        equal(path.win32.dirname('c:\\foo\\bar\\baz'), 'c:\\foo\\bar');
        equal(path.win32.dirname('\\'), '\\');
        equal(path.win32.dirname('\\foo'), '\\');
        equal(path.win32.dirname('\\foo\\'), '\\');
        equal(path.win32.dirname('\\foo\\bar'), '\\foo');
        equal(path.win32.dirname('\\foo\\bar\\'), '\\foo');
        equal(path.win32.dirname('\\foo\\bar\\baz'), '\\foo\\bar');
        equal(path.win32.dirname('c:'), 'c:');
        equal(path.win32.dirname('c:foo'), 'c:');
        equal(path.win32.dirname('c:foo\\'), 'c:');
        equal(path.win32.dirname('c:foo\\bar'), 'c:foo');
        equal(path.win32.dirname('c:foo\\bar\\'), 'c:foo');
        equal(path.win32.dirname('c:foo\\bar\\baz'), 'c:foo\\bar');
        equal(path.win32.dirname('file:stream'), '.');
        equal(path.win32.dirname('dir\\file:stream'), 'dir');
        equal(path.win32.dirname('\\\\unc\\share'),
            '\\\\unc\\share');
        equal(path.win32.dirname('\\\\unc\\share\\foo'),
            '\\\\unc\\share\\');
        equal(path.win32.dirname('\\\\unc\\share\\foo\\'),
            '\\\\unc\\share\\');
        equal(path.win32.dirname('\\\\unc\\share\\foo\\bar'),
            '\\\\unc\\share\\foo');
        equal(path.win32.dirname('\\\\unc\\share\\foo\\bar\\'),
            '\\\\unc\\share\\foo');
        equal(path.win32.dirname('\\\\unc\\share\\foo\\bar\\baz'),
            '\\\\unc\\share\\foo\\bar');
        equal(path.win32.dirname('/a/b/'), '/a');
        equal(path.win32.dirname('/a/b'), '/a');
        equal(path.win32.dirname('/a'), '/');
        equal(path.win32.dirname(''), '.');
        equal(path.win32.dirname('/'), '/');
        equal(path.win32.dirname('////'), '/');
        equal(path.win32.dirname('foo'), '.');
    });

    it('dirname', () =>
    {
        // equal(path.dirname(__filename).substr(-13),
        //                    common.isWindows ? 'test\\parallel' : 'test/parallel');

        equal(path.posix.dirname('/a/b/'), '/a');
        equal(path.posix.dirname('/a/b'), '/a');
        equal(path.posix.dirname('/a'), '/');
        equal(path.posix.dirname(''), '.');
        equal(path.posix.dirname('/'), '/');
        equal(path.posix.dirname('////'), '/');
        equal(path.posix.dirname('//a'), '//');
        equal(path.posix.dirname('foo'), '.');

        equal(path.win32.dirname('c:\\'), 'c:\\');
        equal(path.win32.dirname('c:\\foo'), 'c:\\');
        equal(path.win32.dirname('c:\\foo\\'), 'c:\\');
        equal(path.win32.dirname('c:\\foo\\bar'), 'c:\\foo');
        equal(path.win32.dirname('c:\\foo\\bar\\'), 'c:\\foo');
        equal(path.win32.dirname('c:\\foo\\bar\\baz'), 'c:\\foo\\bar');
        equal(path.win32.dirname('\\'), '\\');
        equal(path.win32.dirname('\\foo'), '\\');
        equal(path.win32.dirname('\\foo\\'), '\\');
        equal(path.win32.dirname('\\foo\\bar'), '\\foo');
        equal(path.win32.dirname('\\foo\\bar\\'), '\\foo');
        equal(path.win32.dirname('\\foo\\bar\\baz'), '\\foo\\bar');
        equal(path.win32.dirname('c:'), 'c:');
        equal(path.win32.dirname('c:foo'), 'c:');
        equal(path.win32.dirname('c:foo\\'), 'c:');
        equal(path.win32.dirname('c:foo\\bar'), 'c:foo');
        equal(path.win32.dirname('c:foo\\bar\\'), 'c:foo');
        equal(path.win32.dirname('c:foo\\bar\\baz'), 'c:foo\\bar');
        equal(path.win32.dirname('file:stream'), '.');
        equal(path.win32.dirname('dir\\file:stream'), 'dir');
        equal(path.win32.dirname('\\\\unc\\share'),
            '\\\\unc\\share');
        equal(path.win32.dirname('\\\\unc\\share\\foo'),
            '\\\\unc\\share\\');
        equal(path.win32.dirname('\\\\unc\\share\\foo\\'),
            '\\\\unc\\share\\');
        equal(path.win32.dirname('\\\\unc\\share\\foo\\bar'),
            '\\\\unc\\share\\foo');
        equal(path.win32.dirname('\\\\unc\\share\\foo\\bar\\'),
            '\\\\unc\\share\\foo');
        equal(path.win32.dirname('\\\\unc\\share\\foo\\bar\\baz'),
            '\\\\unc\\share\\foo\\bar');
        equal(path.win32.dirname('/a/b/'), '/a');
        equal(path.win32.dirname('/a/b'), '/a');
        equal(path.win32.dirname('/a'), '/');
        equal(path.win32.dirname(''), '.');
        equal(path.win32.dirname('/'), '/');
        equal(path.win32.dirname('////'), '/');
        equal(path.win32.dirname('foo'), '.');
    });

    it('extname', () =>
    {
        const failures: string[] = [];
        const slashRE = /\//g;

        [
            // [__filename, '.js'],
            ['', ''],
            ['/path/to/file', ''],
            ['/path/to/file.ext', '.ext'],
            ['/path.to/file.ext', '.ext'],
            ['/path.to/file', ''],
            ['/path.to/.file', ''],
            ['/path.to/.file.ext', '.ext'],
            ['/path/to/f.ext', '.ext'],
            ['/path/to/..ext', '.ext'],
            ['/path/to/..', ''],
            ['file', ''],
            ['file.ext', '.ext'],
            ['.file', ''],
            ['.file.ext', '.ext'],
            ['/file', ''],
            ['/file.ext', '.ext'],
            ['/.file', ''],
            ['/.file.ext', '.ext'],
            ['.path/file.ext', '.ext'],
            ['file.ext.ext', '.ext'],
            ['file.', '.'],
            ['.', ''],
            ['./', ''],
            ['.file.ext', '.ext'],
            ['.file', ''],
            ['.file.', '.'],
            ['.file..', '.'],
            ['..', ''],
            ['../', ''],
            ['..file.ext', '.ext'],
            ['..file', '.file'],
            ['..file.', '.'],
            ['..file..', '.'],
            ['...', '.'],
            ['...ext', '.ext'],
            ['....', '.'],
            ['file.ext/', '.ext'],
            ['file.ext//', '.ext'],
            ['file/', ''],
            ['file//', ''],
            ['file./', '.'],
            ['file.//', '.'],
        ].forEach((test) =>
        {
            const expected = test[1];
            [path.posix.extname, path.win32.extname].forEach((extname) =>
            {
                let input = test[0];
                let os: string;
                if (extname === path.win32.extname)
                {
                    input = input.replace(slashRE, '\\');
                    os = 'win32';
                }
                else
                {
                    os = 'posix';
                }
                const actual = extname(input);
                const message = `path.${os}.extname(${JSON.stringify(input)})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                if (actual !== expected)
                { failures.push(`\n${message}`); }
            });
            {
                const input = `C:${test[0].replace(slashRE, '\\')}`;
                const actual = path.win32.extname(input);
                const message = `path.win32.extname(${JSON.stringify(input)})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                if (actual !== expected)
                { failures.push(`\n${message}`); }
            }
        });
        equal(failures.length, 0, failures.join(''));

        // On Windows, backslash is a path separator.
        equal(path.win32.extname('.\\'), '');
        equal(path.win32.extname('..\\'), '');
        equal(path.win32.extname('file.ext\\'), '.ext');
        equal(path.win32.extname('file.ext\\\\'), '.ext');
        equal(path.win32.extname('file\\'), '');
        equal(path.win32.extname('file\\\\'), '');
        equal(path.win32.extname('file.\\'), '.');
        equal(path.win32.extname('file.\\\\'), '.');

        // On *nix, backslash is a valid name component like any other character.
        equal(path.posix.extname('.\\'), '');
        equal(path.posix.extname('..\\'), '.\\');
        equal(path.posix.extname('file.ext\\'), '.ext\\');
        equal(path.posix.extname('file.ext\\\\'), '.ext\\\\');
        equal(path.posix.extname('file\\'), '');
        equal(path.posix.extname('file\\\\'), '');
        equal(path.posix.extname('file.\\'), '.\\');
        equal(path.posix.extname('file.\\\\'), '.\\\\');
    });

    it('isAbsolute', () =>
    {
        equal(path.win32.isAbsolute('/'), true);
        equal(path.win32.isAbsolute('//'), true);
        equal(path.win32.isAbsolute('//server'), true);
        equal(path.win32.isAbsolute('//server/file'), true);
        equal(path.win32.isAbsolute('\\\\server\\file'), true);
        equal(path.win32.isAbsolute('\\\\server'), true);
        equal(path.win32.isAbsolute('\\\\'), true);
        equal(path.win32.isAbsolute('c'), false);
        equal(path.win32.isAbsolute('c:'), false);
        equal(path.win32.isAbsolute('c:\\'), true);
        equal(path.win32.isAbsolute('c:/'), true);
        equal(path.win32.isAbsolute('c://'), true);
        equal(path.win32.isAbsolute('C:/Users/'), true);
        equal(path.win32.isAbsolute('C:\\Users\\'), true);
        equal(path.win32.isAbsolute('C:cwd/another'), false);
        equal(path.win32.isAbsolute('C:cwd\\another'), false);
        equal(path.win32.isAbsolute('directory/directory'), false);
        equal(path.win32.isAbsolute('directory\\directory'), false);

        equal(path.posix.isAbsolute('/home/foo'), true);
        equal(path.posix.isAbsolute('/home/foo/..'), true);
        equal(path.posix.isAbsolute('bar/'), false);
        equal(path.posix.isAbsolute('./baz'), false);
    });

    it('join', () =>
    {
        const failures: string[] = [];
        const backslashRE = /\\/g;

        const joinTests: any = [
            [[path.posix.join, path.win32.join],
            // arguments                     result
            [[['.', 'x/b', '..', '/b/c.js'], 'x/b/c.js'],
            [[], '.'],
            [['/.', 'x/b', '..', '/b/c.js'], '/x/b/c.js'],
            [['/foo', '../../../bar'], '/bar'],
            [['foo', '../../../bar'], '../../bar'],
            [['foo/', '../../../bar'], '../../bar'],
            [['foo/x', '../../../bar'], '../bar'],
            [['foo/x', './bar'], 'foo/x/bar'],
            [['foo/x/', './bar'], 'foo/x/bar'],
            [['foo/x/', '.', 'bar'], 'foo/x/bar'],
            [['./'], './'],
            [['.', './'], './'],
            [['.', '.', '.'], '.'],
            [['.', './', '.'], '.'],
            [['.', '/./', '.'], '.'],
            [['.', '/////./', '.'], '.'],
            [['.'], '.'],
            [['', '.'], '.'],
            [['', 'foo'], 'foo'],
            [['foo', '/bar'], 'foo/bar'],
            [['', '/foo'], '/foo'],
            [['', '', '/foo'], '/foo'],
            [['', '', 'foo'], 'foo'],
            [['foo', ''], 'foo'],
            [['foo/', ''], 'foo/'],
            [['foo', '', '/bar'], 'foo/bar'],
            [['./', '..', '/foo'], '../foo'],
            [['./', '..', '..', '/foo'], '../../foo'],
            [['.', '..', '..', '/foo'], '../../foo'],
            [['', '..', '..', '/foo'], '../../foo'],
            [['/'], '/'],
            [['/', '.'], '/'],
            [['/', '..'], '/'],
            [['/', '..', '..'], '/'],
            [[''], '.'],
            [['', ''], '.'],
            [[' /foo'], ' /foo'],
            [[' ', 'foo'], ' /foo'],
            [[' ', '.'], ' '],
            [[' ', '/'], ' /'],
            [[' ', ''], ' '],
            [['/', 'foo'], '/foo'],
            [['/', '/foo'], '/foo'],
            [['/', '//foo'], '/foo'],
            [['/', '', '/foo'], '/foo'],
            [['', '/', 'foo'], '/foo'],
            [['', '/', '/foo'], '/foo']
            ]
            ]
        ];

        // Windows-specific join tests
        joinTests.push([
            path.win32.join,
            joinTests[0][1].slice(0).concat(
                [// arguments                     result
                    // UNC path expected
                    [['//foo/bar'], '\\\\foo\\bar\\'],
                    [['\\/foo/bar'], '\\\\foo\\bar\\'],
                    [['\\\\foo/bar'], '\\\\foo\\bar\\'],
                    // UNC path expected - server and share separate
                    [['//foo', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo/', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo', '/bar'], '\\\\foo\\bar\\'],
                    // UNC path expected - questionable
                    [['//foo', '', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo/', '', 'bar'], '\\\\foo\\bar\\'],
                    [['//foo/', '', '/bar'], '\\\\foo\\bar\\'],
                    // UNC path expected - even more questionable
                    [['', '//foo', 'bar'], '\\\\foo\\bar\\'],
                    [['', '//foo/', 'bar'], '\\\\foo\\bar\\'],
                    [['', '//foo/', '/bar'], '\\\\foo\\bar\\'],
                    // No UNC path expected (no double slash in first component)
                    [['\\', 'foo/bar'], '\\foo\\bar'],
                    [['\\', '/foo/bar'], '\\foo\\bar'],
                    [['', '/', '/foo/bar'], '\\foo\\bar'],
                    // No UNC path expected (no non-slashes in first component -
                    // questionable)
                    [['//', 'foo/bar'], '\\foo\\bar'],
                    [['//', '/foo/bar'], '\\foo\\bar'],
                    [['\\\\', '/', '/foo/bar'], '\\foo\\bar'],
                    [['//'], '\\'],
                    // No UNC path expected (share name missing - questionable).
                    [['//foo'], '\\foo'],
                    [['//foo/'], '\\foo\\'],
                    [['//foo', '/'], '\\foo\\'],
                    [['//foo', '', '/'], '\\foo\\'],
                    // No UNC path expected (too many leading slashes - questionable)
                    [['///foo/bar'], '\\foo\\bar'],
                    [['////foo', 'bar'], '\\foo\\bar'],
                    [['\\\\\\/foo/bar'], '\\foo\\bar'],
                    // Drive-relative vs drive-absolute paths. This merely describes the
                    // status quo, rather than being obviously right
                    [['c:'], 'c:.'],
                    [['c:.'], 'c:.'],
                    [['c:', ''], 'c:.'],
                    [['', 'c:'], 'c:.'],
                    [['c:.', '/'], 'c:.\\'],
                    [['c:.', 'file'], 'c:file'],
                    [['c:', '/'], 'c:\\'],
                    [['c:', 'file'], 'c:\\file']
                ]
            )
        ]);
        joinTests.forEach((test: any) =>
        {
            if (!Array.isArray(test[0]))
            { test[0] = [test[0]]; }
            test[0].forEach((join: any) =>
            {
                test[1].forEach((test: any) =>
                {
                    // eslint-disable-next-line prefer-spread
                    const actual = join.apply(null, test[0]);
                    const expected = test[1];
                    // For non-Windows specific tests with the Windows join(), we need to try
                    // replacing the slashes since the non-Windows specific tests' `expected`
                    // use forward slashes
                    let actualAlt: any;
                    let os: string;
                    if (join === path.win32.join)
                    {
                        actualAlt = actual.replace(backslashRE, '/');
                        os = 'win32';
                    }
                    else
                    {
                        os = 'posix';
                    }
                    const message
                        = `path.${os}.join(${test[0].map(JSON.stringify).join(',')})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                    if (actual !== expected && actualAlt !== expected)
                    { failures.push(`\n${message}`); }
                });
            });
        });
        equal(failures.length, 0, failures.join(''));
    });

    it('normalize', () =>
    {
        equal(path.win32.normalize('./fixtures///b/../b/c.js'),
            'fixtures\\b\\c.js');
        equal(path.win32.normalize('/foo/../../../bar'), '\\bar');
        equal(path.win32.normalize('a//b//../b'), 'a\\b');
        equal(path.win32.normalize('a//b//./c'), 'a\\b\\c');
        equal(path.win32.normalize('a//b//.'), 'a\\b');
        equal(path.win32.normalize('//server/share/dir/file.ext'),
            '\\\\server\\share\\dir\\file.ext');
        equal(path.win32.normalize('/a/b/c/../../../x/y/z'), '\\x\\y\\z');
        equal(path.win32.normalize('C:'), 'C:.');
        equal(path.win32.normalize('C:..\\abc'), 'C:..\\abc');
        equal(path.win32.normalize('C:..\\..\\abc\\..\\def'),
            'C:..\\..\\def');
        equal(path.win32.normalize('C:\\.'), 'C:\\');
        equal(path.win32.normalize('file:stream'), 'file:stream');
        equal(path.win32.normalize('bar\\foo..\\..\\'), 'bar\\');
        equal(path.win32.normalize('bar\\foo..\\..'), 'bar');
        equal(path.win32.normalize('bar\\foo..\\..\\baz'), 'bar\\baz');
        equal(path.win32.normalize('bar\\foo..\\'), 'bar\\foo..\\');
        equal(path.win32.normalize('bar\\foo..'), 'bar\\foo..');
        equal(path.win32.normalize('..\\foo..\\..\\..\\bar'),
            '..\\..\\bar');
        equal(path.win32.normalize('..\\...\\..\\.\\...\\..\\..\\bar'),
            '..\\..\\bar');
        equal(path.win32.normalize('../../../foo/../../../bar'),
            '..\\..\\..\\..\\..\\bar');
        equal(path.win32.normalize('../../../foo/../../../bar/../../'),
            '..\\..\\..\\..\\..\\..\\');
        equal(
            path.win32.normalize('../foobar/barfoo/foo/../../../bar/../../'),
            '..\\..\\'
        );
        equal(
            path.win32.normalize('../.../../foobar/../../../bar/../../baz'),
            '..\\..\\..\\..\\baz'
        );
        equal(path.win32.normalize('foo/bar\\baz'), 'foo\\bar\\baz');

        equal(path.posix.normalize('./fixtures///b/../b/c.js'),
            'fixtures/b/c.js');
        equal(path.posix.normalize('/foo/../../../bar'), '/bar');
        equal(path.posix.normalize('a//b//../b'), 'a/b');
        equal(path.posix.normalize('a//b//./c'), 'a/b/c');
        equal(path.posix.normalize('a//b//.'), 'a/b');
        equal(path.posix.normalize('/a/b/c/../../../x/y/z'), '/x/y/z');
        equal(path.posix.normalize('///..//./foo/.//bar'), '/foo/bar');
        equal(path.posix.normalize('bar/foo../../'), 'bar/');
        equal(path.posix.normalize('bar/foo../..'), 'bar');
        equal(path.posix.normalize('bar/foo../../baz'), 'bar/baz');
        equal(path.posix.normalize('bar/foo../'), 'bar/foo../');
        equal(path.posix.normalize('bar/foo..'), 'bar/foo..');
        equal(path.posix.normalize('../foo../../../bar'), '../../bar');
        equal(path.posix.normalize('../.../.././.../../../bar'),
            '../../bar');
        equal(path.posix.normalize('../../../foo/../../../bar'),
            '../../../../../bar');
        equal(path.posix.normalize('../../../foo/../../../bar/../../'),
            '../../../../../../');
        equal(
            path.posix.normalize('../foobar/barfoo/foo/../../../bar/../../'),
            '../../'
        );
        equal(
            path.posix.normalize('../.../../foobar/../../../bar/../../baz'),
            '../../../../baz'
        );
        equal(path.posix.normalize('foo/bar\\baz'), 'foo/bar\\baz');
    });

    it('parse-format', () =>
    {
        const winPaths: [string, string][] = [
            // [path, root]
            ['C:\\path\\dir\\index.html', 'C:\\'],
            ['C:\\another_path\\DIR\\1\\2\\33\\\\index', 'C:\\'],
            ['another_path\\DIR with spaces\\1\\2\\33\\index', ''],
            ['\\', '\\'],
            ['\\foo\\C:', '\\'],
            ['file', ''],
            ['file:stream', ''],
            ['.\\file', ''],
            ['C:', 'C:'],
            ['C:.', 'C:'],
            ['C:..', 'C:'],
            ['C:abc', 'C:'],
            ['C:\\', 'C:\\'],
            ['C:\\abc', 'C:\\'],
            ['', ''],

            // unc
            ['\\\\server\\share\\file_path', '\\\\server\\share\\'],
            ['\\\\server two\\shared folder\\file path.zip',
                '\\\\server two\\shared folder\\'],
            ['\\\\teela\\admin$\\system32', '\\\\teela\\admin$\\'],
            ['\\\\?\\UNC\\server\\share', '\\\\?\\UNC\\']
        ];

        const winSpecialCaseParseTests: [string, { root: string }][] = [
            ['/foo/bar', { root: '/' }],
        ];

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const winSpecialCaseFormatTests: [FormatInputPathObject, string][] = [
            [{ dir: 'some\\dir' }, 'some\\dir\\'],
            [{ base: 'index.html' }, 'index.html'],
            [{ root: 'C:\\' }, 'C:\\'],
            [{ name: 'index', ext: '.html' }, 'index.html'],
            [{ dir: 'some\\dir', name: 'index', ext: '.html' }, 'some\\dir\\index.html'],
            [{ root: 'C:\\', name: 'index', ext: '.html' }, 'C:\\index.html'],
            [{}, '']
        ];

        const unixPaths: [string, string][] = [
            // [path, root]
            ['/home/user/dir/file.txt', '/'],
            ['/home/user/a dir/another File.zip', '/'],
            ['/home/user/a dir//another&File.', '/'],
            ['/home/user/a$$$dir//another File.zip', '/'],
            ['user/dir/another File.zip', ''],
            ['file', ''],
            ['.\\file', ''],
            ['./file', ''],
            ['C:\\foo', ''],
            ['/', '/'],
            ['', ''],
            ['.', ''],
            ['..', ''],
            ['/foo', '/'],
            ['/foo.', '/'],
            ['/foo.bar', '/'],
            ['/.', '/'],
            ['/.foo', '/'],
            ['/.foo.bar', '/'],
            ['/foo/bar.baz', '/']
        ];

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const unixSpecialCaseFormatTests = [
            [{ dir: 'some/dir' }, 'some/dir/'],
            [{ base: 'index.html' }, 'index.html'],
            [{ root: '/' }, '/'],
            [{ name: 'index', ext: '.html' }, 'index.html'],
            [{ dir: 'some/dir', name: 'index', ext: '.html' }, 'some/dir/index.html'],
            [{ root: '/', name: 'index', ext: '.html' }, '/index.html'],
            [{}, '']
        ];

        // const expectedMessage = common.expectsError({
        //     code: 'ERR_INVALID_ARG_TYPE',
        //     type: TypeError
        // }, 18);

        // const errors = [
        //     { method: 'parse', input: [null], message: expectedMessage },
        //     { method: 'parse', input: [{}], message: expectedMessage },
        //     { method: 'parse', input: [true], message: expectedMessage },
        //     { method: 'parse', input: [1], message: expectedMessage },
        //     { method: 'parse', input: [], message: expectedMessage },
        //     { method: 'format', input: [null], message: expectedMessage },
        //     { method: 'format', input: [''], message: expectedMessage },
        //     { method: 'format', input: [true], message: expectedMessage },
        //     { method: 'format', input: [1], message: expectedMessage },
        // ];

        checkParseFormat(path.win32, winPaths);
        checkParseFormat(path.posix, unixPaths);
        checkSpecialCaseParseFormat(path.win32, winSpecialCaseParseTests);
        // checkErrors(path.win32);
        // checkErrors(path.posix);
        // checkFormat(path.win32, winSpecialCaseFormatTests);
        // checkFormat(path.posix, unixSpecialCaseFormatTests);

        // Test removal of trailing path separators
        const trailingTests = [
            [path.win32.parse,
            [['.\\', { root: '', dir: '', base: '.', ext: '', name: '.' }],
            ['\\\\', { root: '\\', dir: '\\', base: '', ext: '', name: '' }],
            ['\\\\', { root: '\\', dir: '\\', base: '', ext: '', name: '' }],
            ['c:\\foo\\\\\\',
                { root: 'c:\\', dir: 'c:\\', base: 'foo', ext: '', name: 'foo' }],
            ['D:\\foo\\\\\\bar.baz',
                {
                    root: 'D:\\',
                    dir: 'D:\\foo\\\\',
                    base: 'bar.baz',
                    ext: '.baz',
                    name: 'bar'
                }
            ]
            ]
            ],
            [path.posix.parse,
            [['./', { root: '', dir: '', base: '.', ext: '', name: '.' }],
            ['//', { root: '/', dir: '/', base: '', ext: '', name: '' }],
            ['///', { root: '/', dir: '/', base: '', ext: '', name: '' }],
            ['/foo///', { root: '/', dir: '/', base: 'foo', ext: '', name: 'foo' }],
            ['/foo///bar.baz',
                { root: '/', dir: '/foo//', base: 'bar.baz', ext: '.baz', name: 'bar' }
            ]
            ]
            ]
        ];
        const failures: string[] = [];
        trailingTests.forEach(function (test: any[])
        {
            const parse = test[0];
            const os = parse === path.win32.parse ? 'win32' : 'posix';
            test[1].forEach(function (test: any)
            {
                const actual = parse(test[0]);
                const expected = test[1];
                const message = `path.${os}.parse(${JSON.stringify(test[0])})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                const actualKeys = Object.keys(actual);
                const expectedKeys = Object.keys(expected);
                let failed = (actualKeys.length !== expectedKeys.length);
                if (!failed)
                {
                    for (let i = 0; i < actualKeys.length; ++i)
                    {
                        const key = actualKeys[i];
                        if (!expectedKeys.includes(key) || actual[key] !== expected[key])
                        {
                            failed = true;
                            break;
                        }
                    }
                }
                if (failed)
                { failures.push(`\n${message}`); }
            });
        });
        equal(failures.length, 0, failures.join(''));

        // function checkErrors(path: any)
        // {
        //     errors.forEach(function (errorCase)
        //     {
        //         throws(() =>
        //         {
        //             path[<any>errorCase.method].apply(path, errorCase.input);
        //         }, errorCase.message);
        //     });
        // }

        function checkParseFormat(path: Path, paths: [string, string][])
        {
            paths.forEach(function ([element, root])
            {
                const output = path.parse(element);
                equal(typeof output.root, 'string');
                equal(typeof output.dir, 'string');
                equal(typeof output.base, 'string');
                equal(typeof output.ext, 'string');
                equal(typeof output.name, 'string');
                equal(path.format(output), element);
                equal(output.root, root);
                assert.ok(output.dir.startsWith(output.root));
                equal(output.dir, output.dir ? path.dirname(element) : '');
                equal(output.base, path.basename(element));
                equal(output.ext, path.extname(element));
            });
        }

        function checkSpecialCaseParseFormat(path: Path, testCases: [string, { root: string; }][])
        {
            testCases.forEach(function (testCase)
            {
                const element = testCase[0];
                const expect: any = testCase[1];
                const output: any = path.parse(element);
                Object.keys(expect).forEach(function (key)
                {
                    equal(output[key], expect[key]);
                });
            });
        }

        // function checkFormat(path: Path, testCases: any)
        // {
        //     testCases.forEach(function (testCase: any)
        //     {
        //         equal(path.format(testCase[0]), testCase[1]);
        //     });

        //     [null, undefined, 1, true, false, 'string'].forEach((pathObject: any) =>
        //     {
        //         common.expectsError(() =>
        //         {
        //             path.format(pathObject);
        //         }, {
        //                 code: 'ERR_INVALID_ARG_TYPE',
        //                 type: TypeError,
        //                 message: 'The "pathObject" argument must be of type Object. ' +
        //                     `Received type ${typeof pathObject}`
        //             });
        //     });
        // }
    });

    it('relative', () =>
    {
        const failures: string[] = [];

        const relativeTests: [(from: string, to: string) => string, string[][]][] = [
            [path.win32.relative,
            // arguments                     result
            [['c:/blah\\blah', 'd:/games', 'd:\\games'],
            ['c:/aaaa/bbbb', 'c:/aaaa', '..'],
            ['c:/aaaa/bbbb', 'c:/cccc', '..\\..\\cccc'],
            ['c:/aaaa/bbbb', 'c:/aaaa/bbbb', ''],
            ['c:/aaaa/bbbb', 'c:/aaaa/cccc', '..\\cccc'],
            ['c:/aaaa/', 'c:/aaaa/cccc', 'cccc'],
            ['c:/', 'c:\\aaaa\\bbbb', 'aaaa\\bbbb'],
            ['c:/aaaa/bbbb', 'd:\\', 'd:\\'],
            ['c:/AaAa/bbbb', 'c:/aaaa/bbbb', ''],
            ['c:/aaaaa/', 'c:/aaaa/cccc', '..\\aaaa\\cccc'],
            ['C:\\foo\\bar\\baz\\quux', 'C:\\', '..\\..\\..\\..'],
            ['C:\\foo\\test', 'C:\\foo\\test\\bar\\package.json', 'bar\\package.json'],
            ['C:\\foo\\bar\\baz-quux', 'C:\\foo\\bar\\baz', '..\\baz'],
            ['C:\\foo\\bar\\baz', 'C:\\foo\\bar\\baz-quux', '..\\baz-quux'],
            ['\\\\foo\\bar', '\\\\foo\\bar\\baz', 'baz'],
            ['\\\\foo\\bar\\baz', '\\\\foo\\bar', '..'],
            ['\\\\foo\\bar\\baz-quux', '\\\\foo\\bar\\baz', '..\\baz'],
            ['\\\\foo\\bar\\baz', '\\\\foo\\bar\\baz-quux', '..\\baz-quux'],
            ['C:\\baz-quux', 'C:\\baz', '..\\baz'],
            ['C:\\baz', 'C:\\baz-quux', '..\\baz-quux'],
            ['\\\\foo\\baz-quux', '\\\\foo\\baz', '..\\baz'],
            ['\\\\foo\\baz', '\\\\foo\\baz-quux', '..\\baz-quux'],
            ['C:\\baz', '\\\\foo\\bar\\baz', '\\\\foo\\bar\\baz'],
            ['\\\\foo\\bar\\baz', 'C:\\baz', 'C:\\baz']
            ]
            ],
            [path.posix.relative,
            // arguments          result
            [['/var/lib', '/var', '..'],
            ['/var/lib', '/bin', '../../bin'],
            ['/var/lib', '/var/lib', ''],
            ['/var/lib', '/var/apache', '../apache'],
            ['/var/', '/var/lib', 'lib'],
            ['/', '/var/lib', 'var/lib'],
            ['/foo/test', '/foo/test/bar/package.json', 'bar/package.json'],
            ['/Users/a/web/b/test/mails', '/Users/a/web/b', '../..'],
            ['/foo/bar/baz-quux', '/foo/bar/baz', '../baz'],
            ['/foo/bar/baz', '/foo/bar/baz-quux', '../baz-quux'],
            ['/baz-quux', '/baz', '../baz'],
            ['/baz', '/baz-quux', '../baz-quux']
            ]
            ]
        ];
        relativeTests.forEach((test) =>
        {
            const relative = test[0];
            test[1].forEach((test) =>
            {
                const actual = relative(test[0], test[1]);
                const expected = test[2];
                const os = relative === path.win32.relative ? 'win32' : 'posix';
                const message = `path.${os}.relative(${test.slice(0, 2).map(<any>JSON.stringify).join(',')})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                if (actual !== expected)
                { failures.push(`\n${message}`); }
            });
        });
        equal(failures.length, 0, failures.join(''));
    });

    it('resolve', () =>
    {
        const failures: string[] = [];
        const slashRE = /\//g;
        const backslashRE = /\\/g;

        const resolveTests: [(...pathSegments: string[]) => string, [string[], string][]][] = [
            [path.win32.resolve,
            // arguments                               result
            [[['c:/blah\\blah', 'd:/games', 'c:../a'], 'c:\\blah\\a'],
            [['c:/ignore', 'd:\\a/b\\c/d', '\\e.exe'], 'd:\\e.exe'],
            [['c:/ignore', 'c:/some/file'], 'c:\\some\\file'],
            [['d:/ignore', 'd:some/dir//'], 'd:\\ignore\\some\\dir'],
            // [['.'], process.cwd()],
            [['//server/share', '..', 'relative\\'], '\\\\server\\share\\relative'],
            [['c:/', '//'], 'c:\\'],
            [['c:/', '//dir'], 'c:\\dir'],
            [['c:/', '//server/share'], '\\\\server\\share\\'],
            [['c:/', '//server//share'], '\\\\server\\share\\'],
            [['c:/', '///some//dir'], 'c:\\some\\dir'],
            [['C:\\foo\\tmp.3\\', '..\\tmp.3\\cycles\\root.js'],
                'C:\\foo\\tmp.3\\cycles\\root.js']
            ]
            ],
            [path.posix.resolve,
            // arguments                    result
            [[['/var/lib', '../', 'file/'], '/var/file'],
            [['/var/lib', '/../', 'file/'], '/file'],
            // [['a/b/c/', '../../..'], process.cwd()],
            // [['.'], process.cwd()],
            [['/some/dir', '.', '/absolute/'], '/absolute'],
            [['/foo/tmp.3/', '../tmp.3/cycles/root.js'], '/foo/tmp.3/cycles/root.js']
            ]
            ]
        ];
        resolveTests.forEach((test) =>
        {
            // add
            const common = { isWindows: true };
            //

            const resolve = test[0];
            test[1].forEach((test) =>
            {
                // eslint-disable-next-line prefer-spread
                const actual = resolve.apply(null, test[0]);
                let actualAlt = '';
                const os = resolve === path.win32.resolve ? 'win32' : 'posix';
                if (resolve === path.win32.resolve && !common.isWindows)
                { actualAlt = actual.replace(backslashRE, '/'); }
                else if (resolve !== path.win32.resolve && common.isWindows)
                { actualAlt = actual.replace(slashRE, '\\'); }

                const expected = test[1];
                const message
                    = `path.${os}.resolve(${test[0].map(<any>JSON.stringify).join(',')})\n  expect=${JSON.stringify(expected)}\n  actual=${JSON.stringify(actual)}`;
                if (actual !== expected && actualAlt !== expected)
                {
                    failures.push(`\n${message}`);
                }
            });
        });
        equal(failures.length, 0, failures.join(''));

        // if (common.isWindows)
        // {
        //     // Test resolving the current Windows drive letter from a spawned process.
        //     // See https://github.com/nodejs/node/issues/7215
        //     const currentDriveLetter = path.parse(process.cwd()).root.substring(0, 2);
        //     const resolveFixture = fixtures.path('path-resolve.js');
        //     const spawnResult = child.spawnSync(
        //         process.argv[0], [resolveFixture, currentDriveLetter]);
        //     const resolvedPath = spawnResult.stdout.toString().trim();
        //     equal(resolvedPath.toLowerCase(), process.cwd().toLowerCase());
        // }
    });

    it('zero-length-strings', () =>
    {
        // Join will internally ignore all the zero-length strings and it will return
        // '.' if the joined string is a zero-length string.
        equal(path.posix.join(''), '.');
        equal(path.posix.join('', ''), '.');
        equal(path.win32.join(''), '.');
        equal(path.win32.join('', ''), '.');
        // equal(path.join(pwd), pwd);
        // equal(path.join(pwd, ''), pwd);

        // Normalize will return '.' if the input is a zero-length string
        equal(path.posix.normalize(''), '.');
        equal(path.win32.normalize(''), '.');
        // equal(path.normalize(pwd), pwd);

        // Since '' is not a valid path in any of the common environments, return false
        equal(path.posix.isAbsolute(''), false);
        equal(path.win32.isAbsolute(''), false);

        // Resolve, internally ignores all the zero-length strings and returns the
        // current working directory
        // equal(path.resolve(''), pwd);
        // equal(path.resolve('', ''), pwd);

        // Relative, internally calls resolve. So, '' is actually the current directory
        // equal(path.relative('', pwd), '');
        // equal(path.relative(pwd, ''), '');
        // equal(path.relative(pwd, pwd), '');
    });
});
