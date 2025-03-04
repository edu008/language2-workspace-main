import { getDeutschCount, getDeutsch } from "../prisma/deutsch";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import Message from "./Message";
import Head from "next/head";
import Header from "../components/deutsch/Header";
import WordCard from "../components/deutsch/WordCard";
import ActionButtons from "../components/deutsch/ActionButtons";
import Stats from "../components/deutsch/Stats";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faTrashRestore } from "@fortawesome/free-solid-svg-icons";
import LoadingScreen from '../components/deutsch/LoadingScreen';
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  let deutsch = [];
  try {
    deutsch = await getDeutsch();
    if (!Array.isArray(deutsch)) {
      console.error("getDeutsch returned non-array:", deutsch);
      deutsch = [];
    }
    deutsch.forEach((document) => {
      document.Article.forEach((article) => {
        if (article.DateSource instanceof Date) {
          article.DateSource = article.DateSource.toISOString();
        }
      });
      if (document.DateEntryWord instanceof Date) {
        document.DateEntryWord = document.DateEntryWord.toISOString();
      }
    });
  } catch (error) {
    console.error("Fehler beim Abrufen von deutsch:", error);
    deutsch = [];
  }

  const deutschCount = await getDeutschCount().catch((error) => {
    console.error("Fehler beim Abrufen von deutschCount:", error);
    return 0;
  });

  return {
    props: {
      deutschCount,
      deutsch,
    },
  };
}

export default function Deutsch({ deutschCount, deutsch }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showTranslation, setShowTranslation] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [newTypeOfWordFilter, setNewTypeOfWordFilter] = useState("");
  const [isRootSearch, setIsRootSearch] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [filteredDeutsch, setFilteredDeutsch] = useState([]);
  const [currentDeutsch, setCurrentDeutsch] = useState(null);
  const [untrained, setUntrained] = useState(deutsch);
  const [repeatPool, setRepeatPool] = useState([]);
  const [trained, setTrained] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [summary, setSummary] = useState([]);
  const [standingSummary, setStandingSummary] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && status === "authenticated" && !isDataLoaded) {
      loadStanding();
    }
  }, [status, isDataLoaded]);

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) {
      console.log("Debounced handleREV called");
      callback();
    }
  }, 1000);

  const loadStanding = async () => {
    if (!session || isDataLoaded) return;
    try {
      const response = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=deutsch`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to load standing: ${response.status} - ${await response.text()}`);
      }
      const data = await response.json();
      console.log("Standing Data Loaded (kategorie=deutsch):", data);

      if (!data.summary || !Array.isArray(data.summary)) {
        console.error("Keine oder ungültige summary-Daten erhalten:", data);
        resetState();
        setStandingSummary([]);
        setIsDataLoaded(true);
        return;
      }

      // Filtere explizit nur Einträge mit kategorie="deutsch"
      const deutschStandings = data.summary.filter(item => item.kategorie === "deutsch");
      console.log("Filtered Standings (kategorie=deutsch):", deutschStandings);

      applyStandingToWords(deutschStandings);
      // Filtere standingSummary, um nur Einträge mit vorhandenen Wörtern und kategorie="deutsch" anzuzeigen
      setStandingSummary(deutschStandings
        .map(item => {
          const word = deutsch.find(d => d.id === item.exercise);
          console.log(`Mapping exercise ${item.exercise} (kategorie=deutsch): Found word - ${word ? word.Word : 'none'}`);
          if (!word) return null;
          return {
            ...item,
            Artikel: word.Artikel || "",
            Word: word.Word || "",
            Transl_F: word.Transl_F.map(t => t.Transl_F).join("; ") || "",
            DateEntryWord: new Date(word.DateEntryWord).toLocaleDateString("de-DE") || "",
          };
        })
        .filter(item => item !== null)
      );
      setLoadingError(null);
    } catch (error) {
      console.error("Fehler beim Laden des Standing:", error);
      setLoadingError(error.message);
      resetState();
      setStandingSummary([]);
      setIsDataLoaded(true);
    }
  };

  const applyStandingToWords = (standing) => {
    if (!standing || standing.length === 0) {
      console.log("Kein Spielstand vorhanden, initialisiere mit allen Wörtern (kategorie=deutsch).");
      resetState();
    } else {
      console.log("Spielstand vorhanden, initialisiere Pools basierend auf Standing-Daten (kategorie=deutsch):", standing);
      const learnedIds = standing.filter(s => s.correct === 2).map(s => s.exercise);
      const repeatIds = standing.filter(s => s.correct === 1).map(s => s.exercise);
      const nokIds = standing.filter(s => s.correct === 0).map(s => s.exercise);

      const untrainedWords = deutsch.filter(word => 
        !learnedIds.includes(word.id) && !repeatIds.includes(word.id) && !nokIds.includes(word.id)
      );
      const repeatPoolWords = deutsch.filter(word => 
        repeatIds.includes(word.id) || nokIds.includes(word.id)
      );

      console.log("Untrained Words (kategorie=deutsch):", untrainedWords.length, untrainedWords);
      console.log("RepeatPool Words (kategorie=deutsch):", repeatPoolWords.length, repeatPoolWords);
      console.log("Learned IDs (correct = 2, kategorie=deutsch):", learnedIds.length, learnedIds);
      console.log("Repeat IDs (correct = 1, kategorie=deutsch):", repeatIds.length, repeatIds);
      console.log("NOK IDs (correct = 0, kategorie=deutsch):", nokIds.length, nokIds);

      setUntrained(untrainedWords);
      setRepeatPool(repeatPoolWords);
      const maxAttempts = standing.reduce((max, s) => Math.max(max, s.attempts || 0), 0);
      setAttempts(maxAttempts);
      setTrained(learnedIds.length);
    }
    setIsDataLoaded(true);
    applyFilters();
  };

  const resetState = () => {
    setUntrained(deutsch);
    setRepeatPool([]);
    setTrained(0);
    setAttempts(0);
    setSummary([]);
    setFilteredDeutsch([]);
    setCurrentDeutsch(null);
    setStandingSummary([]);
  };

  const saveToServer = async (action, exerciseData = {}) => {
    if (!session) return;
    const { exercise, standingId, correct, attempts } = exerciseData;
    const validatedCorrect = Number.isInteger(correct) && correct >= 0 && correct <= 2 ? correct : 0;

    try {
      let response;
      const payload = {
        user: session.user.email,
        exercise,
        button: action,
        kategorie: "deutsch", // Explicite Angabe der Kategorie
        correct: validatedCorrect,
        attempts: attempts ?? 0,
      };
      console.log(`Saving to server (kategorie=deutsch): action=${action}, payload=`, payload);

      if (action === "OK" || action === "NOK") {
        if (standingId) {
          response = await fetch("/api/standing", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              standingIN: standingId,
              ...payload,
            }),
          });
        } else {
          response = await fetch("/api/standing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      } else if (action === "REV") {
        response = await fetch("/api/standing", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: session.user.email,
            kategorie: "deutsch",
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server responded with ${response.status}: ${errorText}`);
        throw new Error(`Fehler bei ${action} Aktion: ${errorText}`);
      }
      const data = await response.json();
      console.log("Server response (kategorie=deutsch):", data);
      if (action === "REV") {
        setStandingSummary([]);
      } else if (action === "OK" || action === "NOK") {
        await loadStanding();
      }
      return data;
    } catch (error) {
      console.error(`Fehler beim Senden an Server (kategorie=deutsch, ${action}):`, error);
      setErrorMessage(`Fehler beim Speichern des Spielstands (${action}).`);
      throw error;
    }
  };

  const handleOpen = () => setOpen(!open);

  const applyFilters = async () => {
    if (isApplyingFilters || (!Array.isArray(untrained) || !Array.isArray(repeatPool))) {
      console.error("Filter wird bereits angewendet oder ungültige Pools (kategorie=deutsch):", { untrained, repeatPool });
      return;
    }
    setIsApplyingFilters(true);
    try {
      let pool;
      const randomCount = Math.floor(Math.random() * 8) + 3;
      if (attempts > 0 && randomCount === 10 && repeatPool.length > 0) {
        console.log("Wähle zufällig ein bereits angesehenes Wort aus repeatPool (kategorie=deutsch).");
        pool = [...repeatPool];
      } else {
        console.log("Wähle ein neues Wort aus untrained (kategorie=deutsch).");
        pool = [...untrained];
      }

      let result = [...new Set(pool.map(JSON.stringify))].map(JSON.parse);
      if (searchInput) {
        if (isRootSearch) {
          result = result.filter((word) =>
            word.Root?.toLowerCase().includes(searchInput.toLowerCase())
          );
        } else {
          result = result.filter((word) =>
            word.Word?.toLowerCase().includes(searchInput.toLowerCase())
          );
        }
      } else if (newTypeOfWordFilter) {
        result = result.filter((word) =>
          word.TypeOfWord?.some((t) => t.TypeOfWord === newTypeOfWordFilter)
        );
      }

      if (result.length === 0 && !hasRedirected) {
        setHasRedirected(true);
        router.push("/successDeutsch?redirected=true");
        return;
      }

      console.log("Filtered Deutsch (kategorie=deutsch):", result);
      setFilteredDeutsch(result);
      if (result.length > 0) {
        const randomIndex = Math.floor(Math.random() * result.length);
        const randomDeutsch = { ...result[randomIndex] };
        randomDeutsch.DateEntryWord = new Date(randomDeutsch.DateEntryWord).toLocaleDateString("de-DE");
        setCurrentDeutsch(randomDeutsch);
      } else {
        setCurrentDeutsch(null);
      }
    } finally {
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (isDataLoaded && !isApplyingFilters) {
      const timer = setTimeout(() => applyFilters(), 200);
      return () => clearTimeout(timer);
    }
  }, [searchInput, newTypeOfWordFilter, isRootSearch, untrained, repeatPool, attempts, isDataLoaded]);

  const handleOK = async () => {
    if (!currentDeutsch || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentDeutsch.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}&kategorie=deutsch`
      );
      const standing = await standingResponse.json();

      const correct = standing && Object.keys(standing).length > 0 ? Math.min((standing.correct || 0) + 1, 2) : 1;

      await saveToServer("OK", {
        exercise,
        standingId: standing?.id,
        correct,
        attempts: newAttempts,
      });

      setUntrained(prev => prev.filter(word => word.id !== exercise));
      setRepeatPool(prev => (correct < 2 ? [...prev, currentDeutsch] : prev));

      if (correct === 2) setTrained(prev => prev + 1);

      const newEntry = {
        Word: currentDeutsch.Word,
        Artikel: currentDeutsch.Artikel || "",
        Transl_F: currentDeutsch.Transl_F.map(t => t.Transl_F).join("; "),
        DateEntryWord: new Date(currentDeutsch.DateEntryWord).toLocaleDateString("de-DE"),
      };

      setStandingSummary(prev => {
        if (!prev.some(entry => entry.Word === newEntry.Word)) {
          return [...prev, newEntry];
        }
        return prev;
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      await applyFilters();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleNOK = async () => {
    if (!currentDeutsch || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      const exercise = currentDeutsch.id;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const standingResponse = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}&kategorie=deutsch`
      );
      const standing = await standingResponse.json();

      await saveToServer("NOK", {
        exercise,
        standingId: standing?.id,
        correct: 0,
        attempts: newAttempts,
      });

      setUntrained(prev => [...prev, currentDeutsch]);
      setRepeatPool(prev => prev.filter(word => word.id !== exercise));

      const newEntry = {
        Word: currentDeutsch.Word,
        Artikel: currentDeutsch.Artikel || "",
        Transl_F: currentDeutsch.Transl_F.map(t => t.Transl_F).join("; "),
        DateEntryWord: new Date(currentDeutsch.DateEntryWord).toLocaleDateString("de-DE"),
      };

      setStandingSummary(prev => {
        if (!prev.some(entry => entry.Word === newEntry.Word)) {
          return [...prev, newEntry];
        }
        return prev;
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      await applyFilters();
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleREV = async () => {
    if (!session || isApplyingFilters) return;
    setIsApplyingFilters(true);
    try {
      console.log("Starting handleREV - deleting standings and resetting state (kategorie=deutsch)...");
      const response = await saveToServer("REV");
      console.log("Server response after DELETE (kategorie=deutsch):", response);
      console.log("Alle Standing-Einträge für den Benutzer (kategorie=deutsch) gelöscht und Score zurückgesetzt.");

      await new Promise(resolve => setTimeout(resolve, 2000));
      resetState();
      setIsDataLoaded(false);
      await loadStanding();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await applyFilters();
    } catch (error) {
      console.error("Fehler in handleREV (kategorie=deutsch):", error);
      setErrorMessage("Fehler beim Zurücksetzen des Spielstands.");
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const updateSuggestions = (inputValue) => {
    if (!filteredDeutsch || filteredDeutsch.length === 0) {
      setSuggestions([]);
      return;
    }

    const key = isRootSearch ? "Root" : "Word";
    const duplicatesCount = filteredDeutsch.reduce((countMap, item) => {
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
    updateSuggestions(inputValue);
  };

  const handleSuggestionClick = (suggestion) => {
    const cleanedSuggestion = suggestion.replace(/\s+\(\d+\)$/, "");
    setSearchInput(cleanedSuggestion);
    updateSuggestions(cleanedSuggestion);
  };

  const handleFocus = () => {
    if (searchInput) {
      updateSuggestions(searchInput);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setSuggestions([]), 200);
  };

  const handleFilterClick = () => {
    if (!isApplyingFilters) {
      applyFilters();
      handleOpen();
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
      applyFilters();
      handleOpen();
    }
  };

  const handleRootSearchToggle = (e) => {
    const isChecked = e.target.checked;
    setIsRootSearch(isChecked);
    if (isChecked) {
      setNewTypeOfWordFilter("");
      document.querySelectorAll('input[type="radio"]').forEach((input) => (input.checked = false));
    }
    if (!isApplyingFilters) {
      applyFilters();
    }
  };

  useEffect(() => {
    if (router.query.redirected === "true" && !hasRedirected && !isApplyingFilters) {
      setHasRedirected(true);
      setSearchInput("");
      setNewTypeOfWordFilter("");
      setIsRootSearch(false);
      setErrorMessage(
        "Der Filter wurde automatisch zurückgesetzt, da jede Bedeutung des gefilterten Wortes bzw. die gefilterte Wortart vollständig erlernt wurde!"
      );
      document.querySelectorAll('input[type="radio"]').forEach((input) => (input.checked = false));
      const rootSearchFilter = document.getElementById("RootSearchFilter");
      if (rootSearchFilter) rootSearchFilter.checked = false;
      applyFilters();
      router.replace("/deutsch", undefined, { shallow: true });
    }
  }, [router.query.redirected]);

  useEffect(() => {
    if (typeof window !== 'undefined' && status === "authenticated" && !isDataLoaded) {
      loadStanding();
    }
  }, [status, isDataLoaded]);

  if (!session) return <div>Lade...</div>;
  if (!isDataLoaded) {
    if (loadingError) {
      return <LoadingScreen message={`Fehler beim Laden: ${loadingError}`} isError={true} />;
    }
    return <LoadingScreen message="Lade Spielstand..." />;
  }

  const progress = Math.round((trained / deutschCount) * 100) || 0;

  return (
    <>
      <Head>
        <title>Wortbedeutungen</title>
      </Head>
      {session && (
        <>
          <Header session={session} />
          <main className="flex justify-end items-start w-full p-6 z-0" style={{ marginTop: '96px' }}>
            <div className="flex gap-4">
              <button
                onClick={handleOpen}
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

          <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8" style={{ minHeight: "800px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {currentDeutsch ? (
              <WordCard
                wordData={{
                  article: currentDeutsch.Artikel,
                  word: currentDeutsch.Word,
                  prefix: currentDeutsch.Prefix,
                  root: currentDeutsch.Root,
                  structure: currentDeutsch.Structure,
                  typeOfWord: currentDeutsch.TypeOfWord.map((t) => t.TypeOfWord),
                  additionalInfo: currentDeutsch.Root,
                  translation: currentDeutsch.Transl_F.map((t) => t.Transl_F).join("; "),
                  examples: currentDeutsch.Article.map((a) => ({
                    sentence: a.Sentence_D,
                    source: `${a.Source}${a.TitleOfArticle ? ` ("${a.TitleOfArticle}"${a.DateSource ? ", " + new Date(a.DateSource).toLocaleDateString() : ""})` : ""}`,
                  })),
                  dateEntryWord: currentDeutsch.DateEntryWord,
                }}
                showTranslation={showTranslation}
                onFlip={() => setShowTranslation(!showTranslation)}
              />
            ) : (
              <div>Keine Wörter verfügbar. Alle Wörter wurden gelernt!</div>
            )}
            <div className="mt-4" style={{ minHeight: "100px" }}>
              <ActionButtons
                onCorrect={() => debouncedHandleClick(handleOK)}
                onIncorrect={() => debouncedHandleClick(handleNOK)}
                isLoading={isApplyingFilters}
              />
            </div>
            <div className="mt-4" style={{ minHeight: "50px" }}>
              <Stats
                totalCount={deutschCount}
                trainedCount={trained}
                attempts={attempts}
                progress={progress}
              />
            </div>
            {standingSummary.length > 0 && (
              <table className="table-auto border-collapse border border-gray-300 mt-4 w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Wort</th>
                    <th className="border border-gray-300 p-2 text-left">Artikel</th>
                    <th className="border border-gray-300 p-2 text-left">Übersetzung</th>
                  </tr>
                </thead>
                <tbody>
                  {standingSummary.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="border border-gray-300 p-2">{item.Word}</td>
                      <td className="border border-gray-300 p-2">{item.Artikel}</td>
                      <td className="border border-gray-300 p-2">{item.Transl_F}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Dialog open={open} handler={handleOpen}>
            <DialogHeader>Filter</DialogHeader>
            <DialogBody>
              <div className="relative">
                {errorMessage && <Message message={errorMessage} />}
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
                    {[
                      "Adjektiv",
                      "Adverb",
                      "Ausdruck",
                      "Konjunktion",
                      "Nomen",
                      "Partizip",
                    ].map((type) => (
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
                    {[
                      "Präposition",
                      "Intransitives Verb",
                      "Reflexives Verb",
                      "Transitives Verb",
                      "Unpersönliches Verb",
                    ].map((type) => (
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
                    ))}
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
              <Button variant="text" color="red" onClick={handleOpen} className="mr-1">
                <span>Abbrechen</span>
              </Button>
              <Button variant="gradient" color="green" onClick={handleOpen}>
                <span>Bestätigen</span>
              </Button>
            </DialogFooter>
          </Dialog>
        </>
      )}
    </>
  );
}