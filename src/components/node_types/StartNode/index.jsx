import { useCallback } from 'react';
import { Position, useStoreApi, useNodeConnections, useReactFlow, useNodesData } from '@xyflow/react';
import CustomHandle from '../../CustomHandle';
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex';

function StartNode(props) {

  return (
    <div className="start-node">
      <InlineMath>{props.data.value}</InlineMath>
      <CustomHandle id={props.id + "_source1"} type="source" position={Position.Right} connectionCount={1} />
    </div>
  );
}
 
export default StartNode;