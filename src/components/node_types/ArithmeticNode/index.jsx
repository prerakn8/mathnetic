import { useCallback } from 'react';
import { Position, useStoreApi, useNodeConnections, useReactFlow, useNodesData } from '@xyflow/react';
import CustomHandle from '../../CustomHandle';
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex';


//some nodes dont have all, or any, targets/sources (see outputnode or exponentnode)
// target1 is the left connection
// target2 is the top connection
// source1 is the right connection
// source2 is the bottom connection
//    |_____
/*          |
            V
         ___
        |__ \   3
           \ \
           /  \
          / /\ \
         / /  \ \.-.
        /_/    \_.-'
*/

function ArithmeticNode(props) {

  return (
    <div className="arithmetic-node">
      <CustomHandle id={props.id + "_target1"} type="target" position={Position.Left} connectionCount={1} />
      <CustomHandle id={props.id + "_target2"} type="target" position={Position.Top} connectionCount={1} />
      <InlineMath>{props.data.value}</InlineMath>
      <CustomHandle id={props.id + "_source1"} type="source" position={Position.Right} connectionCount={1} />
      <CustomHandle id={props.id + "_source2"} type="source" position={Position.Bottom} connectionCount={1} />
    </div>
  );
}
 
export default ArithmeticNode;