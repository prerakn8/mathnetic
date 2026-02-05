import React from 'react';
import { useDrag } from 'react-dnd'
import { useEffect, useRef } from 'react';
import { useType } from '../context/TypeContext';
import { useLatexEq } from '../context/LatexEqContext';
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex';
import DndNode from '../SideBar/DndNode';

//this obviously doesnt work properly right now

export default function Sidebar() {
    return (
        <div className="sidebar" >
            <DndNode value='1' />
            <DndNode value='2' />
            <DndNode value='3' />
            <DndNode value='4' />
            <DndNode value='5' />
        </div>
    );
    
}

