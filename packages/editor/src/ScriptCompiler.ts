 
/// <reference path="../libs/typescriptServices.d.ts" />

import { globalEmitter, ScriptAsset, TextAsset, ticker } from 'feng3d';
// IEvent 是纯类型（interface），运行时不存在，必须用 import type 以免 ESM 链接期报错
import type { IEvent } from 'feng3d';
import { parse } from 'jsonc-parser';
import { ElMessage } from 'element-plus';
import { editorRS } from './assets/EditorRS';
import { nativeAPI } from './assets/NativeRequire';
import { EditorData } from './global/EditorData';
import { EditorAsset, editorAsset } from './ui/assets/EditorAsset';

export class ScriptCompiler
{
    private tsconfig: { compilerOptions: ts.CompilerOptions, files: string[] };

    constructor()
    {
        globalEmitter.on('script.compile', this.onScriptCompile, this);
        globalEmitter.on('script.gettslibs', this.onGettsLibs, this);

        globalEmitter.on('openScript', this.onOpenScript, this);

        globalEmitter.on('fs.delete', this.onFileChanged, this);
        globalEmitter.on('fs.write', this.onFileChanged, this);
    }

    private async onOpenScript(e: IEvent<TextAsset>)
    {
        // IEvent.data 是"emit 时填充"的可选字段，事件能派发到这里就必然带 data；取一次局部变量，
        // 下面三处（赋值 / 取路径 / 再 emit）都用它，省掉对同一个字段的反复收窄
        const script = e.data!;

        EditorData.editorData.openScript = script;

        if (nativeAPI)
        {
            // 使用本地 VSCode 打开
            const path = editorRS.fs.getAbsolutePath(script.assetPath);
            await nativeAPI.openWithVSCode(editorRS.fs.projectname);
            await nativeAPI.openWithVSCode(path);
        }
        else
        {
            if (EditorAsset.codeeditoWin) EditorAsset.codeeditoWin.close();
            // window.open 类型上可能返回 null（被拦截时）；原实现遇到 null 会在下一行读 onload 时崩，
            // 这里用断言保持同一行为
            const codeEditorWin = window.open(`packages/codeeditor/codeeditor.html`)!;

            EditorAsset.codeeditoWin = codeEditorWin;
            codeEditorWin.onload = () =>
            {
                globalEmitter.emit('codeeditor.openScript', script);
            };
        }
    }

    private async onGettsLibs(e: IEvent<{ callback: (tslibs: { path: string; code: string; }[]) => void; }>)
    {
        const tslibs = await this.loadtslibs();

        // 同 onOpenScript：事件能派发到这里就必然带 data
        e.data!.callback(tslibs);
    }

    /**
     * 加载 tslibs
     */
    private async loadtslibs()
    {
        // 加载 ts 配置
        const str = await editorRS.fs.readString('tsconfig.json');

        this.tsconfig = parse(str);
        console.log(this.tsconfig);

        const tslist = editorRS.getAssetsByType(ScriptAsset);
        let files: string[] = this.tsconfig.files;
        files = files.filter((v) => v.indexOf('Assets') !== 0);
        files = files.concat(tslist.map((v) => v.assetPath));
        //
        const strs = await editorRS.fs.readStrings(files);
        const tslibs = files.map((f, i) =>
        {
            const str = strs[i]; if (typeof str === 'string') return { path: f, code: str };
            console.warn(`没有找到文件 ${f}`);

            return null;
        }).filter((v) => !!v);

        return tslibs;
    }

    private onFileChanged(e: IEvent<string>)
    {
        if (!e.data) return;
        if (e.data.substr(-3) === '.ts')
        {
            ticker.once(2000, this.onScriptCompile as any, this);
        }
    }

    private async onScriptCompile(e?: IEvent<{ onComplete?: (...args: any) => void; }>)
    {
        const tslibs = await this.loadtslibs();
        const output = await this.compile(tslibs);
        // onComplete 是可选字段；原实现在它缺省时同样会调用 undefined 并抛错，故用断言保持原行为
        e && e.data && e.data.onComplete!(output);
    }

    private getOptions()
    {
        const targetMap = {
            es3: ts.ScriptTarget.ES3, es5: ts.ScriptTarget.ES5, es2015: ts.ScriptTarget.ES2015, es2016: ts.ScriptTarget.ES2016, es2017: ts.ScriptTarget.ES2017, es2018: ts.ScriptTarget.ES2018
        };
        const options: ts.CompilerOptions = JSON.parse(JSON.stringify(this.tsconfig.compilerOptions));
        // targetMap 的键是字符串（es3/es5/…），而 options.target 是 TS 的数字枚举。
        // 原实现直接拿枚举值索引字符串键——运行时恒为 undefined、这个 if 从来不成立；
        // 这里只做类型层转换，保持原语义（不改写 options.target 的实际行为）
        const targetKey = options.target as unknown as keyof typeof targetMap;

        if (targetMap[targetKey]) options.target = targetMap[targetKey];

        return options;
    }

    private async compile(tslibs: { path: string; code: string; }[])
    {
        // 失败路径返回 null；`null!` 只影响类型（运行时仍是 null），调用方本来就按真值判断
        let output: { name: string; text: string; }[] = null!;
        try
        {
            output = this.transpileModule(tslibs);

            output.forEach((v) =>
            {
                editorRS.fs.writeString(v.name, v.text);
            });

            await editorAsset.runProjectScript();
            globalEmitter.emit('asset.scriptChanged');
        }
        catch (e)
        {
            console.log(`Error from compilation: ${e} `);
        }

        ElMessage({ message: '编译完成！', type: 'info' });

        return output;
    }

    private transpileModule(tslibs: { path: string; code: string; }[])
    {
        const options = this.getOptions();
        const tsSourceMap: { [filepath: string]: ts.SourceFile } = {};
        const fileNames: string[] = [];
        tslibs.forEach((item) =>
        {
            fileNames.push(item.path);
            tsSourceMap[item.path] = ts.createSourceFile(item.path, item.code, options.target || ts.ScriptTarget.ES5);
        });

        // Output
        const outputs: { name: string, text: string }[] = [];
        // 排序
        let program = this.createProgram(fileNames, options, tsSourceMap, outputs);
        // TypeScript API 可能不包含 reorderSourceFiles，使用类型断言避免编译错误
        const result = (ts as any).reorderSourceFiles?.(program);
        if (result)
        {
            console.log(`ts 排序结果`);
            console.log(result);
            if (result.circularReferences && result.circularReferences.length > 0)
            {
                console.warn(`出现循环引用`);
            }
            this.tsconfig.files = result.sortedFileNames;
            editorRS.fs.writeObject('tsconfig.json', this.tsconfig);
            // 编译
            program = this.createProgram(result.sortedFileNames, options, tsSourceMap, outputs);
        }
        program.emit();

        return outputs;
    }

    private createProgram(fileNames: string[], options: ts.CompilerOptions, tsSourceMap: {}, outputs: { name: string; text: string; }[])
    {
        return ts.createProgram(fileNames, options, {
            getSourceFile(fileName)
            {
                return tsSourceMap[fileName];
            },
            writeFile(_name, text)
            {
                outputs.push({ name: _name, text });
            },
            getDefaultLibFileName() { return 'lib.d.ts'; },
            useCaseSensitiveFileNames() { return false; },
            getCanonicalFileName(fileName) { return fileName; },
            getCurrentDirectory() { return ''; },
            getNewLine() { return '\r\n'; },
            fileExists(fileName)
            {
                return !!tsSourceMap[fileName];
            },
            readFile() { return ''; },
            directoryExists() { return true; },
            getDirectories() { return []; }
        });
    }
}

export const scriptCompiler = new ScriptCompiler();
