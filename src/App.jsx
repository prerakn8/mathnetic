// "You are not expected to understand this"

// Third-Party Imports
import React, { useRef, useCallback, useState, useEffect } from 'react';
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

const nodeTypes = {
  numeric: NumericNode,
  latex: LaTeXNode,
}

// Variables to Track How Nodes Are Arranged
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
              (ne.source === closeEdge.source && ne.target === closeEdge.target) || 
              (ne.source === closeEdge.target && ne.target === closeEdge.source),
          )
        ) 
        {
          nextEdges.push(closeEdge);

          const sourceNode = reactFlowInstance.getNode(closeEdge.source);
          const targetNode = reactFlowInstance.getNode(closeEdge.target);

          if (sourceNode.id === node.id)
          {
            node.data.group = targetNode.data.group;
            if (closeEdge.targetHandle.endsWith("target1"))
            {
              node.data.row = targetNode.data.row;
              node.data.col = targetNode.data.col - 1;
            }
            else if (closeEdge.targetHandle.endsWith("target2")) {
              node.data.row = targetNode.data.row - 1;
              node.data.col = targetNode.data.col;
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
            else if (closeEdge.sourceHandle.endsWith("source2")){
              node.data.row = sourceNode.data.row + 1;
              node.data.col = sourceNode.data.col;
            }
          }

          if (sourceNode.data.group === targetNode.data.group)
          {
            console.log("I exist");
            let incomers = getIncomers(node, nodes, edges);
            let outgoers = getOutgoers(node, nodes, edges);
            let currentSourceNode = node;

            function updateSubsequentNodesOutgoers(currentSourceNode, outgoers) {
              if (outgoers.length < 1) {
                return;
              }

              outgoers.forEach((outgoing) => {
                  const connectedEdge = edges.find((edge) =>
                    edge.source === currentSourceNode.id && edge.target === outgoing.id
                  );

                  
                  if (connectedEdge.targetHandle.endsWith("target1"))
                  {
                    outgoing.data.row = currentSourceNode.data.row;
                    outgoing.data.col = currentSourceNode.data.col + 1;
                    outgoing.data.group = currentSourceNode.data.group;
                  }
                  else if (connectedEdge.targetHandle.endsWith("target2")) {
                    outgoing.data.row = currentSourceNode.data.row + 1;
                    outgoing.data.col = currentSourceNode.data.col;
                    outgoing.data.group = currentSourceNode.data.group;
                  }
                  let newOutgoers = getOutgoers(outgoing, nodes, edges);
                  updateSubsequentNodesOutgoers(outgoing, newOutgoers);
                });
            }

            function updateSubsequentNodesIncomers(currentSourceNode, incomers) {
              if (incomers.length < 1) {
                return;
              }

              incomers.forEach((incoming) => {
                  const connectedEdge = edges.find((edge) =>
                    edge.target === currentSourceNode.id && edge.source === incoming.id
                  );

                  
                  if (connectedEdge.sourceHandle.endsWith("source1"))
                  {
                    incoming.data.row = currentSourceNode.data.row;
                    incoming.data.col = currentSourceNode.data.col - 1;
                    incoming.data.group = currentSourceNode.data.group;
                  }
                  else if (connectedEdge.sourceHandle.endsWith("source2")) {
                    incoming.data.row = currentSourceNode.data.row - 1;
                    incoming.data.col = currentSourceNode.data.col;
                    incoming.data.group = currentSourceNode.data.group;
                  }
                  let newIncomers = getIncomers(incoming, nodes, edges);
                  updateSubsequentNodesIncomers(incoming, newIncomers);
                });
            }

            updateSubsequentNodesOutgoers(currentSourceNode, outgoers);
            updateSubsequentNodesIncomers(currentSourceNode, incomers);
          }
          // while (outgoers.length > 0)
          // {
          //   let currentNode = outgoers[0];
          //   outgoers.forEach((outgoing) => {
          //     // if (outgoing.id === targetNode.id)
          //     // {
          //     //   return;
          //     // };
          //     const connectedEdges = getConnectedEdges([outgoing], edges);
          //     connectedEdges.forEach((edge) => {
          //       newTargetNode = reactFlowInstance.getNode(edge.target);
          //       newSourceNode = reactFlowInstance.getNode(edge.source);
          //       if (edge.targetHandle.endsWith("target1"))
          //       {
          //         newSourceNode.data.row = outgoing.data.row;
          //         newSourceNode.data.col = outgoing.data.col - 1;
          //         newSourceNode.data.group = outgoing.data.group;

          //         // outgoing.data.row = newSourceNode.data.row;
          //         // outgoing.data.col = newSourceNode.data.col + 1;
          //         // outgoing.data.group = newSourceNode.data.group;
          //       }
          //       else if (edge.targetHandle.endsWith("target2")){
          //         newSourceNode.data.row = outgoing.data.row - 1;
          //         newSourceNode.data.col = outgoing.data.col;
          //         newSourceNode.data.group = outgoing.data.group;
          //         // outgoing.data.row = newSourceNode.data.row + 1;
          //         // outgoing.data.col = newSourceNode.data.col;
          //         // outgoing.data.group = newSourceNode.data.group;
          //       }
          //     });
          //   });
          //   outgoers = getOutgoers(currentNode, nodes, edges);
          // }

          // newSourceNode = sourceNode;
          // newTargetNode = targetNode;

          // while (incomers.length > 0)
          // {
          //   let currentNode = incomers[0];
          //   incomers.forEach((incoming) => {
          //     // if (incoming.id === sourceNode.id)
          //     // {
          //     //   return;
          //     // };
          //     const connectedEdges = getConnectedEdges([incoming], edges);
          //     connectedEdges.forEach((edge) => {
          //       newTargetNode = reactFlowInstance.getNode(edge.target);
          //       newSourceNode = reactFlowInstance.getNode(edge.source);
          //       if (edge.sourceHandle.endsWith("source1"))
          //       {
          //         newTargetNode.data.row = incoming.data.row;
          //         newTargetNode.data.col = incoming.data.col + 1;
          //         newTargetNode.data.group = incoming.data.group;
          //         // incoming.data.row = newTargetNode.data.row;
          //         // incoming.data.col = newTargetNode.data.col - 1;
          //         // incoming.data.group = newTargetNode.data.group;
          //       }
          //       else if (edge.sourceHandle.endsWith("source2")) {
          //         newTargetNode.data.row = incoming.data.row + 1;
          //         newTargetNode.data.col = incoming.data.col;
          //         newTargetNode.data.group = incoming.data.group;
          //         // incoming.data.row = newTargetNode.data.row - 1;
          //         // incoming.data.col = newTargetNode.data.col;
          //         // incoming.data.group = newTargetNode.data.group;
          //       }
          //     });
          //   });
          //   incomers = getIncomers(currentNode, nodes, edges);
          // }

          if (node.data.row > rowNum)
          {
            rowNum = node.data.row;
          } 

          if (node.data.col > colNum)
          {
            colNum = node.data.col;
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
        data: { value: `${latexEq}`, label: `${latexEq}`, 
                group: groupNum, row: rowNum, col: colNum },
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
      <Sidebar />
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