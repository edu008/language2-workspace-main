// PraepositionContext.js
import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { useBaseContext } from "./BaseContext";
import { useDataContext } from "./DataContext";
import { useRouter } from "next/router";

// Create the context
export const PraepositionContext = createContext();

// Custom hook for using this context
export const usePraepositionContext = () => useContext(PraepositionContext);

export const PraepositionProvider = ({ children }) => {
  const router = useRouter();
  const { session, status, isDataLoaded, setIsDataLoaded, getCurrentFeature } = useBaseContext();
  const { data, standingSummary, loadInitialData, saveToServer, resetSessionTimer, sessionStartTimeRef } = useDataContext();

  // Feature-specific state
  const [currentItem, setCurrentItem] = useState(null);
  const [pools, setPools] = useState({
    untrained: [],
    repeat: [],
    learned: [],
  });
  const [counters, setCounters] = useState({
    wordCounter: 0,
    nextRepeatAt: Math.floor(Math.random() * 8) + 3,
  });

  // Computed stats
  const stats = useMemo(() => {
    return {
      totalCount: data.praeposition.length,
      progress: data.praeposition.length > 0 
        ? Math.round((pools.learned.length / data.praeposition.length) * 100) || 0 
        : 0,
    };
  }, [data.praeposition, pools.learned]);

  // Load initial data when component mounts or route changes
  useEffect(() => {
    if (router.pathname === "/praeposition" && status === "authenticated" && !isDataLoaded) {
      loadPraepositionData();
    }
  }, [router.pathname, session, status]);

  // Select next word when data is loaded
  useEffect(() => {
    if (
      router.pathname === "/praeposition" &&
      isDataLoaded &&
      !currentItem &&
      (pools.untrained.length > 0 || pools.repeat.length > 0)
    ) {
      selectNextWord();
      // Start the timer when a new exercise begins
      resetSessionTimer();
    }
  }, [isDataLoaded, pools, currentItem, router.pathname]);

  // Load praeposition data
  const loadPraepositionData = async () => {
    const featureData = await loadInitialData("praeposition");
    if (featureData && featureData.length > 0) {
      applyStandingToWords(standingSummary.praeposition, featureData);
    }
  };

  // Apply standing to words
  const applyStandingToWords = (standing, featureData) => {
    const learnedIds = standing.filter((s) => s.correct === 2).map((s) => s.exercise.toString());
    const repeatIds = standing.filter((s) => s.correct < 2).map((s) => s.exercise.toString());

    const untrainedWords = featureData.filter(
      (item) => !learnedIds.includes(item.id.toString()) && !repeatIds.includes(item.id.toString())
    );
    const repeatWords = featureData.filter((item) => repeatIds.includes(item.id.toString()));
    const learnedWords = featureData.filter((item) => learnedIds.includes(item.id.toString()));

    setPools({
      untrained: untrainedWords,
      repeat: repeatWords,
      learned: learnedWords,
    });
  };

  // Select next word
  const selectNextWord = () => {
    let selectedWord = null;

    if (counters.wordCounter >= counters.nextRepeatAt && pools.repeat.length > 0) {
      selectedWord = pools.repeat[Math.floor(Math.random() * pools.repeat.length)];
      setCounters({
        wordCounter: 0,
        nextRepeatAt: Math.floor(Math.random() * 8) + 3,
      });
    } else {
      selectedWord =
        pools.untrained.length > 0
          ? pools.untrained[Math.floor(Math.random() * pools.untrained.length)]
          : null;
      setCounters((prev) => ({
        ...prev,
        wordCounter: prev.wordCounter + 1,
      }));
    }

    if (!selectedWord && !pools.untrained.length && !pools.repeat.length) {
      setCurrentItem(null);
      setIsDataLoaded(true);
      return;
    }

    setCurrentItem(selectedWord);
  };

  // Handle word feedback
  const handleWordFeedback = async (isCorrect) => {
    if (!currentItem || !session) return;

    try {
      const itemId = currentItem.id;
      const standingItem = standingSummary.praeposition.find(
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

      // Calculate session duration (in seconds)
      const duration = sessionStartTimeRef.current
        ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
        : 0;

      const updatedStanding = {
        exercise: itemId,
        standingId: standingItem?.id,
        correct: currentCorrect,
        attempts: currentAttempts,
        duration: duration,
      };

      const currentPools = { ...pools };
      const currentItemId = currentItem.id.toString();

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
        currentPools.learned.push(currentItem);
      } else {
        currentPools.repeat.push(currentItem);
      }

      setPools(currentPools);
      setCurrentItem(null);

      await saveToServer("praeposition", isCorrect ? "OK" : "NOK", updatedStanding);
      // Reset timer for next exercise
      resetSessionTimer();
    } catch (error) {
      console.error("[handleWordFeedback:praeposition] Fehler:", error);
    }
  };

  // Reset learning progress
  const resetLearningProgress = async () => {
    if (!session) return;

    try {
      const result = await saveToServer("praeposition", "REV", null);
      if (result) {
        console.log("Server-Reset für praeposition erfolgreich:", result);
        setPools({
          untrained: data.praeposition,
          repeat: [],
          learned: [],
        });
        setCounters({
          wordCounter: 0,
          nextRepeatAt: Math.floor(Math.random() * 8) + 3,
        });
        setCurrentItem(null);
        setIsDataLoaded(false);
        await loadPraepositionData();
      } else {
        console.error("Server-Reset für praeposition fehlgeschlagen");
      }
    } catch (error) {
      console.error("[resetLearningProgress:praeposition] Fehler:", error);
    }
  };

  return (
    <PraepositionContext.Provider
      value={{
        // State
        currentItem,
        pools,
        stats,
        
        // Actions
        handleWordFeedback,
        resetLearningProgress,
        selectNextWord,
      }}
    >
      {children}
    </PraepositionContext.Provider>
  );
};
