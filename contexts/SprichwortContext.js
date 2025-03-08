// SprichwortContext.js
import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { useBaseContext } from "./BaseContext";
import { useDataContext } from "./DataContext";
import { useRouter } from "next/router";

// Create the context
export const SprichwortContext = createContext();

// Custom hook for using this context
export const useSprichwortContext = () => useContext(SprichwortContext);

export const SprichwortProvider = ({ children }) => {
  const router = useRouter();
  const { session, status, isDataLoaded, setIsDataLoaded, getCurrentFeature, setAttempts, setTrainedCount } = useBaseContext();
  const { data, standingSummary, setStandingSummary, loadInitialData, saveToServer, resetSessionTimer, sessionStartTimeRef } = useDataContext();

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
    seenWords: [], // Track recently seen words
  });

  // Computed stats
  const stats = useMemo(() => {
    // Count all learned words from standing summary, not just the filtered ones
    const totalLearnedCount = standingSummary.sprichwort.filter(s => s.correct === 2).length;
    
    return {
      totalCount: data.sprichwort.length,
      trainedCount: totalLearnedCount,
      progress: data.sprichwort.length > 0 
        ? Math.round((totalLearnedCount / data.sprichwort.length) * 100) || 0 
        : 0,
    };
  }, [data.sprichwort, standingSummary.sprichwort]);

  // Load initial data when component mounts or route changes
  useEffect(() => {
    if (router.pathname === "/sprichwort" && status === "authenticated" && !isDataLoaded) {
      loadSprichwortData();
    }
  }, [router.pathname, session, status]);

  // Select next word when data is loaded
  useEffect(() => {
    if (
      router.pathname === "/sprichwort" &&
      isDataLoaded &&
      !currentItem &&
      (pools.untrained.length > 0 || pools.repeat.length > 0)
    ) {
      selectNextWord();
      // Start the timer when a new exercise begins
      resetSessionTimer();
    }
  }, [isDataLoaded, pools, currentItem, router.pathname]);

  // Load sprichwort data
  const loadSprichwortData = async () => {
    const featureData = await loadInitialData("sprichwort");
    if (featureData && featureData.length > 0) {
      applyStandingToWords(standingSummary.sprichwort, featureData);
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
    // Don't select a new word if there's already one
    if (currentItem) return;
    
    let selectedWord = null;
    let availableWords = [];

    // Check if it's time to show a repeat word
    if (counters.wordCounter >= counters.nextRepeatAt && pools.repeat.length > 0) {
      // Select a word from the repeat pool
      availableWords = pools.repeat.filter(word => 
        !counters.seenWords.includes(word.id.toString())
      );
      
      // If all repeat words have been seen recently, use any repeat word
      if (availableWords.length === 0) {
        availableWords = pools.repeat;
      }
      
      if (availableWords.length > 0) {
        selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        
        // Reset counter and set new random repeat interval
        setCounters(prev => ({
          wordCounter: 0,
          nextRepeatAt: Math.floor(Math.random() * 8) + 3, // Random number between 3 and 10
          seenWords: [...prev.seenWords.filter(id => id !== selectedWord.id.toString()), selectedWord.id.toString()].slice(-10) // Keep last 10 seen words
        }));
      }
    } else {
      // Select a word from the untrained pool
      availableWords = pools.untrained.filter(word => 
        !counters.seenWords.includes(word.id.toString())
      );
      
      // If all untrained words have been seen recently, use any untrained word
      if (availableWords.length === 0 && pools.untrained.length > 0) {
        availableWords = pools.untrained;
      }
      
      if (availableWords.length > 0) {
        selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        
        // Increment counter and update seen words
        setCounters(prev => ({
          ...prev,
          wordCounter: prev.wordCounter + 1,
          seenWords: [...prev.seenWords.filter(id => id !== selectedWord.id.toString()), selectedWord.id.toString()].slice(-10) // Keep last 10 seen words
        }));
      }
    }

    if (!selectedWord && !pools.untrained.length && !pools.repeat.length) {
      setCurrentItem(null);
      setIsDataLoaded(true);
      return;
    }

    // Set the current item
    setCurrentItem(selectedWord);
    
    console.log("Selected word:", selectedWord?.Sprichwort || "None");
  };

  // Handle word feedback
  const handleWordFeedback = async (isCorrect) => {
    if (!currentItem || !session) return;

    try {
      const itemId = currentItem.id;
      const standingItem = standingSummary.sprichwort.find(
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

      // Save the current item before updating pools
      const processedItem = { ...currentItem };
      const processedItemId = processedItem.id.toString();

      // Update the BaseContext's attempts and trainedCount immediately
      setAttempts(prev => prev + 1);
      if (currentCorrect === 2 && (!standingItem || standingItem.correct !== 2)) {
        setTrainedCount(prev => prev + 1);
      } else if (currentCorrect !== 2 && standingItem && standingItem.correct === 2) {
        setTrainedCount(prev => Math.max(0, prev - 1));
      }

      // Save to server without reloading the data
      await saveToServer("sprichwort", isCorrect ? "OK" : "NOK", updatedStanding);
      
      // Update the standing summary in DataContext
      const updatedSummary = [...standingSummary.sprichwort];
      const index = updatedSummary.findIndex(s => s.exercise.toString() === itemId.toString());
      
      if (index !== -1) {
        // Update existing standing item
        updatedSummary[index] = {
          ...updatedSummary[index],
          correct: currentCorrect,
          attempts: currentAttempts
        };
      } else {
        // Add new standing item
        const newStandingItem = {
          exercise: itemId,
          correct: currentCorrect,
          attempts: currentAttempts,
          // Add additional fields for display in the table
          Sprichwort: processedItem.Sprichwort || "Unbekannt",
          Bedeutung: processedItem.Bedeutung || "Keine Bedeutung",
        };
        updatedSummary.push(newStandingItem);
      }
      
      // Update the standing summary in DataContext
      setStandingSummary(prev => ({
        ...prev,
        sprichwort: updatedSummary
      }));
      
      // Now update the pools
      const currentPools = { ...pools };

      currentPools.untrained = currentPools.untrained.filter(
        (item) => item.id.toString() !== processedItemId
      );
      currentPools.repeat = currentPools.repeat.filter(
        (item) => item.id.toString() !== processedItemId
      );
      currentPools.learned = currentPools.learned.filter(
        (item) => item.id.toString() !== processedItemId
      );

      if (currentCorrect === 2) {
        currentPools.learned.push(processedItem);
      } else {
        currentPools.repeat.push(processedItem);
      }

      // Clear the current item before updating pools
      setCurrentItem(null);
      
      // Update the pools
      setPools(currentPools);
      
      // Reset timer for next exercise
      resetSessionTimer();
    } catch (error) {
      console.error("[handleWordFeedback:sprichwort] Fehler:", error);
    }
  };

  // Reset learning progress
  const resetLearningProgress = async () => {
    if (!session) return;

    try {
      const result = await saveToServer("sprichwort", "REV", null);
      if (result) {
        console.log("Server-Reset für sprichwort erfolgreich:", result);
        
        // Update local state directly without reloading data
        setPools({
          untrained: data.sprichwort,
          repeat: [],
          learned: [],
        });
        
        setCounters({
          wordCounter: 0,
          nextRepeatAt: Math.floor(Math.random() * 8) + 3,
          seenWords: [], // Reset seen words
        });
        
        setCurrentItem(null);
        
        // Reset trainedCount and attempts in BaseContext
        setTrainedCount(0);
        setAttempts(0);
        
        // Update the standing summary in DataContext
        setStandingSummary(prev => ({
          ...prev,
          sprichwort: [] // Clear the standing summary for sprichwort
        }));
        
        // Force a reload of the data to ensure everything is reset properly
        await loadInitialData("sprichwort");
        setIsDataLoaded(true);
      } else {
        console.error("Server-Reset für sprichwort fehlgeschlagen");
      }
    } catch (error) {
      console.error("[resetLearningProgress:sprichwort] Fehler:", error);
    }
  };

  return (
    <SprichwortContext.Provider
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
    </SprichwortContext.Provider>
  );
};
