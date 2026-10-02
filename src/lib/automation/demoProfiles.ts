import type {
  ActivityLevel,
  AvatarStyle,
  DemoProfile,
  RelationshipGoal,
} from "@/lib/types";
import { AVATAR_STYLES } from "@/lib/types";
import type { DrinkingHabit, SmokingHabit } from "@/lib/selective/types";

type ProfileSeed = Omit<
  DemoProfile,
  | "id"
  | "avatarHue"
  | "avatarVariant"
  | "avatarStyle"
  | "relationshipGoal"
  | "activityLevel"
  | "smoking"
  | "drinking"
  | "hasChildren"
  | "wantsChildren"
> & {
  hue: number;
  variant: number;
  style: AvatarStyle;
  relationshipGoal?: RelationshipGoal;
  activityLevel?: ActivityLevel;
  smoking?: SmokingHabit;
  drinking?: DrinkingHabit;
  hasChildren?: boolean;
  wantsChildren?: boolean | null;
};

/**
 * Curated fictional demo profiles (28).
 * Entirely synthetic — not based on real dating profiles.
 */
const CURATED: ProfileSeed[] = [
  {
    firstName: "Sophie",
    age: 24,
    distanceKm: 3,
    occupation: "Marketing at a startup",
    bio: "Coffee, hockey, spontaneous road trips.",
    interests: ["Hockey", "Travel", "Dogs", "Fitness"],
    hue: 340,
    variant: 0,
    style: "warm",
  },
  {
    firstName: "Emma",
    age: 26,
    distanceKm: 7,
    occupation: "Product designer",
    bio: "Figuring out type systems by day, thrift stores by weekend.",
    interests: ["Design", "Coffee", "Photography", "Cycling"],
    hue: 210,
    variant: 1,
    style: "studio",
  },
  {
    firstName: "Maya",
    age: 28,
    distanceKm: 12,
    occupation: "UX researcher",
    bio: "Ask me about the best taco trucks in town.",
    interests: ["Food", "Hiking", "Podcasts", "Art"],
    hue: 28,
    variant: 2,
    style: "soft",
  },
  {
    firstName: "Olivia",
    age: 25,
    distanceKm: 5,
    occupation: "Grad student in psychology",
    bio: "Weekend baker. Weekday overthinker.",
    interests: ["Baking", "Reading", "Yoga", "Movies"],
    hue: 300,
    variant: 3,
    style: "dusk",
  },
  {
    firstName: "Ava",
    age: 27,
    distanceKm: 9,
    occupation: "Software engineer",
    bio: "Building something cool. Looking for co-adventurers.",
    interests: ["Climbing", "Gaming", "Coffee", "Travel"],
    hue: 195,
    variant: 4,
    style: "cool",
  },
  {
    firstName: "Nora",
    age: 23,
    distanceKm: 2,
    occupation: "Barista & aspiring novelist",
    bio: "Fluent in sarcasm and Spotify playlists.",
    interests: ["Writing", "Music", "Coffee", "Dogs"],
    hue: 15,
    variant: 5,
    style: "warm",
  },
  {
    firstName: "Isla",
    age: 29,
    distanceKm: 14,
    occupation: "Architect",
    bio: "Museum hopper. Crossword addict. Soft launch energy.",
    interests: ["Art", "Architecture", "Wine", "Travel"],
    hue: 250,
    variant: 6,
    style: "studio",
  },
  {
    firstName: "Luna",
    age: 22,
    distanceKm: 6,
    occupation: "Freelance photographer",
    bio: "Trail runs before brunch. Always.",
    interests: ["Photography", "Running", "Dogs", "Camping"],
    hue: 320,
    variant: 7,
    style: "mint",
  },
  {
    firstName: "Chloe",
    age: 31,
    distanceKm: 18,
    occupation: "Physical therapist",
    bio: "Vinyl collector. Terrible dancer. Great cook.",
    interests: ["Music", "Cooking", "Fitness", "Skating"],
    hue: 160,
    variant: 8,
    style: "soft",
  },
  {
    firstName: "Zoe",
    age: 24,
    distanceKm: 4,
    occupation: "Copywriter",
    bio: "Looking for someone who laughs at bad puns.",
    interests: ["Writing", "Theater", "Coffee", "Movies"],
    hue: 350,
    variant: 9,
    style: "dusk",
  },
  {
    firstName: "Aria",
    age: 27,
    distanceKm: 11,
    occupation: "Environmental scientist",
    bio: "If you have a favorite hike, tell me about it.",
    interests: ["Hiking", "Camping", "Photography", "Cycling"],
    hue: 140,
    variant: 10,
    style: "mint",
  },
  {
    firstName: "Mia",
    age: 25,
    distanceKm: 8,
    occupation: "Nurse at city hospital",
    bio: "Dog parent. Plant parent. Trying my best.",
    interests: ["Dogs", "Yoga", "Cooking", "Reading"],
    hue: 10,
    variant: 11,
    style: "warm",
  },
  {
    firstName: "Elena",
    age: 30,
    distanceKm: 15,
    occupation: "Data analyst",
    bio: "Beach > pool. Books > doomscrolling… usually.",
    interests: ["Reading", "Surfing", "Wine", "Travel"],
    hue: 200,
    variant: 0,
    style: "cool",
  },
  {
    firstName: "Grace",
    age: 26,
    distanceKm: 8,
    occupation: "Teacher",
    bio: "Here for good conversation, sunrise hikes, and the occasional hockey night.",
    interests: ["Hockey", "Outdoors", "Hiking", "Coffee"],
    hue: 45,
    variant: 1,
    style: "soft",
  },
  {
    firstName: "Riley",
    age: 28,
    distanceKm: 10,
    occupation: "Music producer",
    bio: "Currently learning guitar. Please be patient.",
    interests: ["Music", "Gaming", "Coffee", "Movies"],
    hue: 275,
    variant: 2,
    style: "dusk",
  },
  {
    firstName: "Quinn",
    age: 32,
    distanceKm: 20,
    occupation: "Chef at a neighborhood spot",
    bio: "I make a mean pasta and worse decisions sometimes.",
    interests: ["Cooking", "Wine", "Travel", "Fitness"],
    hue: 20,
    variant: 3,
    style: "warm",
  },
  {
    firstName: "Harper",
    age: 24,
    distanceKm: 5,
    occupation: "Film editor",
    bio: "Museum hopper with a soft spot for late-night diners.",
    interests: ["Movies", "Photography", "Coffee", "Theater"],
    hue: 330,
    variant: 4,
    style: "studio",
  },
  {
    firstName: "Jade",
    age: 27,
    distanceKm: 7,
    occupation: "Veterinarian assistant",
    bio: "Will absolutely send you photos of every dog I meet.",
    interests: ["Dogs", "Hiking", "Yoga", "Baking"],
    hue: 155,
    variant: 5,
    style: "mint",
  },
  {
    firstName: "Iris",
    age: 29,
    distanceKm: 13,
    occupation: "Product manager",
    bio: "Planning trips faster than I take them.",
    interests: ["Travel", "Running", "Podcasts", "Design"],
    hue: 220,
    variant: 6,
    style: "cool",
  },
  {
    firstName: "Skye",
    age: 23,
    distanceKm: 2,
    occupation: "Graphic designer",
    bio: "Color palettes, skate parks, and good bread.",
    interests: ["Art", "Skating", "Baking", "Music"],
    hue: 310,
    variant: 7,
    style: "soft",
  },
  {
    firstName: "Alex",
    age: 26,
    distanceKm: 9,
    occupation: "Civil engineer",
    bio: "Weekends are for long walks and longer playlists.",
    interests: ["Cycling", "Music", "Hiking", "Coffee"],
    hue: 185,
    variant: 8,
    style: "studio",
  },
  {
    firstName: "Sam",
    age: 28,
    distanceKm: 6,
    occupation: "Occupational therapist",
    bio: "Curious about people. Competitive about board games.",
    interests: ["Games", "Cooking", "Reading", "Yoga"],
    hue: 35,
    variant: 9,
    style: "warm",
  },
  {
    firstName: "Jordan",
    age: 25,
    distanceKm: 11,
    occupation: "Journalist",
    bio: "Always chasing a story — preferably over brunch.",
    interests: ["Writing", "Coffee", "Travel", "Photography"],
    hue: 260,
    variant: 10,
    style: "dusk",
  },
  {
    firstName: "Casey",
    age: 30,
    distanceKm: 16,
    occupation: "Landscape architect",
    bio: "Outdoors first. Screens second. Snacks always.",
    interests: ["Camping", "Design", "Hiking", "Dogs"],
    hue: 125,
    variant: 11,
    style: "mint",
  },
  {
    firstName: "Taylor",
    age: 27,
    distanceKm: 4,
    occupation: "Pharmacist",
    bio: "Early mornings, quiet evenings, ambitious pasta nights.",
    interests: ["Cooking", "Running", "Reading", "Wine"],
    hue: 5,
    variant: 0,
    style: "soft",
  },
  {
    firstName: "Morgan",
    age: 24,
    distanceKm: 8,
    occupation: "Motion designer",
    bio: "Animating pixels by day. Chasing sunsets after.",
    interests: ["Art", "Photography", "Cycling", "Music"],
    hue: 290,
    variant: 1,
    style: "cool",
  },
  {
    firstName: "Jamie",
    age: 33,
    distanceKm: 22,
    occupation: "High school counselor",
    bio: "Good listener. Better hiking partner.",
    interests: ["Hiking", "Podcasts", "Coffee", "Theater"],
    hue: 50,
    variant: 2,
    style: "warm",
  },
  {
    firstName: "Avery",
    age: 26,
    distanceKm: 5,
    occupation: "Marine biologist",
    bio: "Salt water preferred. Fresh coffee required.",
    interests: ["Surfing", "Science", "Travel", "Photography"],
    hue: 190,
    variant: 3,
    style: "cool",
  },
];

const INTEREST_POOL = [
  "Hockey",
  "Travel",
  "Dogs",
  "Fitness",
  "Outdoors",
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
  "Design",
  "Writing",
];

const FALLBACK_NAMES = [
  "Reese",
  "Cameron",
  "Drew",
  "Parker",
  "Blake",
  "Hayden",
  "Rowan",
  "Finley",
];

const FALLBACK_JOBS = [
  "Research associate",
  "Studio manager",
  "Community organizer",
  "Pilot instructor",
  "Librarian",
  "Sourdough baker",
];

const FALLBACK_BIOS = [
  "Curious about cities, playlists, and good conversation.",
  "Looking for someone who plans trips and keeps snacks.",
  "Quiet confidence, loud laugh, mid-tier dance moves.",
  "Prefer sunrise walks to late-night scrolling.",
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

const GOALS: RelationshipGoal[] = [
  "long-term",
  "open-to-see",
  "short-term",
  "casual",
  "friendship",
  "long-term",
  "open-to-see",
];
const ACTIVITY: ActivityLevel[] = ["low", "moderate", "active", "very-active"];
const SMOKING: SmokingHabit[] = ["never", "never", "never", "sometimes", "regularly"];
const DRINKING: DrinkingHabit[] = ["never", "sometimes", "socially", "regularly"];

/** Deterministic lifestyle attributes for fictional profiles. */
export function lifestyleForName(firstName: string, salt = 0): Pick<
  DemoProfile,
  | "relationshipGoal"
  | "activityLevel"
  | "smoking"
  | "drinking"
  | "hasChildren"
  | "wantsChildren"
> {
  // Narrative overrides for V0.4 success path / clear PASS examples
  if (firstName === "Grace") {
    return {
      relationshipGoal: "long-term",
      activityLevel: "active",
      smoking: "never",
      drinking: "socially",
      hasChildren: false,
      wantsChildren: null,
    };
  }
  if (firstName === "Jamie") {
    return {
      relationshipGoal: "casual",
      activityLevel: "low",
      smoking: "sometimes",
      drinking: "regularly",
      hasChildren: true,
      wantsChildren: false,
    };
  }

  let h = salt * 131;
  for (let i = 0; i < firstName.length; i++) {
    h = (h * 33 + firstName.charCodeAt(i)) >>> 0;
  }
  return {
    relationshipGoal: GOALS[h % GOALS.length]!,
    activityLevel: ACTIVITY[h % ACTIVITY.length]!,
    smoking: SMOKING[h % SMOKING.length]!,
    drinking: DRINKING[h % DRINKING.length]!,
    hasChildren: h % 11 === 0,
    wantsChildren: h % 3 === 0 ? true : h % 3 === 1 ? false : null,
  };
}

function fromSeed(seed: ProfileSeed, id: string): DemoProfile {
  const lifestyle = {
    ...lifestyleForName(seed.firstName),
    ...(seed.relationshipGoal ? { relationshipGoal: seed.relationshipGoal } : {}),
    ...(seed.activityLevel ? { activityLevel: seed.activityLevel } : {}),
    ...(seed.smoking ? { smoking: seed.smoking } : {}),
    ...(seed.drinking ? { drinking: seed.drinking } : {}),
    ...(seed.hasChildren !== undefined ? { hasChildren: seed.hasChildren } : {}),
    ...(seed.wantsChildren !== undefined ? { wantsChildren: seed.wantsChildren } : {}),
  };
  return {
    id,
    firstName: seed.firstName,
    age: seed.age,
    distanceKm: seed.distanceKm,
    occupation: seed.occupation,
    bio: seed.bio,
    interests: seed.interests,
    avatarHue: seed.hue,
    avatarVariant: seed.variant,
    avatarStyle: seed.style,
    ...lifestyle,
  };
}

/** Generate a fictional demo profile. Never uses real dating-site data. */
export function generateDemoProfile(seed: number): DemoProfile {
  const curatedIndex = Math.abs(seed) % CURATED.length;
  // Prefer curated pool; occasionally synthesize a variant for freshness
  if (seed % 7 !== 0) {
    const base = CURATED[curatedIndex]!;
    return fromSeed(base, `demo-${seed.toString(36)}`);
  }

  const rng = mulberry32(seed);
  const interestCount = 3 + Math.floor(rng() * 3);
  const firstName = pick(rng, FALLBACK_NAMES);
  return {
    id: `demo-${seed.toString(36)}`,
    firstName,
    age: 22 + Math.floor(rng() * 12),
    distanceKm: Math.max(1, Math.round(rng() * 24)),
    occupation: pick(rng, FALLBACK_JOBS),
    bio: pick(rng, FALLBACK_BIOS),
    interests: pickN(rng, INTEREST_POOL, interestCount),
    avatarHue: Math.floor(rng() * 360),
    avatarVariant: Math.floor(rng() * 12),
    avatarStyle: pick(rng, AVATAR_STYLES),
    ...lifestyleForName(firstName, seed),
  };
}

export function getCuratedProfileCount(): number {
  return CURATED.length;
}

/** Stable curated profiles for Demo Mode generation and Live Sandbox seeding. */
export function listCuratedProfiles(): DemoProfile[] {
  return CURATED.map((seed, index) =>
    fromSeed(seed, `curated-${index}-${seed.firstName.toLowerCase()}`)
  );
}
