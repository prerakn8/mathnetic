// Third-Party Imports
import React, { useRef, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls, 
  Background,
  ReactFlowProvider,
  useReactFlow,
  useStoreApi,
  SelectionMode,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Imports

// Sidebar
import Sidebar from './components/SideBar';
// import { DnDProvider, useDnD } from './components/DnDContext';
import { TypeProvider, useType } from './components/context/TypeContext';

// Node Types
import NumericNode from './components/node_types/NumericNode';
import LaTeXNode from './components/node_types/LaTeXNode';
import OutputNode from './components/node_types/OutputNode';
import { LatexEqProvider, useLatexEq } from './components/context/LatexEqContext';

const nodeTypes = {
  numeric: NumericNode,
  latex: LaTeXNode,
  output: OutputNode,
}

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { value: '1' }, type: 'numeric'},
  { id: '2', position: { x: 0, y: 100 }, data: { value: '2' }, type: 'numeric' },
  { id: '3', position: { x: 0, y: 200 }, data: { value: '+' }, type: 'latex' }
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

// Assign Unique ID to each node that was DnD'd
let id = 0;
const getId = () => `dndnode_${id++}`;

// Global Variables for Proximity Connect
const MIN_DISTANCE = 150;
 
const Flow = () => {
  // Initialize Nodes and Edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
     (params) => setEdges((eds) => addEdge(params, eds)),
     [setEdges],
  );
  const defaultEdgeOptions = { animated: true };

  // Node Tracking Variables
  const store = useStoreApi();
  const { getInternalNode } = useReactFlow();
 
  // Proximity Connect
  const getClosestEdge = useCallback((node) => {
    const { nodeLookup } = store.getState();
    const internalNode = getInternalNode(node.id);

    const closestNode = Array.from(nodeLookup.values()).reduce(
      (res, n) => {
        if (n.id !== internalNode.id) {
          const dx = n.internals.positionAbsolute.x - internalNode.internals.positionAbsolute.x;
          const dy = n.internals.positionAbsolute.y - internalNode.internals.positionAbsolute.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < res.distance && d < MIN_DISTANCE) {
            res.distance = d;
            res.node = n;
          }
        }
        return res;
      },
      {
        distance: Number.MAX_VALUE,
        node: null,
      },
    );

    if (!closestNode.node) {
      return null;
    }

    const closeNodeIsSource = closestNode.node.internals.positionAbsolute.x < internalNode.internals.positionAbsolute.x;

    return {
      id: closeNodeIsSource 
      ? `${closestNode.node.id}-${node.id}`
      : `${node.id}-${closestNode.node.id}`,
      source: closeNodeIsSource ? closestNode.node.id : node.id,
      target: closeNodeIsSource ? node.id : closestNode.node.id,
    };
  }, []);
 
  const onNodeDrag = useCallback(
    (_, node) => {
      const closeEdge = getClosestEdge(node);
 
      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp');
 
        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target,
          )
        ) {
          closeEdge.className = 'temp';
          nextEdges.push(closeEdge);
        }
 
        return nextEdges;
      });
    },
    [getClosestEdge, setEdges],
  );
 
  const onNodeDragStop = useCallback(
    (_, node) => {
      const closeEdge = getClosestEdge(node);
 
      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp');
 
        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target,
          )
        ) {
          nextEdges.push(closeEdge);
        }
 
        return nextEdges;
      });
    },
    [getClosestEdge],
  );

  // DnD Implementation 
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useType();
  const [latexEq] = useLatexEq();
  const onDragOver = useCallback(
    (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }, []);
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!type || !latexEq) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { value: `${latexEq}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type, latexEq],
  );

  const onDragStart = (event, nodeType, nodeLatexEq) => {
    setType(nodeType);
    setLatexEq(nodeLatexEq);
    event.dataTransfer.setData('text/plain', nodeType);
    event.dataTransfer.setData('text/plain', nodeLatexEq);
    event.dataTransfer.effectAllow = 'move';
  };

  return (
    <div className="dndflow">
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          defaultEdgeOptions={defaultEdgeOptions}
          SelectionMode={SelectionMode.Partial}
          nodeTypes={nodeTypes}
          fitView
        >
          <Panel position="top-center">Drag Blocks to Start Making Math!</Panel>
          <MiniMap ariaLabel="Mathnetic Mini Map" pannable zoomable/>
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      <Sidebar />
    </div>
  );
};

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <TypeProvider>
          <LatexEqProvider>
            <Flow />
          </LatexEqProvider>
        </TypeProvider>
      </ReactFlowProvider >
    </div>
  );
};