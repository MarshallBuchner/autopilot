import type { DemoProfile } from "@/lib/types";

const FIRST_NAMES = [
  "Sophie",
  "Emma",
  "Maya",
  "Olivia",
  "Ava",
  "Nora",
  "Isla",
  "Luna",
  "Chloe",
  "Zoe",
  "Aria",
  "Mia",
  "Elena",
  "Grace",
  "Riley",
  "Quinn",
  "Harper",
  "Jade",
  "Iris",
  "Skye",
  "Alex",
  "Sam",
  "Jordan",
  "Casey",
  "Taylor",
  "Morgan",
  "Jamie",
  "Avery",
  "Reese",
  "Cameron",
];

const OCCUPATIONS = [
  "Marketing at a startup",
  "Product designer",
  "Software engineer",
  "Grad student in psychology",
  "Nurse at city hospital",
  "Freelance photographer",
  "Barista & aspiring novelist",
  "Architect",
  "Physical therapist",
  "UX researcher",
  "Teacher",
  "Data analyst",
  "Chef at a neighborhood spot",
  "Music producer",
  "Environmental scientist",
  "Copywriter",
  "Veterinarian assistant",
  "Film editor",
];

const BIOS = [
  "Coffee, hockey, spontaneous road trips.",
  "Looking for someone who laughs at bad puns.",
  "Trail runs before brunch. Always.",
  "Vinyl collector. Terrible dancer. Great cook.",
  "Dog parent. Plant parent. Trying my best.",
  "Ask me about the best taco trucks in town.",
  "Weekend baker. Weekday overthinker.",
  "Here for good conversation and sunrise hikes.",
  "Fluent in sarcasm and Spotify playlists.",
  "Building something cool. Looking for co-adventurers.",
  "Museum hopper. Crossword addict. Soft launch energy.",
  "I make a mean pasta and worse decisions sometimes.",
  "Currently learning guitar. Please be patient.",
  "Beach > pool. Books > doomscrolling… usually.",
  "If you have a favorite hike, tell me about it.",
];

const INTEREST_POOL = [
  "Hockey",
  "Travel",
  "Dogs",
  "Fitness",
  "Coffee",
  "Photography",
  "Hiking",
  "Cooking",
  "Music",
  "Art",
  "Yoga",
  "Movies",
  "Running",
  "Reading",
  "Climbing",
  "Surfing",
  "Gaming",
  "Baking",
  "Cycling",
  "Theater",
  "Camping",
  "Wine",
  "Skating",
  "Podcasts",
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function pickN<T>(rng: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]!);
  }
  return out;
}

/** Generate a fictional demo profile. Never uses real dating-site data. */
export function generateDemoProfile(seed: number): DemoProfile {
  const rng = mulberry32(seed);
  const interestCount = 3 + Math.floor(rng() * 3); // 3–5

  return {
    id: `demo-${seed.toString(36)}`,
    firstName: pick(rng, FIRST_NAMES),
    age: 21 + Math.floor(rng() * 14), // 21–34
    distanceKm: Math.max(1, Math.round(rng() * 25)),
    occupation: pick(rng, OCCUPATIONS),
    bio: pick(rng, BIOS),
    interests: pickN(rng, INTEREST_POOL, interestCount),
    avatarHue: Math.floor(rng() * 360),
  };
}
