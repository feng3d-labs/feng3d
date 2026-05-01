/**
 * 对象视图事件
 */
export class ObjectViewEvent
{
	static VALUE_CHANGE = 'valuechange';
	type: string = '';
	space: any;
	attributeName: string;
	attributeValue: string;
}
