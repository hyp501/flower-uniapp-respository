export const ACTIONS = [
  { key: 'water', label: '浇水' },
  { key: 'fertilize', label: '施肥' },
  { key: 'weed', label: '除草' }
];

export function safeNumber(value, defaultValue = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
}
