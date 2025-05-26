import { Handle } from '@xyflow/react';

function CustomHandle(props) {

    return (
        <div>
            <Handle
                {...props}
                className="handle"
            />
        </div>
    );
};

export default CustomHandle;