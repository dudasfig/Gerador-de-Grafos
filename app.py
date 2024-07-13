from flask import Flask, request, jsonify
from flask_cors import CORS
from padilha import create_graph, insert_batch_info, insert_batch_items, get_graph_info, adj, vertex_degree, shortest_path, verify_adj, create_graph_from_file, check_eulerian
import networkx as nx
import os
app = Flask(__name__)
CORS(app)

G = nx.Graph() 

graph = None
weighted = False
directed = False
vertices = set()

@app.route('/create_graph', methods=['POST'])
def create_graph_endpoint():
    global graph, weighted, directed, vertices
    directed = request.json['directed']
    weighted = request.json['weighted']
    graph, weighted, directed = create_graph(directed, weighted)
    vertices = set()
    return jsonify({'message': 'Graph created', 'directed': directed, 'weighted': weighted})

@app.route('/insert_batch_items', methods=['POST'])
def insert_batch_items_endpoint():
    global graph, weighted
    vertices_input = request.json['vertices']
    edges_input = request.json['edges']
    
    for vertex in vertices_input:
        if vertex not in vertices:
            vertices.add(vertex)
            graph.add_node(vertex)
    
    for edge in edges_input:
        if weighted and len(edge) == 3:
            u, v, weight = edge
            graph.add_edge(u, v, weight=float(weight))
        else:
            u, v = edge[:2]
            graph.add_edge(u, v)
    
    # Prepare edges for response
    edges = [
        (u, v, graph.edges[u, v]['weight']) if 'weight' in graph.edges[u, v] else (u, v)
        for u, v in graph.edges
    ]
    
    return jsonify({'message': 'Batch items inserted', 'vertices': list(vertices), 'edges': edges})


@app.route('/insert_batch_info', methods=['POST'])
def insert_batch_info_endpoint():
    global vertices
    file = request.files['file']
    directed = request.form.get('directed', 'false').lower() in ['true', '1']
    weighted = request.form.get('weighted', 'false').lower() in ['true', '1']
    filepath = os.path.join('/tmp', file.filename)
    file.save(filepath)
    insert_batch_info(filepath, graph, vertices, weighted)
    os.remove(filepath)
    edges = [
        (u, v, graph.edges[u, v]['weight']) if 'weight' in graph.edges[u, v] else (u, v)
        for u, v in graph.edges
    ]
    return jsonify({'message': 'Batch info inserted', 'vertices': list(vertices), 'edges': edges})



@app.route('/add_vertex', methods=['POST'])
def add_vertex():
    vertex = request.json['vertex']
    if vertex not in vertices:
        vertices.add(vertex)
        graph.add_node(vertex)
        return jsonify({'message': f'Vertex {vertex} added successfully!'})
    else:
        return jsonify({'message': f'Vertex {vertex} already exists!'}), 400

@app.route('/add_edge', methods=['POST'])
def add_edge():
    start_vertex = request.json['startVertex']
    end_vertex = request.json['endVertex']
    weight = request.json.get('weight')
    if weighted and weight is not None:
        graph.add_edge(start_vertex, end_vertex, weight=float(weight))
    else:
        graph.add_edge(start_vertex, end_vertex)
    return jsonify({'message': 'Edge added successfully!'})

@app.route('/adjacency', methods=['GET'])
def adjacency_endpoint():
    vertex = request.args.get('vertex')
    try:
        neighbors, _ = adj(graph, vertex)
        return jsonify({'neighbors': neighbors})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/degree', methods=['GET'])
def degree_endpoint():
    vertex = request.args.get('vertex')
    message = vertex_degree(graph, directed, vertex)
    return jsonify({'message': message})

@app.route('/shortest_path', methods=['GET'])
def shortest_path_endpoint():
    vertex_start = request.args.get('vertex_start')
    vertex_end = request.args.get('vertex_end')
    
    if not vertex_start or not vertex_end:
        return jsonify({'error': 'Os vértices de início e fim devem ser fornecidos.'}), 400

    length, path = shortest_path(graph, vertex_start, vertex_end)
    if length is None:
        return jsonify({'error': path}), 400  # 'path' contém a mensagem de erro neste caso
    return jsonify({'length': length, 'path': " -> ".join(path)})

@app.route('/verify_adj', methods=['GET'])
def verify_adj_endpoint():
    vertex1 = request.args.get('vertex1')
    vertex2 = request.args.get('vertex2')
    result = verify_adj(graph, vertex1, vertex2)
    return jsonify({'result': result})

@app.route('/get_graph_info', methods=['GET'])
def graph_info_endpoint():
    order, size = get_graph_info(graph)
    return jsonify({'order': order, 'size': size})

@app.route('/create_graph_from_file', methods=['POST'])
def create_graph_from_file_endpoint():
    global graph, vertices
    file = request.files['file']
    filepath = os.path.join('/tmp', file.filename)
    file.save(filepath)
    graph = create_graph_from_file(filepath)
    vertices = set(graph.nodes())
    os.remove(filepath)
    edges = [
        (u, v, graph.edges[u, v]['weight']) if 'weight' in graph.edges[u, v] else (u, v)
        for u, v in graph.edges
    ]
    return jsonify({'message': 'Graph created from file', 'vertices': list(vertices), 'edges': edges})

@app.route('/check_eulerian', methods=['GET'])
def check_eulerian_endpoint():
    global graph
    # Chame a função check_eulerian
    result = check_eulerian(graph)
    return jsonify({'result': result})

@app.route('/reset_graph', methods=['POST'])
def reset_graph():
    global vertices, edges
    vertices = set()
    edges = []
    return jsonify({"message": "Graph reset successfully."})


if __name__ == '__main__':
    app.run(debug=True)
