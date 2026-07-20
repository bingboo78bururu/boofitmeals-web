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

export function HomeIcon() {
  return (
    <Svg>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5v-6h4v6" />
    </Svg>
  );
}

export function CalendarIcon() {
  return (
    <Svg>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
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
