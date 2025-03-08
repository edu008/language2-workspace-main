// BaseContext.js
import { createContext, useState, useContext } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

// Create the context
export const BaseContext = createContext();

// Custom hook for using this context
export const useBaseContext = () => useContext(BaseContext);

export const BaseProvider = ({ children }) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Common state shared across features
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [trainedCount, setTrainedCount] = useState(0);

  // Helper to determine current feature based on route
  const getCurrentFeature = () => {
    if (router.pathname === "/deutsch") return "deutsch";
    if (router.pathname === "/praeposition") return "praeposition";
    if (router.pathname === "/sprichwort") return "sprichwort";
    if (router.pathname === "/redewendung") return "redewendung";
    if (router.pathname === "/praepverben") return "praepverben";
    return null;
  };

  return (
    <BaseContext.Provider
      value={{
        // Session and loading state
        session,
        status,
        isDataLoaded,
        setIsDataLoaded,

        // Common state
        attempts,
        setAttempts,
        trainedCount,
        setTrainedCount,

        // Helper functions
        getCurrentFeature,
      }}
    >
      {children}
    </BaseContext.Provider>
  );
};
