import { useCallback } from 'react';
import { Position, useStoreApi, useNodeConnections, useReactFlow, useNodesData } from '@xyflow/react';
import CustomHandle from '../../CustomHandle';

function NumericNode(props) {

  return (
    <div className="numeric-node">
      <CustomHandle id={props.id + "_target1"} type="target" position={Position.Left} connectionCount={1} />
      <CustomHandle id={props.id + "_target2"} type="target" position={Position.Top} connectionCount={1} />
      <div>{props.data.value}</div>
      <CustomHandle id={props.id + "_source1"} type="source" position={Position.Right} connectionCount={1} />
      <CustomHandle id={props.id + "_source2"} type="source" position={Position.Bottom} connectionCount={1} />
    </div>
  );
}
 
export default NumericNode;