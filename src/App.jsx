import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Crew from "./pages/Crew.jsx";
import Flights from "./pages/Flights.jsx";
import Stay from "./pages/Stay.jsx";
import Cars from "./pages/Cars.jsx";
import Itinerary from "./pages/Itinerary.jsx";
import MapPage from "./pages/Map.jsx";
import Polls from "./pages/Polls.jsx";
import Packing from "./pages/Packing.jsx";
import Spend from "./pages/Spend.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crew" element={<Crew />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/stay" element={<Stay />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/polls" element={<Polls />} />
        <Route path="/packing" element={<Packing />} />
        <Route path="/spend" element={<Spend />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
