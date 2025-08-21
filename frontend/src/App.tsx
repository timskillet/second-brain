import Header from "./components/Header";
import Interface from "./components/Interface";
import "./index.css";

function App() {
  return (
    <div className="min-h-screen min-w-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Interface />
      </main>
    </div>
  );
}

export default App;
