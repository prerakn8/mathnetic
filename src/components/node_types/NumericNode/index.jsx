import { useCallback } from 'react';
import { Handle, Position, useNodeConnections, useReactFlow, useNodesData } from '@xyflow/react';
import CustomHandle from '../../CustomHandle';

function NumericNode({ id, data }) {

  return (
    <div className="numeric-node">
      <Handle type="target" position={Position.Left} connectionCount={1} />
      <div>{data.value}</div>
      <Handle type="source" position={Position.Right} connectionCount={1} />
    </div>
  );
}
 
export default NumericNode;