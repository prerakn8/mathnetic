import { useCallback } from 'react';
import { Position, useStoreApi, useNodeConnections, useReactFlow, useNodesData } from '@xyflow/react';
import CustomHandle from '../../CustomHandle';
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex';

function VerticalConnector(props) {

  return (
    <div className="vertical-connector">
      <CustomHandle id={props.id + "_source1"} type="source" position={Position.Right} connectionCount={1} />
    </div>
  );
}
 
export default VerticalConnector;