import { saveAs } from '@feng3d/filesaver';
import { AssetType, dataTransform, FileAsset, FolderAsset, GameObjectAsset, GeometryAsset, MaterialAsset, serialize, TextureAsset, TextureCubeAsset } from 'feng3d';
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
     */
    async updateImage()
    {
        if (this.asset instanceof TextureAsset)
        {
            const texture = this.asset.data;

            this.image = Feng3dScreenShot.feng3dScreenShot.drawTexture(texture);

            const img = await dataTransform.dataURLToImage(this.image);
            this.asset.writePreview(img);
        }
        else if (this.asset instanceof TextureCubeAsset)
        {
            const textureCube = this.asset.data;
            textureCube.onLoadCompleted(async () =>
            {
                this.image = Feng3dScreenShot.feng3dScreenShot.drawTextureCube(textureCube);

                const img = await dataTransform.dataURLToImage(this.image);
                this.asset.writePreview(img);
            });
        }
        else if (this.asset instanceof MaterialAsset)
        {
            const mat = this.asset;
            mat.data.onLoadCompleted(async () =>
            {
                this.image = Feng3dScreenShot.feng3dScreenShot.drawMaterial(mat.data).toDataURL();
                const img = await dataTransform.dataURLToImage(this.image);
                this.asset.writePreview(img);
            });
        }
        else if (this.asset instanceof GeometryAsset)
        {
            this.image = Feng3dScreenShot.feng3dScreenShot.drawGeometry(this.asset.data as any).toDataURL();
            const img = await dataTransform.dataURLToImage(this.image);
            this.asset.writePreview(img);
        }
        else if (this.asset instanceof GameObjectAsset)
        {
            const gameObject = this.asset.data;
            gameObject.onLoadCompleted(async () =>
            {
                this.image = Feng3dScreenShot.feng3dScreenShot.drawGameObject(gameObject).toDataURL();
                const img = await dataTransform.dataURLToImage(this.image);
                this.asset.writePreview(img);
            });
        }
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
            case AssetType.gameobject:
                dragsource.addDragData('file_gameobject', this.asset as any);
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
                dragsource.addDragData('texturecube', this.asset.data as any);
                break;
            case AssetType.geometry:
                dragsource.addDragData('geometry', this.asset.data as any);
                break;
            case AssetType.texture:
                dragsource.addDragData('texture2d', this.asset.data as any);
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
