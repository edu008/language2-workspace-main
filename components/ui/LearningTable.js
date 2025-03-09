import React, { useState, useEffect } from "react";
import { useUIContext } from "../../contexts/UIContext";
import { useDataContext } from "../../contexts/AppContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./stats/tabs";
// Import only the specific components needed
import { Button } from "@material-tailwind/react/components/Button";
import { Dialog } from "@material-tailwind/react/components/Dialog";
import { DialogHeader } from "@material-tailwind/react/components/Dialog";
import { DialogBody } from "@material-tailwind/react/components/Dialog";
import { DialogFooter } from "@material-tailwind/react/components/Dialog";

const LearningTable = () => {
  const {
    isTableVisible,
    toggleTable,
    activeTab,
    setActiveTab,
    getTableData,
    getTableColumns,
    getTableTitle,
  } = useUIContext();

  // Use state to store the table data
  const [tableData, setTableData] = useState([]);
  const tableColumns = getTableColumns();
  const tableTitle = getTableTitle();

  // Get data from DataContext and BaseContext
  const { loadInitialData, standingSummary, data } = useDataContext();
  const { getCurrentFeature } = useUIContext();

  // Function to refresh data from the database
  const refreshData = async () => {
    if (isTableVisible) {
      try {
        // Get the updated table data from the current state
        // without reloading from the server
        const newData = getTableData();
        setTableData(newData);
        console.log("Table Data Refreshed:", newData.length, "entries");
      } catch (error) {
        console.error("Error refreshing table data:", error);
      }
    }
  };

  // Function to force reload data from the database
  const forceReloadData = async () => {
    if (isTableVisible) {
      try {
        // Refresh the data from the database
        const currentFeature = getCurrentFeature();
        if (currentFeature) {
          await loadInitialData(currentFeature);
        }
        
        // Get the updated table data
        const newData = getTableData();
        setTableData(newData);
        console.log("Table Data Reloaded from Server:", newData.length, "entries");
      } catch (error) {
        console.error("Error reloading table data:", error);
      }
    }
  };

  // Refresh data when the table is opened
  useEffect(() => {
    if (isTableVisible) {
      // Force an immediate refresh when the table is opened
      refreshData();
    }
  }, [isTableVisible]);

  // Refresh data when the active tab changes
  useEffect(() => {
    if (isTableVisible) {
      refreshData();
    }
  }, [activeTab]);

  // Update the table data when standing summary changes
  // But only if the table is visible and we're not already refreshing
  useEffect(() => {
    if (isTableVisible) {
      const newData = getTableData();
      // Only update if the data has actually changed
      if (JSON.stringify(newData) !== JSON.stringify(tableData)) {
        setTableData(newData);
        console.log("Table Data Updated:", newData.length, "entries");
      }
    }
  }, [standingSummary]);

  return (
    <Dialog
      open={isTableVisible}
      handler={toggleTable}
      size="xl"
      className="max-h-[80vh] max-w-4xl"
    >
      <DialogHeader className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold">{tableTitle}</h2>
        </div>
        <button
          onClick={toggleTable}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </DialogHeader>
      <DialogBody className="px-6 py-0 flex flex-col">
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="learned">Gelernt</TabsTrigger>
            <TabsTrigger value="repeat">Zu wiederholen</TabsTrigger>
            <TabsTrigger value="all">Alle</TabsTrigger>
          </TabsList>
        </Tabs>

        {tableData.length === 0 ? (
          <p className="text-center py-4">Keine Einträge gefunden.</p>
        ) : (
          <div
            style={{
              flex: 1,
              maxHeight: "calc(60vh - 100px)", // Explizite Höhe mit Inline-Style
              overflowY: "auto", // Erzwinge vertikales Scrollen
            }}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {tableColumns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((item, index) => (
                  <tr
                    key={item.exercise || index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {tableColumns.map((column) => (
                      <td
                        key={`${item.exercise}-${column.key}`}
                        className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap"
                      >
                        {column.key === "correct"
                          ? `${item[column.key]}/2`
                          : item[column.key] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogBody>
      <DialogFooter className="px-6 py-4">
        <Button variant="text" color="red" onClick={toggleTable} className="mr-1">
          <span>Schließen</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default LearningTable;
