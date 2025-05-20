import { createContext, useContext, useState } from 'react';

const LatexEqContext = createContext([null, (_) => {}]);

export const LatexEqProvider = ({ children }) => {
  const [latexEq, setLatexEq] = useState(null);

  return (
    <LatexEqContext.Provider value={[latexEq, setLatexEq]}>
      {children}
    </LatexEqContext.Provider>
  );
}

export default LatexEqContext;

export const useLatexEq = () => {
  return useContext(LatexEqContext);
}