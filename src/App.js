import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Network, DataSet } from "vis-network/standalone/esm/vis-network";

import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

function App() {
  const [directed, setDirected] = useState(false);
  const [weighted, setWeighted] = useState(false);
  const [vertices, setVertices] = useState([]);
  const [edges, setEdges] = useState([]);
  const [newVertex, setNewVertex] = useState("");
  const [startVertex, setStartVertex] = useState("");
  const [endVertex, setEndVertex] = useState("");
  const [weight, setWeight] = useState("");
  const [adjVertex, setAdjVertex] = useState("");
  const [degreeMessage, setDegreeMessage] = useState([]);
  const [error, setError] = useState(null);
  const [degreeVertex, setDegreeVertex] = useState("");
  const [adjVertices, setAdjVertices] = useState([]);
  const [pathStart, setPathStart] = useState("");
  const [pathEnd, setPathEnd] = useState("");
  const [shortestPath, setShortestPath] = useState("");
  const [shortestPathLength, setShortestPathLength] = useState(null);
  const [graphInfo, setGraphInfo] = useState({
    order: 0,
    size: 0,
    vertices: [],
    edges: [],
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [insertMode, setInsertMode] = useState("batch");
  const networkRef = useRef(null);

  const [vertex1, setVertex1] = useState("");
  const [vertex2, setVertex2] = useState("");
  const [adjResult, setAdjResult] = useState(null);
  const [batchData, setBatchData] = useState("");

  const [eulerianResult, setEulerianResult] = useState(null);

  const handleCheckEulerian = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/check_eulerian");
      setEulerianResult(response.data.result);
    } catch (error) {
      console.error("Erro ao verificar se o grafo é Euleriano:", error);
    }
  };

  const handleVerifyAdjacency = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/verify_adj?vertex1=${vertex1}&vertex2=${vertex2}`
      );
      console.log(response.data.result);
      setAdjResult(response.data.result);
    } catch (error) {
      console.error("Erro ao verificar adjacência entre vértices:", error);
    }
  };

  const handleBatchInsert = async () => {
    const lines = batchData.split("\n");
    const vertices = new Set();
    const edges = [];

    lines.forEach((line) => {
      const parts = line.trim().split(" ");
      if (parts.length === 2 || parts.length === 3) {
        const [vertex1, vertex2, edgeWeight] = parts;
        vertices.add(vertex1);
        vertices.add(vertex2);

        if (parts.length === 3) {
          edges.push([vertex1, vertex2, parseFloat(edgeWeight)]);
        } else {
          edges.push([vertex1, vertex2]);
        }
      }
    });

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/insert_batch_items",
        {
          vertices: Array.from(vertices),
          edges: edges,
        }
      );
      console.log(response.data);
      setVertices(response.data.vertices || []);
      setEdges(response.data.edges || []);
      fetchGraphInfo();
      alert("Data inserted in batch successfully.");
    } catch (error) {
      console.error("Error inserting items in batch:", error);
    }
  };

  const handleGraphCreation = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:5000/create_graph", {
        directed,
        weighted,
      });
      console.log(response.data.message);
      setVertices([]);
      setEdges([]);
      fetchGraphInfo();
    } catch (error) {
      console.error("Erro ao criar grafo:", error);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Por favor, selecione um arquivo primeiro.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileContent = event.target.result;
      const lines = fileContent.split("\n");

      const newVertices = new Set(vertices);
      const newEdges = [...edges];

      lines.forEach((line) => {
        const parts = line.trim().split(" ");
        if (parts.length === 2 || parts.length === 3) {
          const [vertex1, vertex2, edgeWeight] = parts;
          newVertices.add(vertex1);
          newVertices.add(vertex2);

          if (parts.length === 3) {
            newEdges.push([vertex1, vertex2, parseFloat(edgeWeight)]);
          } else {
            newEdges.push([vertex1, vertex2]);
          }
        }
      });

      setVertices(Array.from(newVertices));
      setEdges(newEdges);

      try {
        const response = await axios.post(
          "http://127.0.0.1:5000/insert_batch_items",
          {
            vertices: Array.from(newVertices),
            edges: newEdges,
          }
        );
        console.log(response.data);
        setVertices(response.data.vertices || []);
        setEdges(response.data.edges || []);
        alert("Dados do arquivo inseridos com sucesso.");
      } catch (error) {
        console.error("Erro ao inserir dados do arquivo:", error);
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleAddVertex = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/add_vertex", {
        vertex: newVertex,
      });
      setVertices((prevVertices) => [...prevVertices, newVertex]);
      setNewVertex("");
      console.log(response.data.message);
    } catch (error) {
      console.error("Erro ao adicionar vértice:", error);
    }
  };

  const handleAddEdge = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/add_edge", {
        startVertex,
        endVertex,
        weight: weighted ? parseFloat(weight) : undefined,
      });
      setEdges((prevEdges) => [
        ...prevEdges,
        [startVertex, endVertex, weighted ? parseFloat(weight) : undefined],
      ]);
      setStartVertex("");
      setEndVertex("");
      setWeight("");
      console.log(response.data.message);
    } catch (error) {
      console.error("Erro ao adicionar aresta:", error);
    }
  };

  const handleCheckAdjacency = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/adjacency?vertex=${adjVertex}`
      );
      setAdjVertices(response.data.neighbors || []);
      setError(null);
    } catch (error) {
      console.error("Erro ao verificar adjacência:", error);
      setError("Erro ao verificar adjacência. Verifique se o vértice existe.");
      setAdjVertices([]);
    }
  };

  const handleCheckDegree = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/degree?vertex=${degreeVertex}`
      );
      setDegreeMessage(response.data.message);
      setError("");
    } catch (error) {
      console.error("Erro ao verificar grau:", error);
      setError("Erro ao verificar grau: " + error.message);
    }
  };

  const handleFindShortestPath = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/shortest_path?vertex_start=${pathStart}&vertex_end=${pathEnd}`
      );
      setShortestPath(response.data.path);
      setShortestPathLength(response.data.length);
    } catch (error) {
      console.error("Erro ao encontrar o caminho mais curto:", error);
    }
  };

  const fetchGraphInfo = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/get_graph_info");
      setGraphInfo({ order: response.data.order, size: response.data.size });
    } catch (error) {
      console.error("Erro ao obter informações do grafo:", error);
    }
  };

  useEffect(() => {
    fetchGraphInfo();
  }, []);

  const graph = {
    nodes: vertices.map((vertex, index) => ({ id: index, label: vertex })),
    edges: edges.map((edge) => ({
      from: vertices.indexOf(edge[0]),
      to: vertices.indexOf(edge[1]),
      arrows: directed ? "to" : "",
      label: edge[2] ? edge[2].toString() : undefined,
    })),
  };

  useEffect(() => {
    if (networkRef.current) {
      const data = {
        nodes: new DataSet(graph.nodes),
        edges: new DataSet(graph.edges),
      };
      const options = {
        layout: {
          hierarchical: false,
        },
        edges: {
          color: "#000000",
        },
      };
      const network = new Network(networkRef.current, data, options);
      network.fit();
    }
  }, [graph.nodes, graph.edges]);

  return (
    <Container maxWidth="md">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Graph Creator</Typography>
        </Toolbar>
      </AppBar>
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Criar Grafo
        </Typography>
        <Paper elevation={3} style={{ padding: 16 }}>
          <form onSubmit={handleGraphCreation}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Grafo é direcionado?</FormLabel>
                  <RadioGroup
                    row
                    aria-label="directed"
                    name="directed"
                    value={directed ? "yes" : "no"}
                    onChange={(e) => setDirected(e.target.value === "yes")}
                  >
                    <FormControlLabel
                      value="yes"
                      control={<Radio />}
                      label="Sim"
                    />
                    <FormControlLabel
                      value="no"
                      control={<Radio />}
                      label="Não"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Grafo é valorado?</FormLabel>
                  <RadioGroup
                    row
                    aria-label="weighted"
                    name="weighted"
                    value={weighted ? "yes" : "no"}
                    onChange={(e) => setWeighted(e.target.value === "yes")}
                  >
                    <FormControlLabel
                      value="yes"
                      control={<Radio />}
                      label="Sim"
                    />
                    <FormControlLabel
                      value="no"
                      control={<Radio />}
                      label="Não"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Criar Grafo
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
      <Box my={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Upload do Arquivo de Grafo
        </Typography>

        <Paper elevation={3} style={{ padding: 16 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <input type="file" accept=".txt" onChange={handleFileChange} />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleFileUpload}
              >
                Inserir Dados do Arquivo
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      <Box my={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Escolha o modo de inserção
        </Typography>
        <Paper elevation={3} style={{ padding: 16 }}>
          <FormControl component="fieldset">
            <RadioGroup
              row
              aria-label="insertMode"
              name="insertMode"
              value={insertMode}
              onChange={(e) => setInsertMode(e.target.value)}
            >
              <FormControlLabel
                value="batch"
                control={<Radio />}
                label="Inserir em Lotes"
              />
              <FormControlLabel
                value="single"
                control={<Radio />}
                label="Inserir um por um"
              />
            </RadioGroup>
          </FormControl>
        </Paper>
      </Box>

      {insertMode === "batch" && (
        <Box my={4}>
          <Typography variant="h5" component="h2" gutterBottom>
            Inserção de Itens em Lote
          </Typography>
          <Paper elevation={3} style={{ padding: 16 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={`Vértices e Arestas (formato: ${
                    weighted ? "v1 v2 peso" : "v1 v2"
                  }, separados por espaço)`}
                  variant="outlined"
                  multiline
                  rows={4}
                  value={batchData}
                  onChange={(e) => setBatchData(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleBatchInsert}
                >
                  Inserir Itens em Lote
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}

      {insertMode === "single" && (
        <>
          <Box my={4}>
            <Typography variant="h5" component="h2" gutterBottom>
              Adicionar Vértice
            </Typography>
            <Paper elevation={3} style={{ padding: 16 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome do Vértice"
                    variant="outlined"
                    value={newVertex}
                    onChange={(e) => setNewVertex(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleAddVertex}
                  >
                    Adicionar Vértice
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          <Box my={4}>
            <Typography variant="h5" component="h2" gutterBottom>
              Adicionar Aresta
            </Typography>
            <Paper style={{ padding: 16 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Vértice de Partida"
                    variant="outlined"
                    value={startVertex}
                    onChange={(e) => setStartVertex(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Vértice de Chegada"
                    variant="outlined"
                    value={endVertex}
                    onChange={(e) => setEndVertex(e.target.value)}
                  />
                </Grid>
                {weighted && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Peso"
                      variant="outlined"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleAddEdge}
                  >
                    Adicionar Aresta
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </>
      )}

      <Box my={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Verificar Adjacência entre Dois Vértices
        </Typography>
        <Paper elevation={3} style={{ padding: 16 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Vértice 1"
                variant="outlined"
                value={vertex1}
                onChange={(e) => setVertex1(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Vértice 2"
                variant="outlined"
                value={vertex2}
                onChange={(e) => setVertex2(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleVerifyAdjacency}
              >
                Verificar Adjacência
              </Button>
            </Grid>
          </Grid>
          {adjResult !== null && (
            <Typography variant="body1" style={{ marginTop: 16 }}>
              {adjResult}
            </Typography>
          )}
        </Paper>
      </Box>
      <Box my={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Verificar Adjacência de Vértice
        </Typography>
        <Paper elevation={3} style={{ padding: 16 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Vértice"
                variant="outlined"
                value={adjVertex}
                onChange={(e) => setAdjVertex(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleCheckAdjacency}
              >
                Verificar Adjacência
              </Button>
            </Grid>
          </Grid>
          <List>
            {adjVertices.map((vertex, index) => (
              <ListItem key={index}>
                <ListItemText primary={vertex} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <Box my={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Verificar Grau do Vértice
        </Typography>
        <Paper elevation={3} style={{ padding: 16 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Vértice"
                variant="outlined"
                value={degreeVertex}
                onChange={(e) => setDegreeVertex(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleCheckDegree}
              >
                Verificar Grau
              </Button>
            </Grid>
            {degreeMessage && (
              <Grid item xs={12}>
                <Typography variant="body1" color="textPrimary">
                  {degreeMessage}
                </Typography>
              </Grid>
            )}
            {error && (
              <Grid item xs={12}>
                <Typography variant="body1" color="error">
                  {error}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
      <Box my={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Caminho Mais Curto Entre Dois Vértices
        </Typography>
        <Paper elevation={3} style={{ padding: 16 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Vértice de Início"
                variant="outlined"
                value={pathStart}
                onChange={(e) => setPathStart(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Vértice de Fim"
                variant="outlined"
                value={pathEnd}
                onChange={(e) => setPathEnd(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleFindShortestPath}
              >
                Encontrar Caminho
              </Button>
            </Grid>
          </Grid>

          {shortestPath && (
            <Box mt={2}>
              <Typography variant="h6">Caminho mais curto:</Typography>
              <Typography>{shortestPath}</Typography>
            </Box>
          )}
          {shortestPathLength !== null && (
            <Box mt={2}>
              <Typography variant="h6">
                Comprimento do caminho mais curto:
              </Typography>
              <Typography>{shortestPathLength}</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Box my={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Verificar se o Grafo é Euleriano
        </Typography>
        <Paper elevation={3} style={{ padding: 16 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleCheckEulerian}
              >
                Verificar Eulerianidade
              </Button>
            </Grid>
            {eulerianResult !== null && (
              <Grid item xs={12}>
                <Typography variant="body1">{eulerianResult}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
      <Box my={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Informações do Grafo
        </Typography>
        <Paper elevation={3} style={{ padding: 16 }}>
          <Button variant="contained" color="primary" onClick={fetchGraphInfo}>
            Obter Informações do Grafo
          </Button>
          {graphInfo !== null && (
            <Box mt={2}>
              <Typography variant="h6">
                Ordem do Grafo: {graphInfo.order}
              </Typography>
              <Typography variant="h6">
                Tamanho do Grafo: {graphInfo.size}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
      <Box my={4}>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Typography variant="h6">Vertices</Typography>
            <Paper
              elevation={3}
              style={{ padding: 16, height: 400, overflow: "auto" }}
            >
              <List>
                {vertices.map((vertex, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={vertex} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6">Edges</Typography>
            <Paper
              elevation={3}
              style={{ padding: 16, height: 400, overflow: "auto" }}
            >
              <List>
                {edges.map((edge, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${edge[0]} - ${edge[1]} ${
                        edge[2] && `(weight: ${edge[2]})`
                      }`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      <Box my={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Visualização do Grafo
        </Typography>
        <Paper elevation={3} style={{ padding: 16 }}>
          <div ref={networkRef} style={{ height: "500px" }}></div>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
