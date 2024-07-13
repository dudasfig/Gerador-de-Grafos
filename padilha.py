import networkx as nx

def create_graph(directed, weighted):
    if directed:
        G = nx.DiGraph()
    else:
        G = nx.Graph()
    return G, weighted, directed

def insert_batch_info(filename, graph, vertices, weighted):
    try:
        with open(filename, 'r') as file:
            for line in file:
                line_info = line.strip().split()
                if weighted:
                    if len(line_info) != 3:
                        continue
                    v1, v2, weight = line_info
                    weight = float(weight)
                else:
                    if len(line_info) != 2:
                        continue
                    v1, v2 = line_info

                if v1 not in vertices:
                    vertices.add(v1)
                    graph.add_node(v1)
                if v2 not in vertices:
                    vertices.add(v2)
                    graph.add_node(v2)

                if weighted:
                    graph.add_edge(v1, v2, weight=weight)
                else:
                    graph.add_edge(v1, v2)
    except FileNotFoundError:
        print("Arquivo não encontrado!")



def insert_batch_items(G, weighted):
    vertices_input = input("Digite os vértices separados por espaço: ").split()
    G.add_nodes_from(vertices_input)

    edges_input = input("Digite as arestas separadas por espaço: ").split()
    i = 0
    while i < len(edges_input):
        u = edges_input[i]
        v = edges_input[i + 1]
        if weighted and i + 2 < len(edges_input) and edges_input[i + 2].isdigit():
            weight = float(edges_input[i + 2])
            G.add_edge(u, v, weight=weight)
            i += 3
        else:
            G.add_edge(u, v)
            i += 2

def create_graph_from_file(filename):
    graph, weighted, directed = create_graph()  
    vertices = set()
    insert_batch_items(filename, graph, vertices, weighted)  
    return graph

def get_graph_info(graph):
    order = len(graph.nodes)
    size = len(graph.edges)
    return order, size

def adj(graph, vertex):
    if vertex not in graph:
        raise ValueError(f"The vertex {vertex} is not in the graph.")
    
    neighbors = list(graph.neighbors(vertex))
    return neighbors, neighbors


def vertex_degree(graph, directed, vertex):
    message = ""
    if directed:
        in_edges, out_edges = adj(graph, vertex)
        message += f"\nO grau do vértice de entrada é: {len(in_edges)}\n"
        message += f"\nO grau do vértice de saída é: {len(out_edges)}"
    else:
        degree = graph.degree[vertex]
        if (vertex, vertex) in graph.edges:
            degree -= 1
        message = f"O grau do vértice é: {degree}" 
    return message

def verify_adj(graph, vertex1, vertex2):
    
    if vertex2 in graph.neighbors(vertex1) or vertex1 in graph.neighbors(vertex2):
        return "São adjacentes"
    else:
        return "Não são adjacentes"

def shortest_path(graph, vertex_start, vertex_end):
    try:
        length, path = nx.single_source_dijkstra(graph, vertex_start, vertex_end)
        if path:
            return length, path
        else:
            return None, "Não há caminho entre os vértices fornecidos."
    except nx.NetworkXNoPath:
        return None, "Não há caminho entre os vértices fornecidos."
    except nx.NodeNotFound as e:
        return None, str(e)
    
def check_eulerian(graph):
    is_eulerian = nx.is_eulerian(graph)
    has_eulerian_path = nx.has_eulerian_path(graph)
    
    if is_eulerian:
        return "O grafo é Euleriano."
    elif has_eulerian_path:
        return "O grafo é Semi-Euleriano."
    else:
        # Check if the graph is semi-eulerian
        odd_degree_vertices = [v for v in graph.nodes if graph.degree(v) % 2 != 0]
        if len(odd_degree_vertices) == 2:
            return "O grafo é Semi-Euleriano."
        else:
            return "O grafo não é Euleriano nem Semi-Euleriano."
