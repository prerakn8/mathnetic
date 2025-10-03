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
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useDrop } from 'react-dnd';

// Custom Imports
import Sidebar from './components/SideBar';
import OutputPane from './components/OutputPane';
import ContextMenu from './components/ContextMenu';

import { TypeProvider, useType } from './components/context/TypeContext';
import { LatexEqProvider, useLatexEq } from './components/context/LatexEqContext';

import NumericNode from './components/node_types/NumericNode';
import LaTeXNode from './components/node_types/LaTeXNode';
import ArithmeticNode from './components/node_types/ArithmeticNode';
import VariableNode from './components/node_types/VariableNode';
import NewNode from './components/node_types/NewNode'       //adds newnode

const nodeTypes = {
  numeric: NumericNode,
  latex: LaTeXNode,
  arithmetic: ArithmeticNode,
  variable: VariableNode
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
  const [menu, setMenu] = useState(null);
  const ref = useRef(null);
  const reactFlowInstance = useReactFlow();

  const onNodeContextMenu = useCallback(
    (event, node) => {
      // Prevent native context menu from showing
      event.preventDefault();
 
      // Calculate position of the context menu. We want to make sure it
      // doesn't get positioned off-screen.
      const pane = ref.current.getBoundingClientRect();
      setMenu({
        id: node.id,
        top: event.clientY < pane.height - 200 && event.clientY,
        left: event.clientX < pane.width - 200 && event.clientX,
        right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
        bottom:
          event.clientY >= pane.height - 200 && pane.height - event.clientY,
      });
    },
    [setMenu],
  );
 
  // Close the context menu if it's open whenever the window is clicked.
  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  // Handles deleting an edge by connecting the incomers and outgoers and deleting edges to the nodes
  const onNodesDelete = useCallback((deleted) => 
    {
      setEdges(deleted.reduce((acc, node) => 
        {
          const incomers = getIncomers(node, nodes, edges);         // Source nodes of current node
          const outgoers = getOutgoers(node, nodes, edges);         // Target nodes of current node
          const connectedEdges = getConnectedEdges([node], edges);  // All edges that are connected to the node (source or target)

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

          return [...remainingEdges];
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
    const internalNode = getInternalNode(node.id); // Node being used


    // Creates an object that stores the closest node and its distance from node
    const closestNode = Array.from(nodeLookup.values()).reduce(    // Essentially iterates through array of nodes with the function, transferring the previous res each time
      (res, n) => {                                                // res holds the closest node and its distance at any point during the iteration, n is the current node
        if (n.id !== internalNode.id) {    // Skips over internal node when iterating through the nodes                      
          const dx = n.internals.positionAbsolute.x - internalNode.internals.positionAbsolute.x; // Finding distance
          const dy = n.internals.positionAbsolute.y - internalNode.internals.positionAbsolute.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < res.distance && d < MIN_DISTANCE) {               // Updating res if the distance is close enough to connect and lower than all other iterations
            res.distance = d;
            res.node = n;
          }
        }
        return res; //returns res for the next iteration
      },
      {
        distance: Number.MAX_VALUE, // Initial res
        node: null,
      }
    );


    if (!closestNode.node) {           // if no node was found, end the function (probably mainly when the node was not within MIN_DISTANCE of another node)
      return null;
    }

    // The rest of the function creates a new edge between the closest node and internal node

    // Finds distance in x and y directions (NOT absolute value)
    const xDistance = closestNode.node.internals.positionAbsolute.x - internalNode.internals.positionAbsolute.x;
    const yDistance = closestNode.node.internals.positionAbsolute.y - internalNode.internals.positionAbsolute.y;
    
      const lessHorizontalDistance = Math.abs(xDistance) < Math.abs(yDistance);

    let newEdge = null;

    // Finds if a given handle is the source of any edges
    const isSourceHandleInUse = (nodeId, handleId, edges) => {
      return edges.some(
        (edge) => edge.source === nodeId && edge.sourceHandle === handleId
      ); 
    };

    // Finds if a given handle is the target of any edges    
    const isTargetHandleInUse = (nodeId, handleId, edges) => {
      return edges.some(
        (edge) => edge.target === nodeId && edge.targetHandle === handleId
      );
    };

    let isInvalidConnection = null;

    if (!lessHorizontalDistance) {
      const closeNodeIsSource = xDistance < 0; // Boolean to determine which node is source based on which one is to the right

      newEdge = {                  // Creates an edge. Ternary statements set closest node as source and node as target or vice versa based on "closeNodeIsSource"
        id: closeNodeIsSource 
            ? `${closestNode.node.id}-${node.id}`
            : `${node.id}-${closestNode.node.id}`,
        source: closeNodeIsSource ? closestNode.node.id : node.id,
        sourceHandle: closeNodeIsSource ? `${closestNode.node.id}_source1` : `${node.id}_source1`,
        targetHandle: closeNodeIsSource ? `${node.id}_target1` : `${closestNode.node.id}_target1`,
        target: closeNodeIsSource ? node.id : closestNode.node.id,
      }

      if (closeNodeIsSource)        // Error handling by checking if the correct handles on the closest node are connected to the new edge
      {
          isInvalidConnection = isSourceHandleInUse(closestNode.node.id, newEdge.sourceHandle, edges);
      }
      else {
        isInvalidConnection = isTargetHandleInUse(closestNode.node.id, newEdge.targetHandle, edges);
      }

    }
    else {                                      // Vertical connections (identical, but with x and y swapped and different corresponding handles)
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


    //if (isInvalidConnection)
    //{
    //  return null;
    //}

    return newEdge;                     // Returns newly created edge

  }, [edges.filter((e) => e.className !== 'temp').length]);  // The one dependency for this useCallback is the number of non-temporary edges
 

  const onNodeDrag = useCallback(
    (_, node) => {
      const closeEdge = getClosestEdge(node); // Finds closest edge
 
      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp'); // removes all temp edges
 
        if (closeEdge && !nextEdges.find(
            (ne) =>
              (ne.source === closeEdge.source && ne.target === closeEdge.target) || 
              (ne.source === closeEdge.target && ne.target === closeEdge.source) // checks if already connected
          ) 

        ) {

          closeEdge.className = 'temp'; // makes temporary
          nextEdges.push(closeEdge); // adds the edge
        }

        return nextEdges;
      });
    },
    [getClosestEdge, setEdges],
  );
 
  const onNodeDragStop = useCallback(

      (_, node) => {
          console.log(node.data.leftNode);
      const closeEdge = getClosestEdge(node); // finds closest edge
 
      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp'); // gets rid of all temp edges
 
        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              (ne.source === closeEdge.source && ne.target === closeEdge.target) || 
              (ne.source === closeEdge.target && ne.target === closeEdge.source), // If closeEdge is not already added
          )
        ) 

        {
          nextEdges.push(closeEdge); // add closeEdge to edges

          const sourceNode = reactFlowInstance.getNode(closeEdge.source); // gets source and target node of closeEdge
          const targetNode = reactFlowInstance.getNode(closeEdge.target);

          if (sourceNode.id === node.id)
          {
            // if this node is the source, set this node's group ID equal to target's group
            node.data.group = targetNode.data.group;

            // Set row and column of node based on which direction the edge is in. The correspondence of edges to targetHandle is defined in the node types
            if (closeEdge.targetHandle.endsWith("target1"))
            {
              node.data.row = targetNode.data.row; // same row
              node.data.col = targetNode.data.col - 1; // left column
              node.data.rightNode = targetNode.id;  // set left and right connection
              targetNode.data.leftNode = node.id;
            }
            else if (closeEdge.targetHandle.endsWith("target2")) {
              node.data.row = targetNode.data.row - 1; // above row ?
              node.data.col = targetNode.data.col; // same column
              node.data.upperNode = targetNode.id;  // set upper and lower connection
              targetNode.data.lowerNode = node.id;
            }


          }
          else
          {
            // if this node is the target, set this node's group equal to source's group
            node.data.group = sourceNode.data.group;
            if (closeEdge.sourceHandle.endsWith("source1"))
            {
              node.data.row = sourceNode.data.row;     // Same row
              node.data.col = sourceNode.data.col + 1; // Right column
              node.data.leftNode = sourceNode.id;       // set left and right connection
              sourceNode.data.rightNode = node.id;
            }
            else if (closeEdge.sourceHandle.endsWith("source2")){

              node.data.row = sourceNode.data.row + 1;
              node.data.col = sourceNode.data.col;
              node.data.lowerNode = targetNode.id;      // set upper and lower connection
              targetNode.data.upperNode = node.id;
            }



          }

            nextEdges.push(closeEdge); // add closest edge

          // Updates the row and column data all other nodes
          if (sourceNode.data.group === targetNode.data.group)
          {
            let incomers = getIncomers(node, nodes, edges);     // returns array of nodes that are a source to node
            let outgoers = getOutgoers(node, nodes, edges);     // returns array of nodes that are a target to node
            let currentSourceNode = node;

            function updateSubsequentNodesOutgoers(currentSourceNode, outgoers) {
              if (outgoers.length < 1) {            // End function if the node has no targets
                return;
              }

              outgoers.forEach((outgoing) => {                          // runs following function for each outgoer (basically a for loop)
                  const connectedEdge = edges.find((edge) =>            // finds edge that goes between node and current outgoer in edges
                    edge.source === currentSourceNode.id && edge.target === outgoing.id
                  );

                  
                  if (connectedEdge.targetHandle.endsWith("target1"))           // Right outgoer
                  {
                    outgoing.data.row = currentSourceNode.data.row;
                    outgoing.data.col = currentSourceNode.data.col + 1;
                    outgoing.data.group = currentSourceNode.data.group;
                  }
                  else if (connectedEdge.targetHandle.endsWith("target2")) {    // Upper outgoer
                    outgoing.data.row = currentSourceNode.data.row + 1;
                    outgoing.data.col = currentSourceNode.data.col;
                    outgoing.data.group = currentSourceNode.data.group;
                  }
                  let newOutgoers = getOutgoers(outgoing, nodes, edges);    // Recursively updates all other outogoers
                  updateSubsequentNodesOutgoers(outgoing, newOutgoers);
              });
            }

            function updateSubsequentNodesIncomers(currentSourceNode, incomers) {       // Same but for incomers (bottom and left)
              if (incomers.length < 1) {
                return;
              }

              incomers.forEach((incoming) => {
                  const connectedEdge = edges.find((edge) =>
                    edge.target === currentSourceNode.id && edge.source === incoming.id
                  );

                  
                  if (connectedEdge.sourceHandle.endsWith("source1"))               // Left incomer
                  {
                    incoming.data.row = currentSourceNode.data.row;
                    incoming.data.col = currentSourceNode.data.col - 1;
                    incoming.data.group = currentSourceNode.data.group;
                  }
                  else if (connectedEdge.sourceHandle.endsWith("source2")) {        // Bottom incomer
                    incoming.data.row = currentSourceNode.data.row - 1;
                    incoming.data.col = currentSourceNode.data.col;
                    incoming.data.group = currentSourceNode.data.group;
                  }
                  let newIncomers = getIncomers(incoming, nodes, edges);
                  updateSubsequentNodesIncomers(incoming, newIncomers);
                });
            }

            updateSubsequentNodesOutgoers(currentSourceNode, outgoers);        // Calling the previous two functions
            updateSubsequentNodesIncomers(currentSourceNode, incomers);
          }

          if (node.data.row > rowNum)       // Updating count of rows and columns
          {
            rowNum = node.data.row;
          } 

          if (node.data.col > colNum)
          {
            colNum = node.data.col;
          } 
        }
 
        return nextEdges;   // Returns array of edges that includes the new edge
      });

    },
    [getClosestEdge],
  );

  // DnD Implementation 
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useType();                             // Context that gives type of currently dragged node
  const [latexEq] = useLatexEq();                       // Context that gives LaTeX equation of currently dragged node (Both provided by sidebar)
 
  const onDragOver = useCallback(                       // Graphic effect for when node is dragged over viewport
    (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }, []);
  
  const onDrop = useCallback((event) => {               // When node is dropped onto the viewport
      event.preventDefault();

      if (!type) {                                      // Return if type is null
        return;
      }

      if (!latexEq && type !== 'output') {              // Special case for the unused output node
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {                                 // Creates new node using position and contexts                          
        id: getId(),
        type,
        position,
        data: { value: `${latexEq}`, label: `${latexEq}`, 
                group: groupNum, row: rowNum, col: colNum, leftNode: '', rightNode: '', upperNode: '', lowerNode: ''},
      };
      console.log(groupNum);
      groupNum += 1;

      setNodes((nds) => nds.concat(newNode));   // Adds new node to nodes
    },
    [screenToFlowPosition, type, latexEq],      // dependencies for UseCallback()
  );

  const onDragStart = (event, nodeType, nodeLatexEq) => { 
    setType(nodeType);                                     
    setLatexEq(nodeLatexEq);
    event.dataTransfer.setData('text/plain', nodeType);
    event.dataTransfer.setData('text/plain', nodeLatexEq);
    event.dataTransfer.effectAllow = 'move';
  };

  
  // Final return for <flow/>
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
          ref={ref}
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          defaultEdgeOptions={defaultEdgeOptions}
          SelectionMode={SelectionMode.Partial}
          nodeTypes={nodeTypes}
          snapToGrid
          fitView
          className="reactflow-container"
        >
          <Panel position="top-center">Drag Blocks to Start Making Math!</Panel>
          <MiniMap ariaLabel="Mathnetic Mini Map" pannable zoomable/>
          <Controls />
          <Background variant="dots" gap={12} size={1} />
          {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
        </ReactFlow>
      </div>
      <OutputPane groupNum={groupNum} rowNum={rowNum} colNum={colNum}/>
    </div>
  );
};

// Exports flow (Entire above part of app.jsx) within necessary context providers

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>                                             
        <TypeProvider>
          <LatexEqProvider>
            <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
            <Flow />
            </DndProvider>
          </LatexEqProvider>
        </TypeProvider>
      </ReactFlowProvider >
    </div>
  );
};