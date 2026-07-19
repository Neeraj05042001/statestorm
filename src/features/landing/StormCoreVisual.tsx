import { LandingIcon } from "./landing-icons";
import styles from "./landing.module.css";

const coreNodes = [
  { label: "Runtime", icon: "runtime", className: styles.coreNodeRuntime },
  { label: "Blank", icon: "blank", className: styles.coreNodeBlank },
  { label: "Overflow", icon: "overflow", className: styles.coreNodeOverflow },
  { label: "Broken image", icon: "broken", className: styles.coreNodeBroken },
] as const;

export function StormCoreVisual() {
  return (
    <figure
      className={styles.stormCore}
      aria-label="Storm Core linking runtime, blank, overflow, and broken image evidence"
    >
      <svg aria-hidden="true" className={styles.coreArtwork} viewBox="0 0 440 470" fill="none">
        <defs>
          <linearGradient id="core-stroke" x1="86" y1="74" x2="360" y2="380">
            <stop stopColor="#A855F7" />
            <stop offset="0.48" stopColor="#6366F1" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient id="bolt-fill" x1="187" y1="140" x2="259" y2="304">
            <stop stopColor="#F8FAFC" />
            <stop offset="0.38" stopColor="#E9D5FF" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
          <radialGradient id="core-glow">
            <stop stopColor="#6D28D9" stopOpacity=".55" />
            <stop offset="1" stopColor="#050816" stopOpacity="0" />
          </radialGradient>
          <filter id="bolt-glow" x="-80%" y="-60%" width="260%" height="240%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="220" cy="228" r="177" fill="url(#core-glow)" />
        <path d="m48 349 171-99 174 99-174 99L48 349Z" stroke="#1E3A8A" opacity=".5" />
        <path d="m68 367 151-87 153 87-153 88-151-88Z" stroke="#312E81" opacity=".52" />
        <path d="m92 389 127-73 128 73-128 74-127-74Z" stroke="#3B82F6" opacity=".25" />
        <path d="M219 250v198M168 280 168 419M270 280v139M118 311v78M320 311v78" stroke="#2563EB" opacity=".18" />
        <path d="M48 349h345M92 389h255M68 367h304" stroke="#8B5CF6" opacity=".15" />

        <path d="m220 58 106 60v174l-106 62-106-62V118l106-60Z" fill="#0A1030" fillOpacity=".68" stroke="url(#core-stroke)" strokeWidth="2.2" />
        <path d="m114 118 106 62 106-62M220 180v174" stroke="url(#core-stroke)" strokeWidth="1.3" opacity=".85" />
        <path d="m139 132 81-47 81 47v135l-81 47-81-47V132Z" stroke="#4F46E5" strokeWidth="1" opacity=".62" />
        <path d="m139 132 81 48 81-48M220 180v134" stroke="#2563EB" opacity=".55" />
        <path d="m163 147 57-33 57 33v104l-57 34-57-34V147Z" fill="#4C1D95" fillOpacity=".18" stroke="#8B5CF6" opacity=".72" />

        <path d="m238 125-64 121h45l-9 87 61-125h-43l10-83Z" fill="url(#bolt-fill)" stroke="#fff" strokeWidth="1.6" filter="url(#bolt-glow)" />

        <path d="M77 207c37 0 42 20 75 20M289 203c32 0 35-26 72-26M294 258c35 0 39 25 68 25M154 282c-35 0-41 22-74 22" stroke="#7C3AED" strokeDasharray="3 7" opacity=".7" />
        <circle cx="77" cy="207" r="2" fill="#FB7185" />
        <circle cx="361" cy="177" r="2" fill="#34D399" />
        <circle cx="362" cy="283" r="2" fill="#F59E0B" />
        <circle cx="80" cy="304" r="2" fill="#A78BFA" />
      </svg>

      {coreNodes.map((node) => (
        <div key={node.label} className={`${styles.coreNode} ${node.className}`}>
          <LandingIcon name={node.icon} />
          <span>{node.label}</span>
        </div>
      ))}
      <figcaption>Storm Core · evidence routes</figcaption>
    </figure>
  );
}
