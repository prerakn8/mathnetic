import { Position, useReactFlow, getIncomers, useNodeId } from '@xyflow/react';
import { useState } from 'react';
import CustomHandle from '../../CustomHandle';

function getSequentialNodes(nodes, edges, startNodeId) {
  const sequence = [];
  let currentNodeId = startNodeId; 

  while (true) {
    sequence.push(currentNodeId);
    const currentNode = nodes.find((node) => node.id === currentNodeId);
    const incomers = getIncomers(currentNode, nodes, edges);
    
    if (incomers.length === 0) {
      break;
    }
    currentNodeId = incomers[0].id; 
  }
  return sequence.reverse();
}

function getEquationString(nodes, edges, startNodeId) {
  const sequence = getSequentialNodes(nodes, edges, startNodeId);
  
  let equationString = '';

  for (let i = 0; i < sequence.length - 1; i++) {
    const nodeId = sequence[i];
    const node = nodes.find((node) => node.id === nodeId);
    if (node) {
      equationString += node.data.value;
    }
  }

  return equationString;
}



function OutputNode(props) {

  const { getNodes, getEdges } = useReactFlow();
  const [equationString, setEquationString] = useState('');

  const id = useNodeId();

  const handleGetSequence = () => {
    const nodes = getNodes();
    const edges = getEdges();
    const startNodeId = id;
    const newEquationString = getEquationString(nodes, edges, startNodeId);
    setEquationString(newEquationString);
  };

  return (
    <div className="output-node description">
      <CustomHandle id={props.id + "_target1"} type="target" position={Position.Left} connectionCount={1}/>
      <div>Output: {equationString}</div>
      <button onClick={handleGetSequence}>Get Sequence</button>
    </div>
  );
}
 
export default OutputNode;