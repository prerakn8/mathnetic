import React from 'react';
import ReactFlow, { useNodesState, useEdgesState, addEdge } from 'reactflow';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from '@react-dnd/touch-backend';

const SidebarItem = ({ type, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'node',
    item: { type, label },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {label}
    </div>
  );
};

const FlowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onDrop = (event, item) => {
    const reactFlowBounds = document.querySelector('.react-flow').getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };

    const newNode = {
      id: String(Date.now()),
      type: item.type,
      position,
      data: { label: item.label },
    };

    setNodes((prevNodes) => [...prevNodes, newNode]);
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'node',
    drop: (item, monitor) => onDrop(monitor.getClientOffset(), item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop} style={{ border: '1px solid black', height: 400, backgroundColor: isOver ? 'lightgreen' : 'white' }}>
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </div>
  );
};

const App = () => (
  <DndProvider backend={HTML5Backend}>
    <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 150, border: '1px solid black' }}>
          <SidebarItem type="input" label="Input Node" />
          <SidebarItem type="output" label="Output Node" />
        </div>
        <FlowCanvas />
      </div>
    </DndProvider>
  </DndProvider>
);

export default App;