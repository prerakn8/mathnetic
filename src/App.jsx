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

import NumericNode from './components/node_types/NumericNode';      // nodes for integer numbers
import LaTeXNode from './components/node_types/LaTeXNode';                  //node for complex math symbols, ex fractions (https://latex.js.org/usage.html#library)
import ArithmeticNode from './components/node_types/ArithmeticNode';        //nodes for math operators (+ - * /)
import VariableNode from './components/node_types/VariableNode';         //nodes for letter variables
import NewNode from './components/node_types/NewNode';              //a node we (co2026) used for testing nodes that create other nodes (ex. FractionNode). has no real purpose now
import VerticalConnector from './components/node_types/VerticalConnector';      //connector node used and created by fractionnode
import ExponentNode from './components/node_types/ExponentNode';                //exponentnode can be clicked and snapped onto any other node
import FractionNode from './components/node_types/FractionNode';                //fractionnode creates two verticalconnector nodes. one above and one below it.
import StartNode from './components/node_types/StartNode';                      //signals to the computer that it should send output data starting with the node that it connects to

const nodeTypes = {
  numeric: NumericNode,
  latex: LaTeXNode,
  arithmetic: ArithmeticNode,
  variable: VariableNode,
  test: NewNode,
  connector: VerticalConnector,
  exponent: ExponentNode,
  fraction: FractionNode,
  start: StartNode
};

const upperConnectionTypes = ['test', 'fraction'];      // Keep track of which types need upper and lower connections
const lowerConnectionTypes = ['test', 'fraction'];

const source1Types = ['numeric', 'latex', 'arithmetic', 'variable', 'test','connector', 'fraction', 'start'];   //a list of node types that can connect to other nodes [X]->-[ ]
const target1Types = ['numeric', 'latex', 'arithmetic', 'variable', 'test', 'fraction'];                        //a list of nodes that can be connected to [ ]->-[X]
const source2Types = ['numeric', 'latex', 'arithmetic', 'variable'];        //a list of nodes that can connect to other nodes vertically  [X]
                                                                                                                                       //  |
                                                                                                                                       // [ ]

const target2Types = ['numeric', 'latex', 'arithmetic', 'variable'];//a list of nodes that can be connected to other nodes vertically     [ ]
                                                                                                                                       //  |
                                                                                                                                       // [X]

// Variables to Track How Nodes Are Arranged
let groupNum = 0;
let rowNum = 0;
let colNum = 0;

// Assign Unique ID to Every Node
let id = 0;
const getId = () => `dndnode_${id++}`;

// Proximity Connection Variables
const MIN_DISTANCE = 200;

// Constants to represent the position offsets of nodes that are tied to a parent node
const LOWER_POSITION_REL = { x: -20, y: 50 };
const UPPER_POSITION_REL = { x: -20, y: -30 };
const EXP_POSITION_REL = { x: 50, y: -25 }

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);           // Declaring states and state changers for nodes and edges. 
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);                               // Context menu for right click (used for testing)
  const ref = useRef(null);
  let lastClicked = useRef(null);                                       // Used to track the last node that has been clicked (for exponent node)
  const reactFlowInstance = useReactFlow();                             // useReactFlow() gets a react flow instance or some of its functions
  const {getNode, deleteElements} = useReactFlow();

      
  const moveNode = (nodeId, newX, newY) => {                            // Helper function to move a node. This form of state setting is common throughout the program
    setNodes((nds) =>                                                   // Nodes should never be modified directly, you should instead use setNodes. 
        nds.map((node) => {                                             // the map function goes through the array and fills in a new array by running the function for each node
            if (node.id === nodeId) {                                   // In this function, the node is returned (added back the same) if it is not the node being moved, and the node that is being moved
                return { ...node, position: { x: newX, y: newY } };     // is replaced by an identical node with a different position
            }
            return node;
        })
    );
  };

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


    //this onNodeClick function handles custom click functionality for nodes (exponentnode)
    const onNodeClick = useCallback((event, node) => {
                    //checks if you click an exponentnode and then you click a numeric or variable node to snap the exponentnode to the other node
        if (lastClicked.type == 'exponent' && (node.type == "numeric" || node.type == "variable")) { 
            
          
            setNodes((nds) =>   //this basically runs through every node and sets its exponentConnection to an empty string except for the one that just got connected
                                    //(this is really weird so dont touch)
                nds.map((node) => {
                    if (node.data.exponentConnection == lastClicked.data.exponentConnection && node.id != lastClicked.id) {
                        return { ...node, data: {...node.data, exponentConnection: ''} };
                    }
                    return node;
                })
            );

            //  changing/setting exponent node location and data (lastClicked is the exponentnode, node is the most recently clicked node)
            lastClicked.position.x = node.position.x + 50;
            lastClicked.position.y = node.position.y - 25;
            node.data.exponentConnection = lastClicked.id;
            
        }

        lastClicked = node; //sets the lastClicked node to the actual last clicked node

    }, []);

  // Handles deleting an edge by connecting the incomers and outgoers and deleting edges to the nodes
    const onNodesDelete = useCallback((deleted) => {
        deleted.forEach((nd) => {                               // Anything but a for loop
            if (nd.type == 'connector')                         // Skips if the node is a connector (this would cause an error)
                return;
            if (nd.data.connectors.upper != '')                 // Removes connection data from node
                deleteElements({ nodes: [{ id: nd.data.connectors.upper }] });
            if (nd.data.connectors.lower != '')
                deleteElements({ nodes: [{ id: nd.data.connectors.lower }] });


            setNodes((nds) =>                                   // Removes nodes in deleted from the nodes array and any connectors attached to those nodes
                nds.filter((node) => {
                    return !(node === nd || (node.type == 'connector' && node.data.origin == nd.id));
                })
            );
        });

        deleted.forEach((nd) => {                               // Removes connections of nodes that were previously attached to the deleted node
            if (source1Types.includes(nd.type) && nd.rightConnection != '')
                getNode(id).leftConnection = '';
            if (source2Types.includes(nd.type) && nd.leftConnection != '')
                getNode(id).rightConnection = '';
            if (target2Types.includes(nd.type) && nd.upperConnection != '')
                getNode(id).lowerConnection = '';
            if (target1Types.includes(nd.type) && nd.lowerConnection != '')
                getNode(id).upperConnection = '';
        });

      setEdges(deleted.reduce((acc, node) => 
        {
          //const incomers = getIncomers(node, nodes, edges);         // Source nodes of current node
          //const outgoers = getOutgoers(node, nodes, edges);         // Target nodes of current node
          const connectedEdges = getConnectedEdges([node], edges);  // All edges that are connected to the node (source or target)

          const remainingEdges = acc.filter(                             
            (edge) => !connectedEdges.includes(edge),
          );

          //const createdEdges = incomers.flatMap(({ id: source }) => 
          //  outgoers.map(({ id: target }) => ({
          //    id: `${source}->${target}`,
          //    source,
          //    sourceHandle: connectedEdges[0].sourceHandle,        
          //    target,
          //    targetHandle: connectedEdges[0].targetHandle,
          //  })),
          /*);*/

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
 
  // Proximity Connect (this needs some heavy reworking to fix bugs and minimize interference between nodes)
  const getClosestEdge = useCallback((node) => {

    const { nodeLookup } = store.getState();
    const internalNode = getInternalNode(node.id); // Node being used

      const validNodes = Array.from(nodeLookup.values()).filter(n => {
          if (n.type === 'connector') {
              return n.origin === internalNode.id || n.internals.positionAbsolute.x > internalNode.internals.positionAbsolute.x;
          }       //^^makes sure that a connector node doesnt try to connect to its linked parent node
          return n.id !== internalNode.id;
      })

    // Creates an object that stores the closest node and its distance from node
      const closestNode = validNodes.reduce(    // Essentially iterates through array of nodes with the function, transferring the previous res each time
          (res, n) => {
          // res holds the closest node and its distance at any point during the iteration, n is the current node
          const dx = n.internals.positionAbsolute.x - internalNode.internals.positionAbsolute.x; // Finding distance
          const dy = n.internals.positionAbsolute.y - internalNode.internals.positionAbsolute.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < res.distance && d < MIN_DISTANCE) {               // Updating res if the distance is close enough to connect and lower than all other iterations
            res.distance = d;
            res.node = n;
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

    const handleExists = (node, handleSuffix) => {      // Helper function to check if a node has a certain type of handle (left right upper lower).
        if (handleSuffix == "_source1")                 // Uses arrays from near the top of the file to check if the node type should have the handle
            return source1Types.includes(node.type);
        if (handleSuffix == "_source2")
            return source2Types.includes(node.type);
        if (handleSuffix == "_target1")
            return target1Types.includes(node.type);
        if (handleSuffix == "_target2")
            return target2Types.includes(node.type);
        return false;
    }
    

    let isInvalidConnection = null;

    if (!lessHorizontalDistance) {
        const closeNodeIsSource = xDistance < 0; // Boolean to determine which node is source based on which one is to the right

        if ((closeNodeIsSource && handleExists(closestNode.node, "_source1") && handleExists(node, "_target1")) ||
            (!closeNodeIsSource && handleExists(closestNode.node, "_target1") && handleExists(node, "_source1"))) {

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
    }

    else {                                      // Vertical connections (identical, but with x and y swapped and different corresponding handles)
        const closeNodeIsSource = yDistance < 0;

        if ((closeNodeIsSource && handleExists(closestNode.node, "_source2") && handleExists(node, "_target2")) ||
            (!closeNodeIsSource && handleExists(closestNode.node, "_target2") && handleExists(node, "_source2"))) {
            newEdge = {
                id: closeNodeIsSource
                    ? `${closestNode.node.id}-${node.id}`
                    : `${node.id}-${closestNode.node.id}`,
                source: closeNodeIsSource ? closestNode.node.id : node.id,
                sourceHandle: closeNodeIsSource ? `${closestNode.node.id}_source2` : `${node.id}_source2`,
                targetHandle: closeNodeIsSource ? `${node.id}_target2` : `${closestNode.node.id}_target2`,
                target: closeNodeIsSource ? node.id : closestNode.node.id,
            }

            if (closeNodeIsSource) {
                isInvalidConnection = isSourceHandleInUse(closestNode.node.id, newEdge.sourceHandle, edges);
            }
            else {
                isInvalidConnection = isTargetHandleInUse(closestNode.node.id, newEdge.targetHandle, edges);
            }
        }
    }


    if (isInvalidConnection)
    {
      return null;
    }

    return newEdge;                     // Returns newly created edge

  }, [edges.filter((e) => e.className !== 'temp').length]);  // The one dependency for this useCallback is the number of non-temporary edges
 

  const onNodeDrag = useCallback(
    (_, node) => {
        if (node.data.exponentConnection != '')   //moving exponent nodes with its coefficient
        {
            moveNode(node.data.exponentConnection, node.position.x + EXP_POSITION_REL.x, node.position.y + EXP_POSITION_REL.y);
        }

        if (upperConnectionTypes.includes(node.type))
        {
            moveNode(node.data.connectors.upper, node.position.x + UPPER_POSITION_REL.x, node.position.y + UPPER_POSITION_REL.y);
        }

        if (lowerConnectionTypes.includes(node.type))
        {
            moveNode(node.data.connectors.lower, node.position.x + LOWER_POSITION_REL.x, node.position.y + LOWER_POSITION_REL.y);
        }
         

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

  // The rest of this component is the system to create nodes using the drag and drop system. A lot of this will need to be overhauled when we switch from HTML drag and drop to React DnD. 
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useType();                             // Context that gives type of the node currently being dragged
  const [latexEq] = useLatexEq();                       // Context that gives LaTeX equation of currently dragged node (Both provided by sidebar)
 
  const onDragOver = useCallback(                       // Graphic effect for when node is dragged over viewport
    (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }, []);
  
  const onDrop = useCallback((event) => {               // Activates when a node is dropped onto the viewport
      event.preventDefault();

      if (!type) {                                      // End the function if type is null
        return;
      }

      if (!latexEq && type !== 'output') {              // Special case for the unused output node
        return;
      }

      const position = screenToFlowPosition({           // Converts the monitor screen position to the position used on the react flow viewport
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {                                 // Creates new node using position and contexts                          
        id: getId(),
        type,
        position,
        data: { value: `${latexEq}`, label: `${latexEq}`,                                                   // Internal value and label, both in LaTeX
                group: groupNum, row: rowNum, col: colNum,                                                  // Old system for keeping track of node connections. Will eventually be removed
                leftNode: '', rightNode: '', upperNode: '', lowerNode: '', exponentConnection: '',          // New system for keeping track of node connections. Each one is an id for a connecrted node. Lower and upper connection will eventually be removed in favor of vertical connectors
                connectors: {upper: '', lower: ''}                                                          // Vertical connectors for specific nodes (for example, fractions). Not used in every node
              }
      };

      //Creation of vertical connectors if needed
      if (upperConnectionTypes.includes(newNode.type))                                                      // Checks array of all node types that need upper connectors (found near top of app file)                                            
      {
          const connectorPosition = {x: newNode.position.x + UPPER_POSITION_REL.x, y:newNode.position.y + UPPER_POSITION_REL.y}     // Position for new connector, offset from node position

          const newConnector =                                                                             // Creation is similar to above. Connectors have less data since they only need one connection (right)
          {                                                                                                // and they are undraggable and undeletable (since they follow their parent node)
              id: getId(),
              type: 'connector',
              position: connectorPosition,
              draggable: false,
              deletable: false,
              data: {value: `${latexEq}`, origin: newNode.id, rightNode: '',
                    group: newNode.group, row: newNode.row - 1, col: newNode.col}

          };

          setNodes((nds) => nds.concat(newConnector));                                                      // Setting state of nodes to include connector
          newNode.data.connectors.upper = newConnector.id;                                                  // Establishing the new connector as the original node's upper connector
      }

      if (lowerConnectionTypes.includes(newNode.type)) {                                                    // Exact same thing as upper connector, just using a different reference array and a different offset
          const connectorPosition = { x: newNode.position.x + LOWER_POSITION_REL.x, y: newNode.position.y + LOWER_POSITION_REL.y }

          const newConnector =
          {
              id: getId(),
              type: 'connector',
              position: connectorPosition,
              draggable: false,
              deletable: false,
              data: {
                  value: `${latexEq}`, origin: newNode.id, rightNode: '',
                  group: newNode.group, row: newNode.row - 1, col: newNode.col
              }
          };

          setNodes((nds) => nds.concat(newConnector));
          newNode.data.connectors.lower = newConnector.id;
      }
      
      groupNum += 1;

      setNodes((nds) => nds.concat(newNode));   // Setting state of nodes to include the new node
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
  // Sidebar is at the top to pass contexts to the whole component. The React Flow component includes the viewport and all nodes/edges/connections. 
  // Within the React Flow component, we pass everything we created before in as features of the component. Below the React Flow component are various other React Flow and JS features and the Output Pane
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
          onNodeClick = {onNodeClick}
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

// Exports flow (Entire above part of app.jsx) within necessary providers
// Providers exist solely to pass contexts down the the Flow component
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

//haha i have captured sidd and am forcing him to work on mathnetic