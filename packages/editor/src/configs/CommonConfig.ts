import * as feng3d from 'feng3d';
import { createNodeMenu, GameObject, getComponentType, globalEmitter, loader, View } from 'feng3d';
import { editorRS } from '../assets/EditorRS';
import { nativeAPI } from '../assets/NativeRequire';
import { editorcache } from '../caches/Editorcache';
import { hierarchy } from '../feng3d/hierarchy/Hierarchy';
import { EditorData } from '../global/EditorData';
import { editorui } from '../global/editorui';
import { editorAsset } from '../ui/assets/EditorAsset';
import { MenuItem } from '../vue-app/components/MenuAdapter';
import { popupView } from '../vue-app/components/PopupView';
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
                            EditorData.editorData.gameScene = View.createNewScene();
                        },
                    },
                    {
                        label: '打开场景',
                        click: () =>
                        {
                            console.warn('未实现！');
                            //
                            // EditorData.editorData.gameScene = View.createNewScene();
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
                                        editorcache.projectname = data.newprojectname;
                                        window.location.reload();
                                    }
                                }
                            });
                        },
                    },
                    {
                        label: '打开最近的项目',
                        submenu: editorcache.lastProjects.map((element) =>
                        {
                            const menuItem: MenuItem
                                = {
                                label: element, click: () =>
                                {
                                    if (editorcache.projectname !== element)
                                    {
                                        editorcache.projectname = element;
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
                                        editorcache.projectname = data.newprojectname;
                                        window.location.reload();
                                    }
                                }
                            });
                        }
                    },
                    {
                        label: '保存场景', click: () =>
                        {
                            const gameobject = hierarchy.rootnode.gameobject;
                            editorAsset.saveObject(gameobject);
                        }
                    },
                    {
                        label: '打开项目', click: async () =>
                        {
                            await editorRS.clearProject();
                            const filelist: FileList = await new Promise((resolve) =>
                            {
                                editorRS.selectFile(resolve);
                            });
                            await editorRS.importProject(filelist.item(0));
                            await editorAsset.initproject();
                            await editorAsset.runProjectScript();
                            const scene = await editorAsset.readScene('default.scene.json');
                            EditorData.editorData.gameScene = scene;
                            editorui.assetview.invalidateAssettree();
                            console.log('打开项目完成!');
                        }
                    },
                    {
                        label: '导出项目', click: () =>
                        {
                            editorRS.exportProjectToJSZip(`${editorcache.projectname}.zip`);
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
                            await editorRS.upgradeProject();
                            console.warn('升级完成！');
                        },
                    },
                    {
                        label: '清空项目',
                        click: async () =>
                        {
                            editorAsset.rootFile.remove();
                            await editorAsset.initproject();
                            await editorAsset.runProjectScript();
                            EditorData.editorData.gameScene = View.createNewScene();
                            editorui.assetview.invalidateAssettree();
                            console.log('清空项目完成!');
                        },
                    },
                ],
            },
            { type: 'separator' },
            {
                label: '调试',
                submenu: [{
                    label: '打开开发者工具',
                    click: () =>
                    {
                        nativeAPI.openDevTools();
                    }, show: !!nativeAPI,
                },
                {
                    label: '编译脚本',
                    click: () =>
                    {
                        globalEmitter.emit('script.compile');
                    },
                }],
            },
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
                    const gameObject = item.click();
                    hierarchy.addGameObject(gameObject);
                };
            }
        });

        // 排序
        const sortSubMenu = (submenu: MenuItem[]) =>
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
                if (~~(submenu[i].priority / 10000) > ~~(submenu[i + 1].priority / 10000))
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
     * @param gameobject 游戏对象
     */
    getCreateComponentMenu(gameobject: GameObject)
    {
        const menu: MenuItem[] = [];

        // 处理 由 AddComponentMenu 添加的菜单
        feng3d.menuConfig.component.forEach((item) =>
        {
            const paths = item.path.split('/');
            let currentmenu = menu;
            let currentMenuItem: MenuItem = null;
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
            currentMenuItem.click = () =>
            {
                const componentClass = getComponentType(item.type);
                gameobject.addComponent(componentClass);
            };
        });

        return menu;
    }
}

/**
 * 菜单配置
 */
export const menuConfig = new MenuConfig();

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
    EditorData.editorData.gameScene = scene;
    editorui.assetview.invalidateAssettree();
    console.log(`${projectname} 项目下载完成!`);
    callback && callback();
}
