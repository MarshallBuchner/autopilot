import { generateDemoProfile, listCuratedProfiles } from "@/lib/automation/demoProfiles";
import type { DemoProfile } from "@/lib/types";
import { SANDBOX_CURRENT_USER_ID } from "@/lib/sandbox/types";

/** Designated AUTOPILOT test account for Live Sandbox. */
export const SANDBOX_CURRENT_USER: DemoProfile & { id: string } = {
  id: SANDBOX_CURRENT_USER_ID,
  firstName: "Alex",
  age: 29,
  distanceKm: 0,
  occupation: "Product engineer",
  bio: "Building AUTOPILOT on weekends. Looking for good conversation.",
  interests: ["Coffee", "Hiking", "Music", "Design"],
  avatarHue: 205,
  avatarVariant: 4,
  avatarStyle: "cool",
};

/** Seeded profiles that already Like Alex before AUTOPILOT starts. */
export const RECIPROCAL_LIKER_NAMES = [
  "Grace",
  "Sophie",
  "Maya",
  "Emma",
  "Chloe",
  "Isla",
  "Aria",
  "Jade",
  "Iris",
  "Harper",
] as const;

const EXTRA_SEED: Array<Omit<DemoProfile, "id">> = [
  {
    firstName: "Blair",
    age: 28,
    distanceKm: 6,
    occupation: "Research scientist",
    bio: "Lab notes by day, farmer’s markets on Saturday.",
    interests: ["Science", "Cooking", "Cycling", "Reading"],
    avatarHue: 170,
    avatarVariant: 2,
    avatarStyle: "mint",
  },
  {
    firstName: "Drew",
    age: 31,
    distanceKm: 14,
    occupation: "City planner",
    bio: "Obsessed with parks, transit maps, and good dumplings.",
    interests: ["Travel", "Coffee", "Art", "Hiking"],
    avatarHue: 40,
    avatarVariant: 6,
    avatarStyle: "warm",
  },
  {
    firstName: "Eden",
    age: 25,
    distanceKm: 4,
    occupation: "Podcast producer",
    bio: "Always chasing better questions.",
    interests: ["Podcasts", "Writing", "Coffee", "Movies"],
    avatarHue: 315,
    avatarVariant: 8,
    avatarStyle: "dusk",
  },
  {
    firstName: "Frankie",
    age: 27,
    distanceKm: 9,
    occupation: "Climbing coach",
    bio: "Belay partner preferred. Snacks required.",
    interests: ["Climbing", "Fitness", "Dogs", "Camping"],
    avatarHue: 12,
    avatarVariant: 1,
    avatarStyle: "soft",
  },
  {
    firstName: "Haven",
    age: 30,
    distanceKm: 17,
    occupation: "Gallery manager",
    bio: "Quiet openings, loud playlists, mid-tier karaoke.",
    interests: ["Art", "Music", "Wine", "Photography"],
    avatarHue: 280,
    avatarVariant: 9,
    avatarStyle: "studio",
  },
  {
    firstName: "Indigo",
    age: 24,
    distanceKm: 3,
    occupation: "Sustainability analyst",
    bio: "Trying to leave things better than I found them.",
    interests: ["Hiking", "Cycling", "Reading", "Cooking"],
    avatarHue: 150,
    avatarVariant: 3,
    avatarStyle: "mint",
  },
  {
    firstName: "Jules",
    age: 26,
    distanceKm: 11,
    occupation: "Frontend engineer",
    bio: "Pixels, pickles, and poorly timed puns.",
    interests: ["Design", "Gaming", "Coffee", "Skating"],
    avatarHue: 225,
    avatarVariant: 5,
    avatarStyle: "cool",
  },
  {
    firstName: "Kai",
    age: 29,
    distanceKm: 8,
    occupation: "Surf instructor",
    bio: "Salt water preferred. Fresh coffee required.",
    interests: ["Surfing", "Travel", "Photography", "Fitness"],
    avatarHue: 195,
    avatarVariant: 7,
    avatarStyle: "cool",
  },
  {
    firstName: "Lane",
    age: 32,
    distanceKm: 19,
    occupation: "Editor",
    bio: "Comma rules optional. Kindness mandatory.",
    interests: ["Reading", "Writing", "Theater", "Wine"],
    avatarHue: 350,
    avatarVariant: 0,
    avatarStyle: "dusk",
  },
  {
    firstName: "Noa",
    age: 23,
    distanceKm: 5,
    occupation: "Dance teacher",
    bio: "Rhythm first. Small talk later.",
    interests: ["Fitness", "Music", "Travel", "Coffee"],
    avatarHue: 330,
    avatarVariant: 10,
    avatarStyle: "warm",
  },
  {
    firstName: "Owen",
    age: 28,
    distanceKm: 12,
    occupation: "Wildlife photographer",
    bio: "Will wait three hours for the right light.",
    interests: ["Photography", "Camping", "Hiking", "Dogs"],
    avatarHue: 95,
    avatarVariant: 11,
    avatarStyle: "soft",
  },
  {
    firstName: "Piper",
    age: 26,
    distanceKm: 7,
    occupation: "Pastry chef",
    bio: "Laminated dough. Complicated feelings. Excellent croissants.",
    interests: ["Baking", "Coffee", "Music", "Movies"],
    avatarHue: 25,
    avatarVariant: 2,
    avatarStyle: "warm",
  },
];

export function buildSandboxSeedProfiles(): Array<DemoProfile & { id: string }> {
  const curated = listCuratedProfiles()
    .filter((p) => p.firstName !== "Alex")
    .map((p, index) => ({
      ...p,
      id: `user-${p.firstName.toLowerCase()}-${index}`,
    }));

  const extras = EXTRA_SEED.map((p, index) => ({
    ...p,
    id: `user-${p.firstName.toLowerCase()}-x${index}`,
  }));

  const generated: Array<DemoProfile & { id: string }> = [];
  let seed = 9001;
  while (curated.length + extras.length + generated.length < 40) {
    const profile = generateDemoProfile(seed++);
    if (profile.firstName === "Alex") continue;
    generated.push({ ...profile, id: `user-gen-${seed}` });
  }

  return [SANDBOX_CURRENT_USER, ...curated, ...extras, ...generated];
}

export function resolveReciprocalLikerIds(
  profiles: Array<DemoProfile & { id: string }>
): string[] {
  const ids: string[] = [];
  for (const name of RECIPROCAL_LIKER_NAMES) {
    const found = profiles.find(
      (p) => p.id !== SANDBOX_CURRENT_USER_ID && p.firstName === name
    );
    if (found) ids.push(found.id);
  }
  return ids;
}
