import { Position, useReactFlow, getIncomers, useNodeId } from '@xyflow/react';
import { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex';

export default (props) => {
    const { getNode, getNodes, getEdges } = useReactFlow();
    const [equationString, setEquationString] = useState('');

    const readEquation = (startingNode) => {
        let lineString = '';
        let currentNode = startingNode;

        while (currentNode !== undefined)   // Iterating through tree, ends when there is no right connection
        {
            if (currentNode.type === 'numeric')
            {
                lineString += currentNode.data.value;
            }
            if (currentNode.type === 'arithmetic')
            {
                lineString += currentNode.data.value;
            }
            if (currentNode.type === 'variable')
            {
                lineString += currentNode.data.value;
            }
            if (currentNode.type === 'latex')
            {
                lineString += currentNode.data.value;
            }

            currentNode = getNode(currentNode.data.rightNode) // Goes to right node by id
        }  

        return lineString;
    }
    const updateEquationString = () => {
        const nodes = getNodes();

        const startingNodes = nodes.filter((node) => 
        (node.type !== 'connector' && node.data.leftNode === '')); 

        let newString = '';
        for (let i = 0; i < startingNodes.length; i++)
        {
            newString += readEquation(startingNodes[i]); 
            newString += "\\\\";
        }

        setEquationString(newString);
    };

    useEffect(() => {
        updateEquationString();
    }, [getEdges(), getNodes().length]);
    
    return (
        <aside className="output-pane print">
            <div className="description">Output</div>
            <InlineMath math={equationString}/>
        </aside>
    );
};