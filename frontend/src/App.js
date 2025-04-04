import React, { useState, useEffect } from "react";
import axios from "axios";
import SymbolDropdown from "./components/SymbolDropdown";
import PriceChart from "./components/PriceChart";

const App = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [stockData, setStockData] = useState([]);

  const symbols = ["CSCO", "GPL", "UNT", "ANTE", "SBGI", "NZF", "PRI"];

  const fetchData = async (symbol) => {
    try {
      const res = await axios.get(
        `https://4ojyncmvuf.execute-api.us-east-2.amazonaws.com/prod/symbol?symbol=${symbol}`
      );
      setStockData(res.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setStockData([]);
    }
  };

  useEffect(() => {
    if (selectedSymbol) {
      fetchData(selectedSymbol);
    }
  }, [selectedSymbol]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "auto" }}>
      <h1>📊 Real-Time Stock Dashboard</h1>
      <SymbolDropdown symbols={symbols} onSelect={setSelectedSymbol} />
      <PriceChart data={stockData} />
    </div>
  );
};

export default App;
