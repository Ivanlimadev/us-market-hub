'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Author } from '@/lib/authors';

/**
 * Author card — compact by default, expands on tap to reveal the full bio and
 * (when available) social links. The full bio text is always rendered in the
 * DOM (only visually clamped when collapsed), so it stays available for
 * E-E-A-T / SEO. Driven by the post's resolved {@link Author}.
 */
export default function AuthorByline({ author }: { author: Author }) {
  const [expanded, setExpanded] = useState(false);

  const socials = author.socials ?? {};
  const hasExtras =
    !!socials.instagram || !!socials.linkedin || !!socials.email || !!author.aboutHref;

  return (
    <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse author bio' : 'Expand author bio'}
        className="flex w-full items-start gap-3 text-left"
      >
        <img
          src={author.photo}
          alt={author.name}
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full border-2 border-emerald-500/30 object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">
            {author.name}{' '}
            <span className="font-normal text-emerald-400">· {author.role} · Stock Market ROI</span>
          </p>
          <p
            className={`text-xs leading-relaxed text-zinc-400 ${
              expanded ? '' : 'line-clamp-1'
            }`}
          >
            {author.bio}
          </p>
          {!expanded && (
            <span className="mt-1 inline-block text-xs font-medium text-emerald-400">
              Tap to read more
            </span>
          )}
        </div>
        <svg
          className={`mt-1 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && hasExtras && (
        <div className="mt-3 flex items-center gap-2 pl-14">
          {socials.instagram && (
            <a
              href={socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${author.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white transition-opacity hover:opacity-80"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          )}
          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`LinkedIn ${author.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A66C2] text-white transition-opacity hover:opacity-80"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          )}
          {socials.email && (
            <a
              href={`mailto:${socials.email}`}
              aria-label="Email"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
            </a>
          )}
          {author.aboutHref && (
            <Link href={author.aboutHref} className="ml-auto text-xs text-emerald-400 hover:underline">
              About the author →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
