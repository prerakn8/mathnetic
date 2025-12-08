import { Panel } from '@xyflow/react';

export default function DropHandler()
{
    return (
        <Panel position='top-left' style={{ width: '100vw', height: '100vh', padding: 0}}>
            <div className='drop-handler' style={{ width: '100vw', height: '100vh', position: 'fixed', top: '0', left: '0', color: 'red', visibility: 'visible'}}/>
        </Panel>
    )
}