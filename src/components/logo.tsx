export function ActionPrintsLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 292"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Action Prints"
      role="img"
    >
      {/* Scattered ink droplets */}
      <circle cx="372" cy="174" r="5.5" fill="#1c1917" />
      <circle cx="386" cy="193" r="3.5" fill="#1c1917" />
      <circle cx="364" cy="80" r="3" fill="#1c1917" />
      <circle cx="46" cy="136" r="4.5" fill="#1c1917" />
      <circle cx="34" cy="116" r="2.5" fill="#1c1917" />
      <circle cx="88" cy="38" r="3.5" fill="#1c1917" />
      <circle cx="356" cy="60" r="2" fill="#1c1917" />
      <circle cx="40" cy="155" r="2" fill="#1c1917" />

      {/* Main paint splash blob */}
      <path
        d="M 215,17
           C 264,5 334,20 360,58
           C 386,92 388,142 370,180
           C 362,198 384,226 358,240
           C 330,254 288,248 256,244
           C 236,241 216,253 188,248
           C 154,241 116,230 92,203
           C 64,174 54,140 64,110
           C 72,88 50,56 78,38
           C 108,18 166,29 215,17 Z"
        fill="#1c1917"
      />

      {/* Warm amber ink-sheen (inner highlight) */}
      <path
        d="M 210,32
           C 248,22 300,34 322,62
           C 342,86 344,118 330,144
           C 322,160 336,180 318,190
           C 296,200 266,196 244,193
           C 228,191 212,198 196,195
           C 170,189 146,178 136,158
           C 122,136 126,110 136,92
           C 144,76 130,56 148,46
           C 168,34 182,42 210,32 Z"
        fill="rgba(217,119,6,0.07)"
      />

      {/* Subtle top highlight */}
      <ellipse cx="210" cy="96" rx="98" ry="44" fill="rgba(255,255,255,0.04)" />

      {/* Paint drip — left of center */}
      <path
        d="M 186,248
           C 184,264 182,276 181,283
           C 180.5,289 183,290.5 185,284
           C 187,274 188.5,248 186,248 Z"
        fill="#1c1917"
      />

      {/* Paint drip — right of center */}
      <path
        d="M 258,244
           C 258,260 259,272 260,279
           C 261,285 264,284 264,277
           C 264,266 261,244 258,244 Z"
        fill="#1c1917"
      />

      {/* Brand name */}
      <text
        x="212"
        y="140"
        fontFamily="'Space Grotesk', sans-serif"
        fontSize="44"
        fontWeight="700"
        textAnchor="middle"
        fill="white"
      >
        Action Prints
      </text>


    </svg>
  );
}
