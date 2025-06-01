const prefixes = [
  'Unfair',
  'Ok',
  'Traditional',
  'Exciting',
  'Several',
  'No',
  'Maximum',
  'Different',
];

const nouns = [
  'Apartment',
  'Carpet',
  'Outcome',
  'Pineapple',
  'Finance',
  'Bat',
  'Dragon',
  'Wizard',
];

export function generateUsername(): string {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * (999999 - 1000) + 1000);
  
  return `${prefix}${noun}${number}`;
}