import RedewendungCard from "../components/ui/WordCardRedewendung";
import ExercisePage from "../components/layout/ExercisePage";
import { useRedewendungContext } from "../contexts/AppContext";

export default function Redewendung() {
  const contextData = useRedewendungContext();

  return (
    <ExercisePage
      title="Redewendungen"
      contextData={contextData}
      CardComponent={RedewendungCard}
      cardProps={{
        getWordData: (currentItem) => ({
          redewendung: currentItem.Redewendung,
          wort: currentItem.Wort,
          erklaerung: currentItem.Erklaerung,
          beispiel: currentItem.Beispiel,
          quelle: currentItem.Quelle,
          datum: currentItem.Datum
            ? new Date(currentItem.Datum).toLocaleDateString("de-DE")
            : "Datum nicht verfügbar",
        })
      }}
      emptyMessage="Keine Redewendungen verfügbar. Alle Redewendungen wurden gelernt! Setze den Fortschritt zurück, um fortzufahren."
    />
  );
}
