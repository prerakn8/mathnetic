import { Panel } from '@xyflow/react';

export default function DropHandler()
{
    return (
        <Panel position='center-left' style={{
            opacity: 1,
            color: 'green',
            padding: 10,
            zIndex: 10
        }} >
            <div className='drop-handler'>

                <title> This is the drop handler </title>
            </div>
        </Panel>
    )
}