import { computed, reactive, watch } from 'vue';
// TODO(P1 API 迁移)：`Texture2D` 已从主仓移除（纹理统一为 `{ __type__: 'Texture', url }` 声明式引用），
// `ReadRS` 的 `getLoadedAssetDatasByType(type)` 需要构造函数，待「已加载纹理枚举」新 API 提供后恢复导入。
// import { Texture2D, ReadRS } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';
import { useEditorStore } from '../../stores/editorStore';
import { MenuAdapter } from '../../components/MenuAdapter';

/**
 * OAVTexture2D 组件的 Props 类型
 */
export interface OAVTexture2DProps
{
    /** 属性名称 */
    name: string;
    /** 属性所有者对象 */
    owner: Record<string, unknown>;
    /** 是否可编辑 */
    editable: boolean;
    /** 属性视图信息 */
    attributeViewInfo?: any;
}

/**
 * OAVTexture2D 组合式函数
 */
export function useOAVTexture2D(props: OAVTexture2DProps)
{
    const editorStore = useEditorStore();
    
    // 在组件内部创建响应式对象，仅用于监听和修改
    const r_owner = reactive(props.owner);

    // 格式化标签名
    const label = computed(() => {
        const name = props.attributeViewInfo?.label || props.name;
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    });

    // 获取纹理图片源
    const imageSrc = computed(() => {
        // TODO(P1 API 迁移)：`Texture2D` 类型已移除，这里按旧属性形状临时断言，
        // 待纹理属性视图迁移到新纯数据类型后替换为正式类型。
        const texture = r_owner[props.name] as { dataURL?: string } | undefined;
        return texture?.dataURL || '';
    });

    // 选择纹理
    function onPickClick()
    {
        const menus = [];
        // TODO(P1 API 迁移)：`Texture2D` 已移除，`ReadRS.rs.getLoadedAssetDatasByType(Texture2D)` 无构造器可传，
        // 待「已加载纹理枚举」新 API 提供后恢复候选纹理列表。
        /*
        const texture2ds = ReadRS.rs.getLoadedAssetDatasByType(Texture2D);

        texture2ds.forEach((texture2d) => {
            menus.push({
                label: texture2d.name,
                click: () => {
                    r_owner[props.name] = texture2d;

                    // 触发值变化事件
                    if (props.attributeViewInfo) {
                        const event = new ObjectViewEvent();
                        event.type = ObjectViewEvent.VALUE_CHANGE;
                        (event as any).space = r_owner;
                        (event as any).attributeName = props.name;
                        (event as any).attributeValue = texture2d;
                    }
                },
            });
        });
        */

        // 使用 MenuAdapter 显示菜单
        const menuAdapter = new MenuAdapter();
        menuAdapter.popup(menus);
    }

    // 双击选择对象
    function onDoubleClick()
    {
        const texture = r_owner[props.name];
        if (texture && typeof texture === 'object') {
            editorStore.selectObject(texture as any);
        }
    }

    // 监听属性变化
    watch(() => r_owner[props.name], () => {
        // 值变化时自动更新显示
    });

    return {
        label,
        imageSrc,
        onPickClick,
        onDoubleClick,
    };
}
