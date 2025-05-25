import { Handle, useNodeConnections } from '@xyflow/react';

function CustomHandle(props) {

    return (
        <div>
            <Handle
                {...props}
                className="handle"
                // isConnectable={connections.length < props.connectionCount}
                //isValidConnection={isValidConnection}
            />
        </div>
    );
};

export default CustomHandle;