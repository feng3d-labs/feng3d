import { GameObject, AnimationClip, Material, Geometry, GameObjectAsset, ScriptAsset, AudioAsset, Texture2D, TextureCube, windowEventProxy, shortcut } from 'feng3d';
import { hierarchy } from '../../feng3d/hierarchy/Hierarchy';
import { shortCutStates } from '../../polyfill/feng3d/ShortCut';
import { AssetNode } from '../assets/AssetNode';

declare global
{
	interface MixinsDragDataMap { }
}

export class Drag
{
	register(displayObject: any, setdargSource: (dragSource: DragData) => void, accepttypes: (keyof DragDataMap)[], onDragDrop?: (dragSource: DragData) => void)
	{
		this.unregister(displayObject);
		registers.push({ displayObject, setdargSource, accepttypes, onDragDrop });

		if (setdargSource)
		{
			displayObject.addEventListener('mousedown', onItemMouseDown, null, false, 1000);
		}
	}
	unregister(displayObject: any)
	{
		for (let i = registers.length - 1; i >= 0; i--)
		{
			if (registers[i].displayObject === displayObject)
			{
				registers.splice(i, 1);
			}
		}
		displayObject.removeEventListener('mousedown', onItemMouseDown, null);
	}
	/** 当拖拽过程中拖拽数据发生变化时调用该方法刷新可接受对象列表 */
	refreshAcceptables()
	{
		// 获取可接受数据的对象列表
		acceptableitems = registers.reduce((value: DragItem[], item) =>
		{
			if (item !== dragitem && acceptData(item, dragSource))
			{
				value.push(item);
			}

			return value;
		}, []);
	}
}

export const drag = new Drag();

export interface DragDataItem<K extends keyof DragDataMap>
{
	datatype: K;
	value: DragDataMap[K];
}

export class DragData
{
	private datas: DragDataItem<any>[] = [];

	/**
	 * 添加拖拽数据
	 *
	 * @param datatype
	 * @param value
	 */
	addDragData<K extends keyof DragDataMap>(datatype: K, value: DragDataMap[K])
	{
		const item = { datatype, value };
		this.datas.push(item);
	}

	/**
	 * 获取拖拽数据列表
	 *
	 * @param datatype
	 */
	getDragData<K extends keyof DragDataMap>(datatype: K)
	{
		const data: DragDataMap[K][] = this.datas.filter((v) => v.datatype === datatype).map((v) => v.value);

		return data;
	}

	/**
	 * 是否拥有指定类型数据
	 *
	 * @param datatype
	 */
	hasDragData<K extends keyof DragDataMap>(datatype: K)
	{
		const data: DragDataMap[K][] = this.datas.filter((v) => v.datatype === datatype).map((v) => v.value);

		return data.length > 0;
	}
}

/**
 * 拖拽数据
 */
export interface DragDataMap extends MixinsDragDataMap
{
	gameobject: GameObject;
	animationclip: AnimationClip;
	material: Material;
	geometry: Geometry;
	//
	file_gameobject: GameObjectAsset;
	/**
	 * 脚本路径
	 */
	file_script: ScriptAsset;
	/**
	 * 文件
	 */
	assetNodes: AssetNode;
	/**
	 * 声音路径
	 */
	audio: AudioAsset;
	/**
	 * 纹理
	 */
	texture2d: Texture2D;
	/**
	 * 立方体纹理
	 */
	texturecube: TextureCube;
}

interface DragItem
{
	displayObject: any,
	setdargSource: (dragSource: DragData) => void,
	accepttypes: (keyof DragDataMap)[],
	onDragDrop?: (dragSource: DragData) => void
}

let stage: any;
const registers: DragItem[] = [];
/**
 * 对象与触发接受拖拽的对象列表
 */
let accepter: any;
let accepterAlpha: number;
/**
 * 被拖拽数据
 */
let dragSource: DragData;
/**
 * 被拖拽对象
 */
let dragitem: DragItem;
/**
 * 可接受拖拽数据对象列表
 */
let acceptableitems: DragItem[];

function getitem(displayObject: any)
{
	for (let i = 0; i < registers.length; i++)
	{
		if (registers[i].displayObject === displayObject)
		{ return registers[i]; }
	}

	return null;
}

/**
 * 判断是否接受数据
 * @param item
 * @param dragSource
 */
function acceptData(item: DragItem, dragSource: DragData)
{
	const hasdata = item.accepttypes.reduce((prevalue, accepttype) => prevalue || dragSource.hasDragData(accepttype), false);

	return hasdata;
}

/**
 * 是否处于拖拽中
 */
let draging = false;
// 鼠标按下时位置
let mouseDownPosX = 0;
let mouseDownPosY = 0;

function onItemMouseDown(event: any): void
{
	mouseDownPosX = windowEventProxy.clientX;
	mouseDownPosY = windowEventProxy.clientY;

	if (dragitem)
	{ return; }
	dragitem = getitem(event.currentTarget);

	if (!dragitem.setdargSource)
	{
		dragitem = null;

		return;
	}

	if (dragitem)
	{
		stage = dragitem.displayObject.stage;
		stage.addEventListener('mousemove', onMouseMove, null);
		stage.addEventListener('mouseup', onMouseUp, null);
		//
		shortcut.activityState(shortCutStates.draging);
	}
}

function onMouseUp(_event: any)
{
	stage.removeEventListener('mousemove', onMouseMove, null);
	stage.removeEventListener('mouseup', onMouseUp, null);

	acceptableitems = null;

	if (accepter)
	{
		const accepteritem = getitem(accepter);
		if (accepter !== dragitem.displayObject)
		{
			accepter.alpha = accepterAlpha;
			accepteritem.onDragDrop && accepteritem.onDragDrop(dragSource);
		}
	}
	accepter = null;
	dragitem = null;
	draging = false;
	//
	shortcut.deactivityState(shortCutStates.draging);
}

function onMouseMove(event: any)
{
	if (!dragitem) return;

	if (!draging)
	{
		if (Math.abs(mouseDownPosX - windowEventProxy.clientX)
			+ Math.abs(mouseDownPosY - windowEventProxy.clientY) > 5)
		{
			draging = true;
		}

		return;
	}
	if (!acceptableitems)
	{
		// 获取拖拽数据
		dragSource = new DragData();
		dragitem.setdargSource(dragSource);

		// 获取可接受数据的对象列表
		acceptableitems = registers.reduce((value: DragItem[], item) =>
		{
			if (acceptData(item, dragSource) && item.displayObject.stage)
			{
				item['hierarchyValue'] = getHierarchyValue(item.displayObject);
				value.push(item);
			}

			return value;
		}, []);

		// 根据层级排序
		acceptableitems.sort((a, b) =>
		{
			const ah: number[] = a['hierarchyValue'];
			const bh: number[] = b['hierarchyValue'];
			for (let i = 0, num = Math.min(ah.length, bh.length); i < num; i++)
			{
				if (ah[i] !== bh[i]) return ah[i] - bh[i];
			}

			return ah.length - bh.length;
		});
		acceptableitems.reverse();
	}

	if (accepter)
	{
		if (dragitem.displayObject !== accepter)
		{
			accepter.alpha = accepterAlpha;
		}

		accepter = null;
	}

	//
	for (let i = 0; i < acceptableitems.length; i++)
	{
		const element = acceptableitems[i];
		const rect = element.displayObject.getGlobalBounds();
		if (rect.contains(event.stageX, event.stageY))
		{
			accepter = element.displayObject;
			if (dragitem.displayObject !== accepter)
			{
				accepterAlpha = element.displayObject.alpha;
				element.displayObject.alpha = 0.5;
			}
			break;
		}
	}
}

/**
 * 获取显示对象的层级
 *
 * @param displayObject
 */
function getHierarchyValue(displayObject: any)
{
	const hierarchys = [];
	if (displayObject.parent)
	{
		hierarchys.unshift(displayObject.parent.getChildIndex(displayObject));
		displayObject = displayObject.parent;
	}

	return hierarchy;
}
