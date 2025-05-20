import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import CustomHandle from '../../CustomHandle';

function NumericNode({ data }) {

  return (
    <div className="numeric-node">
      <CustomHandle type="target" position={Position.Left} connectionCount={1} />
      <div>{data.value}</div>
      <CustomHandle type="source" position={Position.Right} connectionCount={1} />
    </div>
  );
}
 
export default NumericNode;