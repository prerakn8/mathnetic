import React from 'react';
// import { useDnD } from '../DnDContext';
import { useType } from '../context/TypeContext';
import { useLatexEq } from '../context/LatexEqContext';

export default () => {
  const [_, setType] = useType();
  const [__, setLatexEq] = useLatexEq();

  const onDragStart = (event, nodeType, nodeLatexEq) => {
    setType(nodeType);
    setLatexEq(nodeLatexEq);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Yes, I probably should have used a for loop. Shut up. 
  return (
    <aside>
      <div className="description">You can drag these nodes to the pane on the left.</div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '1')} draggable>
        Numeric Node: 1
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '2')} draggable>
        Numeric Node: 2
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '3')} draggable>
        Numeric Node: 3
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '4')} draggable>
        Numeric Node: 4
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '5')} draggable>
        Numeric Node: 5
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '6')} draggable>
        Numeric Node: 6
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '7')} draggable>
        Numeric Node: 7
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '8')} draggable>
        Numeric Node: 8
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '9')} draggable>
        Numeric Node: 9
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '0')} draggable>
        Numeric Node: 0
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'latex', '+')} draggable>
        LaTeX Node 
      </div>
    </aside>
  );
};
