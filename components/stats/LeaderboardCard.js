import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Debugging-Log für die Imports
console.log("LeaderboardCard Imports:", {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
});

const LeaderboardCard = ({ users, title, className = "" }) => {
  return (
    <Card className={`h-full card-hover ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-germanic-100 dark:divide-germanic-800">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 hover:bg-germanic-50 dark:hover:bg-germanic-900/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div 
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                    user.position === 1
                      ? "bg-yellow-100 text-yellow-700"
                      : user.position === 2
                      ? "bg-gray-100 text-gray-700"
                      : user.position === 3
                      ? "bg-amber-100 text-amber-700"
                      : "bg-germanic-100 text-germanic-700"
                  }`}
                >
                  {user.position}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-germanic-200 text-germanic-700">
                    {(user.name && typeof user.name === "string" && user.name.length >= 2)
                      ? user.name.substring(0, 2).toUpperCase()
                      : "N/A"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">{user.name || "Unbekannt"}</div>
              </div>
              <div className="font-bold text-sm text-germanic-800 dark:text-germanic-100">
                {user.score}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardCard;