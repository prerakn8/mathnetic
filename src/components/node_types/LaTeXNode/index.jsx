import { useCallback } from 'react';
import { Position } from '@xyflow/react';
import CustomHandle from '../../CustomHandle';

function LaTeXNode(props) {
  const onChange = useCallback((event) => {
    props.data.value = event.target.value;
  }, []);

  return (
    <div className="latex-node">
      <CustomHandle id={props.id + "_target1"} type="target" position={Position.Left} connectionCount={1} />
      <CustomHandle id={props.id + "_target2"} type="target" position={Position.Top} connectionCount={1} />
      <div>
        <label htmlFor="latex">Enter Latex:</label>
        <input id="latex" name="latex" onChange={onChange} className="nodrag" />
      </div>
      <CustomHandle id={props.id + "_source1"} type="source" position={Position.Right} connectionCount={1} />
      <CustomHandle id={props.id + "_source2"} type="source" position={Position.Bottom} connectionCount={1} />
    </div>
  );
}
 
export default LaTeXNode;