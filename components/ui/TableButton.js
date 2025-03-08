// TableButton.js
import React from "react";
import { useUIContext } from "../../contexts/UIContext";

const TableButton = () => {
  const { toggleTable } = useUIContext();

  return (
    <button
      onClick={toggleTable}
      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    >
      Lernfortschritt anzeigen
    </button>
  );
};

export default TableButton;
