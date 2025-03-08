import { useState } from "react";
import { debounce } from "lodash";
import Head from "next/head";
import Header from "./Header";
import ActionButtons from "../ui/ActionButtons";
import Stats from "../ui/Stats";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faTrashRestore, faTable } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from "../ui/LoadingScreen";
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";
import { useBaseContext, useUIContext } from "../../contexts/AppContext";

/**
 * Unified ExercisePage component that can be used for all exercise types
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {Object} props.contextData - Data from the context (currentItem, stats, handleWordFeedback, resetLearningProgress, etc.)
 * @param {Function} props.CardComponent - The card component to render
 * @param {Object} props.cardProps - Props to pass to the card component
 * @param {boolean} props.hasFilters - Whether this exercise type has filters
 * @param {Object} props.filterProps - Props for the filter component (if hasFilters is true)
 * @param {string} props.emptyMessage - Message to display when there are no items
 */
export default function ExercisePage({
  title,
  contextData,
  CardComponent,
  cardProps = {},
  hasFilters = false,
  filterProps = {},
  emptyMessage = "Keine Einträge verfügbar. Alle wurden gelernt! Setze den Fortschritt zurück, um fortzufahren."
}) {
  const { session, status, isDataLoaded, attempts } = useBaseContext();
  const { toggleTable } = useUIContext();
  
  const { 
    currentItem, 
    stats, 
    handleWordFeedback, 
    resetLearningProgress,
    updatePoolsFromFilters 
  } = contextData;

  const [showTranslation, setShowTranslation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) callback();
  }, 1000);

  const handleOK = async () => {
    if (!currentItem || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await handleWordFeedback(true);
    } catch (error) {
      setErrorMessage("Fehler beim Speichern von OK. Fortfahren lokal...");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentItem || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await handleWordFeedback(false);
    } catch (error) {
      setErrorMessage("Fehler beim Speichern von NOK. Fortfahren lokal...");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleREV = async () => {
    if (!session || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await resetLearningProgress();
    } catch (error) {
      setErrorMessage("Fehler beim Zurücksetzen des Spielstands.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  // Render filter component if this exercise type has filters
  const renderFilters = () => {
    if (!hasFilters) return null;
    
    const {
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
    } = filterProps;

    const handleFilterClick = () => {
      if (!isApplyingFilters) {
        // Apply the filters with the callback
        applyFilters(updatePoolsFromFilters);
        
        // Close the filter dialog
        setOpenFilter(false);
      }
    };

    const handleRemoveFilter = () => {
      if (!isApplyingFilters) {
        setErrorMessage("");
        setSuggestions([]);
        document.querySelectorAll('input[type="radio"]').forEach((input) => (input.checked = false));
        const rootSearchFilter = document.getElementById("RootSearchFilter");
        if (rootSearchFilter) rootSearchFilter.checked = false;
        
        // Reset filters and apply with all words
        resetFilters(updatePoolsFromFilters);
        
        setOpenFilter(false);
      }
    };

    return (
      <>
        <button
          onClick={() => setOpenFilter(true)}
          className="py-2 px-4 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-sm flex items-center gap-2"
          aria-label="Filter öffnen"
        >
          <FontAwesomeIcon icon={faFilter} />
          Filter
        </button>

        <Dialog open={openFilter} handler={() => setOpenFilter(!openFilter)}>
          <DialogHeader>Filter</DialogHeader>
          <DialogBody>
            <div className="relative">
              {errorMessage && <div className="text-red-500 mb-2">{errorMessage}</div>}
              <input
                id="search"
                type="text"
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleSearchChange}
                value={searchInput}
                className="mt-1 block w-full rounded-md border-2 border-gray-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                style={{ height: "2.5rem" }}
                placeholder={isRootSearch ? "Gib ein Stammwort ein..." : "Wortsuche..."}
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <div className="z-30 absolute">
                  <div className="flex flex-wrap bg-white border border-gray-400 rounded shadow p-2 max-h-80 overflow-y-auto">
                    {suggestions
                      .sort((a, b) => (a.Word && b.Word ? a.Word.localeCompare(b.Word) : 0))
                      .map((item, index) => {
                        const displayField = isRootSearch ? item.Root : item.Word;
                        return (
                          <div
                            key={index}
                            onClick={() => handleSuggestionClick(displayField)}
                            className="cursor-pointer mr-4 mb-4 p-2 border border-gray-300 rounded bg-gray-100"
                          >
                            {displayField}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <label htmlFor="worttyp" className="block text-md font-medium text-gray-700">
                  Wortartsuche:
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {["Adjektiv", "Adverb", "Ausdruck", "Konjunktion", "Nomen", "Partizip"].map((type) => (
                    <div key={type}>
                      <input
                        type="radio"
                        id={`${type}Filter`}
                        name="worttypFilter"
                        value={type}
                        checked={newTypeOfWordFilter === type}
                        disabled={searchInput !== "" || isRootSearch}
                        onChange={(e) => {
                          setNewTypeOfWordFilter(e.target.value);
                          // Apply filters immediately
                          applyFilters(updatePoolsFromFilters);
                        }}
                        className={`mr-2 appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${
                          (searchInput !== "" || isRootSearch) && "bg-gray-300"
                        }`}
                      />
                      <label htmlFor={`${type}Filter`}>{type}</label>
                    </div>
                  ))}
                </div>
                <div>
                  {["Präposition", "Intransitives Verb", "Reflexives Verb", "Transitives Verb", "Unpersönliches Verb"].map(
                    (type) => (
                      <div key={type}>
                        <input
                          type="radio"
                          id={`${type}Filter`}
                          name="worttypFilter"
                          value={type}
                          checked={newTypeOfWordFilter === type}
                          disabled={searchInput !== "" || isRootSearch}
                          onChange={(e) => {
                            setNewTypeOfWordFilter(e.target.value);
                            // Apply filters immediately
                            applyFilters(updatePoolsFromFilters);
                          }}
                          className={`mr-2 appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${
                            (searchInput !== "" || isRootSearch) && "bg-gray-300"
                          }`}
                        />
                        <label htmlFor={`${type}Filter`}>
                          {type.startsWith("Verb") ? `Verb (${type.split(" ")[0]})` : type}
                        </label>
                      </div>
                    )
                  )}
                  <div>
                    <input
                      type="checkbox"
                      id="RootSearchFilter"
                      name="Root"
                      checked={isRootSearch}
                      onChange={handleRootSearchToggle}
                      className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500"
                    />
                    <label htmlFor="RootSearchFilter">Nach Stamm suchen</label>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handleFilterClick}
                  className="flex-1 mr-4 mt-4 mb-4 w-full px-4 py-2 rounded text-2xl font-semibold text-white bg-blue-500 hover:bg-blue-700"
                  disabled={isApplyingFilters}
                  aria-label="Filter anwenden"
                >
                  <FontAwesomeIcon icon={faFilter} className="mr-2 fa-lg fa-fw" />
                  Filter anwenden
                </button>
                <button
                  className="flex-1 mt-4 mb-4 w-full px-4 py-2 rounded text-2xl font-semibold text-white bg-red-500 hover:bg-red-700"
                  onClick={handleRemoveFilter}
                  disabled={isApplyingFilters}
                  aria-label="Filter entfernen"
                >
                  <FontAwesomeIcon icon={faTrashRestore} className="mr-2 fa-lg fa-fw" />
                  Filter entfernen
                </button>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="text" color="red" onClick={() => setOpenFilter(false)} className="mr-1">
              <span>Abbrechen</span>
            </Button>
            <Button variant="gradient" color="green" onClick={() => setOpenFilter(false)}>
              <span>Bestätigen</span>
            </Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  };

  if (!session) return <LoadingScreen message="Authentifizierung läuft..." />;
  if (!isDataLoaded) return <LoadingScreen message="Lade Spielstand..." />;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Header session={session} />
      <main className="flex justify-end items-start w-full p-6 z-0" style={{ marginTop: "96px" }}>
        <div className="flex gap-4">
          {hasFilters && renderFilters()}
          <button
            onClick={toggleTable}
            className="py-2 px-4 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-sm flex items-center gap-2"
            aria-label="Tabelle anzeigen"
          >
            <FontAwesomeIcon icon={faTable} />
            Tabelle
          </button>
          <button
            onClick={handleREV}
            className="py-2 px-4 rounded-md bg-red-700 hover:bg-red-800 text-white font-bold text-sm flex items-center gap-2"
            aria-label="Alle Daten löschen"
          >
            <FontAwesomeIcon icon={faTrashRestore} />
            Alle Daten löschen
          </button>
        </div>
      </main>

      <div
        className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8"
        style={{ minHeight: "800px", display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {currentItem ? (
          <CardComponent
            wordData={cardProps.getWordData ? cardProps.getWordData(currentItem) : currentItem}
            showTranslation={showTranslation}
            onFlip={() => setShowTranslation(!showTranslation)}
            {...(cardProps.additionalProps || {})}
          />
        ) : (
          <div>{emptyMessage}</div>
        )}
        {currentItem && (
          <>
            <div className="mt-4 h-[100px]">
              <ActionButtons
                onCorrect={() => debouncedHandleClick(handleOK)}
                onIncorrect={() => debouncedHandleClick(handleNOK)}
                isLoading={isApplyingFilters}
              />
            </div>
            <div className="mt-4" style={{ minHeight: "50px" }}>
              <Stats
                totalCount={stats.totalCount}
                trainedCount={stats.trainedCount}
                attempts={attempts}
                progress={stats.progress}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
