import { useState } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import Interface from "./components/interface/Interface";

function App() {
  return (
    <div className="h-screen flex bg-primary">
      {/* Sidebar */}
      <div className="flex-shrink=0 bg-secondary">
        <Sidebar />
      </div>

      {/* Interface */}
      <div className="flex-1 bg-primary">
        <Interface />
      </div>
    </div>
  );
}

export default App;
