import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/stats/card";

// Definierte lebendige Farben für die Kategorien
const COLORS = [
  "#FF6B6B", // Vokabeln (Lebhaftes Rot)
  "#4ECDC4", // Präpositionen (Türkis)
  "#FFD93D", // Sprichwörter (Sonniges Gelb)
  "#6A5ACD", // Präpositionalverben (Slate Blue)
  "#FF9F1C", // Redewendungen (Leuchtendes Orange)
];

const CategoryDistribution = ({ data, title, className = "" }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, fill } = payload[0];
      return (
        <div
          className="bg-white dark:bg-germanic-900 p-3 shadow-lg rounded-lg border"
          style={{ borderColor: fill }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: fill }}
          >{`${name}: ${value}`}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="list-none p-0">
        {payload.map((entry, index) => (
          <li
            key={`legend-${index}`}
            className="flex items-center mb-2 text-sm"
          >
            <div
              className="w-3 h-3 mr-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-germanic-700 dark:text-germanic-200">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className={`h-full card-hover bg-white dark:bg-germanic-900 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-germanic-800 dark:text-white">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70} // Etwas größer für Donut-Effekt
                outerRadius={100} // Größer für bessere Sichtbarkeit
                paddingAngle={3} // Mehr Abstand zwischen Segmenten
                dataKey="value"
                animationDuration={1000} // Längere Animation
                animationBegin={0} // Startet sofort
                label={({ name, percent }) =>
                  percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ""
                } // Labels nur für größere Segmente
                labelLine={false} // Keine Verbindungslinien
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]} // Lebendige Farben
                    stroke="none" // Keine Umrandung
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={renderCustomLegend}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ paddingLeft: "15px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryDistribution;