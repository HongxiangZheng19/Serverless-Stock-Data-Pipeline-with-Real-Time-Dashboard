import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import Plot from "react-plotly.js";
import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_URL = "https://4ojyncmvuf.execute-api.us-east-2.amazonaws.com/prod";

const historicalOptions = [
  { value: "AIRT", label: "AIRT (Air T Inc)" },
  { value: "ANTE", label: "ANTE (AirNet Technology Inc)" },
  { value: "BNY", label: "BNY (BlackRock New York Municipal Income Trust)" },
  { value: "CSCO", label: "CSCO (Cisco Systems Inc)" },
  { value: "GFED", label: "GFED (Guaranty Federal Bancshares Inc)" },
  { value: "GPL", label: "GPL (Great Panther Mining Ltd)" },
  { value: "HLNE", label: "HLNE (Hamilton Lane Inc)" },
  { value: "HUBS", label: "HUBS (HubSpot Inc)" },
  { value: "ISSC", label: "ISSC (Innovative Solutions and Support Inc)" },
  { value: "NXN", label: "NXN (Nuveen New York Select Tax-Free Income Portfolio)" },
  { value: "NZF", label: "NZF (Nuveen Municipal Credit Income Fund)" },
  { value: "PRI", label: "PRI (Primerica Inc)" },
  { value: "RHE", label: "RHE (Regional Health Properties Inc)" },
  { value: "RIV", label: "RIV (RiverNorth Opportunities Fund Inc)" },
  { value: "RJZ", label: "RJZ (Invesco Agricultural Fund)" },
  { value: "SBGI", label: "SBGI (Sinclair Broadcast Group Inc)" },
  { value: "SITC", label: "SITC (Site Centers Corp)" },
  { value: "TEAF", label: "TEAF (Ecofin Sustainable and Social Impact Term Fund)" },
  { value: "UFCS", label: "UFCS (United Fire Group Inc)" },
  { value: "UNT", label: "UNT (Unit Corporation)" }
];

const realTimeOptions = [
  { value: "AAPL", label: "AAPL (Apple)" },
  { value: "MSFT", label: "MSFT (Microsoft)" },
  { value: "GOOGL", label: "GOOGL (Alphabet)" },
  { value: "AMZN", label: "AMZN (Amazon)" },
  { value: "TSLA", label: "TSLA (Tesla)" },
];

function App() {
  const historicalLayoutRef = useRef({
    title: "",
    xaxis: { title: "Date" },
    yaxis: { title: "Price (USD)" },
    autosize: true,
    margin: { t: 50, b: 50 }
  });
  
  const realTimeLayoutRef = useRef({
    title: "",
    xaxis: { title: "Timestamp", tickformat: "%H:%M\n%b %d" },
    yaxis: { title: "Price (USD)" },
    autosize: true,
    margin: { t: 50, b: 50 }
  });
  
  // Historical
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Real-Time
  const [realTimeSymbol, setRealTimeSymbol] = useState(null);
  const [realTimeData, setRealTimeData] = useState([]);

  const fetchHistoricalData = async (symbol) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/symbol?symbol=${symbol}`);
      setStockData(res.data);
    } catch (err) {
      console.error("Error fetching historical data:", err);
      setStockData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSymbol) {
      fetchHistoricalData(selectedSymbol.value);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (!realTimeSymbol) return;

    const fetchInitialRealTime = async () => {
      try {
        const res = await axios.get(`${API_URL}/symbol?symbol=${realTimeSymbol.value}`);
        setRealTimeData(res.data);
      } catch (err) {
        console.error("Error fetching initial real-time data:", err);
        setRealTimeData([]);
      }
    };

    fetchInitialRealTime();

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/symbol/latest?symbol=${realTimeSymbol.value}`);
        const latest = res.data;
        if (
          realTimeData.length === 0 ||
          realTimeData[realTimeData.length - 1].date !== latest.date
        ) {
          setRealTimeData((prevData) => [...prevData, latest]);
        }
      } catch (err) {
        console.error("Error polling real-time data:", err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [realTimeSymbol, realTimeData]);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "900px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Real-Time Stock Dashboard
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Built with AWS, React, Plotly
      </p>

      {/* Historical Section */}
      <section style={{ marginBottom: "4rem" }}>
        <h2>Historical Data</h2>
        <Select
          options={historicalOptions}
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
                x: stockData.map((d) => d.date),
                y: stockData.map((d) => parseFloat(d.open)),
                type: "scatter",
                mode: "lines+markers",
                name: "Open Price",
                line: { color: "blue" },
              },
              {
                x: stockData.map((d) => d.date),
                y: stockData.map((d) => parseFloat(d.close)),
                type: "scatter",
                mode: "lines+markers",
                name: "Close Price",
                line: { color: "orange" },
              },
            ]}
            layout={{
              ...historicalLayoutRef.current,
              title: `${selectedSymbol?.label} Historical Prices`,
            }}
            onRelayout={(layout) => {
              historicalLayoutRef.current = { ...historicalLayoutRef.current, ...layout };
            }}
            config={{ responsive: true }}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <p style={{ color: "#999" }}>No historical data to show.</p>
        )}
      </section>

      {/* Real-Time Section */}
      <section>
        <h2>Real-Time Data (Updates every 5 mins (I turned it off for now :D))</h2>
        <Select
          options={realTimeOptions}
          value={realTimeSymbol}
          onChange={setRealTimeSymbol}
          placeholder="Select a real-time stock symbol"
          styles={{
            container: (base) => ({ ...base, marginBottom: "2rem" }),
            control: (base) => ({ ...base, borderColor: "#ccc", boxShadow: "none" }),
          }}
        />

        {realTimeData.length > 0 ? (
          <Plot
            data={[
              {
                x: realTimeData.map((d) => d.date),
                y: realTimeData.map((d) => parseFloat(d.close)),
                type: "scatter",
                mode: "lines+markers",
                name: "Real-Time Price",
                line: { color: "#00cc96" },
                hovertemplate: "Price: $%{y:.2f}<br>Time: %{x}<extra></extra>",
              },
            ]}
            layout={{
              ...realTimeLayoutRef.current,
              title: `${realTimeSymbol?.label} Real-Time Price (5-min interval)`,
            }}
            onRelayout={(layout) => {
              realTimeLayoutRef.current = { ...realTimeLayoutRef.current, ...layout };
            }}
            config={{ responsive: true }}
            style={{ width: "100%", height: "100%" }}
          />                
        ) : (
          <p style={{ color: "#999" }}>No real-time data to show.</p>
        )}
      </section>
    </div>
  );
}

export default App;
