import SprichwortCard from "../components/ui/WordCardSprichwort";
import ExercisePage from "../components/layout/ExercisePage";
import { useSprichwortContext } from "../contexts/AppContext";

export default function Sprichwort() {
  const contextData = useSprichwortContext();

  return (
    <ExercisePage
      title="Sprichwörter"
      contextData={contextData}
      CardComponent={SprichwortCard}
      cardProps={{
        getWordData: (currentItem) => ({
          sprichwort: currentItem.Sprichwort,
          wort: currentItem.Wort,
          erklaerung: currentItem.Erklaerung,
          beispiel: currentItem.Beispiel,
          quelle: currentItem.Quelle,
          datum: currentItem.Datum
            ? new Date(currentItem.Datum).toLocaleDateString("de-DE")
            : "Datum nicht verfügbar",
        })
      }}
      emptyMessage="Keine Sprichwörter verfügbar. Alle Sprichwörter wurden gelernt! Setze den Fortschritt zurück, um fortzufahren."
    />
  );
}
