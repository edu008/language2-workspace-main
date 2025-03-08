// AppContext.js
import { BaseProvider } from "./BaseContext";
import { DataProvider } from "./DataContext";
import { FilterProvider } from "./FilterContext";
import { DeutschProvider } from "./DeutschContext";
import { PraepositionProvider } from "./PraepositionContext";
import { SprichwortProvider } from "./SprichwortContext";
import { RedewendungProvider } from "./RedewendungContext";
import { PraepverbenProvider } from "./PraepverbenContext";
import { UIProvider } from "./UIContext";

// This is the composition root for all contexts
// It nests the providers in the correct order to ensure dependencies are available
export const AppProvider = ({ children }) => {
  return (
    <BaseProvider>
      <DataProvider>
        <FilterProvider>
          <UIProvider>
            <DeutschProvider>
              <PraepositionProvider>
                <SprichwortProvider>
                  <RedewendungProvider>
                    <PraepverbenProvider>
                      {children}
                    </PraepverbenProvider>
                  </RedewendungProvider>
                </SprichwortProvider>
              </PraepositionProvider>
            </DeutschProvider>
          </UIProvider>
        </FilterProvider>
      </DataProvider>
    </BaseProvider>
  );
};

// Re-export the context hooks for convenience
export { useBaseContext } from "./BaseContext";
export { useDataContext } from "./DataContext";
export { useFilterContext } from "./FilterContext";
export { useDeutschContext } from "./DeutschContext";
export { usePraepositionContext } from "./PraepositionContext";
export { useSprichwortContext } from "./SprichwortContext";
export { useRedewendungContext } from "./RedewendungContext";
export { usePraepverbenContext } from "./PraepverbenContext";
export { useUIContext } from "./UIContext";
