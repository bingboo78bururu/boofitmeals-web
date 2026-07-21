function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

export function FeedIcon() {
  return (
    <Svg>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 9.5h8M8 13h8M8 16.5h4.5" />
    </Svg>
  );
}

export function RankingIcon() {
  return (
    <Svg>
      <path d="M4 20V11M10 20V4M16 20v-6" />
      <path d="M4 20h12" />
    </Svg>
  );
}

export function GrowthIcon() {
  return (
    <Svg>
      <path d="M4 16l5-5 4 4 7-8" />
      <path d="M15 7h5v5" />
    </Svg>
  );
}

export function HomeIcon() {
  return (
    <Svg>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5v-6h4v6" />
    </Svg>
  );
}

export function CarrotIcon() {
  return (
    <Svg>
      <path d="M12 8.5c2.8 0 4.7 2.7 3.6 6.7-1 3.7-3 6.3-3.6 6.3s-2.6-2.6-3.6-6.3C7.3 11.2 9.2 8.5 12 8.5Z" />
      <path d="M12 8.5V4M9.3 6.2 8 3.5M14.7 6.2 16 3.5" />
    </Svg>
  );
}

export function MyPageIcon() {
  return (
    <Svg>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20.5c0-4 3.5-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
    </Svg>
  );
}
