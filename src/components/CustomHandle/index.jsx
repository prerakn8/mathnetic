import { Handle, useNodeConnections } from '@xyflow/react';

function CustomHandle(props) {
    const connections = useNodeConnections({
        handleType: props.type,
    });

    return (
        <div>
            <Handle
                {...props}
                isConnectable={connections.length < props.connectionCount}
            />
        </div>
    );
};

export default CustomHandle;