import { useCallback } from 'react';
import { Position, useStoreApi, useNodeConnections, useReactFlow, useNodesData } from '@xyflow/react';
import CustomHandle from '../../CustomHandle';
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex';

function NumericNode(props) {

  return (
    <div className="exponent-node">
      
      <InlineMath>{props.data.value}</InlineMath>
      
    </div>
  );
}
 
export default NumericNode;