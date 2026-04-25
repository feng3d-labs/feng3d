import { ArrayBufferAsset, AudioAsset, CapsuleGeometry, Color4, ConeGeometry, CubeGeometry, CylinderGeometry, dataTransform, FileAsset, FolderAsset, GameObject, GameObjectAsset, GeometryAsset, globalEmitter, gPartial, IEvent, ImageUtil, JSAsset, JsonAsset, Material, MaterialAsset, path, PlaneGeometry, regExps, Scene, ScriptAsset, SegmentGeometry, ShaderAsset, SphereGeometry, TextAsset, Texture2D, TextureAsset, TextureCube, TextureCubeAsset, TorusGeometry, watcher } from 'feng3d';
import { editorRS } from '../../assets/EditorRS';
import { nativeAPI } from '../../assets/NativeRequire';
import { EditorData } from '../../global/EditorData';
import { menu, MenuItem } from '../components/Menu';
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
        const object: GameObject = await editorRS.deserializeWithAssets(obj) as any;
        const scene = object.getComponent(Scene);

        return scene;
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
     * @param cls 资源类定义
     * @param fileName 文件名称
     * @param value 初始数据
     */
    async createAsset<T extends FileAsset>(folderPath: string, cls: new () => T, fileName?: string, value?: gPartial<T>)
    {
        const folderNode = this.getAssetByPath(folderPath);

        const folder = <FolderAsset>folderNode.asset;
        const asset = await editorRS.createAsset(cls, fileName, value, folder);
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
                                this.createAsset(folderPath, TextureCubeAsset, 'new TextureCube', { data: new TextureCube() as any });
                            }
                        },
                        {
                            label: 'Material', click: () =>
                            {
                                this.createAsset(folderPath, MaterialAsset, 'New Material', { data: new Material() as any });
                            }
                        },
                        {
                            label: '几何体',
                            submenu: [
                                {
                                    label: '平面', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New PlaneGeometry', { data: new PlaneGeometry() });
                                    }
                                },
                                {
                                    label: '立方体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New CubeGeometry', { data: new CubeGeometry() });
                                    }
                                },
                                {
                                    label: '球体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New SphereGeometry', { data: new SphereGeometry() });
                                    }
                                },
                                {
                                    label: '胶囊体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New CapsuleGeometry', { data: new CapsuleGeometry() });
                                    }
                                },
                                {
                                    label: '圆柱体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New CylinderGeometry', { data: new CylinderGeometry() });
                                    }
                                },
                                {
                                    label: '圆锥体', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New ConeGeometry', { data: new ConeGeometry() });
                                    }
                                },
                                {
                                    label: '圆环', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New TorusGeometry', { data: new TorusGeometry() });
                                    }
                                },
                                {
                                    label: '线段', click: () =>
                                    {
                                        this.createAsset(folderPath, GeometryAsset, 'New SegmentGeometry', { data: new SegmentGeometry() });
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
                    const backColor = new Color4(222 / 255, 222 / 255, 222 / 255);
                    imageUtil.clearBackColor(backColor);
                    const img = await dataTransform.imagedataToImage(imageUtil.imageData, 1);
                    assetNode.asset['image'] = img;
                    this.saveAsset(assetNode);
                }, enable: assetNode.asset.data instanceof Texture2D,
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
        const assetNode = await this.createAsset(this.showFloder.asset.assetPath, GameObjectAsset, object.name, { data: object });

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
                const texture2D = new Texture2D();
                texture2D['_pixels'] = img;
                const assetNode = await this.createAsset(showFloder, TextureAsset, fileName, { data: <any>texture2D });

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
            // eslint-disable-next-line no-eval
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
            // eslint-disable-next-line no-empty
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
