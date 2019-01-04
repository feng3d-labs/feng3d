namespace ds
{
    /**
     * 图
     * 
     * @see https://gitee.com/feng3d_admin/javascript-algorithms/blob/master/src/data-structures/graph/Graph.js
     * @see https://en.wikipedia.org/wiki/Graph_(abstract_data_type)
     * @see https://www.youtube.com/watch?v=gXgEDyodOJU&index=9&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     * @see https://www.youtube.com/watch?v=k1wraWzqtvQ&index=10&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     */
    export class Graph
    {
        vertices: Object;
        edges: Object;

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
         * @param {GraphVertex} newVertex
         * @returns {Graph}
         */
        addVertex(newVertex)
        {
            this.vertices[newVertex.getKey()] = newVertex;

            return this;
        }

        /**
         * @param {string} vertexKey
         * @returns GraphVertex
         */
        getVertexByKey(vertexKey)
        {
            return this.vertices[vertexKey];
        }

        /**
         * @param {GraphVertex} vertex
         * @returns {GraphVertex[]}
         */
        getNeighbors(vertex)
        {
            return vertex.getNeighbors();
        }

        /**
         * @return {GraphVertex[]}
         */
        getAllVertices()
        {
            var values = Object.keys(this.vertices).map(key => this.vertices[key]);
            return values;
        }

        /**
         * @return {GraphEdge[]}
         */
        getAllEdges()
        {
            var values = Object.keys(this.edges).map(key => this.edges[key]);
            return values;
        }

        /**
         * @param {GraphEdge} edge
         * @returns {Graph}
         */
        addEdge(edge)
        {
            // Try to find and end start vertices.
            let startVertex = this.getVertexByKey(edge.startVertex.getKey());
            let endVertex = this.getVertexByKey(edge.endVertex.getKey());

            // Insert start vertex if it wasn't inserted.
            if (!startVertex)
            {
                this.addVertex(edge.startVertex);
                startVertex = this.getVertexByKey(edge.startVertex.getKey());
            }

            // Insert end vertex if it wasn't inserted.
            if (!endVertex)
            {
                this.addVertex(edge.endVertex);
                endVertex = this.getVertexByKey(edge.endVertex.getKey());
            }

            // Check if edge has been already added.
            if (this.edges[edge.getKey()])
            {
                throw new Error('Edge has already been added before');
            } else
            {
                this.edges[edge.getKey()] = edge;
            }

            // Add edge to the vertices.
            if (this.isDirected)
            {
                // If graph IS directed then add the edge only to start vertex.
                startVertex.addEdge(edge);
            } else
            {
                // If graph ISN'T directed then add the edge to both vertices.
                startVertex.addEdge(edge);
                endVertex.addEdge(edge);
            }

            return this;
        }

        /**
         * @param {GraphEdge} edge
         */
        deleteEdge(edge)
        {
            // Delete edge from the list of edges.
            if (this.edges[edge.getKey()])
            {
                delete this.edges[edge.getKey()];
            } else
            {
                throw new Error('Edge not found in graph');
            }

            // Try to find and end start vertices and delete edge from them.
            const startVertex = this.getVertexByKey(edge.startVertex.getKey());
            const endVertex = this.getVertexByKey(edge.endVertex.getKey());

            startVertex.deleteEdge(edge);
            endVertex.deleteEdge(edge);
        }

        /**
         * @param {GraphVertex} startVertex
         * @param {GraphVertex} endVertex
         * @return {(GraphEdge|null)}
         */
        findEdge(startVertex, endVertex)
        {
            const vertex = this.getVertexByKey(startVertex.getKey());

            if (!vertex)
            {
                return null;
            }

            return vertex.findEdge(endVertex);
        }

        /**
         * @return {number}
         */
        getWeight()
        {
            return this.getAllEdges().reduce((weight, graphEdge) =>
            {
                return weight + graphEdge.weight;
            }, 0);
        }

        /**
         * Reverse all the edges in directed graph.
         * @return {Graph}
         */
        reverse()
        {
            /** @param {GraphEdge} edge */
            this.getAllEdges().forEach((edge) =>
            {
                // Delete straight edge from graph and from vertices.
                this.deleteEdge(edge);

                // Reverse the edge.
                edge.reverse();

                // Add reversed edge back to the graph and its vertices.
                this.addEdge(edge);
            });

            return this;
        }

        /**
         * @return {object}
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
         * @return {*[][]}
         */
        getAdjacencyMatrix()
        {
            const vertices = this.getAllVertices();
            const verticesIndices = this.getVerticesIndices();

            // Init matrix with infinities meaning that there is no ways of
            // getting from one vertex to another yet.
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

            // Fill the columns.
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
         * @return {string}
         */
        toString()
        {
            return Object.keys(this.vertices).toString();
        }
    }

    export class GraphEdge
    {
        /**
         * @param {GraphVertex} startVertex
         * @param {GraphVertex} endVertex
         * @param {number} [weight=1]
         */
        constructor(startVertex, endVertex, weight = 0)
        {
            this.startVertex = startVertex;
            this.endVertex = endVertex;
            this.weight = weight;
        }

        /**
         * @return {string}
         */
        getKey()
        {
            const startVertexKey = this.startVertex.getKey();
            const endVertexKey = this.endVertex.getKey();

            return `${startVertexKey}_${endVertexKey}`;
        }

        /**
         * @return {GraphEdge}
         */
        reverse()
        {
            const tmp = this.startVertex;
            this.startVertex = this.endVertex;
            this.endVertex = tmp;

            return this;
        }

        /**
         * @return {string}
         */
        toString()
        {
            return this.getKey();
        }
    }

    export class GraphVertex<T>
    {
        value: T;

        /**
         * @param {*} value
         */
        constructor(value: T)
        {
            if (value === undefined)
            {
                throw new Error('Graph vertex must have a value');
            }

            /**
             * @param {GraphEdge} edgeA
             * @param {GraphEdge} edgeB
             */
            const edgeComparator = (edgeA, edgeB) =>
            {
                if (edgeA.getKey() === edgeB.getKey())
                {
                    return 0;
                }

                return edgeA.getKey() < edgeB.getKey() ? -1 : 1;
            };

            // Normally you would store string value like vertex name.
            // But generally it may be any object as well
            this.value = value;
            this.edges = new LinkedList(edgeComparator);
        }

        /**
         * @param {GraphEdge} edge
         * @returns {GraphVertex}
         */
        addEdge(edge)
        {
            this.edges.append(edge);

            return this;
        }

        /**
         * @param {GraphEdge} edge
         */
        deleteEdge(edge)
        {
            this.edges.delete(edge);
        }

        /**
         * @returns {GraphVertex[]}
         */
        getNeighbors()
        {
            const edges = this.edges.toArray();

            /** @param {LinkedListNode} node */
            const neighborsConverter = (node) =>
            {
                return node.value.startVertex === this ? node.value.endVertex : node.value.startVertex;
            };

            // Return either start or end vertex.
            // For undirected graphs it is possible that current vertex will be the end one.
            return edges.map(neighborsConverter);
        }

        /**
         * @return {GraphEdge[]}
         */
        getEdges()
        {
            return this.edges.toArray().map(linkedListNode => linkedListNode.value);
        }

        /**
         * @return {number}
         */
        getDegree()
        {
            return this.edges.toArray().length;
        }

        /**
         * @param {GraphEdge} requiredEdge
         * @returns {boolean}
         */
        hasEdge(requiredEdge)
        {
            const edgeNode = this.edges.find({
                callback: edge => edge === requiredEdge,
            });

            return !!edgeNode;
        }

        /**
         * @param {GraphVertex} vertex
         * @returns {boolean}
         */
        hasNeighbor(vertex)
        {
            const vertexNode = this.edges.find({
                callback: edge => edge.startVertex === vertex || edge.endVertex === vertex,
            });

            return !!vertexNode;
        }

        /**
         * @param {GraphVertex} vertex
         * @returns {(GraphEdge|null)}
         */
        findEdge(vertex)
        {
            const edgeFinder = (edge) =>
            {
                return edge.startVertex === vertex || edge.endVertex === vertex;
            };

            const edge = this.edges.find({ callback: edgeFinder });

            return edge ? edge.value : null;
        }

        /**
         * @returns {string}
         */
        getKey()
        {
            return this.value;
        }

        /**
         * @return {GraphVertex}
         */
        deleteAllEdges()
        {
            this.getEdges().forEach(edge => this.deleteEdge(edge));

            return this;
        }

        /**
         * @param {function} [callback]
         * @returns {string}
         */
        toString(callback)
        {
            return callback ? callback(this.value) : `${this.value}`;
        }
    }


}