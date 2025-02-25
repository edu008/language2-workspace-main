import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DeutschPage() {
  const [filterOpen, setFilterOpen] = useState(false);

  const handleFilterClick = () => {
    setFilterOpen(!filterOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-between items-center w-full p-6">
        <h1 className="text-5xl font-bold text-center flex-1 ml-16">Wortbedeutungen</h1>
        <div className="flex flex-col gap-4 w-[300px]">
          <button
            onClick={handleFilterClick}
            className="py-2 px-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm h-[48px]"
          >
            Filter
          </button>
        </div>
      </div>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Filter</DialogTitle>
          </DialogHeader>
          <div>
            {/* Filter options go here */}
            <p>Filter options will be displayed here.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}