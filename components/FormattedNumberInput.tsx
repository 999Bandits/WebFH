"use client";

import { useState, useEffect } from "react";

interface FormattedNumberInputProps {
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number;
  className?: string;
  disabled?: boolean;
  allowDecimal?: boolean;
}

export default function FormattedNumberInput({
  id,
  name,
  placeholder,
  required = false,
  defaultValue,
  className = "",
  disabled = false,
  allowDecimal = true,
}: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [rawValue, setRawValue] = useState("");

  // Format number with Indonesian locale (dots as thousand separators, comma as decimal)
  const formatNumber = (value: string): string => {
    if (!value) return "";
    
    // Parse the value properly - Indonesian format: dots are thousands, comma is decimal
    const normalized = value.replace(/\./g, "").replace(/,/g, ".");
    const num = parseFloat(normalized);
    
    if (isNaN(num)) return value;
    
    // Format with Indonesian locale (no decimal places for integers)
    return num.toLocaleString("id-ID");
  };

  // Parse Indonesian formatted number back to numeric value
  const parseIndonesianNumber = (value: string): number => {
    // Replace dots (thousand separators) with nothing, then replace comma with dot
    const normalized = value.replace(/\./g, "").replace(/,/g, ".");
    return parseFloat(normalized) || 0;
  };

  // Initialize with default value
  useEffect(() => {
    if (defaultValue) {
      const stringValue = String(defaultValue);
      setRawValue(stringValue);
      setDisplayValue(formatNumber(stringValue));
    }
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Allow empty input
    if (!input) {
      setRawValue("");
      setDisplayValue("");
      return;
    }
    
    // Remove all non-digit characters except comma and dot
    let cleaned = input.replace(/[^\d.,]/g, "");
    
    // In Indonesian format: dots are thousand separators, comma is decimal
    // If there's a comma, treat it as decimal point
    // Otherwise, remove all dots (they're thousand separators)
    if (allowDecimal && cleaned.includes(",")) {
      // Comma is decimal separator
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // No comma - remove all dots (thousand separators)
      cleaned = cleaned.replace(/\./g, "");
    }
    
    // Store raw numeric value
    const numericValue = cleaned;
    
    // Validate it's a valid number
    if (numericValue === "" || numericValue === "." || !isNaN(parseFloat(numericValue))) {
      const num = parseFloat(numericValue);
      // Store as actual number (not "7.000" but "7")
      setRawValue(isNaN(num) ? "" : String(num));
      // Display formatted value
      const displayVal = num.toLocaleString("id-ID");
      setDisplayValue(isNaN(num) ? numericValue : displayVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 46, 9, 27, 13].includes(e.keyCode)) return;
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) return;
    // Allow: home, end, left, right
    if (e.keyCode >= 35 && e.keyCode <= 39) return;
    // Allow: numbers from main keyboard and numpad
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) return;
    // Allow: comma and dot (for decimal)
    if (allowDecimal && (e.key === "," || e.key === ".")) return;
    
    e.preventDefault();
  };

  const handleBlur = () => {
    // Ensure proper formatting on blur
    if (rawValue && rawValue !== ".") {
      // Parse the raw value properly
      const num = parseFloat(rawValue);
      if (!isNaN(num)) {
        setDisplayValue(num.toLocaleString("id-ID"));
      }
    }
  };

  return (
    <>
      <input
        type="text"
        id={id}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
        inputMode="decimal"
      />
      <input type="hidden" name={name} value={rawValue} />
    </>
  );
}
