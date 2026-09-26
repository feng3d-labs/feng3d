import { computed } from 'vue';

/**
 * OBVInline 组件的 Props 类型
 */
export interface OBVInlineProps
{
    /** 块名称 */
    name: string;
    /** 属性列表 */
    itemList: any[];
    /** 所有者对象 */
    owner?: any;
    /** 块视图信息 */
    blockViewInfo?: any;
}

/**
 * OBVInline 组合式函数：把一组字段**挤在同一行**的块视图。
 *
 * 与 {@link useOBVDefault}（默认块视图）的区别只在排布：
 *
 * - `OBVDefault` 每个字段占一整行，块标题单独占一行，可折叠——适合"一屏看不完"的参数组；
 * - `OBVInline` **不折叠、标题只占行首很窄的一列**，字段等宽平分剩余宽度并强制不换行
 *   （`nowrap`）——适合"名称 / 标签 / 开关"这类看了就想一眼扫过、不需要展开的短字段。
 *
 * 用哪个由**配置**决定（`ObjectViewTypeConfig.blocks[].component`），
 * 见 `src/configs/objectViewSchema.ts`。
 */
export function useOBVInline(props: OBVInlineProps)
{
    /** 行首标题（空名字就不占那一列） */
    const title = computed(() => props.name ?? '');

    /** 是否显示行首标题 */
    const showTitle = computed(() => title.value.length > 0);

    return {
        title,
        showTitle,
    };
}
