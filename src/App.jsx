import React, { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState, // If you need more customization, use applyNodeChanges and applyEdgeChanges
  useEdgesState,
  addEdge,
  SelectionMode,
  MiniMap,
  Panel,
  ReactFlowProvider
} from '@xyflow/react';
 
import '@xyflow/react/dist/style.css';
import NumericNode from './components/node_types/NumericNode';
import LaTeXNode from './components/node_types/LaTeXNode';

const nodeTypes = {
  numeric: NumericNode,
  latex: LaTeXNode
}

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { value: '1' }, type: 'numeric'},
  { id: '2', position: { x: 0, y: 100 }, data: { value: '2' }, type: 'numeric' },
  { id: '3', position: { x: 0, y: 200 }, data: { value: '+' }, type: 'latex' }
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];
 
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
 
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );
 
  const defaultEdgeOptions = { animated: true };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
      </ReactFlowProvider>
    </div>
  );
}