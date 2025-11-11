import React from 'react';
// import { useDnD } from '../DnDContext';
import { useEffect, useRef } from 'react';
import { useType } from '../context/TypeContext';
import { useLatexEq } from '../context/LatexEqContext';
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex';

export default () => {
  const [_, setType] = useType();
  const [__, setLatexEq] = useLatexEq();
  

  const onDragStart = (event, nodeType, nodeLatexEq) => {   // Moves type and value into contexts for use in app.jsx
    setType(nodeType);
    setLatexEq(nodeLatexEq);
    event.dataTransfer.effectAllowed = 'move';
  };     
     

  // Yes, I probably should have used a for loop. Shut up. 

  // Drag and drop nodes, nodes in sidebar that are converted to actual nodes in app.jsx
  return (
    <aside className="sidebar">
      <div className="description">You can drag these nodes to the pane on the right.</div>
        <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '{\\pi}')} draggable>
          <InlineMath>\pi</InlineMath>
        </div>
        <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', 'e')} draggable>
          <InlineMath>e</InlineMath>
        </div>      
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '1')} draggable>
        <InlineMath>1</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '2')} draggable>
        <InlineMath>2</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '3')} draggable>
        <InlineMath>3</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '4')} draggable>
        <InlineMath>4</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '5')} draggable>
        <InlineMath>5</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '6')} draggable>
        <InlineMath>6</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '7')} draggable>
        <InlineMath>7</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '8')} draggable>
        <InlineMath>8</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '9')} draggable>
        <InlineMath>9</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '0')} draggable>
        <InlineMath>0</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'latex', '+')} draggable>
        LaTeX Node 
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'arithmetic', '+')} draggable>
        <InlineMath>+</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'arithmetic', '-')} draggable>
        <InlineMath>-</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'arithmetic', '{\\times}')} draggable>
        <InlineMath>\times</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'arithmetic', '{\\div}')} draggable>
        <InlineMath>\div</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'arithmetic', '=')} draggable>
        <InlineMath>=</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'arithmetic', '{\\pm}')} draggable>
        <InlineMath>\pm</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'variable', 'x')} draggable>
        <InlineMath>x</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'variable', 'y')} draggable>
        <InlineMath>y</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'variable', 'z')} draggable>
        <InlineMath>z</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '.')} draggable>
        <InlineMath>.</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'numeric', '.')} draggable>
        <InlineMath>.</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'test', '-')} draggable>
        <InlineMath>T</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'exponent', '2')} draggable>
        <InlineMath>2</InlineMath>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'fraction', 'F')} draggable>
        <InlineMath>f</InlineMath>
      </div>

      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'start', 'O')} draggable>
          <InlineMath>o</InlineMath>
      </div>
      
    </aside>
  );
};
