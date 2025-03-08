import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useDeutschContext, useFilterContext, useDataContext } from "../contexts/AppContext";

// Dynamic imports for components
const WordCard = dynamic(() => import("../components/ui/WordCard"), {
  ssr: true
});

const ExercisePage = dynamic(() => import("../components/layout/ExercisePage"), {
  ssr: true
});

export default function Deutsch() {
  const contextData = useDeutschContext();
  const { updatePoolsFromFilters } = contextData;
  const {
    searchInput,
    setSearchInput,
    newTypeOfWordFilter,
    setNewTypeOfWordFilter,
    isRootSearch,
    setIsRootSearch,
    applyFilters,
    resetFilters
  } = useFilterContext();
  const { data } = useDataContext();

  const [suggestions, setSuggestions] = useState([]);

  // Memoize the data to prevent unnecessary recalculations
  const deutschData = useMemo(() => data.deutsch || [], [data.deutsch]);

  // Use useCallback to memoize functions
  const updateSuggestions = useCallback((inputValue) => {
    if (!inputValue || inputValue.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const searchLower = inputValue.toLowerCase();
    const key = isRootSearch ? "Root" : "Word";
    
    // Use a more efficient approach with early returns
    const matchingWords = [];
    for (let i = 0; i < deutschData.length && matchingWords.length < 20; i++) {
      const word = deutschData[i];
      if (word[key]?.toLowerCase().includes(searchLower)) {
        matchingWords.push(word);
      }
    }
    
    setSuggestions(matchingWords);
  }, [deutschData, isRootSearch]);

  const handleSearchChange = useCallback((e) => {
    const inputValue = e.target.value;
    setSearchInput(inputValue);
    if (inputValue) {
      setNewTypeOfWordFilter("");
      // Use a more efficient approach to reset radio buttons
      const radioButtons = document.querySelectorAll('input[type="radio"]');
      for (let i = 0; i < radioButtons.length; i++) {
        radioButtons[i].checked = false;
      }
    }
    updateSuggestions(inputValue);
    
    // Debounce the filter application for better performance
    const timeoutId = setTimeout(() => {
      applyFilters(updatePoolsFromFilters);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [setSearchInput, setNewTypeOfWordFilter, updateSuggestions, applyFilters, updatePoolsFromFilters]);

  const handleSuggestionClick = useCallback((suggestion) => {
    const cleanedSuggestion = suggestion.replace(/\s+\(\d+\)$/, "");
    setSearchInput(cleanedSuggestion);
    updateSuggestions(cleanedSuggestion);
    applyFilters(updatePoolsFromFilters);
  }, [setSearchInput, updateSuggestions, applyFilters, updatePoolsFromFilters]);

  const handleFocus = useCallback(() => {
    if (searchInput && searchInput.length > 0) {
      updateSuggestions(searchInput);
    }
  }, [searchInput, updateSuggestions]);

  const handleBlur = useCallback(() => {
    // Use a ref to track the timeout ID for cleanup
    const timeoutId = setTimeout(() => setSuggestions([]), 500);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleRootSearchToggle = useCallback((e) => {
    const isChecked = e.target.checked;
    setIsRootSearch(isChecked);
    if (isChecked) {
      setNewTypeOfWordFilter("");
      // Use a more efficient approach to reset radio buttons
      const radioButtons = document.querySelectorAll('input[type="radio"]');
      for (let i = 0; i < radioButtons.length; i++) {
        radioButtons[i].checked = false;
      }
    }
    
    applyFilters(updatePoolsFromFilters);
  }, [setIsRootSearch, setNewTypeOfWordFilter, applyFilters, updatePoolsFromFilters]);

  // Memoize the getWordData function to prevent unnecessary recalculations
  const getWordData = useCallback((currentItem) => ({
    article: currentItem.Artikel,
    word: currentItem.Word,
    prefix: currentItem.Prefix,
    root: currentItem.Root,
    structure: currentItem.Structure,
    typeOfWord: currentItem.TypeOfWord.map((t) => t.TypeOfWord),
    additionalInfo: currentItem.Root,
    translation: currentItem.Transl_F.map((t) => t.Transl_F).join("; "),
    examples: currentItem.Article.map((a) => ({
      sentence: a.Sentence_D,
      source: `${a.Source}${
        a.TitleOfArticle
          ? ` ("${a.TitleOfArticle}"${a.DateSource ? ", " + new Date(a.DateSource).toLocaleDateString() : ""})`
          : ""
      }`,
    })),
    dateEntryWord: currentItem.DateEntryWord,
  }), []);

  return (
    <ExercisePage
      title="Wortbedeutungen"
      contextData={contextData}
      CardComponent={WordCard}
      cardProps={{
        getWordData
      }}
      hasFilters={true}
      filterProps={{
        searchInput,
        setSearchInput,
        newTypeOfWordFilter,
        setNewTypeOfWordFilter,
        isRootSearch,
        setIsRootSearch,
        applyFilters,
        resetFilters,
        suggestions,
        setSuggestions,
        updateSuggestions,
        handleSearchChange,
        handleSuggestionClick,
        handleFocus,
        handleBlur,
        handleRootSearchToggle
      }}
      emptyMessage="Keine Wörter verfügbar. Alle Wörter wurden gelernt! Setze den Fortschritt zurück, um fortzufahren."
    />
  );
}
