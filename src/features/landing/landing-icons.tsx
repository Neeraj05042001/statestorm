type IconName =
  | "arrow"
  | "atlas"
  | "blank"
  | "broken"
  | "check"
  | "contract"
  | "cube"
  | "github"
  | "lock"
  | "overflow"
  | "plan"
  | "play"
  | "pulse"
  | "runtime"
  | "shield"
  | "source"
  | "spark"
  | "storm";

type LandingIconProps = {
  name: IconName;
  className?: string;
};

export function LandingIcon({ name, className }: LandingIconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
    atlas: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
        <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
      </>
    ),
    blank: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M7 8h.01M10 8h.01M6.5 12h11" />
      </>
    ),
    broken: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="m5 17 4.5-5 2.7 3 2.3-2.5L19 17M15.5 8.5h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    contract: (
      <>
        <path d="M9 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V6a1.5 1.5 0 0 0-1.5-1.5H15" />
        <rect x="9" y="3" width="6" height="3" rx="1" />
        <path d="m8.5 12 2 2 5-5" />
      </>
    ),
    cube: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4.3 7.7 7.7 4.4 7.7-4.4M12 12.1V21" />
      </>
    ),
    github: (
      <path d="M12 2.7a9.5 9.5 0 0 0-3 18.5v-2.1c-2.4.5-2.9-1-2.9-1-.4-1.1-1-1.4-1-1.4-.8-.6.1-.6.1-.6.9.1 1.4 1 1.4 1 .8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-1.9-.2-3.9-1-3.9-4.2 0-.9.3-1.7 1-2.3-.1-.2-.4-1.1.1-2.3 0 0 .8-.3 2.6.9a9 9 0 0 1 4.8 0c1.8-1.2 2.6-.9 2.6-.9.5 1.2.2 2.1.1 2.3.6.7 1 1.4 1 2.3 0 3.3-2 4-3.9 4.2.3.3.6.8.6 1.6v2.5A9.5 9.5 0 0 0 12 2.7Z" />
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
      </>
    ),
    overflow: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path d="M7 15h10M14 12l3 3-3 3M7 9h7" />
      </>
    ),
    plan: (
      <>
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <path d="m7.5 9 1.5 1.5L12 7.5M14.5 9H17M7.5 15l1.5 1.5 3-3M14.5 15H17" />
      </>
    ),
    play: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m10 8 6 4-6 4V8Z" />
      </>
    ),
    pulse: <path d="M3 12h4l2-5 4 10 2-5h6" />,
    runtime: (
      <>
        <path d="M10.3 4.1 2.7 18a1.4 1.4 0 0 0 1.2 2.1h16.2a1.4 1.4 0 0 0 1.2-2.1L13.7 4.1a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    source: (
      <>
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" />
      </>
    ),
    spark: (
      <path d="M12 2.5c.6 5.2 2.8 8 8 9.5-5.2 1.5-7.4 4.3-8 9.5-.6-5.2-2.8-8-8-9.5 5.2-1.5 7.4-4.3 8-9.5Z" />
    ),
    storm: <path d="m13 2-7 11h5l-1 9 8-12h-5V2Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      {paths[name]}
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="brand-mark" x1="5" y1="4" x2="35" y2="37">
          <stop stopColor="#8B5CF6" />
          <stop offset="0.55" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#0D1426" stroke="#29345A" />
      <path d="m22.5 5.5-11 17h7l-1.5 12 12-19h-7l.5-10Z" fill="url(#brand-mark)" />
      <path d="m22.5 5.5-11 17h7l-1.5 12 12-19h-7l.5-10Z" stroke="#D8D5FF" strokeWidth="1" />
    </svg>
  );
}
