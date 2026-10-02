import type { DemoProfile } from "@/lib/types";
import { cn } from "@/lib/cn";

const STYLE_BG: Record<
  DemoProfile["avatarStyle"],
  (hue: number) => string
> = {
  soft: (h) =>
    `radial-gradient(circle at 30% 20%, hsla(${h},55%,70%,0.45), transparent 42%),
     radial-gradient(circle at 80% 80%, hsla(${(h + 40) % 360},40%,45%,0.35), transparent 50%),
     linear-gradient(165deg, hsl(${h},22%,22%) 0%, hsl(${(h + 20) % 360},18%,10%) 100%)`,
  studio: (h) =>
    `radial-gradient(circle at 50% 0%, hsla(${h},30%,55%,0.35), transparent 45%),
     linear-gradient(180deg, hsl(${h},15%,24%) 0%, hsl(${h},12%,8%) 100%)`,
  warm: (h) =>
    `radial-gradient(circle at 25% 30%, hsla(${(h + 20) % 360},70%,60%,0.4), transparent 40%),
     radial-gradient(circle at 70% 90%, hsla(25,60%,40%,0.35), transparent 45%),
     linear-gradient(160deg, hsl(20,30%,20%) 0%, hsl(${h},20%,9%) 100%)`,
  cool: (h) =>
    `radial-gradient(circle at 40% 15%, hsla(${h},50%,65%,0.4), transparent 40%),
     radial-gradient(circle at 90% 70%, hsla(210,50%,40%,0.3), transparent 50%),
     linear-gradient(170deg, hsl(210,25%,18%) 0%, hsl(${h},20%,8%) 100%)`,
  dusk: (h) =>
    `radial-gradient(circle at 20% 80%, hsla(${h},60%,45%,0.4), transparent 45%),
     radial-gradient(circle at 75% 20%, hsla(${(h + 60) % 360},45%,50%,0.3), transparent 40%),
     linear-gradient(150deg, hsl(280,20%,16%) 0%, hsl(${h},18%,8%) 100%)`,
  mint: (h) =>
    `radial-gradient(circle at 35% 25%, hsla(160,40%,55%,0.35), transparent 40%),
     radial-gradient(circle at 80% 75%, hsla(${h},45%,50%,0.3), transparent 50%),
     linear-gradient(165deg, hsl(160,18%,18%) 0%, hsl(${h},16%,8%) 100%)`,
};

const SKIN = [
  "#f3d0b5",
  "#e8b896",
  "#d49a72",
  "#c68662",
  "#a86b48",
  "#8d5524",
  "#f6e0c8",
  "#c9956b",
  "#b07a52",
  "#9a643f",
  "#7a4a2b",
  "#e2b48a",
];

const HAIR = [
  "#1a1410",
  "#2c1b12",
  "#3d2314",
  "#5a3820",
  "#6b4423",
  "#8b5a2b",
  "#1f1a2e",
  "#2a2438",
  "#4a3728",
  "#0f0d0c",
  "#3a2f2a",
  "#5c4033",
];

const TOPS = [
  "#ff4d6d",
  "#3d5a80",
  "#2a9d8f",
  "#e9c46a",
  "#7b2cbf",
  "#457b9d",
  "#e76f51",
  "#264653",
  "#9b2226",
  "#48cae4",
  "#adb5bd",
  "#f4a261",
];

/**
 * Synthetic illustrated portrait — original CSS/SVG art, not scraped photos.
 */
export function ProfilePortrait({
  profile,
  className,
  compact,
}: {
  profile: DemoProfile;
  className?: string;
  compact?: boolean;
}) {
  const skin = SKIN[profile.avatarVariant % SKIN.length]!;
  const hair = HAIR[(profile.avatarVariant + 3) % HAIR.length]!;
  const top = TOPS[(profile.avatarVariant + profile.avatarHue) % TOPS.length]!;
  const accent = `hsl(${profile.avatarHue}, 65%, 58%)`;
  const uid = profile.id.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl",
        compact ? "aspect-square" : "aspect-[4/5]",
        className
      )}
      style={{ background: STYLE_BG[profile.avatarStyle](profile.avatarHue) }}
      aria-hidden
    >
      {/* Soft photographic grain / light */}
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 35%, ${accent}33, transparent 70%)`,
        }}
      />

      <svg
        viewBox="0 0 200 250"
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`face-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={skin} />
            <stop offset="100%" stopColor={skin} stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hair} stopOpacity="0.95" />
            <stop offset="100%" stopColor={hair} />
          </linearGradient>
          <radialGradient id={`cheek-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff8a9a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff8a9a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shoulders / top */}
        <path
          d="M28 250 C40 190 70 168 100 168 C130 168 160 190 172 250 Z"
          fill={top}
          opacity="0.95"
        />
        <path
          d="M45 250 C55 205 75 185 100 185 C125 185 145 205 155 250 Z"
          fill={skin}
          opacity="0.35"
        />

        {/* Neck */}
        <rect x="88" y="148" width="24" height="32" rx="10" fill={`url(#face-${uid})`} />

        {/* Hair back */}
        {renderHairBack(profile.avatarVariant, `url(#hair-${uid})`)}

        {/* Head */}
        <ellipse cx="100" cy="112" rx="42" ry="50" fill={`url(#face-${uid})`} />

        {/* Cheeks */}
        <ellipse cx="72" cy="122" rx="10" ry="7" fill={`url(#cheek-${uid})`} />
        <ellipse cx="128" cy="122" rx="10" ry="7" fill={`url(#cheek-${uid})`} />

        {/* Eyes */}
        <ellipse cx="82" cy="110" rx="5.5" ry="6" fill="#1a1a1e" />
        <ellipse cx="118" cy="110" rx="5.5" ry="6" fill="#1a1a1e" />
        <circle cx="83.5" cy="108.5" r="1.6" fill="#fff" opacity="0.7" />
        <circle cx="119.5" cy="108.5" r="1.6" fill="#fff" opacity="0.7" />

        {/* Brows */}
        <path
          d="M72 98 Q82 94 92 98"
          stroke={hair}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M108 98 Q118 94 128 98"
          stroke={hair}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Nose / mouth */}
        <path
          d="M100 112 L97 124 Q100 127 103 124 Z"
          fill={skin}
          stroke="#000"
          strokeOpacity="0.08"
          strokeWidth="1"
        />
        <path
          d="M90 136 Q100 142 110 136"
          stroke="#c45c6a"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Hair front */}
        {renderHairFront(profile.avatarVariant, `url(#hair-${uid})`)}

        {/* Soft vignette */}
        <rect
          x="0"
          y="0"
          width="200"
          height="250"
          fill="url(#vignette)"
          opacity="0"
        />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
    </div>
  );
}

function renderHairBack(variant: number, fill: string) {
  switch (variant % 4) {
    case 0:
      return (
        <ellipse cx="100" cy="95" rx="52" ry="58" fill={fill} opacity="0.95" />
      );
    case 1:
      return (
        <path
          d="M48 120 C45 70 70 45 100 42 C130 45 155 70 152 120 L145 170 C130 155 115 150 100 150 C85 150 70 155 55 170 Z"
          fill={fill}
        />
      );
    case 2:
      return (
        <path
          d="M55 70 C70 40 130 40 145 70 L150 140 C140 130 120 125 100 125 C80 125 60 130 50 140 Z"
          fill={fill}
        />
      );
    default:
      return (
        <path
          d="M50 100 C48 55 75 38 100 36 C125 38 152 55 150 100 C155 145 140 175 125 185 C115 160 85 160 75 185 C60 175 45 145 50 100 Z"
          fill={fill}
        />
      );
  }
}

function renderHairFront(variant: number, fill: string) {
  switch (variant % 4) {
    case 0:
      return (
        <path
          d="M58 95 C65 60 85 48 100 48 C115 48 135 60 142 95 C130 78 115 72 100 72 C85 72 70 78 58 95 Z"
          fill={fill}
        />
      );
    case 1:
      return (
        <>
          <path d="M60 88 C75 55 100 50 105 78 C90 70 75 75 60 88 Z" fill={fill} />
          <path d="M140 88 C125 55 100 50 95 78 C110 70 125 75 140 88 Z" fill={fill} />
        </>
      );
    case 2:
      return (
        <path
          d="M62 100 C68 68 90 52 112 55 C100 70 95 90 98 110 C85 95 72 95 62 100 Z"
          fill={fill}
        />
      );
    default:
      return (
        <path
          d="M55 92 C70 58 130 58 145 92 C135 75 120 68 100 68 C80 68 65 75 55 92 Z"
          fill={fill}
        />
      );
  }
}
