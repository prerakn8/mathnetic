import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  Panel,
  NodeToolbar,
  NodeResizer,
  useNodesState,
  useEdgesState,
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { initialNodes } from './initialNodes';
import { initialEdges } from './initialEdges';
 
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
 
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );
 
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        defaultEdgeOptions={{ animated: true }}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}