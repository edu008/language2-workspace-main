import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/stats/card";

const StatsCard = ({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className = "",
}) => {
  return (
    <Card className={`overflow-hidden card-hover ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-germanic-500">{title}</CardTitle>
        {icon && <div className="text-germanic-500">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-germanic-500 mt-1">{description}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            <div
              className={`text-xs font-medium mr-1 ${
                trend === "up"
                  ? "text-green-500"
                  : trend === "down"
                  ? "text-red-500"
                  : "text-germanic-500"
              }`}
            >
              {trendValue}
            </div>
            <div
              className={`text-xs ${
                trend === "up"
                  ? "text-green-500"
                  : trend === "down"
                  ? "text-red-500"
                  : "text-germanic-500"
              }`}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;