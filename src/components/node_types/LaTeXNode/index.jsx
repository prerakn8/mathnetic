import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
  
function LaTeXNode({ data }) {
  const onChange = useCallback((event) => {
    console.log(event.target.value);
  }, []);

  return (
    <div className="latex-node">
      <Handle type="target" position={Position.Top} />
      <div>
        <label htmlFor="latex">Enter Latex:</label>
        <input id="latex" name="latex" onChange={onChange} className="nodrag" />
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
}
 
export default LaTeXNode;