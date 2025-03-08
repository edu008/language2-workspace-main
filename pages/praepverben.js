import PraepverbenCard from "../components/ui/WordCardPraepverben";
import ExercisePage from "../components/layout/ExercisePage";
import { usePraepverbenContext } from "../contexts/AppContext";

export default function Praepverben() {
  const contextData = usePraepverbenContext();

  return (
    <ExercisePage
      title="Präpositionen & Verben"
      contextData={contextData}
      CardComponent={PraepverbenCard}
      cardProps={{
        getWordData: (currentItem) => ({
          satz: currentItem.Satz,
          verb: currentItem.Verb,
          loesung: currentItem.Loesung,
          beispiele: currentItem.Beispiele,
          erklaerung: currentItem.Erklaerung,
          quelle: currentItem.quelle,
          datum: currentItem.Datum
            ? new Date(currentItem.Datum).toLocaleDateString("de-DE")
            : "Datum nicht verfügbar",
        })
      }}
      emptyMessage="Keine Präpositionen & Verben verfügbar. Alle wurden gelernt! Setze den Fortschritt zurück, um fortzufahren."
    />
  );
}
