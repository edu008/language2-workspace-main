// AppContext.js
import { createContext, useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Timer-Referenz für die Lernzeit pro Sitzung
  const sessionStartTimeRef = useRef(null);

  // Unified state for all features
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [trainedCount, setTrainedCount] = useState(0);

  // Common filter state (currently only for deutsch, can be extended)
  const [searchInput, setSearchInput] = useState("");
  const [newTypeOfWordFilter, setNewTypeOfWordFilter] = useState("");
  const [isRootSearch, setIsRootSearch] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [prevFilterState, setPrevFilterState] = useState({
    searchInput: "",
    newTypeOfWordFilter: "",
    isRootSearch: false,
  });

  // Feature-specific state with consistent naming pattern
  const [data, setData] = useState({
    deutsch: [],
    praeposition: [],
    sprichwort: [],
    redewendung: [],
    praepverben: [],
  });

  const [filteredData, setFilteredData] = useState({
    deutsch: [],
    sprichwort: [],
    redewendung: [],
    praepverben: [],
  });

  const [standingSummary, setStandingSummary] = useState({
    deutsch: [],
    praeposition: [],
    sprichwort: [],
    redewendung: [],
    praepverben: [],
  });

  const [currentItem, setCurrentItem] = useState({
    deutsch: null,
    praeposition: null,
    sprichwort: null,
    redewendung: null,
    praepverben: null,
  });

  const [pools, setPools] = useState({
    deutsch: { untrained: [], repeat: [], learned: [] },
    praeposition: { untrained: [], repeat: [], learned: [] },
    sprichwort: { untrained: [], repeat: [], learned: [] },
    redewendung: { untrained: [], repeat: [], learned: [] },
    praepverben: { untrained: [], repeat: [], learned: [] },
  });

  const [counters, setCounters] = useState({
    deutsch: { wordCounter: 0, nextRepeatAt: Math.floor(Math.random() * 8) + 3 },
    praeposition: { wordCounter: 0, nextRepeatAt: Math.floor(Math.random() * 8) + 3 },
    sprichwort: { wordCounter: 0, nextRepeatAt: Math.floor(Math.random() * 8) + 3 },
    redewendung: { wordCounter: 0, nextRepeatAt: Math.floor(Math.random() * 8) + 3 },
    praepverben: { wordCounter: 0, nextRepeatAt: Math.floor(Math.random() * 8) + 3 },
  });

  // Computed stats for all features
  const stats = useMemo(() => {
    return {
      deutsch: {
        totalCount: data.deutsch.length,
        progress: data.deutsch.length > 0 ? Math.round((trainedCount / data.deutsch.length) * 100) || 0 : 0,
      },
      praeposition: {
        totalCount: data.praeposition.length,
        progress: data.praeposition.length > 0 ? Math.round((trainedCount / data.praeposition.length) * 100) || 0 : 0,
      },
      sprichwort: {
        totalCount: data.sprichwort.length,
        progress: data.sprichwort.length > 0 ? Math.round((trainedCount / data.sprichwort.length) * 100) || 0 : 0,
      },
      redewendung: {
        totalCount: data.redewendung.length,
        progress: data.redewendung.length > 0 ? Math.round((trainedCount / data.redewendung.length) * 100) || 0 : 0,
      },
      praepverben: {
        totalCount: data.praepverben.length,
        progress: data.praepverben.length > 0 ? Math.round((trainedCount / data.praepverben.length) * 100) || 0 : 0,
      },
    };
  }, [data, trainedCount]);

  // Unified data loading based on current route
  useEffect(() => {
    const currentFeature = getCurrentFeature();
    if (currentFeature && status === "authenticated" && !isDataLoaded) {
      loadInitialData(currentFeature);
    }
  }, [router.pathname, session, status]);

  // Unified word selection
  useEffect(() => {
    const currentFeature = getCurrentFeature();
    if (
      currentFeature &&
      isDataLoaded &&
      !currentItem[currentFeature] &&
      (pools[currentFeature].untrained.length > 0 || pools[currentFeature].repeat.length > 0)
    ) {
      selectNextWord(currentFeature);
      // Starte den Timer, wenn eine neue Übung beginnt
      sessionStartTimeRef.current = Date.now();
    }
  }, [isDataLoaded, pools, currentItem, router.pathname]);

  // Helper to determine current feature based on route
  const getCurrentFeature = () => {
    if (router.pathname === "/deutsch") return "deutsch";
    if (router.pathname === "/praeposition") return "praeposition";
    if (router.pathname === "/sprichwort") return "sprichwort";
    if (router.pathname === "/redewendung") return "redewendung";
    if (router.pathname === "/praepverben") return "praepverben";
    return null;
  };

  // Unified data loading function
  const loadInitialData = async (feature) => {
    if (!session) return;

    setIsDataLoaded(false);

    try {
      const res = await fetch(`/api/${feature}`, {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });

      if (!res.ok) throw new Error(`Fehler beim Laden der ${feature} Daten`);

      const featureData = await res.json();

      setData((prev) => ({
        ...prev,
        [feature]: featureData,
      }));

      setPools((prev) => ({
        ...prev,
        [feature]: {
          ...prev[feature],
          untrained: featureData,
        },
      }));

      await loadStanding(feature, featureData);

      setIsDataLoaded(true);
    } catch (error) {
      console.error(`[loadInitialData:${feature}] Fehler:`, error.message);
      resetState(feature);
      setIsDataLoaded(true);
    }
  };

  // Unified standing loading
  const loadStanding = async (feature, featureData) => {
    if (!session) return;

    try {
      const standingRes = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=${feature}`,
        {
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        }
      );

      if (!standingRes.ok) throw new Error("Fehler beim Laden des Lernstands");

      const standingData = await standingRes.json();

      if (!standingData.summary || !Array.isArray(standingData.summary)) {
        setStandingSummary((prev) => ({
          ...prev,
          [feature]: [],
        }));
        return;
      }

      if (!featureData || featureData.length === 0) {
        await waitForData(feature);
      }

      const mappedStandings = standingData.summary.map((item) => {
        const foundItem = featureData.find((d) => d.id.toString() === String(item.exercise || item.id));

        if (!foundItem) {
          return {
            exercise: item.exercise || item.id,
            correct: item.correct || 0,
            attempts: item.attempts || 0,
            duration: item.duration || 0,
            ...(feature === "deutsch"
              ? { Word: "Unbekannt", Artikel: "", Transl_F: "Keine Übersetzung" }
              : feature === "praeposition"
              ? { Satz: "Unbekannt", Loesung: "Keine Lösung" }
              : feature === "sprichwort"
              ? { Sprichwort: "Unbekannt", Erklaerung: "Keine Erklärung" }
              : feature === "redewendung"
              ? { Redewendung: "Unbekannt", Erklaerung: "Keine Erklärung" }
              : { Satz: "Unbekannt", Verb: "Unbekannt", Loesung: "Keine Lösung" }),
          };
        }

        return {
          exercise: item.exercise || item.id,
          correct: item.correct || 0,
          attempts: item.attempts || 0,
          duration: item.duration || 0,
          ...(feature === "deutsch"
            ? {
                Word: foundItem.Word || "Unbekannt",
                Artikel: foundItem.Artikel || "",
                Transl_F: foundItem.Transl_F?.[0]?.Transl_F || "Keine Übersetzung",
              }
            : feature === "praeposition"
            ? {
                Satz: foundItem.Satz || "Unbekannt",
                Loesung: foundItem.Loesung || "Keine Lösung",
              }
            : feature === "sprichwort"
            ? {
                Sprichwort: foundItem.Sprichwort || "Unbekannt",
                Erklaerung: foundItem.Erklaerung || "Keine Erklärung",
                Wort: foundItem.Wort || "",
                Beispiel: foundItem.Beispiel || "",
                Quelle: foundItem.Quelle || "",
                Datum: foundItem.Datum || "",
              }
            : feature === "redewendung"
            ? {
                Redewendung: foundItem.Redewendung || "Unbekannt",
                Erklaerung: foundItem.Erklaerung || "Keine Erklärung",
                Wort: foundItem.Wort || "",
                Beispiel: foundItem.Beispiel || "",
                Quelle: foundItem.Quelle || "",
                Datum: foundItem.Datum || "",
              }
            : {
                Satz: foundItem.Satz || "Unbekannt",
                Verb: foundItem.Verb || "Unbekannt",
                Loesung: foundItem.Loesung || "Keine Lösung",
                Beispiele: foundItem.Beispiele || "",
                Erklaerung: foundItem.Erklaerung || "Keine Erklärung",
                quelle: foundItem.quelle || "",
                Datum: foundItem.Datum || "",
              }),
        };
      });

      applyStandingToWords(feature, mappedStandings, featureData);

      setStandingSummary((prev) => ({
        ...prev,
        [feature]: mappedStandings,
      }));
    } catch (error) {
      console.error(`[loadStanding:${feature}] Fehler:`, error.message);
      resetState(feature);
      setStandingSummary((prev) => ({
        ...prev,
        [feature]: [],
      }));
    }
  };

  // Helper to wait for data to be available
  const waitForData = async (feature) => {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (data[feature].length > 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  };

  // Unified function to apply standing to words
  const applyStandingToWords = (feature, standing, featureData) => {
    const learnedIds = standing.filter((s) => s.correct === 2).map((s) => s.exercise.toString());
    const repeatIds = standing.filter((s) => s.correct < 2).map((s) => s.exercise.toString());

    const untrainedWords = featureData.filter(
      (item) => !learnedIds.includes(item.id.toString()) && !repeatIds.includes(item.id.toString())
    );
    const repeatWords = featureData.filter((item) => repeatIds.includes(item.id.toString()));
    const learnedWords = featureData.filter((item) => learnedIds.includes(item.id.toString()));

    setPools((prev) => ({
      ...prev,
      [feature]: {
        untrained: untrainedWords,
        repeat: repeatWords,
        learned: learnedWords,
      },
    }));

    setAttempts(standing.reduce((sum, s) => sum + (s.attempts || 0), 0));
    setTrainedCount(learnedIds.length);
  };

  // Unified state reset
  const resetState = (feature) => {
    setPools((prev) => ({
      ...prev,
      [feature]: {
        untrained: data[feature],
        repeat: [],
        learned: [],
      },
    }));

    setTrainedCount(0);
    setAttempts(0);

    setCurrentItem((prev) => ({
      ...prev,
      [feature]: null,
    }));

    setStandingSummary((prev) => ({
      ...prev,
      [feature]: [],
    }));

    setCounters((prev) => ({
      ...prev,
      [feature]: {
        wordCounter: 0,
        nextRepeatAt: Math.floor(Math.random() * 8) + 3,
      },
    }));

    if (feature === "deutsch") {
      setFilteredData({
        deutsch: [],
      });
      setSearchInput("");
      setNewTypeOfWordFilter("");
      setIsRootSearch(false);
      setIsApplyingFilters(false);
    }

    setIsDataLoaded(false);
  };

  // Unified function to reset pools to initial state
  const resetPoolsToInitialState = (feature) => {
    applyStandingToWords(feature, standingSummary[feature], data[feature]);
  };

  // Unified word selection
  const selectNextWord = (feature) => {
    const featurePools = pools[feature];
    const featureCounters = counters[feature];

    let selectedWord = null;

    if (featureCounters.wordCounter >= featureCounters.nextRepeatAt && featurePools.repeat.length > 0) {
      selectedWord = featurePools.repeat[Math.floor(Math.random() * featurePools.repeat.length)];
      setCounters((prev) => ({
        ...prev,
        [feature]: {
          ...prev[feature],
          wordCounter: 0,
          nextRepeatAt: Math.floor(Math.random() * 8) + 3,
        },
      }));
    } else {
      selectedWord =
        featurePools.untrained.length > 0
          ? featurePools.untrained[Math.floor(Math.random() * featurePools.untrained.length)]
          : null;
      setCounters((prev) => ({
        ...prev,
        [feature]: {
          ...prev[feature],
          wordCounter: prev[feature].wordCounter + 1,
        },
      }));
    }

    if (!selectedWord && !featurePools.untrained.length && !featurePools.repeat.length) {
      setCurrentItem((prev) => ({
        ...prev,
        [feature]: null,
      }));
      setIsDataLoaded(true);
      return;
    }

    setCurrentItem((prev) => ({
      ...prev,
      [feature]: selectedWord,
    }));
  };

  // Unified save to server function
  const saveToServer = async (feature, button, data) => {
    if (!session) return null;

    // Berechne die Dauer der Sitzung (in Sekunden)
    const duration = sessionStartTimeRef.current
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      : 0;

    try {
      const url =
        button === "REV"
          ? `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=${feature}`
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
              kategorie: feature,
              button,
              duration: duration, // Lernzeit in Sekunden
            });

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) throw new Error(`Fehler beim Speichern (${button}): ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`[saveToServer:${feature}] Fehler:`, error.message);
      return null;
    }
  };

  // Separate execution flags for each save function
  const saveToServerDeutsch = async (button, data) => saveToServer("deutsch", button, data);
  const saveToServerPraep = async (button, data) => saveToServer("praeposition", button, data);
  const saveToServerSprichwort = async (button, data) => saveToServer("sprichwort", button, data);
  const saveToServerRedewendung = async (button, data) => saveToServer("redewendung", button, data);
  const saveToServerPraepverben = async (button, data) => saveToServer("praepverben", button, data);

  saveToServerDeutsch.isExecuting = false;
  saveToServerPraep.isExecuting = false;
  saveToServerSprichwort.isExecuting = false;
  saveToServerRedewendung.isExecuting = false;
  saveToServerPraepverben.isExecuting = false;

  // Filter application (currently only for deutsch)
  const applyFilters = () => {
    setIsApplyingFilters(true);
    try {
      console.log("Applying filters with:", {
        searchInput,
        newTypeOfWordFilter,
        isRootSearch,
        dataDeutsch: data.deutsch,
      });

      const currentFilterState = { searchInput, newTypeOfWordFilter, isRootSearch };

      if (
        currentFilterState.searchInput === prevFilterState.searchInput &&
        currentFilterState.newTypeOfWordFilter === prevFilterState.newTypeOfWordFilter &&
        currentFilterState.isRootSearch === prevFilterState.isRootSearch
      ) {
        return;
      }

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

      setPools((prev) => ({
        ...prev,
        deutsch: {
          untrained: untrainedWords,
          repeat: repeatWords,
          learned: learnedWords,
        },
      }));

      const newFilteredDeutsch = [...untrainedWords, ...repeatWords];
      setFilteredData({
        deutsch: newFilteredDeutsch,
      });

      let selectedWord = null;
      const featureCounters = counters.deutsch;
      if (featureCounters.wordCounter >= featureCounters.nextRepeatAt && repeatWords.length > 0) {
        selectedWord = repeatWords[Math.floor(Math.random() * repeatWords.length)];
        setCounters((prev) => ({
          ...prev,
          deutsch: {
            ...prev.deutsch,
            wordCounter: 0,
            nextRepeatAt: Math.floor(Math.random() * 8) + 3,
          },
        }));
      } else {
        selectedWord =
          untrainedWords.length > 0
            ? untrainedWords[Math.floor(Math.random() * untrainedWords.length)]
            : null;
        setCounters((prev) => ({
          ...prev,
          deutsch: {
            ...prev.deutsch,
            wordCounter: prev.deutsch.wordCounter + 1,
          },
        }));
      }

      if (!selectedWord && !untrainedWords.length && !repeatWords.length) {
        setCurrentItem((prev) => ({
          ...prev,
          deutsch: null,
        }));
      } else {
        setCurrentItem((prev) => ({
          ...prev,
          deutsch: selectedWord,
        }));
      }
    } catch (error) {
      console.error("[applyFilters] Fehler:", error);
    } finally {
      setIsApplyingFilters(false);
    }
  };

  // Unified function to handle word feedback
  const handleWordFeedback = async (feature, isCorrect) => {
    if (!currentItem[feature] || !session) return;

    try {
      const itemId = currentItem[feature].id;
      const standingItem = standingSummary[feature].find(
        (s) => s.exercise.toString() === itemId.toString()
      );

      const currentAttempts = standingItem ? standingItem.attempts + 1 : 1;
      const currentCorrect = standingItem
        ? isCorrect
          ? Math.min(standingItem.correct + 1, 2)
          : Math.max(standingItem.correct - 1, 0)
        : isCorrect
        ? 1
        : 0;

      // Berechne die Dauer der Sitzung (in Sekunden)
      const duration = sessionStartTimeRef.current
        ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
        : 0;

      const updatedStanding = {
        exercise: itemId,
        standingId: standingItem?.id,
        correct: currentCorrect,
        attempts: currentAttempts,
        duration: duration, // Lernzeit in Sekunden
      };

      const updatedStandingSummary = [...standingSummary[feature]];
      const existingIndex = updatedStandingSummary.findIndex(
        (s) => s.exercise.toString() === itemId.toString()
      );

      if (existingIndex >= 0) {
        updatedStandingSummary[existingIndex] = {
          ...updatedStandingSummary[existingIndex],
          correct: currentCorrect,
          attempts: currentAttempts,
          duration: (updatedStandingSummary[existingIndex].duration || 0) + duration, // Akkumuliere die Dauer (in Sekunden)
        };
      } else {
        const newStandingItem = {
          exercise: itemId,
          correct: currentCorrect,
          attempts: currentAttempts,
          duration: duration,
          ...(feature === "deutsch"
            ? {
                Word: currentItem[feature].Word || "Unbekannt",
                Artikel: currentItem[feature].Artikel || "",
                Transl_F: currentItem[feature].Transl_F?.[0]?.Transl_F || "Keine Übersetzung",
              }
            : feature === "praeposition"
            ? {
                Satz: currentItem[feature].Satz || "Unbekannt",
                Loesung: currentItem[feature].Loesung || "Keine Lösung",
              }
            : feature === "sprichwort"
            ? {
                Sprichwort: currentItem[feature].Sprichwort || "Unbekannt",
                Erklaerung: currentItem[feature].Erklaerung || "Keine Erklärung",
                Wort: currentItem[feature].Wort || "",
                Beispiel: currentItem[feature].Beispiel || "",
                Quelle: currentItem[feature].Quelle || "",
                Datum: currentItem[feature].Datum || "",
              }
            : feature === "redewendung"
            ? {
                Redewendung: currentItem[feature].Redewendung || "Unbekannt",
                Erklaerung: currentItem[feature].Erklaerung || "Keine Erklärung",
                Wort: currentItem[feature].Wort || "",
                Beispiel: currentItem[feature].Beispiel || "",
                Quelle: currentItem[feature].Quelle || "",
                Datum: currentItem[feature].Datum || "",
              }
            : {
                Satz: currentItem[feature].Satz || "Unbekannt",
                Verb: currentItem[feature].Verb || "Unbekannt",
                Loesung: currentItem[feature].Loesung || "Keine Lösung",
                Beispiele: currentItem[feature].Beispiele || "",
                Erklaerung: currentItem[feature].Erklaerung || "Keine Erklärung",
                quelle: currentItem[feature].quelle || "",
                Datum: currentItem[feature].Datum || "",
              }),
        };
        updatedStandingSummary.push(newStandingItem);
      }

      setStandingSummary((prev) => ({
        ...prev,
        [feature]: updatedStandingSummary,
      }));

      setAttempts((prev) => prev + 1);

      const currentPools = { ...pools[feature] };
      const currentItemId = currentItem[feature].id.toString();

      currentPools.untrained = currentPools.untrained.filter(
        (item) => item.id.toString() !== currentItemId
      );
      currentPools.repeat = currentPools.repeat.filter(
        (item) => item.id.toString() !== currentItemId
      );
      currentPools.learned = currentPools.learned.filter(
        (item) => item.id.toString() !== currentItemId
      );

      if (currentCorrect === 2) {
        currentPools.learned.push(currentItem[feature]);
        setTrainedCount((prev) => prev + 1);
      } else {
        currentPools.repeat.push(currentItem[feature]);
      }

      setPools((prev) => ({
        ...prev,
        [feature]: currentPools,
      }));

      setCurrentItem((prev) => ({
        ...prev,
        [feature]: null,
      }));

      await saveToServer(feature, isCorrect ? "OK" : "NOK", updatedStanding);
      // Starte den Timer für die nächste Übung neu
      sessionStartTimeRef.current = Date.now();
    } catch (error) {
      console.error(`[handleWordFeedback:${feature}] Fehler:`, error);
    }
  };

  // Unified function to reset learning progress
  const resetLearningProgress = async (feature) => {
    if (!session) return;

    try {
      const result = await saveToServer(feature, "REV", null);
      if (result) {
        console.log(`Server-Reset für ${feature} erfolgreich:`, result);
        resetState(feature);
        await loadInitialData(feature);
      } else {
        console.error(`Server-Reset für ${feature} fehlgeschlagen`);
      }
    } catch (error) {
      console.error(`[resetLearningProgress:${feature}] Fehler:`, error);
    }
  };

  // Feature-specific handler functions
  const handleDeutschWordFeedback = (isCorrect) => handleWordFeedback("deutsch", isCorrect);
  const handlePraepWordFeedback = (isCorrect) => handleWordFeedback("praeposition", isCorrect);
  const handleSprichwortFeedback = (isCorrect) => handleWordFeedback("sprichwort", isCorrect);
  const handleRedewendungFeedback = (isCorrect) => handleWordFeedback("redewendung", isCorrect);
  const handlePraepverbenFeedback = (isCorrect) => handleWordFeedback("praepverben", isCorrect);
  const resetDeutschLearningProgress = () => resetLearningProgress("deutsch");
  const resetPraepLearningProgress = () => resetLearningProgress("praeposition");
  const resetSprichwortLearningProgress = () => resetLearningProgress("sprichwort");
  const resetRedewendungLearningProgress = () => resetLearningProgress("redewendung");
  const resetPraepverbenLearningProgress = () => resetLearningProgress("praepverben");

  // Effect to apply filters when relevant state changes
  useEffect(() => {
    if (router.pathname === "/deutsch" && data.deutsch.length > 0) {
      applyFilters();
    }
  }, [searchInput, newTypeOfWordFilter, isRootSearch, data.deutsch, standingSummary.deutsch]);

  return (
    <AppContext.Provider
      value={{
        // Session and loading state
        session,
        status,
        isDataLoaded,

        // Common state
        attempts,
        trainedCount,

        // Feature-specific data
        data,
        filteredData,
        standingSummary,
        currentItem,
        pools,
        stats,

        // Filter state (primarily for deutsch)
        searchInput,
        setSearchInput,
        newTypeOfWordFilter,
        setNewTypeOfWordFilter,
        isRootSearch,
        setIsRootSearch,
        isApplyingFilters,
        setIsApplyingFilters,

        // Feature-specific handlers
        handleDeutschWordFeedback,
        handlePraepWordFeedback,
        handleSprichwortFeedback,
        handleRedewendungFeedback,
        handlePraepverbenFeedback,
        resetDeutschLearningProgress,
        resetPraepLearningProgress,
        resetSprichwortLearningProgress,
        resetRedewendungLearningProgress,
        resetPraepverbenLearningProgress,

        // Helper functions
        getCurrentFeature,
        resetPoolsToInitialState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};