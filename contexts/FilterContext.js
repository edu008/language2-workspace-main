// FilterContext.js
import { createContext, useState, useContext, useEffect } from "react";
import { useBaseContext } from "./BaseContext";
import { useDataContext } from "./DataContext";

// Create the context
export const FilterContext = createContext();

// Custom hook for using this context
export const useFilterContext = () => useContext(FilterContext);

export const FilterProvider = ({ children }) => {
  const { getCurrentFeature } = useBaseContext();
  const { data, standingSummary } = useDataContext();

  // Filter state (currently only for deutsch)
  const [searchInput, setSearchInput] = useState("");
  const [newTypeOfWordFilter, setNewTypeOfWordFilter] = useState("");
  const [isRootSearch, setIsRootSearch] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [prevFilterState, setPrevFilterState] = useState({
    searchInput: "",
    newTypeOfWordFilter: "",
    isRootSearch: false,
  });

  // Filtered data state
  const [filteredData, setFilteredData] = useState({
    deutsch: [],
    sprichwort: [],
    redewendung: [],
    praepverben: [],
  });

  // Apply filters function (currently only for deutsch)
  const applyFilters = (onFilterApplied) => {
    setIsApplyingFilters(true);
    try {
      console.log("Applying filters with:", {
        searchInput,
        newTypeOfWordFilter,
        isRootSearch,
        dataDeutsch: data.deutsch,
      });

      const currentFilterState = { searchInput, newTypeOfWordFilter, isRootSearch };

      // Always apply filters even if the state hasn't changed

      setPrevFilterState(currentFilterState);

      const learnedIds = standingSummary.deutsch
        .filter((s) => s.correct === 2)
        .map((s) => s.exercise.toString());
      const repeatIds = standingSummary.deutsch
        .filter((s) => s.correct < 2)
        .map((s) => s.exercise.toString());

      let allWords = [...data.deutsch];

      if (searchInput) {
        const searchLower = searchInput.toLowerCase();
        const key = isRootSearch ? "Root" : "Word";
        allWords = allWords.filter((word) => word[key]?.toLowerCase().includes(searchLower));
      }

      if (newTypeOfWordFilter) {
        allWords = allWords.filter((word) =>
          word.TypeOfWord?.some((type) => type.TypeOfWord === newTypeOfWordFilter)
        );
      }

      const untrainedWords = allWords.filter(
        (word) => !learnedIds.includes(word.id.toString()) && !repeatIds.includes(word.id.toString())
      );
      const repeatWords = allWords.filter((word) => repeatIds.includes(word.id.toString()));
      const learnedWords = allWords.filter((word) => learnedIds.includes(word.id.toString()));

      const newFilteredDeutsch = [...untrainedWords, ...repeatWords];
      setFilteredData((prev) => ({
        ...prev,
        deutsch: newFilteredDeutsch,
      }));

      // Call the callback with the filtered pools
      if (onFilterApplied) {
        onFilterApplied({
          untrained: untrainedWords,
          repeat: repeatWords,
          learned: learnedWords,
        });
      }
    } catch (error) {
      console.error("[applyFilters] Fehler:", error);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  // Reset filter state and apply filters with all words
  const resetFilters = (onFilterApplied) => {
    setSearchInput("");
    setNewTypeOfWordFilter("");
    setIsRootSearch(false);
    setIsApplyingFilters(true);
    
    try {
      setPrevFilterState({
        searchInput: "",
        newTypeOfWordFilter: "",
        isRootSearch: false,
      });
      
      const learnedIds = standingSummary.deutsch
        .filter((s) => s.correct === 2)
        .map((s) => s.exercise.toString());
      const repeatIds = standingSummary.deutsch
        .filter((s) => s.correct < 2)
        .map((s) => s.exercise.toString());

      // Use all words without filtering
      const allWords = [...data.deutsch];
      
      const untrainedWords = allWords.filter(
        (word) => !learnedIds.includes(word.id.toString()) && !repeatIds.includes(word.id.toString())
      );
      const repeatWords = allWords.filter((word) => repeatIds.includes(word.id.toString()));
      const learnedWords = allWords.filter((word) => learnedIds.includes(word.id.toString()));

      const newFilteredDeutsch = [...untrainedWords, ...repeatWords];
      setFilteredData((prev) => ({
        ...prev,
        deutsch: newFilteredDeutsch,
      }));

      // Call the callback with the filtered pools
      if (onFilterApplied) {
        onFilterApplied({
          untrained: untrainedWords,
          repeat: repeatWords,
          learned: learnedWords,
        });
      }
    } catch (error) {
      console.error("[resetFilters] Fehler:", error);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  return (
    <FilterContext.Provider
      value={{
        // Filter state
        searchInput,
        setSearchInput,
        newTypeOfWordFilter,
        setNewTypeOfWordFilter,
        isRootSearch,
        setIsRootSearch,
        isApplyingFilters,
        setIsApplyingFilters,
        
        // Filtered data
        filteredData,
        setFilteredData,
        
        // Filter functions
        applyFilters,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};
