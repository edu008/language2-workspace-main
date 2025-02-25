import React from 'react';

const Stats = ({ totalCount = 0, trainedCount = 0, attempts = 0, progress = 0 }) => {
  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="text-center flex-1">
          <p className="text-sm text-gray-500">Gesamtanzahl</p>
          <p className="text-3xl font-bold text-blue-600">{totalCount}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-500">Trainiert</p>
          <p className="text-3xl font-bold text-green-600">{trainedCount}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-500">Versuche</p>
          <p className="text-3xl font-bold text-yellow-600">{attempts}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-500">Fortschritt</p>
          <p className="text-3xl font-bold text-purple-600">{progress}%</p>
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded-full mb-4">
        <div
          className="h-4 bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Stats;