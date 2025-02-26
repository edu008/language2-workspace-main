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
  const [untrained, setUntrained] = useState(deutsch); // Initialisiere mit allen Wörtern
  const [repeatPool, setRepeatPool] = useState([]);
  const [trained, setTrained] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [summary, setSummary] = useState([]); // Zusammenfassung der aktuellen Sitzung
  const [standingSummary, setStandingSummary] = useState([]); // Zusammenfassung aus der Datenbank
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false); // Neuer Zustand, um doppelte Aufrufe zu verhindern
  const [standingData, setStandingData] = useState([]); // State für die summary-Daten

  // Verhindere Hydration-Fehler, indem wir den initialen Zustand nur auf dem Client setzen
  useEffect(() => {
    if (status === "authenticated" && !isDataLoaded) {
      loadStanding();
    }
  }, [status, isDataLoaded]);

  const debouncedHandleClick = debounce((callback) => {
    if (!isApplyingFilters) {
      console.log("Debounced handleREV called"); // Debugging-Log
      callback();
    }
  }, 1000); // Erhöhe die Debounce-Zeit auf 1000ms, um doppelte Klicks zu vermeiden

  const loadStanding = async () => {
    if (!session || isDataLoaded) return;
    try {
      const response = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=deutsch`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate", // Verhindere Caching
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to load standing: ${response.status} - ${await response.text()}`);
      }
      const data = await response.json();
      console.log("Standing Data Loaded:", data);
      
      // Nutze nur die summary-Daten
      if (!data.summary || !Array.isArray(data.summary)) {
        console.error("Keine oder ungültige summary-Daten erhalten:", data);
        setStandingData([]);
        resetState();
        setStandingSummary([]); // Setze standingSummary auf leer, wenn keine Daten vorhanden sind
        setIsDataLoaded(true);
        return;
      }

      setStandingData(data.summary);
      applyStandingToWords(data.summary);
      // Speichere die summary-Daten aus der Datenbank für die Anzeige
      setStandingSummary(data.summary.map(item => {
        const word = deutsch.find(d => d.id === item.exercise);
        return {
          ...item,
          Artikel: word?.Artikel || "",
          Word: word?.Word || "",
          Transl_F: word?.Transl_F.map(t => t.Transl_F).join("; ") || "", // Konvertiere in String mit "; " als Trennzeichen
          DateEntryWord: word ? new Date(word.DateEntryWord).toLocaleDateString("de-DE") : "",
        };
      }));
      setLoadingError(null);
    } catch (error) {
      console.error("Fehler beim Laden des Standing:", error);
      setLoadingError(error.message);
      resetState();
      setStandingSummary([]); // Setze standingSummary auf leer bei Fehler
      setIsDataLoaded(true);
    }
  };

  const applyStandingToWords = (standing) => {
    if (!standing || standing.length === 0) {
      console.log("Kein Spielstand vorhanden, initialisiere mit allen Wörtern.");
      resetState();
    } else {
      console.log("Spielstand vorhanden, initialisiere Pools basierend auf Standing-Daten:", standing);
      // Initialisiere Pools und Statistiken basierend auf den correct-Werten aus der summary
      const learnedIds = standing.filter(s => s.correct === 2).map(s => s.exercise); // Nur correct = 2 (gelernt)
      const repeatIds = standing.filter(s => s.correct === 1).map(s => s.exercise); // Nur correct = 1 (einmal korrekt)
      const nokIds = standing.filter(s => s.correct === 0).map(s => s.exercise); // Nur correct = 0 (nicht korrekt)
      
      // Wörter mit correct < 2 bleiben in untrained oder repeatPool
      const untrainedWords = deutsch.filter(word => 
        !learnedIds.includes(word.id) && 
        !repeatIds.includes(word.id) && 
        !nokIds.includes(word.id)
      );
      const repeatPoolWords = deutsch.filter(word => 
        repeatIds.includes(word.id) || 
        nokIds.includes(word.id)
      );

      // Debugging für Pools und IDs
      console.log("Untrained Words:", untrainedWords.length, untrainedWords);
      console.log("RepeatPool Words:", repeatPoolWords.length, repeatPoolWords);
      console.log("Learned IDs (correct = 2):", learnedIds.length, learnedIds);
      console.log("Repeat IDs (correct = 1):", repeatIds.length, repeatIds);
      console.log("NOK IDs (correct = 0):", nokIds.length, nokIds);

      // Setze die Zustände
      setUntrained(untrainedWords);
      setRepeatPool(repeatPoolWords);
      // Nehme den höchsten attempts-Wert aus der summary
      const maxAttempts = standing.reduce((max, s) => Math.max(max, s.attempts || 0), 0);
      setAttempts(maxAttempts);
      // Setze trained als Summe der Wörter mit correct === 2
      setTrained(learnedIds.length);
    }
    setIsDataLoaded(true);
    applyFilters(); // Wende Filter nach Laden des Spielstands an
  };

  const resetState = () => {
    setUntrained(deutsch);
    setRepeatPool([]);
    setTrained(0);
    setAttempts(0);
    setSummary([]);
    setFilteredDeutsch([]);
    setCurrentDeutsch(null);
    setStandingSummary([]); // Setze standingSummary zurück
  };

  const saveToServer = async (action, exerciseData = {}) => {
    if (!session) return;
    const { exercise, standingId, correct, attempts } = exerciseData;

    // Sicherstellen, dass correct immer ein gültiger Int-Wert ist
    const validatedCorrect = correct ?? 0;
    if (!Number.isInteger(validatedCorrect) || validatedCorrect < 0 || validatedCorrect > 2) {
      console.error("Ungültiger Wert für correct in saveToServer:", validatedCorrect);
      throw new Error("Ungültiger Wert für correct: Muss eine ganze Zahl zwischen 0 und 2 sein.");
    }

    try {
      let response;
      const payload = {
        user: session.user.email,
        exercise,
        button: action,
        correct: validatedCorrect,  // Verwende den validierten Wert
        attempts: attempts ?? 0,  // Falls null oder undefined, wird 0 gesetzt
      };
      console.log(`Saving to server: action=${action}, payload=`, payload);

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
      console.log("Server response:", data);
      // Aktualisiere standingSummary nach jedem Save (falls nötig, hier nur bei REV relevant)
      if (action === "REV") {
        setStandingSummary([]);
      } else if (action === "OK" || action === "NOK") {
        // Lade den aktualisierten Stand, um standingSummary zu aktualisieren
        await loadStanding();
      }
      return data;
    } catch (error) {
      console.error(`Fehler beim Senden an Server (${action}):`, error);
      setErrorMessage(`Fehler beim Speichern des Spielstands (${action}).`);
      throw error; // Wirf den Fehler weiter, um sicherzustellen, dass wir warten
    }
  };

  const handleOpen = () => setOpen(!open);

  const applyFilters = async () => {
    if (isApplyingFilters || (!Array.isArray(untrained) || !Array.isArray(repeatPool))) {
      console.error("Filter wird bereits angewendet oder ungültige Pools:", { untrained, repeatPool });
      return;
    }
    setIsApplyingFilters(true);
    try {
      let pool;
      // Zufälliger Count, um zu entscheiden, ob ein bereits angesehenes Wort aus repeatPool oder ein neues aus untrained genommen wird
      const randomCount = Math.floor(Math.random() * 8) + 3; // Zufallszahl zwischen 3 und 10
      if (attempts > 0 && randomCount === 10 && repeatPool.length > 0) {
        // 1/8 Chance, ein Wort aus repeatPool zu nehmen (bereits angesehen)
        console.log("Wähle zufällig ein bereits angesehenes Wort aus repeatPool.");
        pool = [...repeatPool];
      } else {
        // Ansonsten nimm nur Wörter aus untrained (nicht angesehen)
        console.log("Wähle ein neues Wort aus untrained.");
        pool = [...untrained];
      }

      // Entferne Duplikate und filtere nach Such- oder Filterkriterien
      let result = [...new Set(pool.map(JSON.stringify))].map(JSON.parse); // Entferne Duplikate
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
        setHasRedirected(true); // Markiere, dass wir redirectet haben
        router.push("/successDeutsch?redirected=true");
        return;
      }

      console.log("Filtered Deutsch:", result);
      setFilteredDeutsch(result);
      if (result.length > 0) {
        const randomIndex = Math.floor(Math.random() * result.length);
        const randomDeutsch = { ...result[randomIndex] };
        randomDeutsch.DateEntryWord = new Date(randomDeutsch.DateEntryWord).toLocaleDateString("de-DE");
        setCurrentDeutsch(randomDeutsch);
      } else {
        setCurrentDeutsch(null); // Setze currentDeutsch auf null, wenn kein Wort verfügbar
      }
    } finally {
      setIsApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (isDataLoaded && !isApplyingFilters) {
      // Verzögerung hinzufügen, um Race Conditions zu vermeiden
      const timer = setTimeout(() => applyFilters(), 200); // Erhöhte Verzögerung auf 200ms
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

      const standing = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}`
      ).then(res => res.json()).catch(error => {
        console.error("Fehler beim Abrufen des Standing:", error);
        return null; // Rückgabe null, wenn die Anfrage fehlschlägt
      });

      let correct = 0; // Initialisiere mit 0 (nicht korrekt)
      if (standing) {
        correct = standing.correct + 1; // Erhöhe um 1 (1: einmal korrekt, 2: gelernt)
        if (correct > 2) correct = 2; // Begrenze auf 2 (gelernt)
      } else {
        correct = 1; // Setze auf 1 für den ersten korrekten Klick
      }

      // Sicherstellen, dass correct ein gültiger Int-Wert ist
      if (!Number.isInteger(correct) || correct < 0 || correct > 2) {
        console.error("Ungültiger Wert für correct in handleOK:", correct);
        correct = 1; // Fallback auf 1 für den ersten OK-Klick, wenn der Wert ungültig ist
      }

      console.log("Correct before save in handleOK:", correct); // Debugging-Log

      if (standing) {
        await saveToServer("OK", {
          exercise,
          standingId: standing.id,
          correct,
          attempts: newAttempts,
        });
        // Wort wurde gelernt, entferne es aus untrained und repeatPool
        if (correct === 2) {
          setTrained((prev) => prev + 1);
          setUntrained(untrained.filter(word => word.id !== exercise));
          setRepeatPool(repeatPool.filter(word => word.id !== exercise));
        } else {
          // Wenn correct < 2, behalte das Wort in repeatPool oder untrained
          setUntrained(untrained.filter(word => word.id !== exercise)); // Entferne aus untrained, falls vorhanden
          const isInRepeatPool = repeatPool.some(word => word.id === exercise);
          if (!isInRepeatPool) {
            setRepeatPool([...repeatPool, currentDeutsch]); // Füge zu repeatPool hinzu, wenn nicht schon vorhanden
          }
        }
      } else {
        await saveToServer("OK", {
          exercise,
          correct,
          attempts: newAttempts,
        });
        // Behalte das Wort in repeatPool, wenn correct < 2
        setUntrained(untrained.filter(word => word.id !== exercise)); // Entferne aus untrained
        setRepeatPool([...repeatPool, currentDeutsch]); // Füge zu repeatPool hinzu
      }

      setSummary((prev) => [
        ...prev,
        {
          summary: {
            ...currentDeutsch,
            DateEntryWord: new Date(currentDeutsch.DateEntryWord).toLocaleDateString("de-DE"),
            Transl_F: currentDeutsch.Transl_F.map(t => t.Transl_F).join("; "), // Konvertiere Transl_F in String mit "; " als Trennzeichen
          },
        },
      ]);

      // Warte, bis der Server-Stand geladen ist, bevor wir filtern
      await new Promise(resolve => setTimeout(resolve, 300)); // Erhöhte Verzögerung auf 300ms
      await applyFilters(); // Warte auf die asynchrone Ausführung von applyFilters
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

      const standing = await fetch(
        `/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(exercise)}`
      ).then(res => res.json()).catch(error => {
        console.error("Fehler beim Abrufen des Standing:", error);
        return null; // Rückgabe null, wenn die Anfrage fehlschlägt
      });

      let correct = 0; // Setze auf 0 (nicht korrekt)
      if (standing) {
        correct = 0; // Setze auf 0, wenn NOK geklickt wird, unabhängig vom aktuellen Wert
      }

      // Sicherstellen, dass correct ein gültiger Int-Wert ist
      if (!Number.isInteger(correct) || correct < 0 || correct > 2) {
        console.error("Ungültiger Wert für correct in handleNOK:", correct);
        correct = 0; // Fallback auf 0, wenn der Wert ungültig ist
      }

      console.log("Correct before save in handleNOK:", correct); // Debugging-Log

      if (standing) {
        await saveToServer("NOK", {
          exercise,
          standingId: standing.id,
          correct,
          attempts: newAttempts,
        });
        // Bei NOK bleibt das Wort in untrained oder repeatPool, wenn correct < 2
        const isInUntrained = untrained.some(word => word.id === exercise);
        const isInRepeatPool = repeatPool.some(word => word.id === exercise);
        if (!isInUntrained) {
          setUntrained([...untrained, currentDeutsch]); // Füge zu untrained hinzu, wenn nicht schon vorhanden
        }
        if (isInRepeatPool) {
          setRepeatPool(repeatPool.filter(word => word.id !== exercise)); // Entferne aus repeatPool, falls vorhanden
        }
      } else {
        await saveToServer("NOK", {
          exercise,
          correct,
          attempts: newAttempts,
        });
        // Füge das Wort zu untrained hinzu, wenn correct < 2
        setUntrained([...untrained, currentDeutsch]); // Füge zu untrained hinzu
        setRepeatPool(repeatPool.filter(word => word.id !== exercise)); // Entferne aus repeatPool, falls vorhanden
      }

      setSummary((prev) => [
        ...prev,
        {
          summary: {
            ...currentDeutsch,
            DateEntryWord: new Date(currentDeutsch.DateEntryWord).toLocaleDateString("de-DE"),
            Transl_F: currentDeutsch.Transl_F.map(t => t.Transl_F).join("; "), // Konvertiere Transl_F in String mit "; " als Trennzeichen
          },
        },
      ]);

      // Warte, bis der Server-Stand geladen ist, bevor wir filtern
      await new Promise(resolve => setTimeout(resolve, 300)); // Erhöhte Verzögerung auf 300ms
      await applyFilters(); // Warte auf die asynchrone Ausführung von applyFilters
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleREV = async () => {
    if (!session || isApplyingFilters) return;

    setIsApplyingFilters(true);
    try {
      // Warte nicht sofort mit resetState, sondern lösche erst die Daten und lade dann den Stand neu
      console.log("Starting handleREV - deleting standings and resetting state...");

      // Lösche alle Standing-Einträge für den Benutzer und kategorie "deutsch"
      try {
        const response = await saveToServer("REV");
        console.log("Server response after DELETE:", response);
        console.log("Alle Standing-Einträge für den Benutzer gelöscht und Score zurückgesetzt.");
      } catch (error) {
        console.error("Fehler beim Löschen der Standings:", error);
        setErrorMessage("Fehler beim Zurücksetzen des Spielstands.");
        throw error; // Wirf den Fehler weiter, um sicherzustellen, dass wir warten
      }

      // Warte, bis die Datenbank und API vollständig synchronisiert sind (erhöhte Verzögerung)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Verzögerung auf 2000ms erhöht

      // Setze den Zustand zurück, nachdem die Daten gelöscht wurden und der neue Stand geladen ist
      resetState();
      setIsDataLoaded(false); // Setze isDataLoaded zurück, um loadStanding erneut auszuführen
      setStandingData([]); // Zurücksetzen von standingData

      // Lade den aktualisierten (leeren) Stand neu
      await loadStanding();

      // Warte erneut, um sicherzustellen, dass der neue Stand vollständig geladen ist
      await new Promise(resolve => setTimeout(resolve, 1000)); // Zusätzliche Verzögerung von 1000ms

      // Wende Filter an, um den zurückgesetzten Zustand anzuzeigen
      await applyFilters();
    } catch (error) {
      console.error("Fehler in handleREV:", error);
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

  // Verhindere Hydration-Fehler, indem wir den initialen Zustand nur auf dem Client setzen
  useEffect(() => {
    if (status === "authenticated" && !isDataLoaded) {
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
      <Header session={session} />
      <div className="flex justify-between items-center w-full p-6">
        <div className="w-[300px]" />
        <h1 className="text-5xl font-bold text-center flex-1">Wortbedeutungen</h1>
        <button
          onClick={handleOpen}
          className="py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-sm"
        >
          Filter
        </button>
      </div>
      <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
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
        <ActionButtons
          onCorrect={() => debouncedHandleClick(handleOK)}
          onIncorrect={() => debouncedHandleClick(handleNOK)}
          isLoading={isApplyingFilters}
        />
        <Stats
          totalCount={deutschCount}
          trainedCount={trained}
          attempts={attempts}
          progress={progress}
        />
        <div className="flex justify-center mt-4">
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded text-2xl"
            onClick={() => debouncedHandleClick(handleREV)}
          >
            <FontAwesomeIcon icon={faTrashRestore} className="mr-2 fa-lg fa-fw" />
          </button>
        </div>
        {/* Kombinierte Anzeige der Summary aus Sitzung und Datenbank */}
        {(summary.length > 0 || standingSummary.length > 0) && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold mb-4">Zusammenfassung der laufenden Übungssession</h1>
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Artikel</th>
                  <th className="px-4 py-2">Wort</th>
                  <th className="px-4 py-2">Französische Übersetzung</th>
                </tr>
              </thead>
              <tbody>
                {[...standingSummary, ...summary].map((item, index) => {
                  const deutsch = item.summary || item; // Entweder aus standingSummary oder summary
                  if (!deutsch) return null;
                  return (
                    <tr key={index}>
                      <td className="border px-4 py-2">{deutsch.Artikel}</td>
                      <td className="border px-4 py-2">{deutsch.Word}</td>
                      <td className="border px-4 py-2">
                        {typeof deutsch.Transl_F === "string" ? deutsch.Transl_F : (deutsch.Transl_F || []).map(t => t.Transl_F).join("; ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                disabled={!searchInput && !newTypeOfWordFilter}
              >
                <FontAwesomeIcon icon={faFilter} className="mr-2 fa-lg fa-fw" />
              </button>
              <button
                className="flex-1 mt-4 mb-4 w-full px-4 py-2 rounded text-2xl font-semibold text-white bg-red-500 hover:bg-red-700"
                onClick={handleRemoveFilter}
                disabled={!searchInput && !newTypeOfWordFilter}
              >
                <FontAwesomeIcon icon={faFilter} className="mr-2 fa-lg fa-fw" />
              </button>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={handleOpen} className="mr-1">
            <span>Cancel</span>
          </Button>
          <Button variant="gradient" color="green" onClick={handleOpen}>
            <span>Confirm</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}