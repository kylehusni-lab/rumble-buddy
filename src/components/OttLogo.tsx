// OTT Logo components - stacked bars design
// Gold vertical bar with white horizontal bars at decreasing opacity

export function OttLogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      width={size} 
      height={size}
      className={className}
    >
      <rect x="2" y="4" width="6" height="24" rx="1.5" fill="hsl(var(--ott-accent))" />
      <rect x="8" y="8" width="22" height="3" rx="1.5" fill="hsl(var(--foreground))" />
      <rect x="8" y="14.5" width="22" height="3" rx="1.5" fill="hsl(var(--foreground))" fillOpacity="0.5" />
      <rect x="8" y="21" width="22" height="3" rx="1.5" fill="hsl(var(--foreground))" fillOpacity="0.25" />
    </svg>
  );
}

export function OttLogoHero({ size = 300, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      viewBox="0 0 300 300" 
      fill="none" 
      width={size} 
      height={size}
      className={className}
    >
      <rect x="20" y="40" width="44" height="220" rx="10" fill="hsl(var(--ott-accent))" />
      <rect x="64" y="68" width="216" height="22" rx="11" fill="hsl(var(--foreground))" />
      <rect x="64" y="129" width="216" height="22" rx="11" fill="hsl(var(--foreground))" fillOpacity="0.5" />
      <rect x="64" y="190" width="216" height="22" rx="11" fill="hsl(var(--foreground))" fillOpacity="0.25" />
      {/* Lightning bolt accent */}
      <path 
        d="M200 52 L260 16 L248 52 L280 38 L220 98" 
        stroke="hsl(var(--ott-accent))" 
        strokeWidth="14" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
    </svg>
  );
}

export function OttWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <span className="text-foreground">Over The </span>
      <span className="text-ott-accent">Top</span>
    </span>
  );
}
