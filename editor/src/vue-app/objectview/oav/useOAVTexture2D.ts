import { computed, reactive, watch } from 'vue';
import { Texture2D, ReadRS } from 'feng3d';
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
        const texture: Texture2D = r_owner[props.name] as any;
        return texture?.dataURL || '';
    });

    // 选择纹理
    function onPickClick()
    {
        const menus = [];
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
