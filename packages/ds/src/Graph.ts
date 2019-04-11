namespace feng3d
{
    /**
     * 图
     * 
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/graph/Graph.js
     * @see https://en.wikipedia.org/wiki/Graph_(abstract_data_type)
     * @see https://www.youtube.com/watch?v=gXgEDyodOJU&index=9&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     * @see https://www.youtube.com/watch?v=k1wraWzqtvQ&index=10&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     */
    export class Graph<T>
    {
        /**
         * 顶点列表
         */
        vertices: { [key: string]: GraphVertex<T> };

        /**
         * 边列表
         */
        edges: { [key: string]: GraphEdge<T> };

        /**
         * 是否有向
         */
        isDirected = false;

        /**
         * 构建图
         * 
         * @param isDirected 是否有向
         */
        constructor(isDirected = false)
        {
            this.vertices = {};
            this.edges = {};
            this.isDirected = isDirected;
        }

        /**
         * 新增顶点
         * 
         * @param newVertex 新顶点
         */
        addVertex(newVertex: GraphVertex<T>)
        {
            this.vertices[newVertex.getKey()] = newVertex;

            return this;
        }

        /**
         * 获取顶点
         * 
         * @param vertexKey 顶点键值
         */
        getVertexByKey(vertexKey: string)
        {
            return this.vertices[vertexKey];
        }

        /**
         * 获取相邻点
         * 
         * @param vertex 顶点
         */
        getNeighbors(vertex: GraphVertex<T>)
        {
            return vertex.getNeighbors();
        }

        /**
         * 获取所有顶点
         */
        getAllVertices()
        {
            var values = Object.keys(this.vertices).map(key => this.vertices[key]);
            return values;
        }

        /**
         * 获取所有边
         */
        getAllEdges()
        {
            var values = Object.keys(this.edges).map(key => this.edges[key]);
            return values;
        }

        /**
         * 新增边
         * 
         * @param edge 边
         */
        addEdge(edge: GraphEdge<T>)
        {
            // 获取起点与终点
            let startVertex = this.getVertexByKey(edge.startVertex.getKey());
            let endVertex = this.getVertexByKey(edge.endVertex.getKey());

            // 新增不存在的起点
            if (!startVertex)
            {
                this.addVertex(edge.startVertex);
                startVertex = this.getVertexByKey(edge.startVertex.getKey());
            }

            // 新增不存在的终点
            if (!endVertex)
            {
                this.addVertex(edge.endVertex);
                endVertex = this.getVertexByKey(edge.endVertex.getKey());
            }

            // 新增边到边列表
            if (this.edges[edge.getKey()])
            {
                throw new Error('指定边已经存在，无法再次添加');
            } else
            {
                this.edges[edge.getKey()] = edge;
            }

            // 新增边到顶点
            if (this.isDirected)
            {
                startVertex.addEdge(edge);
            } else
            {
                startVertex.addEdge(edge);
                endVertex.addEdge(edge);
            }

            return this;
        }

        /**
         * 删除边
         * 
         * @param edge 边
         */
        deleteEdge(edge: GraphEdge<T>)
        {
            // 从列表中删除边
            if (this.edges[edge.getKey()])
            {
                delete this.edges[edge.getKey()];
            } else
            {
                throw new Error('图中不存在指定边');
            }

            // 从起点与终点里删除边
            const startVertex = this.getVertexByKey(edge.startVertex.getKey());
            const endVertex = this.getVertexByKey(edge.endVertex.getKey());

            startVertex.deleteEdge(edge);
            endVertex.deleteEdge(edge);
        }

        /**
         * 查找边
         * 
         * @param startVertex 起始顶点
         * @param endVertex 结束顶点
         */
        findEdge(startVertex: GraphVertex<T>, endVertex: GraphVertex<T>)
        {
            const vertex = this.getVertexByKey(startVertex.getKey());

            if (!vertex)
            {
                return null;
            }

            return vertex.findEdge(endVertex);
        }

        /**
         * 获取权重
         */
        getWeight()
        {
            return this.getAllEdges().reduce((weight, graphEdge) =>
            {
                return weight + graphEdge.weight;
            }, 0);
        }

        /**
         * 反转
         */
        reverse()
        {
            // 遍历边
            this.getAllEdges().forEach((edge) =>
            {
                // 删除边
                this.deleteEdge(edge);

                // 反转边
                edge.reverse();

                // 新增边
                this.addEdge(edge);
            });

            return this;
        }

        /**
         * 获取所有顶点索引
         */
        getVerticesIndices()
        {
            const verticesIndices = {};
            this.getAllVertices().forEach((vertex, index) =>
            {
                verticesIndices[vertex.getKey()] = index;
            });

            return verticesIndices;
        }

        /**
         * 获取邻接矩阵
         */
        getAdjacencyMatrix()
        {
            const vertices = this.getAllVertices();
            const verticesIndices = this.getVerticesIndices();

            // 初始化邻接矩阵
            const adjacencyMatrix = [];
            var n = vertices.length;
            for (let i = 0; i < n; i++)
            {
                adjacencyMatrix[i] = [];
                for (let j = 0; j < n; j++)
                {
                    adjacencyMatrix[i][j] = Infinity;
                }
            }

            // 填充邻接矩阵
            vertices.forEach((vertex, vertexIndex) =>
            {
                vertex.getNeighbors().forEach((neighbor) =>
                {
                    const neighborIndex = verticesIndices[neighbor.getKey()];
                    adjacencyMatrix[vertexIndex][neighborIndex] = this.findEdge(vertex, neighbor).weight;
                });
            });

            return adjacencyMatrix;
        }

        /**
         * 转换为字符串
         */
        toString()
        {
            return Object.keys(this.vertices).toString();
        }
    }

    /**
     * 图边
     */
    export class GraphEdge<T>
    {
        /**
         * 起始顶点
         */
        startVertex: GraphVertex<T>;

        /**
         * 结束顶点
         */
        endVertex: GraphVertex<T>;

        /**
         * 权重
         */
        weight: number;

        /**
         * 构建图边
         * @param startVertex 起始顶点
         * @param endVertex 结束顶点
         * @param weight 权重
         */
        constructor(startVertex: GraphVertex<T>, endVertex: GraphVertex<T>, weight = 0)
        {
            this.startVertex = startVertex;
            this.endVertex = endVertex;
            this.weight = weight;
        }

        /**
         * 获取键值
         */
        getKey()
        {
            const startVertexKey = this.startVertex.getKey();
            const endVertexKey = this.endVertex.getKey();

            return `${startVertexKey}_${endVertexKey}`;
        }

        /**
         * 反转
         */
        reverse()
        {
            const tmp = this.startVertex;
            this.startVertex = this.endVertex;
            this.endVertex = tmp;

            return this;
        }

        /**
         * 转换为字符串
         */
        toString()
        {
            return this.getKey();
        }
    }

    /**
     * 图顶点
     */
    export class GraphVertex<T>
    {
        /**
         * 值
         */
        value: T;

        /**
         * 边列表
         */
        edges: LinkedList<GraphEdge<T>>;

        /**
         * 构建图顶点
         * 
         * @param value 值
         */
        constructor(value: T)
        {
            const edgeComparator = (edgeA: GraphEdge<T>, edgeB: GraphEdge<T>) =>
            {
                if (edgeA.getKey() === edgeB.getKey())
                {
                    return 0;
                }
                return edgeA.getKey() < edgeB.getKey() ? -1 : 1;
            };

            this.value = value;
            this.edges = new LinkedList(edgeComparator);
        }

        /**
         * 新增边
         * 
         * @param edge 边
         */
        addEdge(edge: GraphEdge<T>)
        {
            this.edges.addTail(edge);

            return this;
        }

        /**
         * 删除边
         * 
         * @param edge 边
         */
        deleteEdge(edge: GraphEdge<T>)
        {
            this.edges.delete(edge);
        }

        /**
         * 获取相邻顶点
         */
        getNeighbors()
        {
            const edges = this.edges.toArray();

            const neighborsConverter = (edge: GraphEdge<T>) =>
            {
                return edge.startVertex === this ? edge.endVertex : edge.startVertex;
            };

            return edges.map(neighborsConverter);
        }

        /**
         * 获取边列表
         */
        getEdges()
        {
            return this.edges.toArray();
        }

        /**
         * 获取边的数量
         */
        getDegree()
        {
            return this.edges.toArray().length;
        }

        /**
         * 是否存在指定边
         * 
         * @param requiredEdge 边
         */
        hasEdge(requiredEdge: GraphEdge<T>)
        {
            const edgeNode = this.edges.findByFunc(
                edge => edge === requiredEdge,
            );

            return !!edgeNode;
        }

        /**
         * 是否有相邻顶点
         * 
         * @param vertex 顶点
         */
        hasNeighbor(vertex: GraphVertex<T>)
        {
            const vertexNode = this.edges.findByFunc(
                edge => edge.startVertex === vertex || edge.endVertex === vertex,
            );

            return !!vertexNode;
        }

        /**
         * 查找边
         * 
         * @param vertex 顶点
         */
        findEdge(vertex: GraphVertex<T>)
        {
            const edgeFinder = (edge: GraphEdge<T>) =>
            {
                return edge.startVertex === vertex || edge.endVertex === vertex;
            };

            const edge = this.edges.findByFunc(edgeFinder);

            return edge ? edge.value : null;
        }

        /**
         * 获取键值
         */
        getKey()
        {
            return <string><any>this.value;
        }

        /**
         * 删除所有边
         */
        deleteAllEdges()
        {
            this.getEdges().forEach(edge => this.deleteEdge(edge));

            return this;
        }

        /**
         * 转换为字符串
         * 
         * @param callback 转换为字符串函数
         */
        toString(callback?: (value: T) => string)
        {
            return callback ? callback(this.value) : `${this.value}`;
        }
    }


}