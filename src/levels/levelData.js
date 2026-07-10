// Shared metadata for all 15 levels — narrative source of truth for the world map + progression.
// Only Level 1 has a full 3D scene built so far (see level1_blossom_meadow.js); the rest are
// registered here so the world map, node unlock logic, and hop-transition all work end to end,
// and are filled in with real scenes level by level.

export const LEVEL_DATA = [
  { id: 1, name: 'Blossom Meadow', theme: 'First Impressions & New Beginnings', accent: 0xff8fab, mapPos: [-16, 0, 10] },
  { id: 2, name: 'River of Wishes', theme: 'Dreams & Promises', accent: 0x7fd8e8, mapPos: [-11, 0, 6] },
  { id: 3, name: 'Whispering Forest', theme: 'Quiet Feelings', accent: 0x6fae6a, mapPos: [-7, 0, 1] },
  { id: 4, name: 'Bloom Garden', theme: 'Growing Together', accent: 0xffb6d9, mapPos: [-3, 0, 5] },
  { id: 5, name: 'Cozy Castle', theme: 'Feeling at Home', accent: 0xe0607a, mapPos: [1, 0, 9] },
  { id: 6, name: 'Melody Village', theme: 'The Songs That Stay With Us', accent: 0xc792ea, mapPos: [5, 0, 4] },
  { id: 7, name: 'Snowflake Village', theme: 'Warmth During Cold Days', accent: 0xbfe3ff, mapPos: [9, 0, 8] },
  { id: 8, name: 'Star Observatory', theme: 'Dreams Bigger Than The Sky', accent: 0x5b5fa8, mapPos: [13, 0, 3] },
  { id: 9, name: 'Color Workshop', theme: 'Bringing Color Back', accent: 0xffd166, mapPos: [10, 0, -2] },
  { id: 10, name: 'Courage Mountain', theme: 'Supporting Each Other', accent: 0x9c8b7a, mapPos: [6, 0, -6] },
  { id: 11, name: 'Festival of Smiles', theme: 'Happiness Is Better When Shared', accent: 0xff6fa5, mapPos: [1, 0, -9] },
  { id: 12, name: 'Dream Islands', theme: 'Every Dream Begins Somewhere', accent: 0xa7e8ff, mapPos: [-4, 0, -7] },
  { id: 13, name: 'Memory Grove', theme: 'Looking Back Without Letting Go', accent: 0xffe066, mapPos: [-9, 0, -4] },
  { id: 14, name: 'Heart Kingdom', theme: 'Every Memory Leads Home', accent: 0xffd1e6, mapPos: [-14, 0, -8] },
  { id: 15, name: 'Final Garden', theme: 'Home', accent: 0xff4d94, mapPos: [-18, 0, -2] },
];

export function getLevel(id) {
  return LEVEL_DATA.find((l) => l.id === id) || null;
}
