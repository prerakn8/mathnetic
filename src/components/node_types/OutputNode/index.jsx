import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
  
function OutputNode({ data }) {
  const onChange = useCallback((event) => {
    console.log(event.target.value);
  }, []);

  return (
    <div className="output-node">
      <Handle type="target" position={Position.Top} />
      <div>
        <label htmlFor="output">Enter Output:</label>
      </div>
    </div>
  );
}
 
export default OutputNode;