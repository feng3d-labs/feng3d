namespace feng3d
{
    /**
     * 路径
     * 
     * 从nodeJs的path移植
     * 
     * @see http://nodejs.cn/api/path.html
     * @see https://github.com/nodejs/node/blob/master/lib/path.js
     */
    export var path: Path;

    /**
     * 路径
     */
    interface Path
    {
        /**
         * 规范化字符串路径，减少'.'和'.'的部分。当发现多个斜杠时，它们被单个斜杠替换;当路径包含尾部斜杠时，它将被保留。在Windows上使用反斜杠。
         *
         * @param p 要规范化的字符串路径。
         */
        normalize(p: string): string;
        /**
         * 将所有参数连接在一起，并规范化生成的路径。参数必须是字符串。在v0.8中，非字符串参数被悄悄地忽略。在v0.10及以上版本中，会抛出异常。
         *
         * @param paths 用于连接的路径列表
         */
        join(...paths: string[]): string;
        /**
         * 最右边的参数被认为是{to}。其他参数被认为是{from}的数组。
         *
         * 从最左边的{from}参数开始，将{to}解析为一个绝对路径。
         *
         * 如果{to}还不是绝对的，则{from}参数将按从右到左的顺序预先设置，直到找到绝对路径为止。如果在使用所有{from}路径之后仍然没有找到绝对路径，则还将使用当前工作目录。得到的路径是规范化的，除非路径被解析到根目录，否则尾部斜杠将被删除。
         *
         * @param pathSegments 要连接的字符串路径。非字符串参数将被忽略。
         */
        resolve(...pathSegments: string[]): string;
        /**
         * 确定{path}是否是一个绝对路径。无论工作目录如何，绝对路径总是解析到相同的位置。
         *
         * @param path 用于测试的路径。
         */
        isAbsolute(path: string): boolean;
        /**
         * 解决从{from}到{to}的相对路径。有时我们有两条绝对路径，我们需要推导出一条到另一条的相对路径。这实际上是path.resolve的逆变换。
         * 
         * @param from 起始路径 
         * @param to 目标路径
         */
        relative(from: string, to: string): string;
        /**
         * 返回路径的目录名。类似于Unix的dirname命令。
         *
         * @param p 求值的路径。
         */
        dirname(p: string): string;
        /**
         * 返回路径的最后一部分。类似于Unix basename命令。通常用于从完全限定的路径中提取文件名。
         *
         * @param p 求值的路径。
         * @param ext 可选地，从结果中删除的扩展。
         */
        basename(p: string, ext?: string): string;
        /**
         * 返回路径的扩展名，在路径的最后一部分从最后一个'.'到字符串末尾。如果在路径的最后部分没有'.'或者最后一个字符时'.'则返回一个空字符串。
         *
         * @param p 求值的路径。
         */
        extname(p: string): string;
        /**
         * 特定平台的文件分隔符。'\\'或'/'。
         */
        sep: '\\' | '/';
        /**
         * 特定平台的文件分隔符。 ';' 或者 ':'.
         */
        delimiter: ';' | ':';
        /**
         * 从路径字符串返回一个对象 —— 与format()相反。
         *
         * @param pathString 路径字符串。
         */
        parse(pathString: string): ParsedPath;
        /**
         * 从对象返回路径字符串——与parse()相反。
         *
         * @param pathObject 路径对象。
         */
        format(pathObject: FormatInputPathObject): string;

        win32: Path;
        posix: Path;
    }

    /**
     * 由path.parse()生成或由path.format()使用的已解析路径对象。
     */
    interface ParsedPath
    {
        /**
         * 路径的根，如'/'或'c:\'
         */
        root: string;
        /**
         * 完整的目录路径，如'/home/user/dir'或'c:\path\dir'
         */
        dir: string;
        /**
         * 包含扩展名(如有)的文件名，如'index.html'
         */
        base: string;
        /**
         * 文件扩展名(如果有)，如'.html'
         */
        ext: string;
        /**
         * 没有扩展名(如果有)的文件名，如'index'
         */
        name: string;
    }

    interface FormatInputPathObject
    {
        /**
         * 路径的根，如'/'或'c:\'
         */
        root?: string;
        /**
         * 完整的目录路径，如'/home/user/dir'或'c:\path\dir'
         */
        dir?: string;
        /**
         * 包含扩展名(如有)的文件名，如'index.html'
         */
        base?: string;
        /**
         * 文件扩展名(如果有)，如'.html'
         */
        ext?: string;
        /**
         * 没有扩展名(如果有)的文件名，如'index'
         */
        name?: string;
    }

    /**
     * . 
     */
    const CHAR_DOT = 46;
    /**
     * : 
     */
    const CHAR_COLON = 58;
    /**
     * ? 
     */
    const CHAR_QUESTION_MARK = 63;
    /**
     * A
     */
    const CHAR_UPPERCASE_A = 65;
    /**
     * Z
     */
    const CHAR_UPPERCASE_Z = 90;
    /**
     * a
     */
    const CHAR_LOWERCASE_A = 97;
    /**
     * z
     */
    const CHAR_LOWERCASE_Z = 122;
    /**
     * / 
     */
    const CHAR_FORWARD_SLASH = 47;
    /**
     * \
     */
    const CHAR_BACKWARD_SLASH = 92;

    /**
     * 未实现其功能
     */
    const process = {
        platform: 'win32',
        env: <any>{},
        cwd: function () { return ""; },
    };

    class ERR_INVALID_ARG_TYPE extends TypeError
    {
        constructor(name: string, expected: string, actual: any)
        {
            assert(typeof name === 'string', "'name' must be a string");

            // determiner: 'must be' or 'must not be'
            let determiner;
            if (typeof expected === 'string' && expected.startsWith('not '))
            {
                determiner = 'must not be';
                expected = expected.replace(/^not /, '');
            } else
            {
                determiner = 'must be';
            }

            let msg;
            if (name.endsWith(' argument'))
            {
                // For cases like 'first argument'
                msg = `The ${name} ${determiner} ${oneOf(expected, 'type')}`;
            } else
            {
                const type = name.includes('.') ? 'property' : 'argument';
                msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, 'type')}`;
            }

            // TODO(BridgeAR): Improve the output by showing `null` and similar.
            msg += `. Received type ${typeof actual}`;

            super(msg)
        }
    }

    function oneOf(expected: string | string[], thing: string)
    {
        assert(typeof thing === 'string', '`thing` has to be of type string');
        if (Array.isArray(expected))
        {
            const len = expected.length;
            assert(len > 0, 'At least one expected value needs to be specified');
            expected = expected.map((i) => String(i));
            if (len > 2)
            {
                return `one of ${thing} ${expected.slice(0, len - 1).join(', ')}, or ` +
                    expected[len - 1];
            } else if (len === 2)
            {
                return `one of ${thing} ${expected[0]} or ${expected[1]}`;
            } else
            {
                return `of ${thing} ${expected[0]}`;
            }
        } else
        {
            return `of ${thing} ${String(expected)}`;
        }
    }

    function assert(b: boolean, msg: string)
    {
        if (!b) throw msg;
    }

    function validateString(value: string, name: string)
    {
        if (typeof value !== 'string')
            throw new ERR_INVALID_ARG_TYPE(name, 'string', value);
    }

    function isPathSeparator(code: number)
    {
        return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    }

    function isPosixPathSeparator(code: number)
    {
        return code === CHAR_FORWARD_SLASH;
    }

    function isWindowsDeviceRoot(code: number)
    {
        return code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z ||
            code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z;
    }

    // Resolves . and .. elements in a path with directory names
    function normalizeString(path: string, allowAboveRoot: boolean, separator: string, isPathSeparator: (code: number) => boolean)
    {
        var res = '';
        var lastSegmentLength = 0;
        var lastSlash = -1;
        var dots = 0;
        var code = -1;
        for (var i = 0; i <= path.length; ++i)
        {
            if (i < path.length)
                code = path.charCodeAt(i);
            else if (isPathSeparator(code))
                break;
            else
                code = CHAR_FORWARD_SLASH;

            if (isPathSeparator(code))
            {
                if (lastSlash === i - 1 || dots === 1)
                {
                    // NOOP
                } else if (lastSlash !== i - 1 && dots === 2)
                {
                    if (res.length < 2 || lastSegmentLength !== 2 ||
                        res.charCodeAt(res.length - 1) !== CHAR_DOT ||
                        res.charCodeAt(res.length - 2) !== CHAR_DOT)
                    {
                        if (res.length > 2)
                        {
                            const lastSlashIndex = res.lastIndexOf(separator);
                            if (lastSlashIndex === -1)
                            {
                                res = '';
                                lastSegmentLength = 0;
                            } else
                            {
                                res = res.slice(0, lastSlashIndex);
                                lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                            }
                            lastSlash = i;
                            dots = 0;
                            continue;
                        } else if (res.length === 2 || res.length === 1)
                        {
                            res = '';
                            lastSegmentLength = 0;
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                    }
                    if (allowAboveRoot)
                    {
                        if (res.length > 0)
                            res += `${separator}..`;
                        else
                            res = '..';
                        lastSegmentLength = 2;
                    }
                } else
                {
                    if (res.length > 0)
                        res += separator + path.slice(lastSlash + 1, i);
                    else
                        res = path.slice(lastSlash + 1, i);
                    lastSegmentLength = i - lastSlash - 1;
                }
                lastSlash = i;
                dots = 0;
            } else if (code === CHAR_DOT && dots !== -1)
            {
                ++dots;
            } else
            {
                dots = -1;
            }
        }
        return res;
    }

    function _format(sep: string, pathObject: { dir: string, root: string, base: string, name: string, ext: string })
    {
        const dir = pathObject.dir || pathObject.root;
        const base = pathObject.base ||
            ((pathObject.name || '') + (pathObject.ext || ''));
        if (!dir)
        {
            return base;
        }
        if (dir === pathObject.root)
        {
            return dir + base;
        }
        return dir + sep + base;
    }

    class Win32Path implements Path
    {
        // path.resolve([from ...], to)
        resolve(...pathSegments: string[]): string
        {
            var resolvedDevice = '';
            var resolvedTail = '';
            var resolvedAbsolute = false;

            for (var i = arguments.length - 1; i >= -1; i--)
            {
                var path: string;
                if (i >= 0)
                {
                    path = arguments[i];
                } else if (!resolvedDevice)
                {
                    path = process.cwd();
                } else
                {
                    // Windows has the concept of drive-specific current working
                    // directories. If we've resolved a drive letter but not yet an
                    // absolute path, get cwd for that drive, or the process cwd if
                    // the drive cwd is not available. We're sure the device is not
                    // a UNC path at this points, because UNC paths are always absolute.
                    path = process.env['=' + resolvedDevice] || process.cwd();

                    // Verify that a cwd was found and that it actually points
                    // to our drive. If not, default to the drive's root.
                    if (path === undefined ||
                        path.slice(0, 3).toLowerCase() !==
                        resolvedDevice.toLowerCase() + '\\')
                    {
                        path = resolvedDevice + '\\';
                    }
                }

                validateString(path, 'path');

                // Skip empty entries
                if (path.length === 0)
                {
                    continue;
                }

                var len = path.length;
                var rootEnd = 0;
                var device = '';
                var isAbsolute = false;
                const code = path.charCodeAt(0);

                // Try to match a root
                if (len > 1)
                {
                    if (isPathSeparator(code))
                    {
                        // Possible UNC root

                        // If we started with a separator, we know we at least have an
                        // absolute path of some kind (UNC or otherwise)
                        isAbsolute = true;

                        if (isPathSeparator(path.charCodeAt(1)))
                        {
                            // Matched double path separator at beginning
                            var j = 2;
                            var last = j;
                            // Match 1 or more non-path separators
                            for (; j < len; ++j)
                            {
                                if (isPathSeparator(path.charCodeAt(j)))
                                    break;
                            }
                            if (j < len && j !== last)
                            {
                                const firstPart = path.slice(last, j);
                                // Matched!
                                last = j;
                                // Match 1 or more path separators
                                for (; j < len; ++j)
                                {
                                    if (!isPathSeparator(path.charCodeAt(j)))
                                        break;
                                }
                                if (j < len && j !== last)
                                {
                                    // Matched!
                                    last = j;
                                    // Match 1 or more non-path separators
                                    for (; j < len; ++j)
                                    {
                                        if (isPathSeparator(path.charCodeAt(j)))
                                            break;
                                    }
                                    if (j === len)
                                    {
                                        // We matched a UNC root only

                                        device = '\\\\' + firstPart + '\\' + path.slice(last);
                                        rootEnd = j;
                                    } else if (j !== last)
                                    {
                                        // We matched a UNC root with leftovers

                                        device = '\\\\' + firstPart + '\\' + path.slice(last, j);
                                        rootEnd = j;
                                    }
                                }
                            }
                        } else
                        {
                            rootEnd = 1;
                        }
                    } else if (isWindowsDeviceRoot(code))
                    {
                        // Possible device root

                        if (path.charCodeAt(1) === CHAR_COLON)
                        {
                            device = path.slice(0, 2);
                            rootEnd = 2;
                            if (len > 2)
                            {
                                if (isPathSeparator(path.charCodeAt(2)))
                                {
                                    // Treat separator following drive name as an absolute path
                                    // indicator
                                    isAbsolute = true;
                                    rootEnd = 3;
                                }
                            }
                        }
                    }
                } else if (isPathSeparator(code))
                {
                    // `path` contains just a path separator
                    rootEnd = 1;
                    isAbsolute = true;
                }

                if (device.length > 0 &&
                    resolvedDevice.length > 0 &&
                    device.toLowerCase() !== resolvedDevice.toLowerCase())
                {
                    // This path points to another device so it is not applicable
                    continue;
                }

                if (resolvedDevice.length === 0 && device.length > 0)
                {
                    resolvedDevice = device;
                }
                if (!resolvedAbsolute)
                {
                    resolvedTail = path.slice(rootEnd) + '\\' + resolvedTail;
                    resolvedAbsolute = isAbsolute;
                }

                if (resolvedDevice.length > 0 && resolvedAbsolute)
                {
                    break;
                }
            }

            // At this point the path should be resolved to a full absolute path,
            // but handle relative paths to be safe (might happen when process.cwd()
            // fails)

            // Normalize the tail path
            resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, '\\',
                isPathSeparator);

            return (resolvedDevice + (resolvedAbsolute ? '\\' : '') + resolvedTail) ||
                '.';
        }

        normalize(path: string)
        {
            validateString(path, 'path');
            const len = path.length;
            if (len === 0)
                return '.';
            var rootEnd = 0;
            var device;
            var isAbsolute = false;
            const code = path.charCodeAt(0);

            // Try to match a root
            if (len > 1)
            {
                if (isPathSeparator(code))
                {
                    // Possible UNC root

                    // If we started with a separator, we know we at least have an absolute
                    // path of some kind (UNC or otherwise)
                    isAbsolute = true;

                    if (isPathSeparator(path.charCodeAt(1)))
                    {
                        // Matched double path separator at beginning
                        var j = 2;
                        var last = j;
                        // Match 1 or more non-path separators
                        for (; j < len; ++j)
                        {
                            if (isPathSeparator(path.charCodeAt(j)))
                                break;
                        }
                        if (j < len && j !== last)
                        {
                            const firstPart = path.slice(last, j);
                            // Matched!
                            last = j;
                            // Match 1 or more path separators
                            for (; j < len; ++j)
                            {
                                if (!isPathSeparator(path.charCodeAt(j)))
                                    break;
                            }
                            if (j < len && j !== last)
                            {
                                // Matched!
                                last = j;
                                // Match 1 or more non-path separators
                                for (; j < len; ++j)
                                {
                                    if (isPathSeparator(path.charCodeAt(j)))
                                        break;
                                }
                                if (j === len)
                                {
                                    // We matched a UNC root only
                                    // Return the normalized version of the UNC root since there
                                    // is nothing left to process

                                    return '\\\\' + firstPart + '\\' + path.slice(last) + '\\';
                                } else if (j !== last)
                                {
                                    // We matched a UNC root with leftovers

                                    device = '\\\\' + firstPart + '\\' + path.slice(last, j);
                                    rootEnd = j;
                                }
                            }
                        }
                    } else
                    {
                        rootEnd = 1;
                    }
                } else if (isWindowsDeviceRoot(code))
                {
                    // Possible device root

                    if (path.charCodeAt(1) === CHAR_COLON)
                    {
                        device = path.slice(0, 2);
                        rootEnd = 2;
                        if (len > 2)
                        {
                            if (isPathSeparator(path.charCodeAt(2)))
                            {
                                // Treat separator following drive name as an absolute path
                                // indicator
                                isAbsolute = true;
                                rootEnd = 3;
                            }
                        }
                    }
                }
            } else if (isPathSeparator(code))
            {
                // `path` contains just a path separator, exit early to avoid unnecessary
                // work
                return '\\';
            }

            var tail: string;
            if (rootEnd < len)
            {
                tail = normalizeString(path.slice(rootEnd), !isAbsolute, '\\',
                    isPathSeparator);
            } else
            {
                tail = '';
            }
            if (tail.length === 0 && !isAbsolute)
                tail = '.';
            if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1)))
                tail += '\\';
            if (device === undefined)
            {
                if (isAbsolute)
                {
                    if (tail.length > 0)
                        return '\\' + tail;
                    else
                        return '\\';
                } else if (tail.length > 0)
                {
                    return tail;
                } else
                {
                    return '';
                }
            } else if (isAbsolute)
            {
                if (tail.length > 0)
                    return device + '\\' + tail;
                else
                    return device + '\\';
            } else if (tail.length > 0)
            {
                return device + tail;
            } else
            {
                return device;
            }
        }

        isAbsolute(path: string)
        {
            validateString(path, 'path');
            const len = path.length;
            if (len === 0)
                return false;

            const code = path.charCodeAt(0);
            if (isPathSeparator(code))
            {
                return true;
            } else if (isWindowsDeviceRoot(code))
            {
                // Possible device root

                if (len > 2 && path.charCodeAt(1) === CHAR_COLON)
                {
                    if (isPathSeparator(path.charCodeAt(2)))
                        return true;
                }
            }
            return false;
        }


        join()
        {
            if (arguments.length === 0)
                return '.';

            var joined;
            var firstPart;
            for (var i = 0; i < arguments.length; ++i)
            {
                var arg = arguments[i];
                validateString(arg, 'path');
                if (arg.length > 0)
                {
                    if (joined === undefined)
                        joined = firstPart = arg;
                    else
                        joined += '\\' + arg;
                }
            }

            if (joined === undefined)
                return '.';

            // Make sure that the joined path doesn't start with two slashes, because
            // normalize() will mistake it for an UNC path then.
            //
            // This step is skipped when it is very clear that the user actually
            // intended to point at an UNC path. This is assumed when the first
            // non-empty string arguments starts with exactly two slashes followed by
            // at least one more non-slash character.
            //
            // Note that for normalize() to treat a path as an UNC path it needs to
            // have at least 2 components, so we don't filter for that here.
            // This means that the user can use join to construct UNC paths from
            // a server name and a share name; for example:
            //   path.join('//server', 'share') -> '\\\\server\\share\\')
            var needsReplace = true;
            var slashCount = 0;
            if (isPathSeparator(firstPart.charCodeAt(0)))
            {
                ++slashCount;
                const firstLen = firstPart.length;
                if (firstLen > 1)
                {
                    if (isPathSeparator(firstPart.charCodeAt(1)))
                    {
                        ++slashCount;
                        if (firstLen > 2)
                        {
                            if (isPathSeparator(firstPart.charCodeAt(2)))
                                ++slashCount;
                            else
                            {
                                // We matched a UNC path in the first part
                                needsReplace = false;
                            }
                        }
                    }
                }
            }
            if (needsReplace)
            {
                // Find any more consecutive slashes we need to replace
                for (; slashCount < joined.length; ++slashCount)
                {
                    if (!isPathSeparator(joined.charCodeAt(slashCount)))
                        break;
                }

                // Replace the slashes if needed
                if (slashCount >= 2)
                    joined = '\\' + joined.slice(slashCount);
            }

            return win32.normalize(joined);
        }


        // It will solve the relative path from `from` to `to`, for instance:
        //  from = 'C:\\orandea\\test\\aaa'
        //  to = 'C:\\orandea\\impl\\bbb'
        // The output of the function should be: '..\\..\\impl\\bbb'
        relative(from: string, to: string)
        {
            validateString(from, 'from');
            validateString(to, 'to');

            if (from === to)
                return '';

            var fromOrig = win32.resolve(from);
            var toOrig = win32.resolve(to);

            if (fromOrig === toOrig)
                return '';

            from = fromOrig.toLowerCase();
            to = toOrig.toLowerCase();

            if (from === to)
                return '';

            // Trim any leading backslashes
            var fromStart = 0;
            for (; fromStart < from.length; ++fromStart)
            {
                if (from.charCodeAt(fromStart) !== CHAR_BACKWARD_SLASH)
                    break;
            }
            // Trim trailing backslashes (applicable to UNC paths only)
            var fromEnd = from.length;
            for (; fromEnd - 1 > fromStart; --fromEnd)
            {
                if (from.charCodeAt(fromEnd - 1) !== CHAR_BACKWARD_SLASH)
                    break;
            }
            var fromLen = (fromEnd - fromStart);

            // Trim any leading backslashes
            var toStart = 0;
            for (; toStart < to.length; ++toStart)
            {
                if (to.charCodeAt(toStart) !== CHAR_BACKWARD_SLASH)
                    break;
            }
            // Trim trailing backslashes (applicable to UNC paths only)
            var toEnd = to.length;
            for (; toEnd - 1 > toStart; --toEnd)
            {
                if (to.charCodeAt(toEnd - 1) !== CHAR_BACKWARD_SLASH)
                    break;
            }
            var toLen = (toEnd - toStart);

            // Compare paths to find the longest common path from root
            var length = (fromLen < toLen ? fromLen : toLen);
            var lastCommonSep = -1;
            var i = 0;
            for (; i <= length; ++i)
            {
                if (i === length)
                {
                    if (toLen > length)
                    {
                        if (to.charCodeAt(toStart + i) === CHAR_BACKWARD_SLASH)
                        {
                            // We get here if `from` is the exact base path for `to`.
                            // For example: from='C:\\foo\\bar'; to='C:\\foo\\bar\\baz'
                            return toOrig.slice(toStart + i + 1);
                        } else if (i === 2)
                        {
                            // We get here if `from` is the device root.
                            // For example: from='C:\\'; to='C:\\foo'
                            return toOrig.slice(toStart + i);
                        }
                    }
                    if (fromLen > length)
                    {
                        if (from.charCodeAt(fromStart + i) === CHAR_BACKWARD_SLASH)
                        {
                            // We get here if `to` is the exact base path for `from`.
                            // For example: from='C:\\foo\\bar'; to='C:\\foo'
                            lastCommonSep = i;
                        } else if (i === 2)
                        {
                            // We get here if `to` is the device root.
                            // For example: from='C:\\foo\\bar'; to='C:\\'
                            lastCommonSep = 3;
                        }
                    }
                    break;
                }
                var fromCode = from.charCodeAt(fromStart + i);
                var toCode = to.charCodeAt(toStart + i);
                if (fromCode !== toCode)
                    break;
                else if (fromCode === CHAR_BACKWARD_SLASH)
                    lastCommonSep = i;
            }

            // We found a mismatch before the first common path separator was seen, so
            // return the original `to`.
            if (i !== length && lastCommonSep === -1)
            {
                return toOrig;
            }

            var out = '';
            if (lastCommonSep === -1)
                lastCommonSep = 0;
            // Generate the relative path based on the path difference between `to` and
            // `from`
            for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i)
            {
                if (i === fromEnd || from.charCodeAt(i) === CHAR_BACKWARD_SLASH)
                {
                    if (out.length === 0)
                        out += '..';
                    else
                        out += '\\..';
                }
            }

            // Lastly, append the rest of the destination (`to`) path that comes after
            // the common path parts
            if (out.length > 0)
                return out + toOrig.slice(toStart + lastCommonSep, toEnd);
            else
            {
                toStart += lastCommonSep;
                if (toOrig.charCodeAt(toStart) === CHAR_BACKWARD_SLASH)
                    ++toStart;
                return toOrig.slice(toStart, toEnd);
            }
        }

        toNamespacedPath(path: string)
        {
            // Note: this will *probably* throw somewhere.
            if (typeof path !== 'string')
                return path;

            if (path.length === 0)
            {
                return '';
            }

            const resolvedPath = win32.resolve(path);

            if (resolvedPath.length >= 3)
            {
                if (resolvedPath.charCodeAt(0) === CHAR_BACKWARD_SLASH)
                {
                    // Possible UNC root

                    if (resolvedPath.charCodeAt(1) === CHAR_BACKWARD_SLASH)
                    {
                        const code = resolvedPath.charCodeAt(2);
                        if (code !== CHAR_QUESTION_MARK && code !== CHAR_DOT)
                        {
                            // Matched non-long UNC root, convert the path to a long UNC path
                            return '\\\\?\\UNC\\' + resolvedPath.slice(2);
                        }
                    }
                } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0)))
                {
                    // Possible device root

                    if (resolvedPath.charCodeAt(1) === CHAR_COLON &&
                        resolvedPath.charCodeAt(2) === CHAR_BACKWARD_SLASH)
                    {
                        // Matched device root, convert the path to a long UNC path
                        return '\\\\?\\' + resolvedPath;
                    }
                }
            }

            return path;
        }

        dirname(path: string)
        {
            validateString(path, 'path');
            const len = path.length;
            if (len === 0)
                return '.';
            var rootEnd = -1;
            var end = -1;
            var matchedSlash = true;
            var offset = 0;
            const code = path.charCodeAt(0);

            // Try to match a root
            if (len > 1)
            {
                if (isPathSeparator(code))
                {
                    // Possible UNC root

                    rootEnd = offset = 1;

                    if (isPathSeparator(path.charCodeAt(1)))
                    {
                        // Matched double path separator at beginning
                        var j = 2;
                        var last = j;
                        // Match 1 or more non-path separators
                        for (; j < len; ++j)
                        {
                            if (isPathSeparator(path.charCodeAt(j)))
                                break;
                        }
                        if (j < len && j !== last)
                        {
                            // Matched!
                            last = j;
                            // Match 1 or more path separators
                            for (; j < len; ++j)
                            {
                                if (!isPathSeparator(path.charCodeAt(j)))
                                    break;
                            }
                            if (j < len && j !== last)
                            {
                                // Matched!
                                last = j;
                                // Match 1 or more non-path separators
                                for (; j < len; ++j)
                                {
                                    if (isPathSeparator(path.charCodeAt(j)))
                                        break;
                                }
                                if (j === len)
                                {
                                    // We matched a UNC root only
                                    return path;
                                }
                                if (j !== last)
                                {
                                    // We matched a UNC root with leftovers

                                    // Offset by 1 to include the separator after the UNC root to
                                    // treat it as a "normal root" on top of a (UNC) root
                                    rootEnd = offset = j + 1;
                                }
                            }
                        }
                    }
                } else if (isWindowsDeviceRoot(code))
                {
                    // Possible device root

                    if (path.charCodeAt(1) === CHAR_COLON)
                    {
                        rootEnd = offset = 2;
                        if (len > 2)
                        {
                            if (isPathSeparator(path.charCodeAt(2)))
                                rootEnd = offset = 3;
                        }
                    }
                }
            } else if (isPathSeparator(code))
            {
                // `path` contains just a path separator, exit early to avoid
                // unnecessary work
                return path;
            }

            for (var i = len - 1; i >= offset; --i)
            {
                if (isPathSeparator(path.charCodeAt(i)))
                {
                    if (!matchedSlash)
                    {
                        end = i;
                        break;
                    }
                } else
                {
                    // We saw the first non-path separator
                    matchedSlash = false;
                }
            }

            if (end === -1)
            {
                if (rootEnd === -1)
                    return '.';
                else
                    end = rootEnd;
            }
            return path.slice(0, end);
        }

        basename(path: string, ext: string)
        {
            if (ext !== undefined)
                validateString(ext, 'ext');
            validateString(path, 'path');
            var start = 0;
            var end = -1;
            var matchedSlash = true;
            var i;

            // Check for a drive letter prefix so as not to mistake the following
            // path separator as an extra separator at the end of the path that can be
            // disregarded
            if (path.length >= 2)
            {
                const drive = path.charCodeAt(0);
                if (isWindowsDeviceRoot(drive))
                {
                    if (path.charCodeAt(1) === CHAR_COLON)
                        start = 2;
                }
            }

            if (ext !== undefined && ext.length > 0 && ext.length <= path.length)
            {
                if (ext.length === path.length && ext === path)
                    return '';
                var extIdx = ext.length - 1;
                var firstNonSlashEnd = -1;
                for (i = path.length - 1; i >= start; --i)
                {
                    const code = path.charCodeAt(i);
                    if (isPathSeparator(code))
                    {
                        // If we reached a path separator that was not part of a set of path
                        // separators at the end of the string, stop now
                        if (!matchedSlash)
                        {
                            start = i + 1;
                            break;
                        }
                    } else
                    {
                        if (firstNonSlashEnd === -1)
                        {
                            // We saw the first non-path separator, remember this index in case
                            // we need it if the extension ends up not matching
                            matchedSlash = false;
                            firstNonSlashEnd = i + 1;
                        }
                        if (extIdx >= 0)
                        {
                            // Try to match the explicit extension
                            if (code === ext.charCodeAt(extIdx))
                            {
                                if (--extIdx === -1)
                                {
                                    // We matched the extension, so mark this as the end of our path
                                    // component
                                    end = i;
                                }
                            } else
                            {
                                // Extension does not match, so our result is the entire path
                                // component
                                extIdx = -1;
                                end = firstNonSlashEnd;
                            }
                        }
                    }
                }

                if (start === end)
                    end = firstNonSlashEnd;
                else if (end === -1)
                    end = path.length;
                return path.slice(start, end);
            } else
            {
                for (i = path.length - 1; i >= start; --i)
                {
                    if (isPathSeparator(path.charCodeAt(i)))
                    {
                        // If we reached a path separator that was not part of a set of path
                        // separators at the end of the string, stop now
                        if (!matchedSlash)
                        {
                            start = i + 1;
                            break;
                        }
                    } else if (end === -1)
                    {
                        // We saw the first non-path separator, mark this as the end of our
                        // path component
                        matchedSlash = false;
                        end = i + 1;
                    }
                }

                if (end === -1)
                    return '';
                return path.slice(start, end);
            }
        }

        extname(path: string)
        {
            validateString(path, 'path');
            var start = 0;
            var startDot = -1;
            var startPart = 0;
            var end = -1;
            var matchedSlash = true;
            // Track the state of characters (if any) we see before our first dot and
            // after any path separator we find
            var preDotState = 0;

            // Check for a drive letter prefix so as not to mistake the following
            // path separator as an extra separator at the end of the path that can be
            // disregarded

            if (path.length >= 2 &&
                path.charCodeAt(1) === CHAR_COLON &&
                isWindowsDeviceRoot(path.charCodeAt(0)))
            {
                start = startPart = 2;
            }

            for (var i = path.length - 1; i >= start; --i)
            {
                const code = path.charCodeAt(i);
                if (isPathSeparator(code))
                {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash)
                    {
                        startPart = i + 1;
                        break;
                    }
                    continue;
                }
                if (end === -1)
                {
                    // We saw the first non-path separator, mark this as the end of our
                    // extension
                    matchedSlash = false;
                    end = i + 1;
                }
                if (code === CHAR_DOT)
                {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1)
                        startDot = i;
                    else if (preDotState !== 1)
                        preDotState = 1;
                } else if (startDot !== -1)
                {
                    // We saw a non-dot and non-path separator before our dot, so we should
                    // have a good chance at having a non-empty extension
                    preDotState = -1;
                }
            }

            if (startDot === -1 ||
                end === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                (preDotState === 1 &&
                    startDot === end - 1 &&
                    startDot === startPart + 1))
            {
                return '';
            }
            return path.slice(startDot, end);
        }

        format(pathObject: {
            dir: string;
            root: string;
            base: string;
            name: string;
            ext: string;
        })
        {
            if (pathObject === null || typeof pathObject !== 'object')
            {
                throw new ERR_INVALID_ARG_TYPE('pathObject', 'Object', pathObject);
            }
            return _format('\\', pathObject);
        }

        parse(path: string)
        {
            validateString(path, 'path');

            var ret = { root: '', dir: '', base: '', ext: '', name: '' };
            if (path.length === 0)
                return ret;

            var len = path.length;
            var rootEnd = 0;
            let code = path.charCodeAt(0);

            // Try to match a root
            if (len > 1)
            {
                if (isPathSeparator(code))
                {
                    // Possible UNC root

                    rootEnd = 1;
                    if (isPathSeparator(path.charCodeAt(1)))
                    {
                        // Matched double path separator at beginning
                        var j = 2;
                        var last = j;
                        // Match 1 or more non-path separators
                        for (; j < len; ++j)
                        {
                            if (isPathSeparator(path.charCodeAt(j)))
                                break;
                        }
                        if (j < len && j !== last)
                        {
                            // Matched!
                            last = j;
                            // Match 1 or more path separators
                            for (; j < len; ++j)
                            {
                                if (!isPathSeparator(path.charCodeAt(j)))
                                    break;
                            }
                            if (j < len && j !== last)
                            {
                                // Matched!
                                last = j;
                                // Match 1 or more non-path separators
                                for (; j < len; ++j)
                                {
                                    if (isPathSeparator(path.charCodeAt(j)))
                                        break;
                                }
                                if (j === len)
                                {
                                    // We matched a UNC root only

                                    rootEnd = j;
                                } else if (j !== last)
                                {
                                    // We matched a UNC root with leftovers

                                    rootEnd = j + 1;
                                }
                            }
                        }
                    }
                } else if (isWindowsDeviceRoot(code))
                {
                    // Possible device root

                    if (path.charCodeAt(1) === CHAR_COLON)
                    {
                        rootEnd = 2;
                        if (len > 2)
                        {
                            if (isPathSeparator(path.charCodeAt(2)))
                            {
                                if (len === 3)
                                {
                                    // `path` contains just a drive root, exit early to avoid
                                    // unnecessary work
                                    ret.root = ret.dir = path;
                                    return ret;
                                }
                                rootEnd = 3;
                            }
                        } else
                        {
                            // `path` contains just a drive root, exit early to avoid
                            // unnecessary work
                            ret.root = ret.dir = path;
                            return ret;
                        }
                    }
                }
            } else if (isPathSeparator(code))
            {
                // `path` contains just a path separator, exit early to avoid
                // unnecessary work
                ret.root = ret.dir = path;
                return ret;
            }

            if (rootEnd > 0)
                ret.root = path.slice(0, rootEnd);

            var startDot = -1;
            var startPart = rootEnd;
            var end = -1;
            var matchedSlash = true;
            var i = path.length - 1;

            // Track the state of characters (if any) we see before our first dot and
            // after any path separator we find
            var preDotState = 0;

            // Get non-dir info
            for (; i >= rootEnd; --i)
            {
                code = path.charCodeAt(i);
                if (isPathSeparator(code))
                {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash)
                    {
                        startPart = i + 1;
                        break;
                    }
                    continue;
                }
                if (end === -1)
                {
                    // We saw the first non-path separator, mark this as the end of our
                    // extension
                    matchedSlash = false;
                    end = i + 1;
                }
                if (code === CHAR_DOT)
                {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1)
                        startDot = i;
                    else if (preDotState !== 1)
                        preDotState = 1;
                } else if (startDot !== -1)
                {
                    // We saw a non-dot and non-path separator before our dot, so we should
                    // have a good chance at having a non-empty extension
                    preDotState = -1;
                }
            }

            if (startDot === -1 ||
                end === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                (preDotState === 1 &&
                    startDot === end - 1 &&
                    startDot === startPart + 1))
            {
                if (end !== -1)
                {
                    ret.base = ret.name = path.slice(startPart, end);
                }
            } else
            {
                ret.name = path.slice(startPart, startDot);
                ret.base = path.slice(startPart, end);
                ret.ext = path.slice(startDot, end);
            }

            // If the directory is the root, use the entire root as the `dir` including
            // the trailing slash if any (`C:\abc` -> `C:\`). Otherwise, strip out the
            // trailing slash (`C:\abc\def` -> `C:\abc`).
            if (startPart > 0 && startPart !== rootEnd)
                ret.dir = path.slice(0, startPart - 1);
            else
                ret.dir = ret.root;

            return ret;
        }

        sep: "\\" | "/" = '\\';
        delimiter: ";" | ":" = ';';
        win32: Win32Path = <any>null;
        posix: PosixPath = <any>null;
    };

    class PosixPath implements Path
    {
        // path.resolve([from ...], to)
        resolve(...pathSegments: string[]): string
        {
            var resolvedPath = '';
            var resolvedAbsolute = false;

            for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--)
            {
                var path;
                if (i >= 0)
                    path = arguments[i];
                else
                {
                    path = process.cwd();
                }

                validateString(path, 'path');

                // Skip empty entries
                if (path.length === 0)
                {
                    continue;
                }

                resolvedPath = path + '/' + resolvedPath;
                resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
            }

            // At this point the path should be resolved to a full absolute path, but
            // handle relative paths to be safe (might happen when process.cwd() fails)

            // Normalize the path
            resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, '/',
                isPosixPathSeparator);

            if (resolvedAbsolute)
            {
                if (resolvedPath.length > 0)
                    return '/' + resolvedPath;
                else
                    return '/';
            } else if (resolvedPath.length > 0)
            {
                return resolvedPath;
            } else
            {
                return '.';
            }
        }


        normalize(path: string)
        {
            validateString(path, 'path');

            if (path.length === 0)
                return '.';

            const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
            const trailingSeparator =
                path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH;

            // Normalize the path
            path = normalizeString(path, !isAbsolute, '/', isPosixPathSeparator);

            if (path.length === 0 && !isAbsolute)
                path = '.';
            if (path.length > 0 && trailingSeparator)
                path += '/';

            if (isAbsolute)
                return '/' + path;
            return path;
        }

        isAbsolute(path: string)
        {
            validateString(path, 'path');
            return path.length > 0 && path.charCodeAt(0) === CHAR_FORWARD_SLASH;
        }

        join()
        {
            if (arguments.length === 0)
                return '.';
            var joined;
            for (var i = 0; i < arguments.length; ++i)
            {
                var arg = arguments[i];
                validateString(arg, 'path');
                if (arg.length > 0)
                {
                    if (joined === undefined)
                        joined = arg;
                    else
                        joined += '/' + arg;
                }
            }
            if (joined === undefined)
                return '.';
            return posix.normalize(joined);
        }

        relative(from: string, to: string)
        {
            validateString(from, 'from');
            validateString(to, 'to');

            if (from === to)
                return '';

            from = posix.resolve(from);
            to = posix.resolve(to);

            if (from === to)
                return '';

            // Trim any leading backslashes
            var fromStart = 1;
            for (; fromStart < from.length; ++fromStart)
            {
                if (from.charCodeAt(fromStart) !== CHAR_FORWARD_SLASH)
                    break;
            }
            var fromEnd = from.length;
            var fromLen = (fromEnd - fromStart);

            // Trim any leading backslashes
            var toStart = 1;
            for (; toStart < to.length; ++toStart)
            {
                if (to.charCodeAt(toStart) !== CHAR_FORWARD_SLASH)
                    break;
            }
            var toEnd = to.length;
            var toLen = (toEnd - toStart);

            // Compare paths to find the longest common path from root
            var length = (fromLen < toLen ? fromLen : toLen);
            var lastCommonSep = -1;
            var i = 0;
            for (; i <= length; ++i)
            {
                if (i === length)
                {
                    if (toLen > length)
                    {
                        if (to.charCodeAt(toStart + i) === CHAR_FORWARD_SLASH)
                        {
                            // We get here if `from` is the exact base path for `to`.
                            // For example: from='/foo/bar'; to='/foo/bar/baz'
                            return to.slice(toStart + i + 1);
                        } else if (i === 0)
                        {
                            // We get here if `from` is the root
                            // For example: from='/'; to='/foo'
                            return to.slice(toStart + i);
                        }
                    } else if (fromLen > length)
                    {
                        if (from.charCodeAt(fromStart + i) === CHAR_FORWARD_SLASH)
                        {
                            // We get here if `to` is the exact base path for `from`.
                            // For example: from='/foo/bar/baz'; to='/foo/bar'
                            lastCommonSep = i;
                        } else if (i === 0)
                        {
                            // We get here if `to` is the root.
                            // For example: from='/foo'; to='/'
                            lastCommonSep = 0;
                        }
                    }
                    break;
                }
                var fromCode = from.charCodeAt(fromStart + i);
                var toCode = to.charCodeAt(toStart + i);
                if (fromCode !== toCode)
                    break;
                else if (fromCode === CHAR_FORWARD_SLASH)
                    lastCommonSep = i;
            }

            var out = '';
            // Generate the relative path based on the path difference between `to`
            // and `from`
            for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i)
            {
                if (i === fromEnd || from.charCodeAt(i) === CHAR_FORWARD_SLASH)
                {
                    if (out.length === 0)
                        out += '..';
                    else
                        out += '/..';
                }
            }

            // Lastly, append the rest of the destination (`to`) path that comes after
            // the common path parts
            if (out.length > 0)
                return out + to.slice(toStart + lastCommonSep);
            else
            {
                toStart += lastCommonSep;
                if (to.charCodeAt(toStart) === CHAR_FORWARD_SLASH)
                    ++toStart;
                return to.slice(toStart);
            }
        }

        toNamespacedPath(path: string)
        {
            // Non-op on posix systems
            return path;
        }

        dirname(path: string)
        {
            validateString(path, 'path');
            if (path.length === 0)
                return '.';
            const hasRoot = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
            var end = -1;
            var matchedSlash = true;
            for (var i = path.length - 1; i >= 1; --i)
            {
                if (path.charCodeAt(i) === CHAR_FORWARD_SLASH)
                {
                    if (!matchedSlash)
                    {
                        end = i;
                        break;
                    }
                } else
                {
                    // We saw the first non-path separator
                    matchedSlash = false;
                }
            }

            if (end === -1)
                return hasRoot ? '/' : '.';
            if (hasRoot && end === 1)
                return '//';
            return path.slice(0, end);
        }

        basename(path: string, ext: string)
        {
            if (ext !== undefined)
                validateString(ext, 'ext');
            validateString(path, 'path');

            var start = 0;
            var end = -1;
            var matchedSlash = true;
            var i;

            if (ext !== undefined && ext.length > 0 && ext.length <= path.length)
            {
                if (ext.length === path.length && ext === path)
                    return '';
                var extIdx = ext.length - 1;
                var firstNonSlashEnd = -1;
                for (i = path.length - 1; i >= 0; --i)
                {
                    const code = path.charCodeAt(i);
                    if (code === CHAR_FORWARD_SLASH)
                    {
                        // If we reached a path separator that was not part of a set of path
                        // separators at the end of the string, stop now
                        if (!matchedSlash)
                        {
                            start = i + 1;
                            break;
                        }
                    } else
                    {
                        if (firstNonSlashEnd === -1)
                        {
                            // We saw the first non-path separator, remember this index in case
                            // we need it if the extension ends up not matching
                            matchedSlash = false;
                            firstNonSlashEnd = i + 1;
                        }
                        if (extIdx >= 0)
                        {
                            // Try to match the explicit extension
                            if (code === ext.charCodeAt(extIdx))
                            {
                                if (--extIdx === -1)
                                {
                                    // We matched the extension, so mark this as the end of our path
                                    // component
                                    end = i;
                                }
                            } else
                            {
                                // Extension does not match, so our result is the entire path
                                // component
                                extIdx = -1;
                                end = firstNonSlashEnd;
                            }
                        }
                    }
                }

                if (start === end)
                    end = firstNonSlashEnd;
                else if (end === -1)
                    end = path.length;
                return path.slice(start, end);
            } else
            {
                for (i = path.length - 1; i >= 0; --i)
                {
                    if (path.charCodeAt(i) === CHAR_FORWARD_SLASH)
                    {
                        // If we reached a path separator that was not part of a set of path
                        // separators at the end of the string, stop now
                        if (!matchedSlash)
                        {
                            start = i + 1;
                            break;
                        }
                    } else if (end === -1)
                    {
                        // We saw the first non-path separator, mark this as the end of our
                        // path component
                        matchedSlash = false;
                        end = i + 1;
                    }
                }

                if (end === -1)
                    return '';
                return path.slice(start, end);
            }
        }

        extname(path: string)
        {
            validateString(path, 'path');
            var startDot = -1;
            var startPart = 0;
            var end = -1;
            var matchedSlash = true;
            // Track the state of characters (if any) we see before our first dot and
            // after any path separator we find
            var preDotState = 0;
            for (var i = path.length - 1; i >= 0; --i)
            {
                const code = path.charCodeAt(i);
                if (code === CHAR_FORWARD_SLASH)
                {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash)
                    {
                        startPart = i + 1;
                        break;
                    }
                    continue;
                }
                if (end === -1)
                {
                    // We saw the first non-path separator, mark this as the end of our
                    // extension
                    matchedSlash = false;
                    end = i + 1;
                }
                if (code === CHAR_DOT)
                {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1)
                        startDot = i;
                    else if (preDotState !== 1)
                        preDotState = 1;
                } else if (startDot !== -1)
                {
                    // We saw a non-dot and non-path separator before our dot, so we should
                    // have a good chance at having a non-empty extension
                    preDotState = -1;
                }
            }

            if (startDot === -1 ||
                end === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                (preDotState === 1 &&
                    startDot === end - 1 &&
                    startDot === startPart + 1))
            {
                return '';
            }
            return path.slice(startDot, end);
        }

        format(pathObject: {
            dir: string;
            root: string;
            base: string;
            name: string;
            ext: string;
        })
        {
            if (pathObject === null || typeof pathObject !== 'object')
            {
                throw new ERR_INVALID_ARG_TYPE('pathObject', 'Object', pathObject);
            }
            return _format('/', pathObject);
        }

        parse(path: string)
        {
            validateString(path, 'path');

            var ret = { root: '', dir: '', base: '', ext: '', name: '' };
            if (path.length === 0)
                return ret;
            var isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
            var start;
            if (isAbsolute)
            {
                ret.root = '/';
                start = 1;
            } else
            {
                start = 0;
            }
            var startDot = -1;
            var startPart = 0;
            var end = -1;
            var matchedSlash = true;
            var i = path.length - 1;

            // Track the state of characters (if any) we see before our first dot and
            // after any path separator we find
            var preDotState = 0;

            // Get non-dir info
            for (; i >= start; --i)
            {
                const code = path.charCodeAt(i);
                if (code === CHAR_FORWARD_SLASH)
                {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash)
                    {
                        startPart = i + 1;
                        break;
                    }
                    continue;
                }
                if (end === -1)
                {
                    // We saw the first non-path separator, mark this as the end of our
                    // extension
                    matchedSlash = false;
                    end = i + 1;
                }
                if (code === CHAR_DOT)
                {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1)
                        startDot = i;
                    else if (preDotState !== 1)
                        preDotState = 1;
                } else if (startDot !== -1)
                {
                    // We saw a non-dot and non-path separator before our dot, so we should
                    // have a good chance at having a non-empty extension
                    preDotState = -1;
                }
            }

            if (startDot === -1 ||
                end === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                (preDotState === 1 &&
                    startDot === end - 1 &&
                    startDot === startPart + 1))
            {
                if (end !== -1)
                {
                    if (startPart === 0 && isAbsolute)
                        ret.base = ret.name = path.slice(1, end);
                    else
                        ret.base = ret.name = path.slice(startPart, end);
                }
            } else
            {
                if (startPart === 0 && isAbsolute)
                {
                    ret.name = path.slice(1, startDot);
                    ret.base = path.slice(1, end);
                } else
                {
                    ret.name = path.slice(startPart, startDot);
                    ret.base = path.slice(startPart, end);
                }
                ret.ext = path.slice(startDot, end);
            }

            if (startPart > 0)
                ret.dir = path.slice(0, startPart - 1);
            else if (isAbsolute)
                ret.dir = '/';

            return ret;
        }

        sep: "\\" | "/" = '/';
        delimiter: ";" | ":" = ':';
        win32: Win32Path = <any>null;
        posix: PosixPath = <any>null;
    };

    const win32 = new Win32Path();
    const posix = new PosixPath();

    posix.win32 = win32.win32 = win32;
    posix.posix = win32.posix = posix;

    // Legacy internal API, docs-only deprecated: DEP0080
    // win32._makeLong = win32.toNamespacedPath;
    // posix._makeLong = posix.toNamespacedPath;

    // if (process.platform === 'win32')
    //     module.exports = win32;
    // else
    //     module.exports = posix;

    // 

    if (process.platform === 'win32')
        path = win32;
    else
        path = posix;
}