namespace feng3d
{
    export var path: WindowPath;

    /**
     * 路径
     * 
     * @see http://nodejs.cn/api/path.html
     * @see https://github.com/nodejs/node/blob/master/lib/path.js
     */
    export class WindowPath
    {
        /**
         * 返回路径的最后一部分。类似于Unix basename命令。通常用于从完全限定的路径中提取文件名。
         * 
         * @param path 求值的路径。
         * @param ext 可选地，从结果中删除的扩展。
         */
        basename(path: string, ext?: string)
        {
            var start = 0;
            var end = -1;
            var matchedSlash = true;
            var i: number;

            // 检查驱动器的字母前缀，以免将下面的路径分隔符误认为是可以忽略的路径末尾的额外分隔符
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
                        // 如果我们到达的路径分隔符不是字符串末尾的一组路径分隔符的一部分，那么现在停止
                        if (!matchedSlash)
                        {
                            start = i + 1;
                            break;
                        }
                    } else
                    {
                        if (firstNonSlashEnd === -1)
                        {
                            //我们看到了第一个非路径分隔符，以防万一，请记住这个索引
                            //如果扩展名不匹配，我们需要它
                            matchedSlash = false;
                            firstNonSlashEnd = i + 1;
                        }
                        if (extIdx >= 0)
                        {
                            // 尝试匹配显式扩展
                            if (code === ext.charCodeAt(extIdx))
                            {
                                if (--extIdx === -1)
                                {
                                    //我们匹配了扩展名，因此将其标记为路径组件的结束
                                    end = i;
                                }
                            } else
                            {
                                //扩展名不匹配，因此我们的结果是整个路径组件
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
                        //如果我们到达的路径分隔符不是字符串末尾的一组路径分隔符的一部分，那么现在停止
                        if (!matchedSlash)
                        {
                            start = i + 1;
                            break;
                        }
                    } else if (end === -1)
                    {
                        //我们看到了第一个非路径分隔符，将其标记为路径组件的结束
                        matchedSlash = false;
                        end = i + 1;
                    }
                }

                if (end === -1)
                    return '';
                return path.slice(start, end);
            }
        }

    }
    path = new WindowPath();

    const CHAR_COLON = 58;
    const CHAR_UPPERCASE_A = 65;
    const CHAR_UPPERCASE_Z = 90;
    const CHAR_LOWERCASE_A = 97;
    const CHAR_LOWERCASE_Z = 122;
    const CHAR_FORWARD_SLASH = 47;
    const CHAR_BACKWARD_SLASH = 92;

    function isWindowsDeviceRoot(code: number)
    {
        return code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z ||
            code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z;
    }

    function isPathSeparator(code: number)
    {
        return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    }
}