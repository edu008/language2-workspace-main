// UIContext.js
import { createContext, useState, useContext, useEffect } from "react";
import { useBaseContext } from "./BaseContext";
import { useDataContext } from "./DataContext";

// Create the context
export const UIContext = createContext();

// Custom hook for using this context
export const useUIContext = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const { getCurrentFeature } = useBaseContext();
  const { standingSummary } = useDataContext();

  // UI state
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("learned"); // "learned", "repeat", "all"

  // Show/hide table
  const toggleTable = () => {
    setIsTableVisible(!isTableVisible);
  };

  // Update the table data when the table is opened or when the standing summary changes
  useEffect(() => {
    // Force a re-render when the table is opened or when the standing summary changes
    if (isTableVisible) {
      // This will ensure we get fresh data when the table is opened
      const data = getTableData();
      console.log("Table data updated:", data.length, "entries");
    }
  }, [isTableVisible, standingSummary]);

  // Get table data based on current feature and active tab
  const getTableData = () => {
    const currentFeature = getCurrentFeature();
    if (!currentFeature) return [];

    const featureStanding = standingSummary[currentFeature] || [];

    if (activeTab === "learned") {
      return featureStanding.filter((item) => item.correct === 2);
    } else if (activeTab === "repeat") {
      return featureStanding.filter((item) => item.correct < 2);
    } else {
      return featureStanding;
    }
  };

  // Get table columns based on current feature
  const getTableColumns = () => {
    const currentFeature = getCurrentFeature();
    
    const commonColumns = [
      { key: "attempts", label: "Versuche" },
      { key: "correct", label: "Korrekt" },
      { key: "duration", label: "Zeit (s)" },
    ];

    switch (currentFeature) {
      case "deutsch":
        return [
          { key: "Word", label: "Wort" },
          { key: "Artikel", label: "Artikel" },
          { key: "Transl_F", label: "Übersetzung" },
          ...commonColumns,
        ];
      case "praeposition":
        return [
          { key: "Satz", label: "Satz" },
          { key: "Loesung", label: "Lösung" },
          ...commonColumns,
        ];
      case "sprichwort":
        return [
          { key: "Sprichwort", label: "Sprichwort" },
          { key: "Erklaerung", label: "Erklärung" },
          ...commonColumns,
        ];
      case "redewendung":
        return [
          { key: "Redewendung", label: "Redewendung" },
          { key: "Erklaerung", label: "Erklärung" },
          ...commonColumns,
        ];
      case "praepverben":
        return [
          { key: "Satz", label: "Satz" },
          { key: "Verb", label: "Verb" },
          { key: "Loesung", label: "Lösung" },
          ...commonColumns,
        ];
      default:
        return commonColumns;
    }
  };

  // Get table title based on current feature
  const getTableTitle = () => {
    const currentFeature = getCurrentFeature();
    const tabText = activeTab === "learned" 
      ? "Gelernte" 
      : activeTab === "repeat" 
        ? "Zu wiederholende" 
        : "Alle";
    
    switch (currentFeature) {
      case "deutsch":
        return `${tabText} Wörter`;
      case "praeposition":
        return `${tabText} Präpositionen`;
      case "sprichwort":
        return `${tabText} Sprichwörter`;
      case "redewendung":
        return `${tabText} Redewendungen`;
      case "praepverben":
        return `${tabText} Präpositionalverben`;
      default:
        return `${tabText} Einträge`;
    }
  };

  return (
    <UIContext.Provider
      value={{
        // Table visibility
        isTableVisible,
        toggleTable,
        
        // Tab state
        activeTab,
        setActiveTab,
        
        // Table data and structure
        getTableData,
        getTableColumns,
        getTableTitle,
        
        // Feature functions
        getCurrentFeature,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
