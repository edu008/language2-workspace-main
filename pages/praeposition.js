import PraepositionCard from "../components/ui/WordCardPraeposition";
import ExercisePage from "../components/layout/ExercisePage";
import { usePraepositionContext } from "../contexts/AppContext";

export default function Praeposition() {
  const contextData = usePraepositionContext();

  return (
    <ExercisePage
      title="Präpositionen"
      contextData={contextData}
      CardComponent={PraepositionCard}
      cardProps={{
        getWordData: (currentItem) => ({
          satz: currentItem.Satz,
          loesung: currentItem.Loesung,
          quelle: currentItem.quelle,
          datum: currentItem.Datum
            ? new Date(currentItem.Datum).toLocaleDateString("de-DE")
            : "Datum nicht verfügbar",
        })
      }}
      emptyMessage="Keine Präpositionen verfügbar. Alle Präpositionen wurden gelernt! Setze den Fortschritt zurück, um fortzufahren."
    />
  );
}
