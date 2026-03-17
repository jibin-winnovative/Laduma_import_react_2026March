import Decimal from 'decimal.js';

export const add = (a: number | string | Decimal, b: number | string | Decimal): Decimal => {
  return new Decimal(a || 0).plus(new Decimal(b || 0));
};

export const subtract = (a: number | string | Decimal, b: number | string | Decimal): Decimal => {
  return new Decimal(a || 0).minus(new Decimal(b || 0));
};

export const multiply = (a: number | string | Decimal, b: number | string | Decimal): Decimal => {
  return new Decimal(a || 0).times(new Decimal(b || 0));
};

export const divide = (a: number | string | Decimal, b: number | string | Decimal): Decimal => {
  const divisor = new Decimal(b || 1);
  if (divisor.isZero()) {
    return new Decimal(0);
  }
  return new Decimal(a || 0).div(divisor);
};

export const toMoney = (value: number | string | Decimal): string => {
  return new Decimal(value || 0).toFixed(2);
};

export const toNumber = (value: number | string | Decimal): number => {
  return new Decimal(value || 0).toNumber();
};

export const sum = (values: (number | string | Decimal)[]): Decimal => {
  return values.reduce((acc, val) => add(acc, val), new Decimal(0));
};
