import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const AchievementCard = ({
  title,
  description,
  progress,
  icon,
  className = "",
}) => {
  return (
    <Card className={`card-hover ${className}`}>
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <div className="h-12 w-12 rounded-full bg-germanic-100 dark:bg-germanic-800 flex items-center justify-center text-germanic-700 dark:text-germanic-200">
          {icon}
        </div>
        <div>
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <p className="text-sm text-germanic-500 mt-1">{description}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-germanic-600">{`Fortschritt: ${progress}%`}</span>
            {progress === 100 ? (
              <span className="text-green-500 text-xs font-medium">Abgeschlossen</span>
            ) : (
              <span className="text-germanic-500 text-xs">{`Noch ${100 - progress}%`}</span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementCard;