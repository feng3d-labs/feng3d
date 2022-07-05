
QUnit.module('Graph', () =>
{
    QUnit.test('should add vertices to graph', (assert) =>
    {
        const graph = new feng3d.Graph();

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');

        graph
            .addVertex(vertexA)
            .addVertex(vertexB);

        assert.deepEqual(graph.toString(), 'A,B');
        assert.deepEqual(graph.getVertexByKey(vertexA.getKey()), vertexA);
        assert.deepEqual(graph.getVertexByKey(vertexB.getKey()), vertexB);
    });

    QUnit.test('should add edges to undirected graph', (assert) =>
    {
        const graph = new feng3d.Graph();

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);

        graph.addEdge(edgeAB);

        assert.deepEqual(graph.getAllVertices().length, 2);
        assert.deepEqual(graph.getAllVertices()[0], vertexA);
        assert.deepEqual(graph.getAllVertices()[1], vertexB);

        const graphVertexA = graph.getVertexByKey(vertexA.getKey());
        const graphVertexB = graph.getVertexByKey(vertexB.getKey());

        assert.deepEqual(graph.toString(), 'A,B');
        assert.deepEqual(graphVertexA != undefined, true);
        assert.deepEqual(graphVertexB != undefined, true);

        assert.deepEqual(graph.getVertexByKey('not existing') == undefined, true);

        assert.deepEqual(graphVertexA.getNeighbors().length, 1);
        assert.deepEqual(graphVertexA.getNeighbors()[0], vertexB);
        assert.deepEqual(graphVertexA.getNeighbors()[0], graphVertexB);

        assert.deepEqual(graphVertexB.getNeighbors().length, 1);
        assert.deepEqual(graphVertexB.getNeighbors()[0], vertexA);
        assert.deepEqual(graphVertexB.getNeighbors()[0], graphVertexA);
    });

    QUnit.test('should add edges to directed graph', (assert) =>
    {
        const graph = new feng3d.Graph(true);

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);

        graph.addEdge(edgeAB);

        const graphVertexA = graph.getVertexByKey(vertexA.getKey());
        const graphVertexB = graph.getVertexByKey(vertexB.getKey());

        assert.deepEqual(graph.toString(), 'A,B');
        assert.deepEqual(graphVertexA != undefined, true);
        assert.deepEqual(graphVertexB != undefined, true);

        assert.deepEqual(graphVertexA.getNeighbors().length, 1);
        assert.deepEqual(graphVertexA.getNeighbors()[0], vertexB);
        assert.deepEqual(graphVertexA.getNeighbors()[0], graphVertexB);

        assert.deepEqual(graphVertexB.getNeighbors().length, 0);
    });

    QUnit.test('should find edge by vertices in undirected graph', (assert) =>
    {
        const graph = new feng3d.Graph();

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB, 10);

        graph.addEdge(edgeAB);

        const graphEdgeAB = graph.findEdge(vertexA, vertexB);
        const graphEdgeBA = graph.findEdge(vertexB, vertexA);
        const graphEdgeAC = graph.findEdge(vertexA, vertexC);
        const graphEdgeCA = graph.findEdge(vertexC, vertexA);

        assert.deepEqual(graphEdgeAC, null);
        assert.deepEqual(graphEdgeCA, null);
        assert.deepEqual(graphEdgeAB, edgeAB);
        assert.deepEqual(graphEdgeBA, edgeAB);
        assert.deepEqual(graphEdgeAB.weight, 10);
    });

    QUnit.test('should find edge by vertices in directed graph', (assert) =>
    {
        const graph = new feng3d.Graph(true);

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB, 10);

        graph.addEdge(edgeAB);

        const graphEdgeAB = graph.findEdge(vertexA, vertexB);
        const graphEdgeBA = graph.findEdge(vertexB, vertexA);
        const graphEdgeAC = graph.findEdge(vertexA, vertexC);
        const graphEdgeCA = graph.findEdge(vertexC, vertexA);

        assert.deepEqual(graphEdgeAC, null);
        assert.deepEqual(graphEdgeCA, null);
        assert.deepEqual(graphEdgeBA, null);
        assert.deepEqual(graphEdgeAB, edgeAB);
        assert.deepEqual(graphEdgeAB.weight, 10);
    });

    QUnit.test('should return vertex neighbors', (assert) =>
    {
        const graph = new feng3d.Graph(true);

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        const edgeAC = new feng3d.GraphEdge(vertexA, vertexC);

        graph
            .addEdge(edgeAB)
            .addEdge(edgeAC);

        const neighbors = graph.getNeighbors(vertexA);

        assert.deepEqual(neighbors.length, 2);
        assert.deepEqual(neighbors[0], vertexB);
        assert.deepEqual(neighbors[1], vertexC);
    });

    QUnit.test('should throw an error when trying to add edge twice', (assert) =>
    {
        function addSameEdgeTwice()
        {
            const graph = new feng3d.Graph(true);

            const vertexA = new feng3d.GraphVertex('A');
            const vertexB = new feng3d.GraphVertex('B');

            const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);

            graph
                .addEdge(edgeAB)
                .addEdge(edgeAB);
        }

        var error0 = false;
        try
        {
            addSameEdgeTwice();
        } catch (error)
        {
            error0 = true;
        }

        assert.deepEqual(error0, true);
    });

    QUnit.test('should return the list of all added edges', (assert) =>
    {
        const graph = new feng3d.Graph(true);

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        const edgeBC = new feng3d.GraphEdge(vertexB, vertexC);

        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC);

        const edges = graph.getAllEdges();

        assert.deepEqual(edges.length, 2);
        assert.deepEqual(edges[0], edgeAB);
        assert.deepEqual(edges[1], edgeBC);
    });

    QUnit.test('should calculate total graph weight for default graph', (assert) =>
    {
        const graph = new feng3d.Graph();

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');
        const vertexD = new feng3d.GraphVertex('D');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        const edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
        const edgeCD = new feng3d.GraphEdge(vertexC, vertexD);
        const edgeAD = new feng3d.GraphEdge(vertexA, vertexD);

        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeAD);

        assert.deepEqual(graph.getWeight(), 0);
    });

    QUnit.test('should calculate total graph weight for weighted graph', (assert) =>
    {
        const graph = new feng3d.Graph();

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');
        const vertexD = new feng3d.GraphVertex('D');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB, 1);
        const edgeBC = new feng3d.GraphEdge(vertexB, vertexC, 2);
        const edgeCD = new feng3d.GraphEdge(vertexC, vertexD, 3);
        const edgeAD = new feng3d.GraphEdge(vertexA, vertexD, 4);

        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeAD);

        assert.deepEqual(graph.getWeight(), 10);
    });

    QUnit.test('should be possible to delete edges from graph', (assert) =>
    {
        const graph = new feng3d.Graph();

        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        const edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
        const edgeAC = new feng3d.GraphEdge(vertexA, vertexC);

        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeAC);

        assert.deepEqual(graph.getAllEdges().length, 3);

        graph.deleteEdge(edgeAB);

        assert.deepEqual(graph.getAllEdges().length, 2);
        assert.deepEqual(graph.getAllEdges()[0].getKey(), edgeBC.getKey());
        assert.deepEqual(graph.getAllEdges()[1].getKey(), edgeAC.getKey());
    });

    QUnit.test('should should throw an error when trying to delete not existing edge', (assert) =>
    {
        function deleteNotExistingEdge()
        {
            const graph = new feng3d.Graph();

            const vertexA = new feng3d.GraphVertex('A');
            const vertexB = new feng3d.GraphVertex('B');
            const vertexC = new feng3d.GraphVertex('C');

            const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
            const edgeBC = new feng3d.GraphEdge(vertexB, vertexC);

            graph.addEdge(edgeAB);
            graph.deleteEdge(edgeBC);
        }

        var error0 = false;
        try
        {
            deleteNotExistingEdge();
        } catch (error)
        {
            error0 = true;
        }

        assert.deepEqual(error0, true);
    });

    QUnit.test('should be possible to reverse graph', (assert) =>
    {
        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');
        const vertexD = new feng3d.GraphVertex('D');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        const edgeAC = new feng3d.GraphEdge(vertexA, vertexC);
        const edgeCD = new feng3d.GraphEdge(vertexC, vertexD);

        const graph = new feng3d.Graph(true);
        graph
            .addEdge(edgeAB)
            .addEdge(edgeAC)
            .addEdge(edgeCD);

        assert.deepEqual(graph.toString(), 'A,B,C,D');
        assert.deepEqual(graph.getAllEdges().length, 3);
        assert.deepEqual(graph.getNeighbors(vertexA).length, 2);
        assert.deepEqual(graph.getNeighbors(vertexA)[0].getKey(), vertexB.getKey());
        assert.deepEqual(graph.getNeighbors(vertexA)[1].getKey(), vertexC.getKey());
        assert.deepEqual(graph.getNeighbors(vertexB).length, 0);
        assert.deepEqual(graph.getNeighbors(vertexC).length, 1);
        assert.deepEqual(graph.getNeighbors(vertexC)[0].getKey(), vertexD.getKey());
        assert.deepEqual(graph.getNeighbors(vertexD).length, 0);

        graph.reverse();

        assert.deepEqual(graph.toString(), 'A,B,C,D');
        assert.deepEqual(graph.getAllEdges().length, 3);
        assert.deepEqual(graph.getNeighbors(vertexA).length, 0);
        assert.deepEqual(graph.getNeighbors(vertexB).length, 1);
        assert.deepEqual(graph.getNeighbors(vertexB)[0].getKey(), vertexA.getKey());
        assert.deepEqual(graph.getNeighbors(vertexC).length, 1);
        assert.deepEqual(graph.getNeighbors(vertexC)[0].getKey(), vertexA.getKey());
        assert.deepEqual(graph.getNeighbors(vertexD).length, 1);
        assert.deepEqual(graph.getNeighbors(vertexD)[0].getKey(), vertexC.getKey());
    });

    QUnit.test('should return vertices indices', (assert) =>
    {
        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');
        const vertexD = new feng3d.GraphVertex('D');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        const edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
        const edgeCD = new feng3d.GraphEdge(vertexC, vertexD);
        const edgeBD = new feng3d.GraphEdge(vertexB, vertexD);

        const graph = new feng3d.Graph();
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeBD);

        const verticesIndices = graph.getVerticesIndices();
        assert.deepEqual(verticesIndices, {
            A: 0,
            B: 1,
            C: 2,
            D: 3,
        });
    });

    QUnit.test('should generate adjacency matrix for undirected graph', (assert) =>
    {
        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');
        const vertexD = new feng3d.GraphVertex('D');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB);
        const edgeBC = new feng3d.GraphEdge(vertexB, vertexC);
        const edgeCD = new feng3d.GraphEdge(vertexC, vertexD);
        const edgeBD = new feng3d.GraphEdge(vertexB, vertexD);

        const graph = new feng3d.Graph();
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeBD);

        const adjacencyMatrix = graph.getAdjacencyMatrix();
        assert.deepEqual(adjacencyMatrix, [
            [Infinity, 0, Infinity, Infinity],
            [0, Infinity, 0, 0],
            [Infinity, 0, Infinity, 0],
            [Infinity, 0, 0, Infinity],
        ]);
    });

    QUnit.test('should generate adjacency matrix for directed graph', (assert) =>
    {
        const vertexA = new feng3d.GraphVertex('A');
        const vertexB = new feng3d.GraphVertex('B');
        const vertexC = new feng3d.GraphVertex('C');
        const vertexD = new feng3d.GraphVertex('D');

        const edgeAB = new feng3d.GraphEdge(vertexA, vertexB, 2);
        const edgeBC = new feng3d.GraphEdge(vertexB, vertexC, 1);
        const edgeCD = new feng3d.GraphEdge(vertexC, vertexD, 5);
        const edgeBD = new feng3d.GraphEdge(vertexB, vertexD, 7);

        const graph = new feng3d.Graph(true);
        graph
            .addEdge(edgeAB)
            .addEdge(edgeBC)
            .addEdge(edgeCD)
            .addEdge(edgeBD);

        const adjacencyMatrix = graph.getAdjacencyMatrix();
        assert.deepEqual(adjacencyMatrix, [
            [Infinity, 2, Infinity, Infinity],
            [Infinity, Infinity, 1, 7],
            [Infinity, Infinity, Infinity, 5],
            [Infinity, Infinity, Infinity, Infinity],
        ]);
    });
});
