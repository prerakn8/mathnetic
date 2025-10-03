import { useCallback } from 'react';
import { Position, useStoreApi, useNodeConnections, useReactFlow, useNodesData } from '@xyflow/react';
import CustomHandle from '../../CustomHandle';
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex';

function NewNode(props) {

  return (
    <div className="new-node">
      <CustomHandle id={props.id + "_target1"} type="target" position={Position.Left} connectionCount={1} />
      <CustomHandle id={props.id + "_target2"} type="target" position={Position.Top} connectionCount={1} />
      <InlineMath>{props.data.value}</InlineMath>
      <CustomHandle id={props.id + "_source1"} type="source" position={Position.Right} connectionCount={1} />
      <CustomHandle id={props.id + "_source2"} type="source" position={Position.Bottom} connectionCount={1} />
    </div>
  );
}
 
export default NewNode;