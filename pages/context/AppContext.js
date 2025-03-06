// pages/context/AppContext.js
import { createContext, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Deutsch-Zustände
  const [filteredDeutsch, setFilteredDeutsch] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [newTypeOfWordFilter, setNewTypeOfWordFilter] = useState("");
  const [isRootSearch, setIsRootSearch] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [deutsch, setDeutsch] = useState([]);
  const [standingSummary, setStandingSummary] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Einziger Ladezustand, Großschreibung korrigiert
  const [currentDeutsch, setCurrentDeutsch] = useState(null);
  const [untrainedPool, setUntrainedPool] = useState([]);
  const [repeatPool, setRepeatPool] = useState([]);
  const [learnedPool, setLearnedPool] = useState([]);
  const [trainedCount, setTrainedCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [wordCounter, setWordCounter] = useState(0);
  const [nextRepeatAt, setNextRepeatAt] = useState(Math.floor(Math.random() * 8) + 3);

  // Präpositionen-Zustände
  const [praeposition, setPraeposition] = useState([]);
  const [standingSummaryPraep, setStandingSummaryPraep] = useState([]);
  const [currentPraeposition, setCurrentPraeposition] = useState(null);
  const [untrainedPoolPraep, setUntrainedPoolPraep] = useState([]);
  const [repeatPoolPraep, setRepeatPoolPraep] = useState([]);
  const [learnedPoolPraep, setLearnedPoolPraep] = useState([]);
  const [wordCounterPraep, setWordCounterPraep] = useState(0);
  const [nextRepeatAtPraep, setNextRepeatAtPraep] = useState(Math.floor(Math.random() * 8) + 3);

  // Vorherige Filterwerte speichern
  const [prevFilterState, setPrevFilterState] = useState({
    searchInput: "",
    newTypeOfWordFilter: "",
    isRootSearch: false,
  });


  const praepositionStats = useMemo(() => {
    const totalCountPraep = praeposition.length; // Definiert totalCount als die Länge des praeposition-Arrays
    
    const progressPraep = totalCountPraep > 0 ? Math.round((trainedCount / totalCountPraep) * 100) || 0 : 0; // Definiert progress basierend auf trainedCountPraep und totalCount
    return { totalCountPraep, progressPraep };
  }, [praeposition, trainedCount]);


  const deutschStats = useMemo(() => {
    const totalCount = deutsch.length; // Definiert totalCount als die Länge des praeposition-Arrays
    const progress = totalCount > 0 ? Math.round((trainedCount / totalCount) * 100) || 0 : 0; // Definiert progress basierend auf trainedCountPraep und totalCount
    return { totalCount, progress };
  }, [deutsch, trainedCount]);



  // Debugging für isDataLoaded
  useEffect(() => {
  }, [isDataLoaded]);

  // Initiale Datenladung für Deutsch
  useEffect(() => {
    if (router.pathname === "/deutsch" && status === "authenticated" && !isDataLoaded) {
      loadInitialData();
    }
  }, [router.pathname, session, status]);

  // Initiale Datenladung für Präpositionen
  useEffect(() => {
    if (router.pathname === "/praeposition" && status === "authenticated" && !isDataLoaded) {
      loadInitialDataPraep();
    }
  }, [router.pathname, session, status]);

  // Wortauswahl für Deutsch
  useEffect(() => {
    if (isDataLoaded && !currentDeutsch && (untrainedPool.length > 0 || repeatPool.length > 0)) {
      selectNextWord();
    }
  }, [isDataLoaded, untrainedPool.length, repeatPool.length, currentDeutsch]);

  // Wortauswahl für Präpositionen
  useEffect(() => {
    if (isDataLoaded && !currentPraeposition && (untrainedPoolPraep.length > 0 || repeatPoolPraep.length > 0)) {
      selectNextWordPraep();
    }
  }, [isDataLoaded, untrainedPoolPraep.length, repeatPoolPraep.length, currentPraeposition]);

  useEffect(() => {
  }, [praeposition]);
  
  const loadInitialData = async () => {
    if (!session || isDataLoaded) {
      return;
    }

    try {
      const deutschRes = await fetch("/api/deutsch", {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
      if (!deutschRes.ok) throw new Error("Fehler beim Laden der Wörter");

      const deutschData = await deutschRes.json();
      setDeutsch(deutschData);
      setUntrainedPool(deutschData);

      await loadStanding(deutschData);

      setIsDataLoaded(true); // Korrigierte Großschreibung
    } catch (error) {
      console.error("[loadInitialData] Fehler:", error.message);
      resetState();
      setIsDataLoaded(true); // Auch im Fehlerfall setzen
    }
  };

  const loadInitialDataPraep = async () => {
    if (!session || isDataLoaded) {
      return;
    }

    try {
      const praepRes = await fetch("/api/praeposition", {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
      if (!praepRes.ok) throw new Error("Fehler beim Laden der Präpositionen");

      const praepData = await praepRes.json();
      setPraeposition(praepData);

      setUntrainedPoolPraep(praepData);

      await loadStandingPraep(praepData);

      setIsDataLoaded(true); // Korrigierte Großschreibung
    } catch (error) {
      resetStatePraep();
      setIsDataLoaded(true); // Auch im Fehlerfall setzen
    }
  };

  const waitForDeutsch = async () => {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (deutsch.length > 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  };

  const waitForPraeposition = async () => {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (praeposition.length > 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  };

  const loadStanding = async (deutschData) => {
    if (!session) {
      return;
    }

    try {
      const standingRes = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=deutsch`,
        {
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        }
      );
      if (!standingRes.ok) throw new Error("Fehler beim Laden des Lernstands");

      const standingData = await standingRes.json();

      if (!standingData.summary || !Array.isArray(standingData.summary)) {
        setStandingSummary([]);
        return;
      }

      if (!deutschData || deutschData.length === 0) {
        await waitForDeutsch();
      }

      const deutschStandings = standingData.summary.map((item) => {
        const word = deutschData.find((d) => d.id.toString() === String(item.exercise));
        if (!word) {
          return {
            exercise: item.exercise,
            correct: item.correct || 0,
            attempts: item.attempts || 0,
            Word: "Unbekannt",
            Artikel: "",
            Transl_F: "Keine Übersetzung",
          };
        }
        return {
          exercise: item.exercise,
          correct: item.correct || 0,
          attempts: item.attempts || 0,
          Word: word.Word || "Unbekannt",
          Artikel: word.Artikel || "",
          Transl_F: word.Transl_F?.[0]?.Transl_F || "Keine Übersetzung",
        };
      });

      applyStandingToWords(deutschStandings, deutschData);
      setStandingSummary(deutschStandings);
    } catch (error) {
      console.error("[loadStanding] Fehler:", error.message);
      resetState();
      setStandingSummary([]);
    }
  };

  const loadStandingPraep = async (praepData) => {
    if (!session) {
      return;
    }
  
    try {
      const standingRes = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=praeposition`,
        {
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        }
      );
      if (!standingRes.ok) throw new Error("Fehler beim Laden des Lernstands");
  
      const standingData = await standingRes.json();
  
      if (!standingData.summary || !Array.isArray(standingData.summary)) {
        console.warn("[loadStandingPraep] Keine oder ungültige summary-Daten:", standingData);
        setStandingSummaryPraep([]);
        return;
      }
  
      // Überprüfe, ob die benötigten Felder vorhanden sind
      const hasRequiredFields = standingData.summary.every(item => 
        item.exercise !== undefined && item.correct !== undefined && item.attempts !== undefined
      );
      if (!hasRequiredFields) {
        console.error("[loadStandingPraep] Fehlende Felder (exercise, correct, attempts) in Standing-Daten:", standingData.summary);
      }
  
      if (!praepData || praepData.length === 0) {
        await waitForPraeposition();
      }
  
      const praepStandings = standingData.summary.map((item) => {
        const praep = praepData.find((p) => p.id.toString() === String(item.exercise || item.id)); // Fallback auf item.id
        if (!praep) {
          console.warn("[loadStandingPraep] Keine Übereinstimmung für exercise:", item.exercise || item.id);
          return {
            exercise: item.exercise || item.id, // Fallback
            correct: item.correct || 0,
            attempts: item.attempts || 0,
            Satz: "Unbekannt",
            Loesung: "Keine Lösung",
          };
        }
        return {
          exercise: item.exercise || item.id, // Fallback
          correct: item.correct || 0,
          attempts: item.attempts || 0,
          Satz: praep.Satz || "Unbekannt",
          Loesung: praep.Loesung || "Keine Lösung",
        };
      });
  
      applyStandingToWordsPraep(praepStandings, praepData);
      setStandingSummaryPraep(praepStandings);
    } catch (error) {
      resetStatePraep();
      setStandingSummaryPraep([]);
    }
  };

  const applyStandingToWords = (standing, deutschData) => {
    const learnedIds = standing.filter((s) => s.correct === 2).map((s) => s.exercise.toString());
    const repeatIds = standing.filter((s) => s.correct < 2).map((s) => s.exercise.toString());

    const untrainedWords = deutschData.filter(
      (word) => !learnedIds.includes(word.id) && !repeatIds.includes(word.id)
    );
    const repeatWords = deutschData.filter((word) => repeatIds.includes(word.id));
    const learnedWords = deutschData.filter((word) => learnedIds.includes(word.id));

    setUntrainedPool(untrainedWords);
    setRepeatPool(repeatWords);
    setLearnedPool(learnedWords);

    setAttempts(standing.reduce((max, s) => Math.max(max, s.attempts || 0), 0));
    setTrainedCount(learnedIds.length);
  };

  const applyStandingToWordsPraep = (standing, praepData) => {
    const learnedIds = standing.filter((s) => s.correct === 2).map((s) => s.exercise.toString());
    const repeatIds = standing.filter((s) => s.correct < 2).map((s) => s.exercise.toString());
  
    const untrainedWords = praepData.filter(
      (praep) => !learnedIds.includes(praep.id) && !repeatIds.includes(praep.id)
    );
    const repeatWords = praepData.filter((praep) => repeatIds.includes(praep.id));
    const learnedWords = praepData.filter((praep) => learnedIds.includes(praep.id));
  
    setUntrainedPoolPraep(untrainedWords);
    setRepeatPoolPraep(repeatWords);
    setLearnedPoolPraep(learnedWords);
  
    const newAttempts = standing.reduce((max, s) => Math.max(max, s.attempts || 0), 0);
    const newTrainedCount = learnedIds.length;
    setAttempts(newAttempts);
    setTrainedCount(newTrainedCount);
  
    setStandingSummaryPraep({
      untrained: untrainedWords.length,
      repeat: repeatWords.length,
      learned: learnedWords.length,
      attempts: newAttempts,
      trainedCount: newTrainedCount,
    });
  };

  const resetState = () => {
    if (isDataLoaded) {
      return;
    }
    setUntrainedPool(deutsch);
    setRepeatPool([]);
    setLearnedPool([]);
    setTrainedCount(0);
    setAttempts(0);
    setCurrentDeutsch(null);
    setStandingSummary([]);
    setWordCounter(0);
    setNextRepeatAt(Math.floor(Math.random() * 8) + 3);
    setFilteredDeutsch([]);
    setSearchInput("");
    setNewTypeOfWordFilter("");
    setIsRootSearch(false);
    setIsApplyingFilters(false);
  };

  const resetStatePraep = () => {
    if (isDataLoaded) return;
    setUntrainedPoolPraep(praeposition);
    setRepeatPoolPraep([]);
    setLearnedPoolPraep([]);
    setTrainedCount(0);
    setAttempts(0);
    setCurrentPraeposition(null);
    setStandingSummaryPraep([]);
    setWordCounterPraep(0);
    setNextRepeatAtPraep(Math.floor(Math.random() * 8) + 3);
  };

  const resetPoolsToInitialState = () => {
    applyStandingToWords(standingSummary, deutsch);
  };

  const selectNextWord = () => {
    let selectedWord = null;
    if (wordCounter >= nextRepeatAt && repeatPool.length > 0) {
      selectedWord = repeatPool[Math.floor(Math.random() * repeatPool.length)];
      setWordCounter(0);
      setNextRepeatAt(Math.floor(Math.random() * 8) + 3);
    } else {
      selectedWord = untrainedPool.length > 0 ? untrainedPool[Math.floor(Math.random() * untrainedPool.length)] : null;
      setWordCounter((prev) => prev + 1);
    }

    if (!selectedWord && !untrainedPool.length && !repeatPool.length) {
      setCurrentDeutsch(null);
      setIsDataLoaded(true); // Korrigierte Großschreibung
      return;
    }

    setCurrentDeutsch(selectedWord);
  };

  const selectNextWordPraep = () => {
    let selectedWord = null;
    if (wordCounterPraep >= nextRepeatAtPraep && repeatPoolPraep.length > 0) {
      selectedWord = repeatPoolPraep[Math.floor(Math.random() * repeatPoolPraep.length)];
      setWordCounterPraep(0);
      setNextRepeatAtPraep(Math.floor(Math.random() * 8) + 3);
    } else {
      selectedWord = untrainedPoolPraep.length > 0 ? untrainedPoolPraep[Math.floor(Math.random() * untrainedPoolPraep.length)] : null;
      setWordCounterPraep((prev) => prev + 1);
    }

    if (!selectedWord && !untrainedPoolPraep.length && !repeatPoolPraep.length) {
      setCurrentPraeposition(null);
      setIsDataLoaded(true); // Korrigierte Großschreibung
      return;
    }

    setCurrentPraeposition(selectedWord);
  };

  const saveToServer = async (button, data) => {
    if (!session) {
      return null;
    }

    if (saveToServer.isExecuting) {
      return null;
    }
    saveToServer.isExecuting = true;

    try {
      const url =
        button === "REV"
          ? `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=deutsch`
          : "/api/standing";
      const method = button === "REV" ? "DELETE" : "POST";
      const body =
        button === "REV"
          ? null
          : JSON.stringify({
              user: session.user.email,
              exercise: data?.exercise,
              standingId: data?.standingId,
              correct: data?.correct,
              attempts: data?.attempts,
              kategorie: "deutsch",
              button,
            });

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) throw new Error(`Fehler beim Speichern (${button}): ${response.statusText}`);
      return await response.json();
    } catch (error) {
      return null;
    } finally {
      saveToServer.isExecuting = false;
    }
  };

  const saveToServerPraep = async (button, data) => {
    if (!session) return null;

    if (saveToServerPraep.isExecuting) return null;
    saveToServerPraep.isExecuting = true;

    try {
      const url =
        button === "REV"
          ? `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=praeposition`
          : "/api/standing";
      const method = button === "REV" ? "DELETE" : "POST";
      const body =
        button === "REV"
          ? null
          : JSON.stringify({
              user: session.user.email,
              exercise: data?.exercise,
              standingId: data?.standingId,
              correct: data?.correct,
              attempts: data?.attempts,
              kategorie: "praeposition",
              button,
            });

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) throw new Error(`Fehler beim Speichern (${button}): ${response.statusText}`);
      return await response.json();
    } catch (error) {
      return null;
    } finally {
      saveToServerPraep.isExecuting = false;
    }
  };

  saveToServer.isExecuting = false;

  const applyFilters = () => {
    setIsApplyingFilters(true);
    try {
      const currentFilterState = { searchInput, newTypeOfWordFilter, isRootSearch };

      if (
        currentFilterState.searchInput === prevFilterState.searchInput &&
        currentFilterState.newTypeOfWordFilter === prevFilterState.newTypeOfWordFilter &&
        currentFilterState.isRootSearch === prevFilterState.isRootSearch
      ) {
        return;
      }

      setPrevFilterState(currentFilterState);

      const learnedIds = standingSummary
        .filter((s) => s.correct === 2)
        .map((s) => s.exercise.toString());
      const repeatIds = standingSummary
        .filter((s) => s.correct < 2)
        .map((s) => s.exercise.toString());

      const untrainedWords = deutsch.filter(
        (word) => !learnedIds.includes(word.id) && !repeatIds.includes(word.id)
      );
      const repeatWords = deutsch.filter((word) => repeatIds.includes(word.id));
      const learnedWords = deutsch.filter((word) => learnedIds.includes(word.id));

      setUntrainedPool(untrainedWords);
      setRepeatPool(repeatWords);
      setLearnedPool(learnedWords);

      if (!searchInput && !newTypeOfWordFilter && !isRootSearch) {
        const resetFiltered = [...untrainedWords, ...repeatWords];
        setFilteredDeutsch(resetFiltered);

        let selectedWord = null;
        if (wordCounter >= nextRepeatAt && repeatWords.length > 0) {
          selectedWord = repeatWords[Math.floor(Math.random() * repeatWords.length)];
          setWordCounter(0);
          setNextRepeatAt(Math.floor(Math.random() * 8) + 3);
        } else {
          selectedWord = untrainedWords.length > 0 ? untrainedWords[Math.floor(Math.random() * untrainedWords.length)] : null;
          setWordCounter((prev) => prev + 1);
        }
        if (!selectedWord && !untrainedWords.length && !repeatWords.length) {
          setCurrentDeutsch(null);
        } else {
          setCurrentDeutsch(selectedWord);
        }
        return;
      }

      let allWords = [...untrainedWords, ...repeatWords, ...learnedWords];

      if (searchInput) {
        const key = isRootSearch ? "Root" : "Word";
        allWords = allWords.filter((word) => 
          word[key]?.toLowerCase().includes(searchInput.toLowerCase())
        );
      }

      if (newTypeOfWordFilter) {
        allWords = allWords.filter((word) => 
          word.TypeOfWord.some((type) => type.TypeOfWord === newTypeOfWordFilter)
        );
      }

      const newUntrainedPool = allWords.filter(
        (word) => !learnedIds.includes(word.id) && !repeatIds.includes(word.id)
      );
      const newRepeatPool = allWords.filter((word) => repeatIds.includes(word.id));
      const newLearnedPool = allWords.filter((word) => learnedIds.includes(word.id));

      setUntrainedPool(newUntrainedPool);
      setRepeatPool(newRepeatPool);
      setLearnedPool(newLearnedPool);
      const newFilteredDeutsch = [...newUntrainedPool, ...newRepeatPool];
      setFilteredDeutsch(newFilteredDeutsch);

      let selectedWord = null;
      if (wordCounter >= nextRepeatAt && newRepeatPool.length > 0) {
        selectedWord = newRepeatPool[Math.floor(Math.random() * newRepeatPool.length)];
        setWordCounter(0);
        setNextRepeatAt(Math.floor(Math.random() * 8) + 3);
      } else {
        selectedWord = newUntrainedPool.length > 0 ? newUntrainedPool[Math.floor(Math.random() * newUntrainedPool.length)] : null;
        setWordCounter((prev) => prev + 1);
      }
      if (!selectedWord && !newUntrainedPool.length && !newRepeatPool.length) {
        setCurrentDeutsch(null);
      } else {
        setCurrentDeutsch(selectedWord);
      }
    } catch (error) {
      console.error("[applyFilters] Fehler:", error.message);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        session,
        deutsch,
        setDeutsch,
        standingSummary,
        setStandingSummary,
        isDataLoaded,
        setIsDataLoaded, // Korrigierte Großschreibung
        currentDeutsch,
        setCurrentDeutsch,
        trainedCount,
        attempts,
        saveToServer,
        applyFilters,
        untrained: untrainedPool,
        setUntrainedPool,
        repeatPool,
        setRepeatPool,
        setTrainedCount,
        setAttempts,
        filteredDeutsch,
        setFilteredDeutsch,
        searchInput,
        setSearchInput,
        newTypeOfWordFilter,
        setNewTypeOfWordFilter,
        isRootSearch,
        setIsRootSearch,
        isApplyingFilters,
        setIsApplyingFilters,
        selectNextWord,
        setLearnedPool,
        resetPoolsToInitialState,
        // Präpositionen-Werte
        praeposition,
        setPraeposition,
        standingSummaryPraep,
        setStandingSummaryPraep,
        currentPraeposition,
        setCurrentPraeposition,
        saveToServerPraep,
        untrainedPraep: untrainedPoolPraep,
        setUntrainedPoolPraep,
        repeatPoolPraep,
        setRepeatPoolPraep,
        selectNextWordPraep,
        setLearnedPoolPraep,
        totalCountPraep: praepositionStats.totalCountPraep,
        progressPraep: praepositionStats.progressPraep,
        totalCount: deutschStats.totalCount,
        progress: deutschStats.progress
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;