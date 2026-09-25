import { saveAs } from 'file-saver';
import { AssetType, dataTransform, effect, FileAsset, FolderAsset, Object3DAsset, GeometryAsset, logic as getLogic, MaterialAsset, serialize, TextureAsset, TextureCubeAsset } from 'feng3d';
import JSZip from 'jszip';
import { editorRS } from '../../assets/EditorRS';
import { Feng3dScreenShot } from '../../feng3d/Feng3dScreenShot';
import { TreeNode, TreeNodeMap } from '../components/TreeNode';
import { DragData } from '../drag/Drag';
import { editorAsset } from './EditorAsset';

export interface AssetNodeEventMap extends TreeNodeMap
{
    /**
     * 加载完成
     */
    loaded
}

/**
 * 资源树结点
 */
export class AssetNode<T extends AssetNodeEventMap = AssetNodeEventMap> extends TreeNode<T>
{
    /**
     * 是否文件夹
     */
    isDirectory: boolean;

    /**
     * 图标名称或者路径
     */
    image: string;

    /**
     * 显示标签
     */
    declare label: string;

    @serialize
    children: AssetNode[] = [];

    declare parent: AssetNode;

    asset: FileAsset;

    /**
     * 是否已加载
     */
    isLoaded = false;

    /**
     * 是否加载中
     */
    private isLoading: boolean;

    /**
     * 构建
     *
     * @param asset 资源
     */
    constructor(asset: FileAsset)
    {
        super();

        this.asset = asset;
        this.isDirectory = asset.assetType === AssetType.folder;
        this.label = asset.fileName;
        // 更新图标
        if (this.isDirectory)
        {
            this.image = 'folder_png';
        }
        else
        {
            this.image = 'file_png';
        }

        asset.readPreview().then((image) =>
        {
            if (image)
            {
                this.image = dataTransform.imageToDataURL(image);
            }
            else
            {
                this.updateImage();
            }
        });
    }

    /**
     * 加载
     */
    async load()
    {
        if (this.isLoaded)
        {
            return;
        }

        if (this.isLoading)
        {
            await new Promise((resolve) =>
            {
                this.on('loaded', resolve);
            });

            return;
        }

        this.isLoading = true;

        await editorRS.readAsset(this.asset.assetId);
        this.isLoading = false;
        this.isLoaded = true;

        this.emit('loaded', this);
    }

    /**
     * 更新预览图
     *
     * 迁移要点：
     * - 旧的 `asset.data.on(...)` / `data.onLoadCompleted(cb)` **实例事件已从主仓移除**
     *   （资源加载状态改由 `ComponentLogic` / `MaterialLogic` / `Object3DLogic` 的
     *   `isLoaded` getter 暴露）。此处统一改为 `effect()` 读 `getLogic(data).isLoaded`
     *   建立响应式依赖，在「未就绪 → 就绪」跃迁时重绘预览。
     * - `Feng3dScreenShot.drawMaterial/drawGeometry/drawObject3D` 的返回值已从
     *   「`Feng3dScreenShot` 实例」改为 **PNG DataURL 字符串**（异步），故去掉尾部的 `.toDataURL()`
     *   （旧写法的 `.toDataURL()` 是链式调用截图器的画布导出）。
     * - 上述绘制方法走「离屏 View 提交 → GPU 取像素」通路，因此返回 Promise；
     *   此处 try/catch 兜底：预览图生成失败只保留原图标，不产生未处理的 Promise 拒绝。
     */
    async updateImage()
    {
        if (this.asset instanceof TextureAsset)
        {
            // 贴图预览优先用资源系统附加的 `_pixels`（主仓 `Texture2D.activePixels` 已移除），
            // 无像素且为 `{ __type__: 'Texture', url }` 声明式引用时回退到 GPU 通路。
            this.#updatePreview(() => Feng3dScreenShot.feng3dScreenShot.drawTexture(this.asset.data));
        }
        else if (this.asset instanceof TextureCubeAsset)
        {
            // TODO(P1 API 迁移)：`TextureCube` 已从主仓移除，纹理统一为
            // `{ __type__: 'Texture', url }` 声明式引用，六面像素不再以 `_pixels` 暴露。
            // 原 `textureCube.on('loadCompleted', ...)` + `drawTextureCube(textureCube)` 无数据来源，
            // 且实例事件已废除——本分支暂不生成预览，保留资源默认图标，待立方体贴图预览迁移后恢复。
        }
        else if (this.asset instanceof MaterialAsset)
        {
            const materialAsset = this.asset;
            this.#whenLoaded(getLogic(materialAsset.data), () =>
                Feng3dScreenShot.feng3dScreenShot.drawMaterial(materialAsset.data));
        }
        else if (this.asset instanceof GeometryAsset)
        {
            this.#updatePreview(() => Feng3dScreenShot.feng3dScreenShot.drawGeometry(this.asset.data));
        }
        else if (this.asset instanceof Object3DAsset)
        {
            const object3D = this.asset.data;
            this.#whenLoaded(getLogic(object3D), () =>
                Feng3dScreenShot.feng3dScreenShot.drawObject3D(object3D));
        }
    }

    /**
     * 加载完成后产出预览图并写回资源。
     *
     * @param drawPreview 产出 PNG DataURL 的绘制回调（离屏渲染取像素是异步的，返回 Promise）
     */
    async #updatePreview(drawPreview: () => string | Promise<string>)
    {
        let image: string;
        try
        {
            image = await drawPreview();
        }
        catch (error)
        {
            // 预览生成失败（无 WebGPU 设备、纹理无像素来源等）只保留原图标，不打断资源树加载
            console.warn('[AssetNode] 预览图生成失败，保留默认图标', error);

            return;
        }
        this.image = image;

        const img = await dataTransform.dataURLToImage(this.image);
        await this.asset.writePreview(img);
    }

    /**
     * 等待资源的 logic 报告加载完成（`isLoaded` 变 true）后产出预览图。
     *
     * 替代旧的 `data.onLoadCompleted(cb)` 实例事件：主仓已废除实例事件，异步资源就绪状态
     * 经 `isLoaded` getter 暴露，用 `effect()` 建立响应式依赖即可。语义与原回调一致——
     * 每次「未就绪 → 就绪」跃迁各触发一次（资源重载后会再次刷新预览）。
     *
     * @param resourceLogic 资源的 logic（未注册类型时 `logic()` 返回 null，跳过预览）
     * @param drawPreview 加载完成后产出 PNG DataURL 的回调
     */
    #whenLoaded(resourceLogic: { readonly isLoaded?: boolean } | null, drawPreview: () => string | Promise<string>)
    {
        if (!resourceLogic || typeof resourceLogic.isLoaded !== 'boolean')
        {
            // TODO(P1 API 迁移)：该资源类型未注册 Logic（无法查询加载状态），暂不生成预览
            return;
        }

        let wasLoaded = false;
        effect(() =>
        {
            const isLoaded = resourceLogic.isLoaded; // 经 getter 建立响应式依赖
            const justLoaded = isLoaded && !wasLoaded;
            wasLoaded = isLoaded;
            if (!justLoaded) return;

            // 预览绘制与写回是异步副作用，不放在 effect 同步体内执行
            queueMicrotask(() => { void this.#updatePreview(drawPreview); });
        });
    }

    /**
     * 删除
     */
    delete()
    {
        this.children.forEach((element) =>
        {
            element.delete();
        });
        this.remove();

        editorAsset.deleteAsset(this);
    }

    /**
     * 获取文件夹列表
     *
     * @param includeClose 是否包含关闭的文件夹
     */
    getFolderList(includeClose = false)
    {
        let folders: AssetNode[] = [];
        if (this.isDirectory)
        {
            folders.push(this);
        }
        if (this.isOpen || includeClose)
        {
            this.children.forEach((v) =>
            {
                const cfolders = v.getFolderList();
                folders = folders.concat(cfolders);
            });
        }

        return folders;
    }

    /**
     * 获取文件列表
     */
    getFileList()
    {
        let files: AssetNode[] = [];
        files.push(this);
        this.children.forEach((v) =>
        {
            const cfiles = v.getFileList();
            files = files.concat(cfiles);
        });

        return files;
    }

    /**
     * 提供拖拽数据
     *
     * @param dragsource
     */
    setdargSource(dragsource: DragData)
    {
        const extension = this.asset.assetType;
        switch (extension)
        {
            case AssetType.object3D:
                dragsource.addDragData('file_object3D', this.asset as any);
                break;
            case AssetType.script:
                dragsource.addDragData('file_script', this.asset as any);
                break;
            case AssetType.anim:
                dragsource.addDragData('animationclip', this.asset.data as any);
                break;
            case AssetType.material:
                dragsource.addDragData('material', this.asset.data as any);
                break;
            case AssetType.texturecube:
                // TODO(P1 API 迁移)：拖拽数据类型 `texturecube` 随 `TextureCube` 从主仓移除而暂缺
                // （见 ui/drag/Drag.ts 的 DragDataMap），待纹理拖拽迁移后恢复。
                // dragsource.addDragData('texturecube', this.asset.data as any);
                break;
            case AssetType.geometry:
                dragsource.addDragData('geometry', this.asset.data as any);
                break;
            case AssetType.texture:
                // TODO(P1 API 迁移)：拖拽数据类型 `texture2d` 随 `Texture2D` 从主仓移除而暂缺
                // （见 ui/drag/Drag.ts 的 DragDataMap），待纹理拖拽迁移后恢复。
                // dragsource.addDragData('texture2d', this.asset.data as any);
                break;
            case AssetType.audio:
                dragsource.addDragData('audio', this.asset.data);
                break;
        }
        dragsource.addDragData('assetNodes', this);
    }

    /**
     * 接受拖拽数据
     *
     * @param dragdata
     */
    acceptDragDrop(dragdata: DragData)
    {
        if (!(this.asset instanceof FolderAsset)) return;
        const folder = this.asset;

        dragdata.getDragData('assetNodes').forEach(async (v) =>
        {
            // 确保资源的 meta 对象存在，避免在 write 时出错
            if (!v.asset.meta) {
                // 如果 meta 不存在，尝试读取资源以初始化 meta
                try {
                    await editorRS.readAsset(v.asset.assetId);
                } catch (error) {
                    console.error('AssetNode: 读取资源失败', error);
                    // 如果读取失败，初始化一个基本的 meta 对象
                    if (!v.asset.meta) {
                        v.asset.meta = {
                            guid: v.asset.assetId,
                            mtimeMs: Date.now(),
                            birthtimeMs: Date.now(),
                            assetType: v.asset.assetType
                        } as any;
                    }
                }
            }
            
            await editorRS.moveAsset(v.asset, folder);
            this.addChild(v);
        });
    }

    /**
     * 导出
     */
    async export()
    {
        const zip = new JSZip();

        const filename = this.label;
        const path = this.asset.assetPath;
        let filepaths: string[] = [path];
        if (this.isDirectory)
        {
            filepaths = await editorRS.fs.getAllPathsInFolder(path);
        }

        await Promise.all(filepaths.map(async (filepath) =>
        {
            const data = await editorRS.fs.readArrayBuffer(filepath);
            data && zip.file(filepath, data);
        }));

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${filename}.zip`);
    }
}
