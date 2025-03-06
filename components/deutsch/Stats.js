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
          <p className="text-sm text-gray-500">Gesamtanzahl</p>
          <p className="text-3xl font-bold text-blue-600">{effectiveTotalCount}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-500">Trainiert</p>
          <p className="text-3xl font-bold text-green-600">{effectiveTrainedCount}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-500">Versuche</p>
          <p className="text-3xl font-bold text-yellow-600">{effectiveAttempts}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-500">Fortschritt</p>
          <p className="text-3xl font-bold text-purple-600">{effectiveProgress}%</p>
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded-full mb-4">
        <div
          className="h-4 bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${effectiveProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Stats;