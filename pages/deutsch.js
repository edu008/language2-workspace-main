import { useContext, useState } from "react";
import { debounce } from "lodash";
import Head from "next/head";
import Header from "../components/deutsch/Header";
import WordCard from "../components/deutsch/WordCard";
import ActionButtons from "../components/deutsch/ActionButtons";
import Stats from "../components/deutsch/Stats";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faTrashRestore } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from "../components/deutsch/LoadingScreen";
import { AppContext } from "./context/AppContext";
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";

export default function Deutsch() {
  const {
    session,
    status,
    isDataLoaded,
    data,
    currentItem,
    pools,
    stats,
    standingSummary,
    attempts,
    trainedCount,
    filteredData,
    searchInput,
    setSearchInput,
    newTypeOfWordFilter,
    setNewTypeOfWordFilter,
    setIsApplyingFilters,
    isRootSearch,
    setIsRootSearch,
    isApplyingFilters,
    handleDeutschWordFeedback,
    resetDeutschLearningProgress,
  } = useContext(AppContext);

  const [showTranslation, setShowTranslation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [openFilter, setOpenFilter] = useState(false);

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) callback();
  }, 1000);

  const handleOK = async () => {
    if (!currentItem.deutsch || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await handleDeutschWordFeedback(true);
    } catch (error) {
      setErrorMessage("Fehler beim Speichern von OK. Fortfahren lokal...");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentItem.deutsch || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      await handleDeutschWordFeedback(false);
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
      await resetDeutschLearningProgress();
    } catch (error) {
      setErrorMessage("Fehler beim Zurücksetzen des Spielstands.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const updateSuggestions = (inputValue) => {
    if (!data.deutsch || data.deutsch.length === 0) {
      setSuggestions([]);
      return;
    }
    const key = isRootSearch ? "Root" : "Word";
    const duplicatesCount = data.deutsch.reduce((countMap, item) => {
      const value = item?.[key];
      if (value && value.toLowerCase().includes(inputValue.toLowerCase())) {
        countMap[value] = (countMap[value] || 0) + 1;
      }
      return countMap;
    }, {});
    const filteredResults = Object.keys(duplicatesCount).map((value) => ({
      Word: `${value} (${duplicatesCount[value]})`,
    }));
    setSuggestions(filteredResults);
  };

  const handleSearchChange = (e) => {
    const inputValue = e.target.value;
    setSearchInput(inputValue);
    if (inputValue) {
      setNewTypeOfWordFilter("");
      document.querySelectorAll('input[type="radio"]').forEach((input) => (input.checked = false));
    }
    updateSuggestions(inputValue);
  };

  const handleSuggestionClick = (suggestion) => {
    const cleanedSuggestion = suggestion.replace(/\s+\(\d+\)$/, "");
    setSearchInput(cleanedSuggestion);
    updateSuggestions(cleanedSuggestion);
  };

  const handleFocus = () => {
    if (searchInput) updateSuggestions(searchInput);
  };

  const handleBlur = () => {
    setTimeout(() => setSuggestions([]), 200);
  };

  const handleFilterClick = () => {
    if (!isApplyingFilters) {
      setOpenFilter(false);
    }
  };

  const handleRemoveFilter = () => {
    if (!isApplyingFilters) {
      setSearchInput("");
      setNewTypeOfWordFilter("");
      setIsRootSearch(false);
      setErrorMessage("");
      setSuggestions([]);
      document.querySelectorAll('input[type="radio"]').forEach((input) => (input.checked = false));
      const rootSearchFilter = document.getElementById("RootSearchFilter");
      if (rootSearchFilter) rootSearchFilter.checked = false;
      setOpenFilter(false);
    }
  };

  const handleRootSearchToggle = (e) => {
    const isChecked = e.target.checked;
    setIsRootSearch(isChecked);
    if (isChecked) {
      setNewTypeOfWordFilter("");
      document.querySelectorAll('input[type="radio"]').forEach((input) => (input.checked = false));
    }
  };

  if (!session) return <LoadingScreen message="Authentifizierung läuft..." />;
  if (!isDataLoaded) return <LoadingScreen message="Lade Spielstand..." />;

  return (
    <>
      <Head>
        <title>Wortbedeutungen</title>
      </Head>
      <Header session={session} />
      <main className="flex justify-end items-start w-full p-6 z-0" style={{ marginTop: "96px" }}>
        <div className="flex gap-4">
          <button
            onClick={() => setOpenFilter(true)}
            className="py-2 px-4 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-sm flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faFilter} />
            Filter
          </button>
          <button
            onClick={handleREV}
            className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-2"
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
        {currentItem.deutsch ? (
          <WordCard
            wordData={{
              article: currentItem.deutsch.Artikel,
              word: currentItem.deutsch.Word,
              prefix: currentItem.deutsch.Prefix,
              root: currentItem.deutsch.Root,
              structure: currentItem.deutsch.Structure,
              typeOfWord: currentItem.deutsch.TypeOfWord.map((t) => t.TypeOfWord),
              additionalInfo: currentItem.deutsch.Root,
              translation: currentItem.deutsch.Transl_F.map((t) => t.Transl_F).join("; "),
              examples: currentItem.deutsch.Article.map((a) => ({
                sentence: a.Sentence_D,
                source: `${a.Source}${
                  a.TitleOfArticle
                    ? ` ("${a.TitleOfArticle}"${a.DateSource ? ", " + new Date(a.DateSource).toLocaleDateString() : ""})`
                    : ""
                }`,
              })),
              dateEntryWord: currentItem.deutsch.DateEntryWord,
            }}
            showTranslation={showTranslation}
            onFlip={() => setShowTranslation(!showTranslation)}
          />
        ) : (
          <div>
            Keine Wörter verfügbar. Alle Wörter wurden gelernt! Setze den Fortschritt zurück, um fortzufahren.
          </div>
        )}
        {currentItem.deutsch && (
          <>
            <div className="mt-4" style={{ minHeight: "100px" }}>
              <ActionButtons
                onCorrect={() => debouncedHandleClick(handleOK)}
                onIncorrect={() => debouncedHandleClick(handleNOK)}
                isLoading={isApplyingFilters}
              />
            </div>
            <div className="mt-4" style={{ minHeight: "50px" }}>
              <Stats
                totalCount={stats.deutsch.totalCount}
                trainedCount={trainedCount}
                attempts={attempts}
                progress={stats.deutsch.progress}
              />
            </div>
          </>
        )}
        {standingSummary.deutsch && standingSummary.deutsch.length > 0 ? (
          <table className="table-auto border-collapse border border-gray-300 mt-4 w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Wort</th>
                <th className="border border-gray-300 p-2 text-left">Artikel</th>
                <th className="border border-gray-300 p-2 text-left">Übersetzung</th>
              </tr>
            </thead>
            <tbody>
              {standingSummary.deutsch.map((item, index) => (
                <tr key={item.exercise || index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="border border-gray-300 p-2">{item.Word || "Unbekannt"}</td>
                  <td className="border border-gray-300 p-2">{item.Artikel || ""}</td>
                  <td className="border border-gray-300 p-2">{item.Transl_F || "Keine Übersetzung"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p></p>
        )}
      </div>

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
                    .map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(item.Word)}
                        className="cursor-pointer mr-4 mb-4 p-2 border border-gray-300 rounded bg-gray-100"
                      >
                        {item.Word}
                      </div>
                    ))}
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
                      onChange={(e) => setNewTypeOfWordFilter(e.target.value)}
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
                        onChange={(e) => setNewTypeOfWordFilter(e.target.value)}
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
              >
                <FontAwesomeIcon icon={faFilter} className="mr-2 fa-lg fa-fw" />
                Filter anwenden
              </button>
              <button
                className="flex-1 mt-4 mb-4 w-full px-4 py-2 rounded text-2xl font-semibold text-white bg-red-500 hover:bg-red-700"
                onClick={handleRemoveFilter}
                disabled={isApplyingFilters}
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
}