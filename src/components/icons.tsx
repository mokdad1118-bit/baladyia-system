export function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 21h18v-2H3v2zM5 19V5l7-3 7 3v14H5zm2-2h4v-4H7v4zm0-6h4V7H7v4zm6 6h4v-4h-4v4zm0-6h4V7h-4v4z" />
    </svg>
  );
}

export function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2z" fill="currentColor" />
      <path
        d="M18 16v-5a6 6 0 00-5-5.9V3a1 1 0 00-2 0v2.1A6 6 0 006 11v5l-2 2h16l-2-2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
