export function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconInbox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 12h-4l-3 9H9l-3-9H2" />
      <path d="M5.45 5H19l-2.5 6" />
    </svg>
  );
}

export function IconBellSm({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 8a6 6 0 1112 0c0 5 2 5 2 5H4s2 0 2-5" />
      <path d="M9 20h6" />
    </svg>
  );
}

export function IconUserSm({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0114 0" />
    </svg>
  );
}

export function IconMessageSm({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H9l-5 3v-3H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
      <path d="M8 10h8M8 13h5" strokeLinecap="round" />
    </svg>
  );
}

export function IconNewsSm({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 5h12a2 2 0 012 2v12H6a2 2 0 01-2-2V5z" />
      <path d="M18 9h2v8a2 2 0 01-2 2" />
      <path d="M7 9h7M7 13h7M7 17h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconHomeSm({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h5v-5h4v5h5v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
