import { createContext, useContext, useState } from 'react';

const TypeContext = createContext([null, (_) => {}]);

export const TypeProvider = ({ children }) => {
  const [type, setType] = useState(null);

  return (
    <TypeContext.Provider value={[type, setType]}>
      {children}
    </TypeContext.Provider>
  );
}

export default TypeContext;

export const useType = () => {
  return useContext(TypeContext);
}