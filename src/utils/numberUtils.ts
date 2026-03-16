export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const formatDecimal = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

export const parseDecimalInput = (value: string): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : roundToTwoDecimals(parsed);
};

export const removeTrailingZeros = (value: number | undefined | null): string => {
  if (value === undefined || value === null) {
    return '-';
  }
  return parseFloat(value.toString()).toString();
};
