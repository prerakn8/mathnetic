import { Position, useReactFlow, getIncomers, useNodeId } from '@xyflow/react';
import { useState, useCallback } from 'react';

export default (props) => {
    const { getNodes, getNode } = useReactFlow();
    const [equationString, setEquationString] = useState('');
    
    const updateEquationString = useCallback(() => {
        const nodes = getNodes();
        let node3D = new Array(props.groupNum + 1);
        for (let i = 0; i < props.groupNum + 1; i++)
        {
            node3D[i] = new Array(props.rowNum + 1);
            for (let j = 0; j < props.rowNum + 1; j++)
            {
                node3D[i][j] = new Array(props.colNum + 1).fill(0);
            }
        }

        for (let i = 0; i < nodes.length; i++)
        {
            const currentNode = nodes[i];
            node3D[currentNode.data.group][currentNode.data.row][currentNode.data.col] = nodes[i];
        }

        let newString = '';
        for (let i = 0; i < node3D.length; i++)
        {
            for (let j = 0; j < node3D[0].length; j++)
            {
                for (let k = 0; k < node3D[0][0].length; k++)
                {
                    if (node3D[i][j][k] != 0)
                    {
                        newString += node3D[i][j][k].data.value;
                    }       
                }
                newString += "\n\n";
            }
            newString += "\n\n";
        }

        setEquationString(newString);
    }, [props]);
    
    return (
        <aside>
            <div className="description">Test</div>
            <button onClick={updateEquationString}>Update</button>
            <div>{equationString}</div>
        </aside>
    );
};

/*

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
    <div className="output-node">
      <CustomHandle id={props.id + "_target1"} type="target" position={Position.Left} connectionCount={1}/>
      <div>Output: {equationString}</div>
      <button onClick={handleGetSequence}>Get Sequence</button>
    </div>
  );
}
*/