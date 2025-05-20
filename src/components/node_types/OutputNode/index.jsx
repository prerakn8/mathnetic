import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
  
function OutputNode({ data }) {

  return (
    <div className="output-node">
      <Handle type="target" position={Position.Left} />
      <div>Output: {data.label}</div>
    </div>
  );
}
 
export default OutputNode;