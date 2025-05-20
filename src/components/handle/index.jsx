import { Handle, Position, useNodesData, useNodeConnections, Handle } from '@xyflow/react';

function CustomHandle({ id, onChange }) {
    const connections = useNodeConnections({
        handleType: 'target',
        handleId: id
    });

    const nodeData = useNodesData(connections?.[0].source);

    useEffect(() => {
        onChange(nodeData?.data ? nodeData.data.value : 0);
    }, [nodeData]);

    return (
        <div>
            <Handle
                type="target"
                position={Position.Left}
                id={id}
                className="handle"
            />
        </div>
    )
}

export default CustomHandle;