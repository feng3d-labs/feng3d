import { ArrayBufferAsset, AudioAsset, dataTransform, FileAsset, FolderAsset, Object3DAsset, GeometryAsset, globalEmitter, ImageUtil, JSAsset, JsonAsset, logic, MaterialAsset, path, regExps, ScriptAsset, serialization, ShaderAsset, TextAsset, TextureAsset, TextureCubeAsset, watcher } from 'feng3d';
import type { Object3D, gPartial, Material, Scene } from 'feng3d';
// IEvent 是纯类型（interface），运行时不存在，必须用 import type 以免 ESM 链接期报错
import type { IEvent } from 'feng3d';
import { editorRS } from '../../assets/EditorRS';
import { nativeAPI } from '../../assets/NativeRequire';
import { EditorData } from '../../global/EditorData';
import { menu, MenuItem } from '../components/Menu';
import { toImageUtilColor } from '../../utils/colorUtils';
import { assetFileTemplates } from './AssetFileTemplates';
import { AssetNode } from './AssetNode';

export class EditorAsset
{
    static codeeditoWin: Window;

    /**
     * 资源ID字典
     */
    private _assetIDMap: { [id: string]: AssetNode } = {};
    private _assetPathMap: { [path: string]: AssetNode } = {};

    /**
     * 显示文件夹
     */
    showFloder: AssetNode;

    /**
     * 项目资源id树形结构
     */
    rootFile: AssetNode;

    constructor()
    {
        globalEmitter.on('asset.parsed', this.onParsed, this);
        //
        watcher.watch(this as EditorAsset, 'showFloder', this.showFloderChanged, this);
    }

    /**
     * 初始化项目
     */
    async initproject()
    {
        await editorRS.init();

        this._assetIDMap = {};
        this._assetPathMap = {};

        const allAssets = editorRS.getAllAssets();
        allAssets.map((asset) =>
        {
            const node = new AssetNode(asset);
            this.addAsset(node);

            return node;
        }).forEach((element) =>
        {
            if (element.asset.parentAsset)
            {
                const parentNode = this.getAssetByID(element.asset.parentAsset.assetId);
                parentNode.addChild(element);
            }
        });

        this.rootFile = this.getAssetByID(editorRS.root.assetId);
        this.showFloder = this.rootFile;
        this.rootFile.isOpen = true;
    }

    /**
     * 添加新资源
     *
     * @param node 资源
     */
    addAsset(node: AssetNode)
    {
        if (this._assetIDMap[node.asset.assetId])
        { throw '添加重复资源！'; }
        if (this._assetPathMap[node.asset.assetPath])
        { throw '添加重复资源！'; }

        this._assetIDMap[node.asset.assetId] = node;
        this._assetPathMap[node.asset.assetPath] = node;
    }

    async readScene(path: string)
    {
        const obj = await editorRS.fs.readObject(path);
        if (!obj)
        {
            return null;
        }
        // 纯数据格式（`__type__`，主仓新范式的场景文件）：不含资源引用，直接反序列化即可，
        // 无需经过「类名 → 构造器」的资源加载链路（该链路对纯数据接口不适用）。
        // 旧格式（`__class__`）仍走 deserializeWithAssets，保持既有工程文件可读。
        const isDataFormat = typeof (obj as { __type__?: unknown }).__type__ === 'string';
        const object = (isDataFormat
            ? serialization.deserialize(obj)
            : await editorRS.deserializeWithAssets(obj)) as Object3D | undefined;
        if (!object)
        {
            console.warn(`[EditorAsset] readScene 反序列化失败，已退回空场景: ${path}`);

            return null;
        }

        console.info(`[EditorAsset] 场景已从文件加载: ${path}${isDataFormat ? '（纯数据格式）' : '（旧格式）'}`);

        return logic(object).getComponent<Scene>('Scene') ?? null;
    }

    /**
     * 根据资源编号获取文件
     *
     * @param assetId 文件路径
     */
    getAssetByID(assetId: string)
    {
        return this._assetIDMap[assetId];
    }

    /**
     * 根据资源路径获取文件
     *
     * @param path 资源路径
     */
    getAssetByPath(path: string)
    {
        return this._assetPathMap[path];
    }

    /**
     * 删除资源
     *
     * @param assetNode 资源
     */
    async deleteAsset(assetNode: AssetNode)
    {
        await editorRS.deleteAsset(assetNode.asset);
        delete this._assetIDMap[assetNode.asset.assetId];
        delete this._assetPathMap[assetNode.asset.assetPath];

        globalEmitter.emit('asset.deletefile', { id: assetNode.asset.assetId });
    }

    /**
     * 保存资源
     *
     * @param assetNode 资源
     */
    async saveAsset(assetNode: AssetNode)
    {
        await editorRS.writeAsset(assetNode.asset);
    }

    /**
     * 新增资源
     *
     * @param folderPath 文件夹路径
     * @param cls 资源类定义
     * @param fileName 文件名称
     * @param value 初始数据（其形状由调用方按资源数据类型 `D` 声明：新建材质 / 几何体时
     *   传的是**具体子类型**的纯数据字面量，与 `FileAsset.data` 的静态类型（基接口
     *   `Material` / `Geometry`）在结构上不等价，故这里用独立的 `D` 泛型描述）
     */
    async createAsset<T extends FileAsset, D = T>(folderPath: string, cls: new () => T, fileName?: string, value?: gPartial<D>)
    {
        const folderNode = this.getAssetByPath(folderPath);

        const folder = <FolderAsset>folderNode.asset;
        // 纯数据类型与 FileAsset.data 的静态基类型不同构，边界处显式断言（不做运行时转换）
        const asset = await editorRS.createAsset(cls, fileName, value as unknown as gPartial<T>, folder);
        const assetNode = new AssetNode(asset);

        assetNode.isLoaded = true;

        this.addAsset(assetNode);

        folderNode.addChild(assetNode);

        EditorData.editorData.selectObject(assetNode);

        return assetNode;
    }

    /**
     * 弹出文件菜单
     */
    popupmenu(assetNode: AssetNode)
    {
        const folder = <FolderAsset>assetNode.asset;
        // 资源所在文件夹
        let folderPath = assetNode.asset.assetPath;
        if (!assetNode.isDirectory) folderPath = assetNode.parent.asset.assetPath;

        const menuconfig: MenuItem[]
            = [
                {
                    label: 'Create',
                    submenu: [
                        {
                            label: 'Folder', click: () =>
                            {
                                this.createAsset(folderPath, FolderAsset, 'NewFolder');
                            }
                        },
                        {
                            label: 'TS Script', click: async () =>
                            {
                                const fileName = editorRS.getValidChildName(folder, 'NewScript');
                                await this.createAsset(folderPath, ScriptAsset, fileName, { textContent: assetFileTemplates.getNewScript(fileName) });
                                globalEmitter.emit('script.compile');
                            }
                        },
                        {
                            label: 'Shader', click: async () =>
                            {
                                const fileName = editorRS.getValidChildName(folder, 'NewShader');
                                await this.createAsset(folderPath, ShaderAsset, fileName, { textContent: assetFileTemplates.getNewShader(fileName) });
                                globalEmitter.emit('script.compile');
                            }
                        },
                        {
                            label: 'js', click: () =>
                            {
                                this.createAsset(folderPath, JSAsset, 'NewJs');
                            }
                        },
                        {
                            label: 'Json', click: () =>
                            {
                                this.createAsset(folderPath, JsonAsset, 'New Json', { textContent: '{}' });
                            }
                        },
                        {
                            label: 'Txt', click: () =>
                            {
                                this.createAsset(folderPath, TextAsset, 'New Text');
                            }
                        },
                        { type: 'separator' },
                        {
                            label: '立方体贴图', click: () =>
                            {
                                // TODO(P1 API 迁移)：`TextureCube` 类已从主仓移除（纹理统一为
                                // `{ __type__: 'Texture', url }` 声明式引用），待立方体贴图资源创建迁移后恢复。
                                // this.createAsset(folderPath, TextureCubeAsset, 'new TextureCube', { data: new TextureCube() as any });
                            }
                        },
                        {
                            label: 'Material', click: () =>
                            {
                                // `Material` 是纯数据接口（基接口不声明 `__type__`，不可构造），
                                // 新建材质用具体子类型字面量；`ColorUniforms.u_diffuseInput` 必填
                                this.createAsset(folderPath, MaterialAsset, 'New Material', {
                                    data: {
                                        __type__: 'ColorMaterial',
                                        uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
                                    },
                                });
                            }
                        },
                        {
                            label: '几何体',
                            submenu: [
                                {
                                    label: '平面', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New PlaneGeometry', { data: { __type__: 'PlaneGeometry' } });
                                    }
                                },
                                {
                                    label: '立方体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New CubeGeometry', { data: { __type__: 'CubeGeometry' } });
                                    }
                                },
                                {
                                    label: '球体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New SphereGeometry', { data: { __type__: 'SphereGeometry' } });
                                    }
                                },
                                {
                                    label: '胶囊体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New CapsuleGeometry', { data: { __type__: 'CapsuleGeometry' } });
                                    }
                                },
                                {
                                    label: '圆柱体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New CylinderGeometry', { data: { __type__: 'CylinderGeometry' } });
                                    }
                                },
                                {
                                    label: '圆锥体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New ConeGeometry', { data: { __type__: 'ConeGeometry' } });
                                    }
                                },
                                {
                                    label: '圆环', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New TorusGeometry', { data: { __type__: 'TorusGeometry' } });
                                    }
                                },
                                {
                                    label: '线段', click: () =>
                                    {
                                        // `SegmentGeometry.segments` 必填（主仓无 addSegment，整体替换）
                                        this.createAsset(folderPath, GeometryAsset, 'New SegmentGeometry', {
                                            data: { __type__: 'SegmentGeometry', segments: [] },
                                        });
                                    }
                                },
                                // {
                                //     label: "地形", click: () =>
                                //     {
                                //         this.createAsset(folderPath, GeometryAsset, "New TerrainGeometry", { data: new TerrainGeometry() });
                                //     }
                                // },
                            ],
                        },
                    ]
                },
                {
                    label: 'Show In Explorer', click: () =>
                    {
                        const fullpath = editorRS.fs.getAbsolutePath(assetNode.asset.assetPath);
                        nativeAPI.showFileInExplorer(fullpath);
                    }, enable: !!nativeAPI
                }, {
                    label: '使用VSCode打开项目', click: async () =>
                    {
                        await nativeAPI.openWithVSCode(editorRS.fs.projectname);
                    }, enable: !!nativeAPI,
                },
                {
                    label: 'Open', click: () =>
                    {
                        if (assetNode.asset instanceof TextAsset)
                        {
                            globalEmitter.emit('openScript', <TextAsset>assetNode.asset);
                        }
                    },
                },
                {
                    label: 'Delete', click: () =>
                    {
                        assetNode.delete();
                    }, enable: assetNode !== this.rootFile && assetNode !== this.showFloder,
                },
                {
                    label: 'Rename',
                    click: () =>
                    {
                        console.warn('未实现');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Import New Asset...', click: () =>
                    {
                        editorRS.selectFile((fileList: FileList) =>
                        {
                            const files = [];
                            for (let i = 0; i < fileList.length; i++)
                            {
                                files[i] = fileList[i];
                            }
                            this.inputFiles(files);
                        });
                    }, enable: assetNode.isDirectory,
                },
                {
                    label: 'Export Package...', click: () =>
                    {
                        assetNode.export();
                    },
                },
            ];

        // 解析菜单
        this.parserMenu(menuconfig, assetNode);
        menuconfig.push(
            {
                label: '去除背景色', click: async () =>
                {
                    const image: HTMLImageElement = assetNode.asset['image'];
                    const imageUtil = new ImageUtil().fromImage(image);
                    // `Color4` 是纯数据接口（不可 `new`），改用字面量；
                    // `ImageUtil.clearBackColor` 的参数仍是 `@feng3d/math` 的 class 版 Color4，
                    // 经 colorUtils 的边界适配函数转换（见 utils/colorUtils.ts 的说明）
                    const backColor = toImageUtilColor({ r: 222 / 255, g: 222 / 255, b: 222 / 255, a: 1 });
                    imageUtil.clearBackColor(backColor);
                    const img = await dataTransform.imagedataToImage(imageUtil.imageData, 1);
                    assetNode.asset['image'] = img;
                    this.saveAsset(assetNode);
                },
                // TODO(P1 API 迁移)：`Texture2D` 类已移除，类型判别改用 `__type__` 字符串；
                // 迁移前该项暂置为不可用，避免误操作。
                // enable: assetNode.asset.data instanceof Texture2D,
                enable: false,
            },
        );
        menu.popup(menuconfig);
    }

    /**
     * 保存对象
     *
     * @param object 对象
     */
    async saveObject(object: any)
    {
        const assetNode = await this.createAsset(this.showFloder.asset.assetPath, Object3DAsset, object.name, { data: object });

        return assetNode;
    }

    /**
     *
     * @param files 需要导入的文件列表
     * @param callback 完成回调
     * @param assetNodes 生成资源文件列表（不用赋值，函数递归时使用）
     */
    inputFiles(files: File[], callback?: (files: AssetNode[]) => void, assetNodes: AssetNode[] = [])
    {
        if (files.length === 0)
        {
            EditorData.editorData.selectMultiObject(assetNodes);
            callback && callback(assetNodes);

            return;
        }
        const file = files.shift();
        const reader = new FileReader();
        reader.addEventListener('load', async (event) =>
        {
            const result: ArrayBuffer = <any>event.target['result'];
            const showFloder = this.showFloder.asset.assetPath;

            const createAssetCallback = (err: Error, assetNode: AssetNode) =>
            {
                if (err)
                {
                    console.warn(err.message);
                }
                else
                {
                    assetNodes.push(assetNode);
                }
                this.inputFiles(files, callback, assetNodes);
            };

            const fileName = file.name;
            if (regExps.image.test(file.name))
            {
                const img = await dataTransform.arrayBufferToImage(result);
                // TODO(P1 API 迁移)：`Texture2D` 类已移除，图片资源改由声明式纹理承载；
                // 迁移前直接把图片对象作为资源数据（原 `texture2D['_pixels']` 包装逻辑待重建）。
                // const texture2D = new Texture2D();
                // texture2D['_pixels'] = img;
                const assetNode = await this.createAsset(showFloder, TextureAsset, fileName, { data: <any>img });

                createAssetCallback(null, assetNode);
            }
            else if (regExps.audio.test(file.name))
            {
                const assetNode = await this.createAsset(showFloder, AudioAsset, fileName, { arraybuffer: <any>result });

                createAssetCallback(null, assetNode);
            }
            else
            {
                const assetNode = await this.createAsset(showFloder, ArrayBufferAsset, fileName, { arraybuffer: <any>result });

                createAssetCallback(null, assetNode);
            }
        }, false);
        reader.readAsArrayBuffer(file);
    }

    async runProjectScript()
    {
        const content = await editorRS.fs.readString('project.js');

        if (content !== this._preProjectJsContent)
        {
            //
             
            const windowEval = eval.bind(window);
            try
            {
                // 运行project.js
                windowEval(content);
                // 刷新属性界面（界面中可能有脚本）
                globalEmitter.emit('inspector.update');
            }
            catch (error)
            {
                console.warn(error);
            }
        }
        this._preProjectJsContent = content;
    }

    /**
     * 上次执行的项目脚本
     */
    private _preProjectJsContent = null;

    /**
     * 解析菜单
     * @param menuconfig 菜单
     * @param assetNode 文件
     */
    private parserMenu(menuconfig: MenuItem[], assetNode: AssetNode)
    {
        if (assetNode.asset instanceof FileAsset)
        {
            const filePath = assetNode.asset.assetPath;
            const extensions = path.extname(filePath);
             
            switch (extensions)
            {
                // case '.mdl': menuconfig.push({ label: '解析', click: () => mdlLoader.load(filePath) }); break;
                // case '.obj': menuconfig.push({ label: '解析', click: () => objLoader.load(filePath) }); break;
                // case '.mtl': menuconfig.push({ label: '解析', click: () => mtlLoader.load(filePath) }); break;
                // case '.fbx': menuconfig.push({ label: '解析', click: () => threejsLoader.load(filePath) }); break;
                // case '.md5mesh': menuconfig.push({ label: '解析', click: () => md5Loader.load(filePath) }); break;
                // case '.md5anim': menuconfig.push({ label: '解析', click: () => md5Loader.loadAnim(filePath) }); break;
            }
        }
    }

    private showFloderChanged(_property, oldValue, newValue)
    {
        this.showFloder.openParents();
        globalEmitter.emit('asset.showFloderChanged', { oldpath: oldValue, newpath: newValue });
    }

    private onParsed(e: IEvent<any>)
    {
        const data = e.data;
        if (data instanceof FileAsset)
        {
            this.saveObject(data.data);
        }
    }
}

export const editorAsset = new EditorAsset();
