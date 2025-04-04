import React from "react";
import Select from "react-select";

const SymbolDropdown = ({ symbols, onSelect }) => {
  const options = symbols.map((symbol) => ({ label: symbol, value: symbol }));

  return (
    <div style={{ marginBottom: "1rem" }}>
      <Select
        options={options}
        onChange={(e) => onSelect(e.value)}
        placeholder="Select a symbol"
      />
    </div>
  );
};

export default SymbolDropdown;
