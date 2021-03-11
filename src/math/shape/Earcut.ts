/**
 * Port from https://github.com/mapbox/earcut (v2.2.2)
 */
namespace feng3d
{
	export class Earcut
	{
		/**
		 * 三角化形状
		 * 
		 * @param data 形状顶点数据
		 * @param holeIndices 空洞的起始顶点索引列表
		 * @param dim 相邻顶点数据之间的步长
		 */
		static triangulate(data: number[], holeIndices: number[], dim = 2)
		{
			// 判断是否有孔洞
			const hasHoles = holeIndices && holeIndices.length;
			// 获取形状轮廓顶点数量
			const outerLen = hasHoles ? holeIndices[0] * dim : data.length;
			// 初始化形状轮廓顶点链表
			let outerNode = linkedList(data, 0, outerLen, dim, true);
			// 三角索引
			const triangles: number[] = [];

			// 没有节点、只有一个或者两个节点不构成三角形时直接返回
			if (!outerNode || outerNode.next === outerNode.prev) return triangles;

			let minX: number, minY: number, maxX: number, maxY: number, x: number, y: number, invSize: number;

			// 消除孔洞
			if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

			// if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
			// 如果形状比较复杂，将使用z顺序曲线哈希;计算多边形bbox
			if (data.length > 80 * dim)
			{
				minX = maxX = data[0];
				minY = maxY = data[1];

				// 统计最大最小X轴与Y轴坐标
				for (let i = dim; i < outerLen; i += dim)
				{
					x = data[i];
					y = data[i + 1];
					if (x < minX) minX = x;
					if (y < minY) minY = y;
					if (x > maxX) maxX = x;
					if (y > maxY) maxY = y;
				}

				// minX, minY and invSize are later used to node3d coords into integers for z-order calculation
				// 计算尺寸的倒数，用于后面运算
				invSize = Math.max(maxX - minX, maxY - minY);
				invSize = invSize !== 0 ? 1 / invSize : 0;
			}

			earcutLinked(outerNode, triangles, dim, minX, minY, invSize);

			return triangles;
		}
	}

	/**
	 * create a circular doubly linked list from polygon points in the specified winding order
	 * 
	 * 以指定的绕线顺序从多边形点创建一个循环的双重链表
	 * 
	 * @param data 多边形顶点数据
	 * @param start 起始顶点索引
	 * @param end 终止顶点索引
	 * @param dim 相邻顶点数据之间的步长
	 * @param clockwise 是否顺时针方向
	 */
	function linkedList(data: number[], start: number, end: number, dim: number, clockwise: boolean)
	{
		let i: number, last: Node;

		// 按照指定时钟方向建立链表
		if (clockwise === (signedArea(data, start, end, dim) > 0))
		{
			for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
		} else
		{
			for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
		}

		// 去除头尾相同节点
		if (last && equals(last, last.next))
		{
			removeNode(last);
			last = last.next;
		}

		return last;
	}

	/**
	 * 消除共线与重复节点
	 * 
	 * @param start 遍历检测起始节点
	 * @param end 遍历检测终止节点
	 */
	function filterPoints(start: Node, end?: Node)
	{
		if (!start) return start;
		if (!end) end = start;

		let p = start,
			again: boolean;
		do
		{
			again = false;

			// 判断重复节点与共线节点
			if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0))
			{
				removeNode(p);
				p = end = p.prev;
				if (p === p.next) break;
				again = true;
			} else
			{
				p = p.next;
			}
		} while (again || p !== end);

		return end;
	}

	/**
	 * main ear slicing loop which triangulates a polygon (given as a linked list)
	 * 
	 * 主耳切割循环三角化多边形（由链表表示）
	 * 
	 * @param ear 被三角化的多边形链表
	 * @param triangles 三角化后的顶点索引数组
	 * @param dim 相邻顶点数据之间的步长
	 * @param minX 包围盒X轴最小值
	 * @param minY 包围盒Y轴最小值
	 * @param invSize 包围盒尺寸倒数
	 * @param pass 
	 */
	function earcutLinked(ear: Node, triangles: number[], dim: number, minX: number, minY: number, invSize: number, pass?: number)
	{
		if (!ear) return;

		// interlink polygon nodes in z-order
		// 使用z-order连接多边形结点
		if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

		let stop = ear,
			prev: Node, next: Node;

		// iterate through ears, slicing them one by one
		while (ear.prev !== ear.next)
		{
			prev = ear.prev;
			next = ear.next;

			if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear))
			{
				// cut off the triangle
				triangles.push(prev.i / dim);
				triangles.push(ear.i / dim);
				triangles.push(next.i / dim);

				removeNode(ear);

				// skipping the next vertex leads to less sliver triangles
				ear = next.next;
				stop = next.next;

				continue;
			}

			ear = next;

			// if we looped through the whole remaining polygon and can't find any more ears
			if (ear === stop)
			{
				// try filtering points and slicing again
				if (!pass)
				{
					earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

					// if this didn't work, try curing all small self-intersections locally
				} else if (pass === 1)
				{
					ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
					earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

					// as a last resort, try splitting the remaining polygon into two
				} else if (pass === 2)
				{
					splitEarcut(ear, triangles, dim, minX, minY, invSize);
				}

				break;
			}
		}
	}

	// check whether a polygon node forms a valid ear with adjacent nodes
	function isEar(ear: Node)
	{
		const a = ear.prev,
			b = ear,
			c = ear.next;

		if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

		// now make sure we don't have other points inside the potential ear
		let p = ear.next.next;

		while (p !== ear.prev)
		{
			if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
				area(p.prev, p, p.next) >= 0) return false;
			p = p.next;
		}

		return true;
	}

	function isEarHashed(ear: Node, minX: number, minY: number, invSize: number)
	{
		const a = ear.prev,
			b = ear,
			c = ear.next;

		if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

		// triangle bbox; min & max are calculated like this for speed
		const minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
			minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
			maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
			maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

		// z-order range for the current triangle bbox;
		const minZ = zOrder(minTX, minTY, minX, minY, invSize),
			maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);

		let p = ear.prevZ,
			n = ear.nextZ;

		// look for points inside the triangle in both directions
		while (p && p.z >= minZ && n && n.z <= maxZ)
		{

			if (p !== ear.prev && p !== ear.next &&
				pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
				area(p.prev, p, p.next) >= 0) return false;
			p = p.prevZ;

			if (n !== ear.prev && n !== ear.next &&
				pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
				area(n.prev, n, n.next) >= 0) return false;
			n = n.nextZ;

		}

		// look for remaining points in decreasing z-order
		while (p && p.z >= minZ)
		{
			if (p !== ear.prev && p !== ear.next &&
				pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
				area(p.prev, p, p.next) >= 0) return false;
			p = p.prevZ;
		}

		// look for remaining points in increasing z-order
		while (n && n.z <= maxZ)
		{
			if (n !== ear.prev && n !== ear.next &&
				pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
				area(n.prev, n, n.next) >= 0) return false;
			n = n.nextZ;
		}

		return true;
	}

	// go through all polygon nodes and cure small local self-intersections
	function cureLocalIntersections(start: Node, triangles: number[], dim: number)
	{
		let p = start;
		do
		{
			const a = p.prev,
				b = p.next.next;

			if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a))
			{
				triangles.push(a.i / dim);
				triangles.push(p.i / dim);
				triangles.push(b.i / dim);

				// remove two nodes involved
				// 移除两个有问题的节点
				removeNode(p);
				removeNode(p.next);

				p = start = b;
			}
			p = p.next;
		} while (p !== start);

		return filterPoints(p);
	}

	// try splitting polygon into two and triangulate them independently
	function splitEarcut(start: Node, triangles: number[], dim: number, minX: number, minY: number, invSize: number)
	{
		// look for a valid diagonal that divides the polygon into two
		let a = start;
		do
		{
			let b = a.next.next;
			while (b !== a.prev)
			{
				if (a.i !== b.i && isValidDiagonal(a, b))
				{
					// split the polygon in two by the diagonal
					let c = splitPolygon(a, b);

					// filter colinear points around the cuts
					a = filterPoints(a, a.next);
					c = filterPoints(c, c.next);

					// run earcut on each half
					earcutLinked(a, triangles, dim, minX, minY, invSize);
					earcutLinked(c, triangles, dim, minX, minY, invSize);
					return;
				}

				b = b.next;
			}
			a = a.next;
		} while (a !== start);
	}

	/**
	 * link every hole into the outer loop, producing a single-ring polygon without holes
	 * 
	 * 将每个孔连接到外环，产生一个没有孔的单环多边形
	 * 
	 * @param data 形状顶点数据
	 * @param holeIndices 空洞的起始顶点索引列表
	 * @param outerNode 形状轮廓链表
	 * @param dim 相邻顶点数据之间的步长
	 */
	function eliminateHoles(data: number[], holeIndices: number[], outerNode: Node, dim: number)
	{
		// 孔洞链表数组
		const queue: Node[] = [];
		let i: number, len: number, start: number, end: number, list: Node;

		// 遍历构建孔洞链表数组
		for (i = 0, len = holeIndices.length; i < len; i++)
		{
			// 获取当前孔洞起始与结束索引
			start = holeIndices[i] * dim;
			end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
			// 构建孔洞链表
			list = linkedList(data, start, end, dim, false);
			if (list === list.next) list.steiner = true;
			// 把孔洞链表中最左边（X值最小）的节点存放到数组中
			queue.push(getLeftmost(list));
		}
		// 从左到右排序孔洞链表数组
		queue.sort(compareX);

		// process holes from left to right
		// 从左到右消除孔洞链表
		for (i = 0; i < queue.length; i++)
		{
			// 消除孔洞列表
			eliminateHole(queue[i], outerNode);
			// 处理连接外轮廓与孔洞后出现的重复点与共线
			outerNode = filterPoints(outerNode, outerNode.next);
		}

		return outerNode;
	}

	function compareX(a: Node, b: Node)
	{
		return a.x - b.x;
	}

	/**
	 * find a bridge between vertices that connects hole with an outer ring and and link it
	 * 找到一个桥梁连接外轮廓与孔洞
	 * 
	 * @param hole 孔洞链表
	 * @param outerNode 外轮廓链表
	 */
	function eliminateHole(hole: Node, outerNode: Node)
	{
		// 查找与hole节点构成桥梁的外轮廓节点
		outerNode = findHoleBridge(hole, outerNode);
		if (outerNode)
		{
			// 构建外轮廓与孔洞桥梁
			const b = splitPolygon(outerNode, hole);

			// filter collinear points around the cuts
			filterPoints(outerNode, outerNode.next);
			filterPoints(b, b.next);
		}
	}

	/**
	 * David Eberly's algorithm for finding a bridge between hole and outer polygon
	 * 
	 * 使用David Eberly算法找到孔洞与外轮廓之间的桥梁
	 * 
	 * @param hole 孔洞链表
	 * @param outerNode 外轮廓链表
	 */
	function findHoleBridge(hole: Node, outerNode: Node)
	{
		let p = outerNode;
		const hx = hole.x;
		const hy = hole.y;
		let qx = - Infinity, m: Node;

		// find a segment intersected by a ray from the hole's leftmost point to the left;
		// segment's endpoint with lesser x will be potential connection point
		do
		{
			if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y)
			{
				const x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
				if (x <= hx && x > qx)
				{
					qx = x;
					if (x === hx)
					{
						if (hy === p.y) return p;
						if (hy === p.next.y) return p.next;
					}
					m = p.x < p.next.x ? p : p.next;
				}
			}
			p = p.next;
		} while (p !== outerNode);

		if (!m) return null;
		if (hx === qx) return m; // hole touches outer segment; pick leftmost endpoint

		// look for points inside the triangle of hole point, segment intersection and endpoint;
		// if there are no points found, we have a valid connection;
		// otherwise choose the point of the minimum angle with the ray as connection point
		const stop = m,
			mx = m.x,
			my = m.y;
		let tanMin = Infinity, tan: number;
		p = m;
		do
		{
			if (hx >= p.x && p.x >= mx && hx !== p.x &&
				pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y))
			{
				tan = Math.abs(hy - p.y) / (hx - p.x); // tangential
				if (locallyInside(p, hole) && (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p))))))
				{
					m = p;
					tanMin = tan;
				}
			}
			p = p.next;
		} while (p !== stop);
		return m;
	}

	/**
	 * whether sector in vertex m contains sector in vertex p in the same coordinates
	 * 
	 * 判断在相同坐标系下第一个节点的扇形区域是否包含第二个节点的扇形区域。
	 * 
	 * @param m 第一个节点
	 * @param p 第二个节点
	 * 
	 * @todo 没懂
	 */
	function sectorContainsSector(m: Node, p: Node)
	{
		return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
	}

	/**
	 * interlink polygon nodes in z-order
	 * 
	 * 以z顺序连接多边形节点
	 * 
	 * @param start 起始节点
	 * @param minX 包围盒X轴最小值
	 * @param minY 包围盒Y轴最小值
	 * @param invSize 包围盒尺寸的倒数
	 */
	function indexCurve(start: Node, minX: number, minY: number, invSize: number)
	{
		let p = start;
		do
		{
			if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, invSize);
			p.prevZ = p.prev;
			p.nextZ = p.next;
			p = p.next;

		} while (p !== start);

		p.prevZ.nextZ = null;
		p.prevZ = null;

		// 根据z的大小对链表进行排序
		sortLinked(p);
	}

	/**
	 * Simon Tatham's linked list merge sort algorithm
	 * 
	 * 链表归并排序算法
	 * 
	 * @see http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
	 * 
	 * @param list 链表
	 */
	function sortLinked(list: Node)
	{
		let i: number, p: Node, q: Node, e: Node, tail: Node, numMerges: number, pSize: number, qSize: number,
			inSize = 1;

		do
		{
			p = list;
			list = null;
			tail = null;
			numMerges = 0;

			while (p)
			{
				numMerges++;
				q = p;
				pSize = 0;
				for (i = 0; i < inSize; i++)
				{
					pSize++;
					q = q.nextZ;
					if (!q) break;
				}

				qSize = inSize;

				while (pSize > 0 || (qSize > 0 && q))
				{
					if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z))
					{
						e = p;
						p = p.nextZ;
						pSize--;
					} else
					{
						e = q;
						q = q.nextZ;
						qSize--;
					}

					if (tail) tail.nextZ = e;
					else list = e;

					e.prevZ = tail;
					tail = e;
				}

				p = q;
			}

			tail.nextZ = null;
			inSize *= 2;

		} while (numMerges > 1);

		return list;
	}

	/**
	 * z-order of a point given coords and inverse of the longer side of data bbox
	 * 
	 * 把x与y分别映射到包围盒中位置(0,1)再映射到(0,(1<<15)-1)，最后把x与y的值进行相互穿插组成32位数字
	 * 
	 * @todo 为什么使用这种运算？不明觉厉！
	 * 
	 * @param x X轴坐标
	 * @param y Y轴坐标
	 * @param minX 包围盒X轴最小值
	 * @param minY 包围盒Y轴最小值
	 * @param invSize 包围盒尺寸倒数
	 * 
	 * @see https://en.wikipedia.org/wiki/Z-order_curve
	 */
	function zOrder(x: number, y: number, minX: number, minY: number, invSize: number)
	{
		// coords are transformed into non-negative 15-bit integer range
		// 坐标被转换为非负的15位整数范围
		// 把x与y约束在(0,1)范围后在映射到(0,32767)
		x = 32767 * (x - minX) * invSize;
		y = 32767 * (y - minY) * invSize;

		// 把16位中每一位前面插入一个0转换为32位，例如 0111111111111111（0xffff） -> 00010101010101010101010101010101（0x55555555）
		x = (x | (x << 8)) & 0x00FF00FF;
		x = (x | (x << 4)) & 0x0F0F0F0F;
		x = (x | (x << 2)) & 0x33333333;
		x = (x | (x << 1)) & 0x55555555;

		y = (y | (y << 8)) & 0x00FF00FF;
		y = (y | (y << 4)) & 0x0F0F0F0F;
		y = (y | (y << 2)) & 0x33333333;
		y = (y | (y << 1)) & 0x55555555;

		// 
		return x | (y << 1);
	}

	/**
	 * find the leftmost node of a polygon ring
	 * 
	 * 查找一个X值最小的节点
	 * 
	 * @param start 查找起始节点
	 */
	function getLeftmost(start: Node)
	{
		let p = start,
			leftmost = start;
		do
		{
			if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
			p = p.next;
		} while (p !== start);

		return leftmost;
	}

	/**
	 * check if a point lies within a convex triangle
	 * 
	 * 检查一个点是否位于一个正向三角形内
	 * 
	 * @param ax 三角形第一个点的X轴坐标
	 * @param ay 三角形第一个点的Y轴坐标
	 * @param bx 三角形第二个点的X轴坐标
	 * @param by 三角形第二个点的Y轴坐标
	 * @param cx 三角形第三个点的X轴坐标
	 * @param cy 三角形第三个点的Y轴坐标
	 * @param px 被检查点的X轴坐标
	 * @param py 被检查点的Y轴坐标
	 */
	function pointInTriangle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, px: number, py: number)
	{
		return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
			(ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
			(bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
	}

	/**
	 * check if a diagonal between two polygon nodes is valid (lies in polygon interior)
	 * 
	 * 检查两个多边形节点之间的对角线是否有效(位于多边形内部)
	 * 
	 * @param a 多边形顶点a
	 * @param b 多边形顶点b
	 */
	function isValidDiagonal(a: Node, b: Node)
	{
		return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && // dones't intersect other edges
			(locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && // locally visible
				(area(a.prev, a, b.prev) || area(a, b.prev, b)) || // does not create opposite-facing sectors
				equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); // special zero-length case

	}

	/**
	 * signed area of a triangle
	 * 
	 * 计算三角形的带符号面积
	 * 
	 * @param p 三角形第一个点
	 * @param q 三角形第二个点
	 * @param r 三角形第三个点
	 */
	function area(p: { x: number, y: number }, q: { x: number, y: number }, r: { x: number, y: number })
	{
		return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
	}

	/**
	 * check if two points are equal
	 * 
	 * 判断两个点是否相等
	 * 
	 * @param p1 第一个点
	 * @param p2 第二个点
	 */
	function equals(p1: { x: number, y: number }, p2: { x: number, y: number })
	{
		return p1.x === p2.x && p1.y === p2.y;
	}

	/**
	 * check if two segments intersect
	 * 
	 * 检查两条线段是否相交
	 * 
	 * @param p1 第一条线段起点
	 * @param q1 第一条线段终点
	 * @param p2 第二条线段起点
	 * @param q2 第二条线段终点
	 */
	function intersects(p1: { x: number, y: number }, q1: { x: number, y: number }, p2: { x: number, y: number }, q2: { x: number, y: number })
	{
		const o1 = sign(area(p1, q1, p2));
		const o2 = sign(area(p1, q1, q2));
		const o3 = sign(area(p2, q2, p1));
		const o4 = sign(area(p2, q2, q1));

		// 正常相交情况
		if (o1 !== o2 && o3 !== o4) return true; // general case

		// 处理4种3点共线情况
		if (o1 === 0 && onSegment(p1, p2, q1)) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
		if (o2 === 0 && onSegment(p1, q2, q1)) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
		if (o3 === 0 && onSegment(p2, p1, q2)) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
		if (o4 === 0 && onSegment(p2, q1, q2)) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

		return false;
	}

	/**
	 * for collinear points p, q, r, check if point q lies on segment pr
	 * 
	 * 对于共线点p, q, r，检查点q是否在线段pr上
	 * 
	 * @param p 线段起点
	 * @param q 被检测的点
	 * @param r 线段中点
	 */
	function onSegment(p: { x: number, y: number }, q: { x: number, y: number }, r: { x: number, y: number })
	{
		return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
	}

	/**
	 * 取数字符号
	 * 
	 * @param num 数字
	 */
	function sign(num: number)
	{
		return num > 0 ? 1 : num < 0 ? - 1 : 0;
	}

	/**
	 * check if a polygon diagonal intersects any polygon segments
	 * 
	 * 检查一个多边形的对角线是否与任何多边形线段相交
	 * 
	 * @param a 第一个节点
	 * @param b 第二个节点
	 */
	function intersectsPolygon(a: Node, b: Node)
	{
		let p = a;
		do
		{
			// 排除与对角线ab连接的边进行相交测试
			if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
				intersects(p, p.next, a, b)) return true;
			p = p.next;

		} while (p !== a);

		return false;
	}

	/**
	 * check if a polygon diagonal is locally inside the polygon
	 * 
	 * 检查多边形的对角线是否局部位于多边形内部
	 * 
	 * 判断出ab对角线是否从a点进入多边形内部，从而判断出对角线ab是否局部位于多边形内部。
	 * 
	 * @param a 第一个节点
	 * @param b 第二个节点
	 * 
	 * @todo locallyOutside?
	 */
	function locallyInside(a: Node, b: Node)
	{
		return area(a.prev, a, a.next) < 0 ?	// 判断a为多边形凸点或者凹点
			area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :	// 判断a为凸点情况
			area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;		// 判断a为凹点情况
	}

	/**
	 * check if the middle point of a polygon diagonal is inside the polygon
	 * 
	 * 检查两个节点的对角线中点是否在多边形内部
	 * 
	 * @param a 第一个节点
	 * @param b 第二个节点
	 */
	function middleInside(a: Node, b: Node)
	{
		let p = a,
			inside = false;
		const px = (a.x + b.x) / 2,
			py = (a.y + b.y) / 2;
		do
		{
			// 以该点为起点作一条朝向正X轴方向的射线，计算与多边形的边相交的次数，奇数次表示在多边形内部，否则在外部。
			if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
				(px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
				inside = !inside;
			p = p.next;
		} while (p !== a);

		return inside;
	}

	/**
	 * link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
	 * if one belongs to the outer ring and another to a hole, it merges it into a single ring
	 * 
	 * 用桥连接两个多边形顶点; 如果顶点属于同一个环，它将多边形一分为二;
	 * 如果一个属于外环，另一个属于洞，它合并成一个环。
	 * 
	 * @param a 外环节点
	 * @param b 内环节点
	 */
	function splitPolygon(a: Node, b: Node)
	{
		const a2 = new Node(a.i, a.x, a.y),
			b2 = new Node(b.i, b.x, b.y),
			an = a.next,
			bp = b.prev;

		a.next = b;
		b.prev = a;

		a2.next = an;
		an.prev = a2;

		b2.next = a2;
		a2.prev = b2;

		bp.next = b2;
		b2.prev = bp;

		return b2;
	}

	/**
	 * create a node and optionally link it with previous one (in a circular doubly linked list)
	 * 
	 * 创建一个节点，并可选地与上一个节点链接(在双向循环链表中)
	 * 
	 * @param i 在顶点数组中的索引
	 * @param x 节点所在X轴坐标
	 * @param y 节点所在Y轴坐标
	 * @param last 双向循环链表中最后一个节点
	 */
	function insertNode(i: number, x: number, y: number, last: Node)
	{
		const p = new Node(i, x, y);

		if (!last)
		{
			p.prev = p;
			p.next = p;
		} else
		{
			p.next = last.next;
			p.prev = last;
			last.next.prev = p;
			last.next = p;
		}

		return p;
	}

	/**
	 * 移除节点
	 * 
	 * @param p 被移除的节点
	 */
	function removeNode(p: Node)
	{
		p.next.prev = p.prev;
		p.prev.next = p.next;

		if (p.prevZ) p.prevZ.nextZ = p.nextZ;
		if (p.nextZ) p.nextZ.prevZ = p.prevZ;
	}

	class Node
	{
		/**
		 * 在顶点数组中的索引
		 */
		i: number;

		/**
		 * 节点所在X轴坐标
		 */
		x: number;

		/**
		 * 节点所在Y轴坐标
		 */
		y: number;

		/**
		 * z-order curve value
		 */
		z: number = null;

		/**
		 * previous node in z-order
		 */
		prevZ: Node = null;

		/**
		 * next node in z-order
		 */
		nextZ: Node = null;

		/**
		 * 多边形环中的前一个顶点节点
		 */
		prev: Node = null;

		/**
		 * 多边形环中的下一个顶点节点
		 */
		next: Node = null;

		/**
		 * 否为 Steiner Point?
		 * 
		 * @todo 没理解
		 * @see https://en.wikipedia.org/wiki/Steiner_point_(triangle)
		 */
		steiner = false;

		constructor(i: number, x: number, y: number)
		{
			this.i = i;

			this.x = x;
			this.y = y;
		}
	}

	/**
	 * 求有符号的多边形面积总和。正面时面积为正值，否则为负值。
	 * 
	 * @param data 多边形顶点数据
	 * @param start 顶点起始索引
	 * @param end 顶点终止索引
	 * @param dim 是否顺时针方向
	 */
	function signedArea(data: number[], start: number, end: number, dim: number)
	{
		let sum = 0;
		for (let i = start, j = end - dim; i < end; i += dim)
		{
			sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
			j = i;
		}
		return sum;
	}
}
