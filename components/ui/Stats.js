// components/deutsch/Stats.js
import React from "react";

const Stats = ({ totalCount, trainedCount, attempts, progress }) => {
  const effectiveTotalCount = totalCount|| 0;
  const effectiveTrainedCount = trainedCount || 0;
  const effectiveAttempts = attempts || 0;
  const effectiveProgress = progress !== undefined && !isNaN(progress) ? Math.min(Math.max(progress, 0), 100) : 0;

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="text-center flex-1">
          <p className="text-sm text-gray-700 font-medium">Gesamtanzahl</p>
          <p className="text-3xl font-bold text-blue-800">{effectiveTotalCount}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-700 font-medium">Trainiert</p>
          <p className="text-3xl font-bold text-green-800">{effectiveTrainedCount}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-700 font-medium">Versuche</p>
          <p className="text-3xl font-bold text-amber-700">{effectiveAttempts}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-700 font-medium">Fortschritt</p>
          <p className="text-3xl font-bold text-purple-800">{effectiveProgress}%</p>
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded-full mb-4">
        <div
          className="h-4 bg-blue-700 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${effectiveProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Stats;
