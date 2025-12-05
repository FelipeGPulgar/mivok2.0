
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { getCurrentUserMode, UserMode } from './user-mode-functions';

// Define el tipo para el valor del contexto
interface RoleContextType {
  isDJ: boolean | null;
  currentMode: UserMode | null;
  isLoading: boolean;
  checkRole: () => Promise<void>;
  refreshMode: () => Promise<void>;
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
  const [currentMode, setCurrentMode] = useState<UserMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para verificar el rol del usuario
  const checkRole = useCallback(async () => {
    setIsLoading(true);
    try {
      const mode = await getCurrentUserMode();
      
      if (mode) {
        setCurrentMode(mode);
        setIsDJ(mode === 'dj');
      } else {
        console.log('⚠️ No hay modo configurado, asumiendo cliente');
        setCurrentMode('cliente');
        setIsDJ(false);
      }
    } catch (error) {
      console.error('❌ Error al verificar el modo:', error);
      setCurrentMode('cliente');
      setIsDJ(false); // Asumir cliente en caso de error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar el rol al montar el componente
  useEffect(() => {
    checkRole();
  }, [checkRole]);

  // Función para refrescar el modo (sin mostrar loading)
  const refreshMode = useCallback(async () => {
    try {
      const mode = await getCurrentUserMode();
      
      if (mode) {
        setCurrentMode(mode);
        setIsDJ(mode === 'dj');
      } else {
        setCurrentMode('cliente');
        setIsDJ(false);
      }
    } catch (error) {
      console.error('❌ Error al refrescar el modo:', error);
    }
  }, []);

  const value = {
    isDJ,
    currentMode,
    isLoading,
    checkRole,
    refreshMode,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};
