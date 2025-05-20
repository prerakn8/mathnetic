import { Handle, useNodeConnections } from '@xyflow/react';

function CustomHandle({ id, label, onConnect }) {
    const connections = useNodeConnections({
        handleType: 'target',
        handleId: id,
    });

    const nodeData = useNodesData(connections?.[0].source);

    useEffect(() => {
        onConnect(nodeData?.data ? nodeData.data.label : 0);
    }, [nodeData]);

    return (
        <div>
            <Handle
                type="target"
                position={Position.Left}
                id={id}
                className="handle"
                isConnectable={connections.length < props.connectionCount}
            />
        </div>
    );
};

export default CustomHandle;