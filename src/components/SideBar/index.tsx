import React from 'react';
import { useCallback, useRef, useState } from 'react';
import { useDraggable } from '@neodrag/react';
import { useReactFlow, XYPosition } from '@xyflow/react';
import { InlineMath } from 'react-katex';


// This is a simple ID generator for the nodes.
// You can customize this to use your own ID generation logic.
let id = 0;
const getId = () => `dndnode_${id++}`;

interface DraggableNodeProps {
  className?: string;
  children: React.ReactNode;
  nodeType: string;
  latexEq: string;
  onDrop: (nodeType: string, latexEq: string, position: XYPosition) => void;
}

 
function DraggableNode({ className, children, nodeType, latexEq, onDrop }: DraggableNodeProps) {
  const draggableRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<XYPosition>({ x: 0, y: 0 });
 
  useDraggable(draggableRef, {
    position: position,
    onDrag: ({ offsetX, offsetY }) => {
      // Calculate position relative to the viewport
      setPosition({
        x: offsetX,
        y: offsetY,
      });
    },
    onDragEnd: ({ event }) => {
      setPosition({ x: 0, y: 0 });
      onDrop(nodeType, latexEq, {
        x: event.clientX,
        y: event.clientY,
      });
    },
  });
  return (
    
    <div className='dndnode' ref={draggableRef}>
          <InlineMath math={latexEq}/>
    </div>
  );
}
 
export default function Sidebar() {
  const { setNodes, screenToFlowPosition } = useReactFlow();
 
  const handleNodeDrop = useCallback(
    (nodeType: string, latexEq: string, screenPosition: XYPosition) => {
      const flow = document.querySelector('.react-flow');
      const flowRect = flow?.getBoundingClientRect();
      const isInFlow =
        flowRect &&
        screenPosition.x >= flowRect.left &&
        screenPosition.x <= flowRect.right &&
        screenPosition.y >= flowRect.top &&
        screenPosition.y <= flowRect.bottom;
 
      // Create a new node and add it to the flow
      if (isInFlow) {
        const nodePosition = screenToFlowPosition(screenPosition);
        const dropEv = new CustomEvent("drop", { detail: {position: nodePosition, type: nodeType, latexEq: latexEq} })
        document.dispatchEvent(dropEv);
      }
    },
    [setNodes, screenToFlowPosition],
  );
 
  return (
    <aside>
      <div className="sidebar">
        You can drag these nodes to the pane to create new nodes.
      
          <DraggableNode children="c" nodeType="numeric" latexEq='0' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='1' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='2' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='3' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='4' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='5' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='6' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='7' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='8' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='9' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='\\pi' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="numeric" latexEq='e' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="arithmetic" latexEq='+' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="arithmetic" latexEq='-' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="arithmetic" latexEq='\\times' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="arithmetic" latexEq='\\div' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="arithmetic" latexEq='=' onDrop={handleNodeDrop} />
          <DraggableNode children="c" nodeType="arithmetic" latexEq='\\pm' onDrop={handleNodeDrop} />


          </div>
    </aside>
  );
}