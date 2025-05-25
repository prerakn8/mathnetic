// Third-Party Imports
import React, { useRef, useCallback, useState } from 'react';
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
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  useNodeConnections,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Imports
import Sidebar from './components/SideBar';

import { TypeProvider, useType } from './components/context/TypeContext';
import { LatexEqProvider, useLatexEq } from './components/context/LatexEqContext';

import NumericNode from './components/node_types/NumericNode';
import LaTeXNode from './components/node_types/LaTeXNode';
import OutputNode from './components/node_types/OutputNode';

const nodeTypes = {
  numeric: NumericNode,
  latex: LaTeXNode,
  output: OutputNode,
}

// Track Nodes and Edges in Workspace (3D Blocks)
const workspaceNodes = [];
const workspaceEdges = [];

// Assign Unique ID to Every Node
let id = 0;
const getId = () => `dndnode_${id++}`;

// Proximity Connection Variables
const MIN_DISTANCE = 150;
 
const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const reactFlowInstance = useReactFlow();

  const onConnect = useCallback((params) => 
    {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodesDelete = useCallback((deleted) => 
    {
      setEdges(deleted.reduce((acc, node) => 
        {
          const incomers = getIncomers(node, nodes, edges);
          const outgoers = getOutgoers(node, nodes, edges);
          const connectedEdges = getConnectedEdges([node], edges);

          const remainingEdges = acc.filter(
            (edge) => !connectedEdges.includes(edge),
          );

          const createdEdges = incomers.flatMap(({ id: source }) => 
            outgoers.map(({ id: target }) => ({
              id: `${source}->${target}`,
              source,
              sourceHandle: connectedEdges[0].sourceHandle,        
              target,
              targetHandle: connectedEdges[0].targetHandle,
            })),
          );

          return [...remainingEdges, ...createdEdges];
        }, edges),
      );
    },
    [nodes, edges],
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

    const xDistance = closestNode.node.internals.positionAbsolute.x - internalNode.internals.positionAbsolute.x;
    const yDistance = closestNode.node.internals.positionAbsolute.y - internalNode.internals.positionAbsolute.y;
    
    const lessHorizontalDistance = Math.abs(xDistance) < Math.abs(yDistance);

    let newEdge = null;

    if (!lessHorizontalDistance) {
      const closeNodeIsSource = xDistance < 0;

      newEdge = {
        id: closeNodeIsSource 
        ? `${closestNode.node.id}-${node.id}`
        : `${node.id}-${closestNode.node.id}`,
        source: closeNodeIsSource ? closestNode.node.id : node.id,
        sourceHandle: closeNodeIsSource ? `${closestNode.node.id}_source1` : `${node.id}_source1`,
        targetHandle: closeNodeIsSource ? `${node.id}_target1` : `${closestNode.node.id}_target1`,
        target: closeNodeIsSource ? node.id : closestNode.node.id,
      }
    }
    else {
      const closeNodeIsSource = yDistance < 0;

      newEdge = {
        id: closeNodeIsSource 
        ? `${closestNode.node.id}-${node.id}`
        : `${node.id}-${closestNode.node.id}`,
        source: closeNodeIsSource ? closestNode.node.id : node.id,
        sourceHandle: closeNodeIsSource ? `${closestNode.node.id}_source2` : `${node.id}_source2`,
        targetHandle: closeNodeIsSource ? `${node.id}_target2` : `${closestNode.node.id}_target2`,
        target: closeNodeIsSource ? node.id : closestNode.node.id,
      }
    }

    const sourceNode = reactFlowInstance.getNode(newEdge.source);
    const targetNode = reactFlowInstance.getNode(newEdge.target);
    
    const connectedSourceEdges = getConnectedEdges([sourceNode], edges);
    const connectedTargetEdges = getConnectedEdges([targetNode], edges);

    const invalidSourceConnection = connectedSourceEdges.some(
      edge => {
        return (edge.sourceHandle === newEdge.sourceHandle);
      }
    );
    const invalidTargetConnection = connectedTargetEdges.some(
      edge => {
        return (edge.targetHandle === newEdge.targetHandle);
      }
    );

    if (invalidSourceConnection || invalidTargetConnection)
    {
      return null;
    }

    return newEdge;
  }, []);
 
  const onNodeDrag = useCallback(
    (_, node) => {
      const closeEdge = getClosestEdge(node);
 
      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp');
 
        if (closeEdge && !nextEdges.find(
            (ne) =>
              (ne.source === closeEdge.source && ne.target === closeEdge.target) || (ne.source === closeEdge.target && ne.target === closeEdge.source),
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
              (ne.source === closeEdge.source && ne.target === closeEdge.target) || (ne.source === closeEdge.target && ne.target === closeEdge.source),
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

      if (!type) {
        return;
      }

      if (!latexEq && type !== 'output') {
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
        data: { value: `${latexEq}`, label: `${latexEq}` },
      };

      workspaceNodes.push(newNode);

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
          onNodesDelete={onNodesDelete}
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