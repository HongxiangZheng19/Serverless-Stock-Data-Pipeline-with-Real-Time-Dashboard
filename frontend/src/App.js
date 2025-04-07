import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import Plot from "react-plotly.js";
import "./App.css";

const API_URL = "https://4ojyncmvuf.execute-api.us-east-2.amazonaws.com/prod";

const options = [
  { value: "AIRT", label: "AIRT (AIRT)" },
  { value: "ANTE", label: "ANTE (ANTE)" },
  { value: "BNY", label: "BNY (BNY)" },
  { value: "CSCO", label: "CSCO (CSCO)" },
  { value: "GFED", label: "GFED (GFED)" },
  { value: "GPL", label: "GPL (GPL)" },
  { value: "HLNE", label: "HLNE (HLNE)" },
  { value: "HUBS", label: "HUBS (HUBS)" },
  { value: "ISSC", label: "ISSC (ISSC)" },
  { value: "NXN", label: "NXN (NXN)" },
  { value: "NZF", label: "NZF (NZF)" },
  { value: "PRI", label: "PRI (PRI)" },
  { value: "RHE", label: "RHE (RHE)" },
  { value: "RIV", label: "RIV (RIV)" },
  { value: "RJZ", label: "RJZ (RJZ)" },
  { value: "SBGI", label: "SBGI (SBGI)" },
  { value: "SITC", label: "SITC (SITC)" },
  { value: "TEAF", label: "TEAF (TEAF)" },
  { value: "UFCS", label: "UFCS (UFCS)" },
  { value: "UNT", label: "UNT (UNT)" }
];

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async (symbol) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/symbol?symbol=${symbol}`);
      setStockData(res.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setStockData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSymbol) {
      fetchData(selectedSymbol.value);
    }
  }, [selectedSymbol]);

  const openPrices = stockData.map((d) => parseFloat(d.open));
  const closePrices = stockData.map((d) => parseFloat(d.close));
  const dates = stockData.map((d) => d.date);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "900px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        Real-Time Stock Dashboard
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Built with AWS, React, Plotly
      </p>

      <Select
        options={options}
        value={selectedSymbol}
        onChange={setSelectedSymbol}
        placeholder="Select a stock symbol"
        styles={{
          container: (base) => ({ ...base, marginBottom: "2rem" }),
          control: (base) => ({ ...base, borderColor: "#ccc", boxShadow: "none" }),
        }}
      />

      {isLoading ? (
        <p>Loading data...</p>
      ) : stockData.length > 0 ? (
        <Plot
          data={[
            {
              x: dates,
              y: openPrices,
              type: "scatter",
              mode: "lines+markers",
              name: "Open Price",
              line: { color: "blue" },
            },
            {
              x: dates,
              y: closePrices,
              type: "scatter",
              mode: "lines+markers",
              name: "Close Price",
              line: { color: "orange" },
            },
          ]}
          layout={{
            title: `${selectedSymbol?.label} Stock Price`,
            xaxis: { title: "Date" },
            yaxis: { title: "Price (USD)" },
            autosize: true,
            margin: { t: 50, b: 50 },
          }}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <p style={{ color: "#999" }}>No data to show.</p>
      )}
    </div>
  );
}

export default App;
