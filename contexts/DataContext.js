// DataContext.js
import { createContext, useState, useContext } from "react";
import { useBaseContext } from "./BaseContext";

// Create the context
export const DataContext = createContext();

// Custom hook for using this context
export const useDataContext = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { session, setIsDataLoaded, setAttempts, setTrainedCount } = useBaseContext();

  // Timer-Referenz für die Lernzeit pro Sitzung
  const sessionStartTimeRef = { current: null };

  // Unified data state
  const [data, setData] = useState({
    deutsch: [],
    praeposition: [],
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

      await loadStanding(feature, featureData);

      setIsDataLoaded(true);
      return featureData;
    } catch (error) {
      console.error(`[loadInitialData:${feature}] Fehler:`, error.message);
      setIsDataLoaded(true);
      return [];
    }
  };

  // Unified standing loading
  const loadStanding = async (feature, featureData) => {
    if (!session) return [];

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
        return [];
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

      setStandingSummary((prev) => ({
        ...prev,
        [feature]: mappedStandings,
      }));

      setAttempts(mappedStandings.reduce((sum, s) => sum + (s.attempts || 0), 0));
      setTrainedCount(mappedStandings.filter((s) => s.correct === 2).length);

      return mappedStandings;
    } catch (error) {
      console.error(`[loadStanding:${feature}] Fehler:`, error.message);
      setStandingSummary((prev) => ({
        ...prev,
        [feature]: [],
      }));
      return [];
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

  // Reset session timer
  const resetSessionTimer = () => {
    sessionStartTimeRef.current = Date.now();
  };

  return (
    <DataContext.Provider
      value={{
        // Data state
        data,
        setData,
        standingSummary,
        setStandingSummary,
        
        // Data loading functions
        loadInitialData,
        loadStanding,
        
        // Server communication
        saveToServer,
        
        // Session timer
        sessionStartTimeRef,
        resetSessionTimer,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
