import { createContext, useContext, useState } from 'react';

const DnDContext = createContext([null, (_) => {}]);

export const DnDProvider = ({ children }) => {
  const [type, setType] = useState(null);
  const [latexEq, setLatexEq] = useState(null);

  return (
    <DnDContext.Provider value={[type, setType, latexEq, setLatexEq]}>
      {children}
    </DnDContext.Provider>
  );
}

export default DnDContext;

export const useDnD = () => {
  return useContext(DnDContext);
}