
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as profileFunctions from './profile-functions';

// Define el tipo para el valor del contexto
interface RoleContextType {
  isDJ: boolean | null;
  isLoading: boolean;
  checkRole: () => Promise<void>;
}

// Crea el contexto con un valor inicial undefined
const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Hook para consumir el contexto
export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Proveedor del contexto
export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDJ, setIsDJ] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para verificar el rol del usuario
  const checkRole = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Verificando el rol del usuario...');
      const djProfile = await profileFunctions.getCurrentDJProfile();
      const userIsDJ = !!djProfile;
      console.log(userIsDJ ? 'El usuario es DJ.' : 'El usuario es Cliente.');
      setIsDJ(userIsDJ);
    } catch (error) {
      console.error('Error al verificar el rol:', error);
      setIsDJ(false); // Asumir cliente en caso de error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar el rol al montar el componente
  useEffect(() => {
    checkRole();
  }, [checkRole]);

  const value = {
    isDJ,
    isLoading,
    checkRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};
