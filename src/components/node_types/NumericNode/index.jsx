import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

function NumericNode({ id, data }) {

  return (
    <div className="numeric-node">
      <Handle type="target" position={Position.Left} />
      <div>{data.value}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
 
export default NumericNode;