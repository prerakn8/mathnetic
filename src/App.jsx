// "You are not expected to understand this"

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
import OutputPane from './components/OutputPane';

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

// 3D?
let groupNum = 0;
let rowNum = 0;
let colNum = 0;

// Assign Unique ID to Every Node
let id = 0;
const getId = () => `dndnode_${id++}`;

// Proximity Connection Variables
const MIN_DISTANCE = 200;
 
const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const reactFlowInstance = useReactFlow();

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

    const isSourceHandleInUse = (nodeId, handleId, edges) => {
      return edges.some(
        (edge) => edge.source === nodeId && edge.sourceHandle === handleId
      ); 
    };

    const isTargetHandleInUse = (nodeId, handleId, edges) => {
      return edges.some(
        (edge) => edge.target === nodeId && edge.targetHandle === handleId
      );
    };

    let isInvalidConnection = null;

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

      if (closeNodeIsSource)
      {
        isInvalidConnection = isSourceHandleInUse(closestNode.node.id, newEdge.sourceHandle, edges);
      }
      else {
        isInvalidConnection = isTargetHandleInUse(closestNode.node.id, newEdge.targetHandle, edges);
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

      if (closeNodeIsSource)
      {
        isInvalidConnection = isSourceHandleInUse(closestNode.node.id, newEdge.sourceHandle, edges);
      }
      else {
        isInvalidConnection = isTargetHandleInUse(closestNode.node.id, newEdge.targetHandle, edges);
      }
    }

    if (isInvalidConnection)
    {
      return null;
    }

    return newEdge;
  }, [edges.filter((e) => e.className !== 'temp').length]);
 
  const onNodeDrag = useCallback(
    (_, node) => {
      const closeEdge = getClosestEdge(node);
 
      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp');
 
        if (closeEdge && !nextEdges.find(
            (ne) =>
              (ne.source === closeEdge.source && ne.target === closeEdge.target) || (ne.source === closeEdge.target && ne.target === closeEdge.source)
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

          const sourceNode = reactFlowInstance.getNode(closeEdge.source);
          const targetNode = reactFlowInstance.getNode(closeEdge.target);

          if (sourceNode === node)
          {
            node.data.group = targetNode.data.group;
            if (closeEdge.targetHandle.endsWith("target1"))
            {
              node.data.row = targetNode.data.row;
              node.data.col = targetNode.data.col - 1;
            }
            else {
              node.data.row = targetNode.data.row - 1;
              node.data.col = targetNode.data.col;
            }

            if (node.data.row > rowNum)
            {
              rowNum = node.data.row;
            }

            if (node.data.col > colNum)
            {
              colNum = node.data.col;
            }
          }
          else 
          {
            node.data.group = sourceNode.data.group;
            if (closeEdge.sourceHandle.endsWith("source1"))
            {
              node.data.row = sourceNode.data.row;
              node.data.col = sourceNode.data.col + 1;
            }
            else {
              node.data.row = sourceNode.data.row + 1;
              node.data.col = sourceNode.data.col;
            }

            if (node.data.row > rowNum)
            {
              rowNum = node.data.row;
            }

            if (node.data.col > colNum)
            {
              colNum = node.data.col;
            }
          }
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
        data: { value: `${latexEq}`, label: `${latexEq}`, group: groupNum, row: rowNum, col: colNum },
      };

      groupNum += 1;

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
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          defaultEdgeOptions={defaultEdgeOptions}
          SelectionMode={SelectionMode.Partial}
          nodeTypes={nodeTypes}
          snapToGrid
          fitView
        >
          <Panel position="top-center">Drag Blocks to Start Making Math!</Panel>
          <MiniMap ariaLabel="Mathnetic Mini Map" pannable zoomable/>
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      <Sidebar />
      <OutputPane groupNum={groupNum} rowNum={rowNum} colNum={colNum}/>
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