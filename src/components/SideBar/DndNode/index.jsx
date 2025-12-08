import React from 'react';
import { useDrag, DragPreviewImage } from 'react-dnd'
import { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex';


export default function DndNode(props) {

    //no idea if this is gonna work when the sidebar works again
    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: 'dndnode',   //node type being dragged
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        }),
    }))

    return (
        <>
            <DragPreviewImage connect = {preview} source = {'./DndNode/frozen-emoji-frozen-meme.jpg'} />
            <div className = 'dndnode' ref={preview} style={{ opacity: isDragging ? 0.3 : 1, cursor: 'move' }} >
                {props.value}
            </div>
        </>
    );
};
