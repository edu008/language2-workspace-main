import dynamic from 'next/dynamic';
import { useState } from 'react';
import LoadingScreen from './LoadingScreen';

// Example of dynamic import for code splitting
// This component will only be loaded when needed
const DynamicProgressChart = dynamic(
  () => import('../ui/stats/ProgressChart'),
  {
    loading: () => <LoadingScreen message="Lade Diagramm..." />,
    ssr: false // Disable server-side rendering for this component
  }
);

export default function DynamicExample({ data, title }) {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div className="p-4">
      <button
        onClick={() => setShowChart(!showChart)}
        className="py-2 px-4 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm"
        aria-label={showChart ? "Diagramm ausblenden" : "Diagramm anzeigen"}
      >
        {showChart ? "Diagramm ausblenden" : "Diagramm anzeigen"}
      </button>
      
      {/* Chart is only loaded when showChart is true */}
      {showChart && (
        <div className="mt-4">
          <DynamicProgressChart
            data={data}
            title={title}
            color="#5A5E83" // Using the updated color for better contrast
            gradientFrom="#5A5E83"
            gradientTo="rgba(90, 94, 131, 0.1)"
          />
        </div>
      )}
    </div>
  );
}
