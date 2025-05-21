import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
  
function LaTeXNode({ data }) {
  const onChange = useCallback((event) => {
    data.value = event.target.value;
  }, []);

  return (
    <div className="latex-node">
      <Handle type="target" position={Position.Left} />
      <div>
        <label htmlFor="latex">Enter Latex:</label>
        <input id="latex" name="latex" onChange={onChange} className="nodrag" />
      </div>
      <Handle type="source" position={Position.Right} id="a" />
    </div>
  );
}
 
export default LaTeXNode;