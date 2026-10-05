import * as feng3d from 'feng3d';
import { globalEmitter, loader } from 'feng3d';
import type { Object3D } from 'feng3d';
// `EditorRS` 类型用于**构造注入**；`editorRS` 那个单例仍被文件末尾的 `downloadProject` 用着
//（它属"环内"，与 `editorAsset` 一起留到下一批），所以这里暂时两者都引
import { editorRS, type EditorRS } from '../assets/EditorRS';
import { getEditorCache } from '../caches/Editorcache';
import { hierarchy } from '../feng3d/hierarchy/Hierarchy';
import { useEditorStore } from '../vue-app/stores/editorStore';
// `EditorAsset` 类型用于**构造注入**；`editorAsset` 那个单例仍被文件末尾两个模块级函数用着
//（它们与 `editorRS` 的迁移绑在一起，属下一批），所以这里暂时两者都引
import { editorAsset, type EditorAsset } from '../ui/assets/EditorAsset';
import { createDefaultSceneComponent } from '../utils/createDefaultScene';
import { MenuItem } from '../vue-app/components/MenuAdapter';
import { popupView } from '../vue-app/components/PopupView';
import { invalidateAssettree } from '../vue-app/views/ProjectViewAdapter';
import { viewLayoutConfig } from './ViewLayoutConfig';

/**
 * 创建对象菜单
 */
export const createObjectMenu: MenuItem[] = [];

/**
 * 菜单配置
 */
export class MenuConfig
{
    /**
     * 资源管理器（**构造注入**，#278 路线 B 第四批）。
     *
     * `MenuConfig` 原来直接 import 模块级单例；它的**创建**已经挪到入口
     *（`vue-app/main.ts` 的 `new MenuConfig(editorAsset)`），所以类里只认这个字段。
     * 注意 `EditorAsset` 是**有状态单例**，入口传的必须是同一个实例。
     */
    private assetManager: EditorAsset;

    /**
     * 资源系统（**构造注入**，#278 路线 B / `editorRS` 第一批）。
     *
     * 与 `assetManager` 同一套：创建点已经在入口（`vue-app/main.ts` 的
     * `new MenuConfig(editorAsset, resourceSystem)`），所以类里只认字段。
     * `resourceSystem` 就是 `installEditorResourceSystem()` 的返回值，零新增引用。
     */
    private rs: EditorRS;

    constructor(assetManager: EditorAsset, rs: EditorRS)
    {
        this.assetManager = assetManager;
        this.rs = rs;
    }

    /**
     * 主菜单
     */
    getMainMenu()
    {
        const mainMenu: MenuItem[] = [
            {
                label: '文件',
                submenu: [
                    {
                        label: '新建场景',
                        click: () =>
                        {
                            // TODO(P1 API 迁移)：`View` 现为纯 interface（无 `createNewScene()` 静态方法），
                            // 新范式用纯数据字面量声明场景，待场景创建 API 重建后恢复。
                            // useEditorStore().gameScene = View.createNewScene();
                        },
                    },
                    {
                        label: '打开场景',
                        click: () =>
                        {
                            console.warn('未实现！');
                            //
                            // useEditorStore().gameScene = View.createNewScene();
                        },
                    },
                    {
                        label: '新建项目', click: () =>
                        {
                            popupView.popupObject({ newprojectname: 'newproject' }, {
                                closecallback: (data) =>
                                {
                                    if (data.newprojectname && data.newprojectname.length > 0)
                                    {
                                        getEditorCache().projectname = data.newprojectname;
                                        window.location.reload();
                                    }
                                }
                            });
                        },
                    },
                    {
                        label: '打开最近的项目',
                        submenu: getEditorCache().lastProjects.map((element) =>
                        {
                            const menuItem: MenuItem
                                = {
                                label: element, click: () =>
                                {
                                    const cache = getEditorCache();

                                    if (cache.projectname !== element)
                                    {
                                        cache.projectname = element;
                                        window.location.reload();
                                    }
                                }
                            };

                            return menuItem;
                        }),
                        click: () =>
                        {
                            popupView.popupObject({ newprojectname: 'newproject' }, {
                                closecallback: (data) =>
                                {
                                    if (data.newprojectname && data.newprojectname.length > 0)
                                    {
                                        getEditorCache().projectname = data.newprojectname;
                                        window.location.reload();
                                    }
                                }
                            });
                        }
                    },
                    {
                        // 这里写出的是**对象资源**（`.gameobject.json`），不是场景文件——原文案「保存场景」
                        // 与行为不符（issue #113 缺口 4）。真场景序列化（写 `default.scene.json`）在
                        // `vue-app/components/TopToolBar.vue` 的播放流程里。
                        label: '对象存为资源', click: () =>
                        {
                            // rootnode 在编辑器里必然已初始化；未初始化时读它会与原来一样崩
                            const object3D = hierarchy.rootnode!.object3D;
                            this.assetManager.saveObject(object3D);
                        }
                    },
                    {
                        label: '打开项目', click: async () =>
                        {
                            await this.rs.clearProject();
                            const filelist: FileList = await new Promise((resolve) =>
                            {
                                this.rs.selectFile(resolve);
                            });
                            // 用户取消选择时 item(0) 为 null；原实现同样会把它传下去（崩在内部），断言保持原行为
                            await this.rs.importProject(filelist.item(0)!);
                            await this.assetManager.initproject();
                            await this.assetManager.runProjectScript();
                            const scene = await this.assetManager.readScene('default.scene.json');
                            // 读取失败（旧格式资源 + 旧序列化链路）时回退纯数据默认场景，
                            // 避免打开项目后层级面板显示 `No Data`（详见 utils/createDefaultScene.ts）
                            useEditorStore().gameScene = scene ?? createDefaultSceneComponent();
                            invalidateAssettree();
                            console.log('打开项目完成!');
                        }
                    },
                    {
                        label: '导出项目', click: () =>
                        {
                            this.rs.exportProjectToJSZip(`${getEditorCache().projectname}.zip`);
                        }
                    },
                    {
                        label: '打开网络项目',
                        submenu: [
                            {
                                label: '地形', click: () =>
                                {
                                    openDownloadProject('terrain.zip');
                                },
                            },
                            {
                                label: '自定义材质', click: () =>
                                {
                                    openDownloadProject('customshader.zip');
                                },
                            },
                            {
                                label: '水', click: () =>
                                {
                                    openDownloadProject('water.zip');
                                },
                            },
                            {
                                label: '灯光', click: () =>
                                {
                                    openDownloadProject('light.zip');
                                },
                            },
                            {
                                label: '声音', click: () =>
                                {
                                    openDownloadProject('audio.zip');
                                },
                            },
                        ],
                    },
                    {
                        label: '下载网络项目',
                        submenu: [
                            {
                                label: '地形', click: () =>
                                {
                                    downloadProject('terrain.zip');
                                },
                            },
                            {
                                label: '自定义材质', click: () =>
                                {
                                    downloadProject('customshader.zip');
                                },
                            },
                            {
                                label: '水', click: () =>
                                {
                                    downloadProject('water.zip');
                                },
                            },
                            {
                                label: '灯光', click: () =>
                                {
                                    downloadProject('light.zip');
                                },
                            },
                        ],
                    },
                    {
                        label: '升级项目',
                        click: async () =>
                        {
                            await this.rs.upgradeProject();
                            console.warn('升级完成！');
                        },
                    },
                    {
                        label: '清空项目',
                        click: async () =>
                        {
                            this.assetManager.rootFile.remove();
                            await this.assetManager.initproject();
                            await this.assetManager.runProjectScript();
                            // TODO(P1 API 迁移)：`View` 现为纯 interface（无 `createNewScene()` 静态方法），
                            // 新范式用纯数据字面量声明场景，待场景创建 API 重建后恢复。
                            // useEditorStore().gameScene = View.createNewScene();
                            invalidateAssettree();
                            console.log('清空项目完成!');
                        },
                    },
                ],
            },
            { type: 'separator' },
            {
                label: '窗口',
                submenu: this.getWindowSubMenus(),
            },
            {
                label: '帮助',
                submenu: [
                    {
                        label: '问题',
                        click: () =>
                        {
                            window.open('https://github.com/feng3d-labs/editor/issues');
                        },
                    },
                    {
                        label: '文档',
                        click: () =>
                        {
                            window.open('http://com');
                        },
                    },
                ],
            },
        ];

        return mainMenu;
    }

    /**
     * 获取窗口子菜单
     */
    private getWindowSubMenus()
    {
        const menus: MenuItem[] = [
            {
                label: 'Layouts',
                submenu: Object.keys(viewLayoutConfig).map((v) =>
                ({
                    label: v,
                    click: () =>
                    {
                        globalEmitter.emit('viewLayout.reset', viewLayoutConfig[v]);
                    },
                })),
            },
        ];

        // 窗口菜单项已迁移到 Vue，暂时注释掉
        // TODO: 实现 Vue 版本的窗口弹出功能
        // [SceneView.moduleName,
        // InspectorView.moduleName,
        // HierarchyView.moduleName,
        // ProjectView.moduleName,
        // AnimationView.moduleName,
        // ShortCutSetting.moduleName,
        // ].forEach((v) =>
        // {
        //     menus.push({
        //         label: v,
        //         click: () =>
        //         {
        //             // TODO: 使用 Vue 版本的窗口弹出功能
        //         },
        //     });
        // });

        return menus;
    }

    /**
     * 层级界面创建3D对象列表数据
     */
    getCreateObjectMenu()
    {
        const createObjectMenu: MenuItem[] = [];
        //
        // TODO(P1 API 迁移)：`createNodeMenu`（3D 对象创建菜单注册表）已从主仓移除。
        // 新范式中可创建对象由纯数据类型 + `ComponentMap` 推导，待「对象创建菜单发现机制」重建后恢复。
        /*
        createNodeMenu.forEach((item) =>
        {
            let submenu = createObjectMenu;
            const paths = item.path.split('/');
            let targetItem: MenuItem;
            for (let i = 0; i < paths.length; i++)
            {
                targetItem = submenu.filter((item0) =>
                    item0.label === paths[i])[0];
                if (!targetItem)
                {
                    targetItem = { label: paths[i] };
                    submenu.push(targetItem);
                }
                if (!targetItem.submenu)
                {
                    targetItem.submenu = [];
                }
                submenu = targetItem.submenu;
            }
            if (item.priority !== undefined)
            {
                targetItem.priority = item.priority;
            }
            if (item.click !== undefined)
            {
                targetItem.click = () =>
                {
                    const object3D = item.click();
                    hierarchy.addObject3D(object3D);
                };
            }
        });
        */

        // 排序
        // 实参可能缺省（函数体内本来就有 `if (!submenu) return;`），如实放宽
        const sortSubMenu = (submenu: MenuItem[] | undefined) =>
        {
            if (!submenu)
            {
                return;
            }
            submenu.sort((a, b) =>
            {
                if (a.priority === undefined) a.priority = 0;
                if (b.priority === undefined) b.priority = 0;

                return b.priority - a.priority;
            });
            for (let i = 0; i < submenu.length; i++)
            {
                sortSubMenu(submenu[i].submenu);
            }
            for (let i = submenu.length - 2; i >= 0; i--)
            {
                // 优先级跨度 10000 时，中间增加 横格线。
                // 下标访问的类型含 undefined；i 从 length-2 递减，两个下标都必然在范围内。
                // priority 可选，缺省时原式算出 ~~(NaN) 也就是 0，与 `?? 0` 等价
                if (~~((submenu[i]!.priority ?? 0) / 10000) > ~~((submenu[i + 1]!.priority ?? 0) / 10000))
                {
                    submenu.splice(i + 1, 0, { type: 'separator' });
                }
            }
        };

        sortSubMenu(createObjectMenu);

        return createObjectMenu;
    }

    /**
     * 获取创建游戏对象组件菜单
     * @param object3D 游戏对象
     */
    getCreateComponentMenu(object3D: Object3D)
    {
        const menu: MenuItem[] = [];

        // 处理 由 AddComponentMenu 添加的菜单（component 是注册表，运行时必然已建；缺省时读它会与原来一样崩）
        feng3d.menuConfig.component!.forEach((item) =>
        {
            const paths = item.path.split('/');
            let currentmenu = menu;
            // 占位哨兵：下面每轮先消费上一轮留下的 currentMenuItem（null 表示"这一轮不消费"），故它允许为 null
            let currentMenuItem: MenuItem | null = null;
            paths.forEach((p) =>
            {
                if (currentMenuItem)
                {
                    if (!currentMenuItem.submenu) currentMenuItem.submenu = [];
                    currentmenu = currentMenuItem.submenu;
                    currentMenuItem = null;
                }
                currentMenuItem = currentmenu.filter((m) => m.label === p)[0];
                if (!currentMenuItem)
                {
                    currentMenuItem = { label: p };
                    currentmenu.push(currentMenuItem);
                }
            });
            // 上面几行已保证它非空（空则就地新建并 push），故此处断言
            currentMenuItem!.click = () =>
            {
                // TODO(P1 API 迁移)：`getComponentType()` 与 `object3D.addComponent()` 均已从主仓移除。
                // 新范式组件为纯数据字面量：`reactive(object3D).components.push({ __type__: ... })`，待迁移后恢复。
                // const componentClass = getComponentType(item.type);
                // object3D.addComponent(componentClass);
                void object3D;
            };
        });

        return menu;
    }
}

/**
 * 菜单配置
 */
// **不在模块顶层创建**了（#278 路线 B 第一批）：创建挪到入口 `vue-app/main.ts`，
// 组件通过 `useMenus()` 注入取用。原因见 `vue-app/composables/useMenus.ts` 的文件头——
// `MenuConfig` 是三个单例依赖环的"外沿"，先拆它最稳。

/**
 * 下载项目
 * @param projectname
 */
function openDownloadProject(projectname: string, callback?: () => void)
{
    editorAsset.rootFile.delete();
    downloadProject(projectname, callback);
}

/**
 * 下载项目
 * @param projectname
 */
async function downloadProject(projectname: string, callback?: () => void)
{
    const path = `projects/${projectname}`;
    const content = await loader.loadBinary(path);
    await editorRS.importProject(<any>content);
    await editorAsset.initproject();
    await editorAsset.runProjectScript();
    const scene = await editorAsset.readScene('default.scene.json');
    // 同上：读取失败回退纯数据默认场景
    useEditorStore().gameScene = scene ?? createDefaultSceneComponent();
    invalidateAssettree();
    console.log(`${projectname} 项目下载完成!`);
    callback && callback();
}
