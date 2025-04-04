import React from "react";
import Plot from "react-plotly.js";

const PriceChart = ({ data }) => {
  if (data.length === 0) return <p>No data to show.</p>;

  const dates = data.map((d) => d.date);
  const open = data.map((d) => parseFloat(d.open));
  const close = data.map((d) => parseFloat(d.close));

  return (
    <Plot
      data={[
        {
          x: dates,
          y: open,
          type: "scatter",
          mode: "lines+markers",
          name: "Open Price",
        },
        {
          x: dates,
          y: close,
          type: "scatter",
          mode: "lines+markers",
          name: "Close Price",
        },
      ]}
      layout={{
        title: "Stock Prices",
        xaxis: { title: "Date" },
        yaxis: { title: "Price" },
        autosize: true,
      }}
      useResizeHandler={true}
      style={{ width: "100%", height: "500px" }}
    />
  );
};

export default PriceChart;
