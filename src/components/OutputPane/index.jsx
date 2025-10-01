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
        // Some Rows And Columns Might Have A Negative Index
        // Because Those Nodes Were Placed As A Source to Existing
        // Nodes. So First, Find the Offset.
        let startingRowNum = 0;
        let startingColNum = 0;
        const nodes = getNodes();

        for (let i = 0; i < nodes.length; i++)
        {

            if (nodes[i].data.row < startingRowNum)
            {
                startingRowNum = nodes[i].data.row;
            }

            if (nodes[i].data.col < startingColNum)
            {
                startingColNum = nodes[i].data.col;
            }
        }
        
        let node3D = new Array(props.groupNum);
        for (let i = 0; i < node3D.length; i++)
        {
            node3D[i] = new Array(props.rowNum - startingRowNum + 1);
            for (let j = 0; j < node3D[i].length; j++)
            {
                node3D[i][j] = new Array(props.colNum - startingColNum + 1);
            }
        }

        for (let i = 0; i < nodes.length; i++)
        {
            const currentNode = nodes[i];
            node3D[currentNode.data.group][currentNode.data.row - startingRowNum][currentNode.data.col - startingColNum] = currentNode;
        }

        // New System being implemented ----------------------------------------------
        const startingNodes = nodes.filter((node) => node.data.leftNode === '') // List of all nodes that start a line (nothing to the left of it)
        let newStringTemp = '' // Different newString to avoid causing errors for now
        for (let i = 0; i < startingNodes.length; i++)
        {
            newStringTemp += readEquation(startingNodes[i]); 
            newStringTemp += "\\\\";
        }
        // ---------------------------------------------------------------------------
        
        let newString = '';

        for (let i = 0; i < node3D.length; i++)
        {
            if (node3D[i].flat(Infinity).every(node => node === undefined))
            {
                continue; // Skip empty groups
            }

            for (let j = 0; j < node3D[0].length; j++)
            {
                for (let k = 0; k < node3D[0][0].length; k++)
                {
                    if (node3D[i][j][k] !== undefined)
                    {
                        newString += node3D[i][j][k].data.value;
                    }     
                }
                if (j < node3D[0].length - 1)
                {
                    newString += "\\\\";
                }
            }
            newString += "\\\\~\\\\";
        }

        setEquationString(newStringTemp);
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