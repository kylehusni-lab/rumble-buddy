import { cn } from "@/lib/utils";

interface RingIconProps {
  size?: number;
  className?: string;
}

export function RingIcon({ size = 320, className }: RingIconProps) {
  return (
    <svg
      viewBox="0 0 320 320"
      width={size}
      height={size}
      className={cn("", className)}
      role="img"
      aria-label="Over The Top - Wrestling ring logo"
    >
      {/* Platform base - isometric gold */}
      <path
        d="M 80 200 L 160 150 L 240 200 L 160 250 Z"
        fill="#D4A017"
        opacity="0.9"
      />
      
      {/* Platform front edge - darker gold for depth */}
      <path
        d="M 80 200 L 160 250 L 160 265 L 80 215 Z"
        fill="#B8860B"
      />
      <path
        d="M 160 250 L 240 200 L 240 215 L 160 265 Z"
        fill="#C69214"
      />
      
      {/* Canvas/mat - dark surface */}
      <path
        d="M 95 190 L 160 145 L 225 190 L 160 235 Z"
        fill="#1a1a1a"
        stroke="#333"
        strokeWidth="1.5"
      />
      
      {/* Canvas texture lines */}
      <g opacity="0.3">
        <line x1="105" y1="185" x2="215" y2="185" stroke="#2a2a2a" strokeWidth="1" />
        <line x1="110" y1="178" x2="210" y2="178" stroke="#2a2a2a" strokeWidth="1" />
        <line x1="115" y1="171" x2="205" y2="171" stroke="#2a2a2a" strokeWidth="1" />
        <line x1="108" y1="192" x2="212" y2="192" stroke="#2a2a2a" strokeWidth="1" />
        <line x1="112" y1="199" x2="208" y2="199" stroke="#2a2a2a" strokeWidth="1" />
        <line x1="118" y1="206" x2="202" y2="206" stroke="#2a2a2a" strokeWidth="1" />
      </g>
      
      {/* Center logo area on mat */}
      <ellipse
        cx="160"
        cy="190"
        rx="28"
        ry="16"
        fill="#FDB81E"
        opacity="0.15"
      />
      <ellipse
        cx="160"
        cy="190"
        rx="28"
        ry="16"
        fill="none"
        stroke="#FDB81E"
        strokeWidth="1"
        opacity="0.3"
      />
      
      {/* Corner posts */}
      {/* Back left post */}
      <rect x="89" y="120" width="12" height="42" fill="#FDB81E" rx="2" />
      <rect x="91" y="120" width="3" height="42" fill="#FFD700" opacity="0.5" rx="1" />
      <rect x="89" y="158" width="12" height="4" fill="#C69214" rx="1" />
      
      {/* Back right post */}
      <rect x="219" y="120" width="12" height="42" fill="#FDB81E" rx="2" />
      <rect x="221" y="120" width="3" height="42" fill="#FFD700" opacity="0.5" rx="1" />
      <rect x="219" y="158" width="12" height="4" fill="#C69214" rx="1" />
      
      {/* Front left post */}
      <rect x="69" y="165" width="12" height="42" fill="#FDB81E" rx="2" />
      <rect x="71" y="165" width="3" height="42" fill="#FFD700" opacity="0.5" rx="1" />
      <rect x="69" y="203" width="12" height="4" fill="#C69214" rx="1" />
      
      {/* Front right post */}
      <rect x="239" y="165" width="12" height="42" fill="#FDB81E" rx="2" />
      <rect x="241" y="165" width="3" height="42" fill="#FFD700" opacity="0.5" rx="1" />
      <rect x="239" y="203" width="12" height="4" fill="#C69214" rx="1" />
      
      {/* Turnbuckle pads */}
      <ellipse cx="95" cy="128" rx="7" ry="10" fill="#FDB81E" />
      <ellipse cx="95" cy="126" rx="4" ry="6" fill="#FFD700" opacity="0.6" />
      
      <ellipse cx="225" cy="128" rx="7" ry="10" fill="#FDB81E" />
      <ellipse cx="225" cy="126" rx="4" ry="6" fill="#FFD700" opacity="0.6" />
      
      <ellipse cx="75" cy="173" rx="7" ry="10" fill="#FDB81E" />
      <ellipse cx="75" cy="171" rx="4" ry="6" fill="#FFD700" opacity="0.6" />
      
      <ellipse cx="245" cy="173" rx="7" ry="10" fill="#FDB81E" />
      <ellipse cx="245" cy="171" rx="4" ry="6" fill="#FFD700" opacity="0.6" />
      
      {/* Rope connection rings */}
      <circle cx="95" cy="135" r="4" fill="#FDB81E" stroke="#C69214" strokeWidth="1" />
      <circle cx="95" cy="135" r="1.5" fill="#333" />
      
      <circle cx="225" cy="135" r="4" fill="#FDB81E" stroke="#C69214" strokeWidth="1" />
      <circle cx="225" cy="135" r="1.5" fill="#333" />
      
      <circle cx="75" cy="180" r="4" fill="#FDB81E" stroke="#C69214" strokeWidth="1" />
      <circle cx="75" cy="180" r="1.5" fill="#333" />
      
      <circle cx="245" cy="180" r="4" fill="#FDB81E" stroke="#C69214" strokeWidth="1" />
      <circle cx="245" cy="180" r="1.5" fill="#333" />
      
      {/* Top ropes (white) */}
      {/* Back rope */}
      <line x1="95" y1="130" x2="225" y2="130" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {/* Left rope */}
      <line x1="91" y1="133" x2="73" y2="175" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {/* Right rope */}
      <line x1="229" y1="133" x2="247" y2="175" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {/* Front rope */}
      <line x1="75" y1="180" x2="245" y2="180" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      
      {/* Middle ropes (light gray) */}
      {/* Back rope */}
      <line x1="95" y1="142" x2="225" y2="142" stroke="#ccc" strokeWidth="4" strokeLinecap="round" />
      {/* Left rope */}
      <line x1="88" y1="146" x2="72" y2="186" stroke="#ccc" strokeWidth="4" strokeLinecap="round" />
      {/* Right rope */}
      <line x1="232" y1="146" x2="248" y2="186" stroke="#ccc" strokeWidth="4" strokeLinecap="round" />
      {/* Front rope */}
      <line x1="75" y1="192" x2="245" y2="192" stroke="#ccc" strokeWidth="4" strokeLinecap="round" />
      
      {/* Bottom ropes (gray) */}
      {/* Back rope */}
      <line x1="95" y1="154" x2="225" y2="154" stroke="#999" strokeWidth="4" strokeLinecap="round" />
      {/* Left rope */}
      <line x1="85" y1="159" x2="71" y2="197" stroke="#999" strokeWidth="4" strokeLinecap="round" />
      {/* Right rope */}
      <line x1="235" y1="159" x2="249" y2="197" stroke="#999" strokeWidth="4" strokeLinecap="round" />
      {/* Front rope */}
      <line x1="75" y1="203" x2="245" y2="203" stroke="#999" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
