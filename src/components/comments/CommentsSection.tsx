'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';

type EntityType = 'stock' | 'crypto' | 'post';

type Author = { display_name: string | null; avatar_url: string | null };

type Comment = {
  id: string;
  user_id: string;
  body: string;
  like_count: number;
  edited: boolean;
  created_at: string;
  parent_id: string | null;
  hidden: boolean;
  author: Author | null;
  likedByMe: boolean;
};

const SELECT =
  'id,user_id,body,like_count,edited,created_at,parent_id,hidden,author:profiles(display_name,avatar_url)';

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

/**
 * Shared discussion area for blog posts and asset pages. Reads are public;
 * posting / liking requires a signed-in user. Backed by the same Supabase
 * `comments` / `comment_likes` tables as the mobile app, so threads are shared.
 */
export default function CommentsSection({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('comments')
      .select(SELECT)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      setLoading(false);
      return;
    }

    let liked = new Set<string>();
    if (user && data.length) {
      const ids = data.map((d: { id: string }) => d.id);
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', ids);
      liked = new Set((likes ?? []).map((l: { comment_id: string }) => l.comment_id));
    }

    if (user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      setIsAdmin(!!prof?.is_admin);
    } else {
      setIsAdmin(false);
    }

    setComments(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data as any[]).map((d) => ({
        ...d,
        author: Array.isArray(d.author) ? d.author[0] ?? null : d.author,
        likedByMe: liked.has(d.id),
      })),
    );
    setLoading(false);
  }, [entityType, entityId, user]);

  useEffect(() => {
    // Fetch-on-mount / on dependency change. All setState calls happen after
    // awaits inside load(), not synchronously, so no cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function submit() {
    const text = body.trim();
    if (!text || sending || !user) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      body: text,
      parent_id: replyTo?.id ?? null,
    });
    setSending(false);
    if (!error) {
      setBody('');
      setReplyTo(null);
      load();
    }
  }

  async function toggleLike(c: Comment) {
    if (!user) return;
    const supabase = createClient();
    if (c.likedByMe) {
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', c.id)
        .eq('user_id', user.id);
    } else {
      await supabase.from('comment_likes').insert({ comment_id: c.id, user_id: user.id });
    }
    load();
  }

  async function report(c: Comment) {
    if (!user) return;
    if (!confirm('Report this comment for review?')) return;
    const supabase = createClient();
    await supabase
      .from('comment_reports')
      .upsert({ comment_id: c.id, reporter_id: user.id });
    load();
  }

  async function toggleHidden(c: Comment) {
    const supabase = createClient();
    await supabase.from('comments').update({ hidden: !c.hidden }).eq('id', c.id);
    load();
  }

  async function ban(c: Comment) {
    if (!confirm(`Ban ${c.author?.display_name || 'this user'} from posting?`)) return;
    const supabase = createClient();
    await supabase.from('banned_users').upsert({ user_id: c.user_id });
    alert('User banned.');
  }

  async function saveEdit(c: Comment) {
    const text = editBody.trim();
    if (!text) return;
    const supabase = createClient();
    await supabase.from('comments').update({ body: text }).eq('id', c.id);
    setEditingId(null);
    load();
  }

  async function remove(c: Comment) {
    if (!confirm('Delete this comment? This cannot be undone.')) return;
    const supabase = createClient();
    await supabase.from('comments').delete().eq('id', c.id);
    load();
  }

  const tops = comments
    .filter((c) => c.parent_id === null)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const repliesByParent = comments
    .filter((c) => c.parent_id !== null)
    .reduce<Record<string, Comment[]>>((acc, c) => {
      (acc[c.parent_id as string] ||= []).push(c);
      return acc;
    }, {});

  return (
    <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-100">
        <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Discussion
        {!loading && <span className="text-sm font-normal text-zinc-500">{comments.length}</span>}
      </h2>

      {/* Composer */}
      {user ? (
        <div className="mb-5">
          {replyTo && (
            <div className="mb-2 flex items-center gap-1 text-xs text-zinc-500">
              <span>Replying to {replyTo.author?.display_name || 'user'}</span>
              <button onClick={() => setReplyTo(null)} className="ml-1 hover:text-zinc-300" aria-label="Cancel reply">✕</button>
            </div>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder={replyTo ? 'Write a reply…' : 'Share your view…'}
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={submit}
              disabled={sending || !body.trim()}
              className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
            >
              {sending ? 'Posting…' : replyTo ? 'Reply' : 'Post'}
            </button>
          </div>
        </div>
      ) : (
        <Link
          href="/auth/login"
          className="mb-5 flex items-center justify-between rounded-lg bg-zinc-800/60 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          <span>Sign in to join the discussion</span>
          <span className="font-semibold text-emerald-400">Sign in</span>
        </Link>
      )}

      {/* List */}
      {loading ? (
        <p className="py-6 text-center text-sm text-zinc-500">Loading…</p>
      ) : tops.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">No comments yet. Be the first to share.</p>
      ) : (
        <div className="space-y-5">
          {tops.map((c) => (
            <div key={c.id}>
              <CommentItem
                c={c}
                isMine={c.user_id === user?.id}
                editing={editingId === c.id}
                editBody={editBody}
                setEditBody={setEditBody}
                onStartEdit={() => {
                  setEditingId(c.id);
                  setEditBody(c.body);
                }}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={() => saveEdit(c)}
                onLike={() => toggleLike(c)}
                onReply={() => setReplyTo(c)}
                onDelete={() => remove(c)}
                loggedIn={!!user}
                isAdmin={isAdmin}
                onReport={() => report(c)}
                onToggleHidden={() => toggleHidden(c)}
                onBan={() => ban(c)}
              />
              {(repliesByParent[c.id] ?? [])
                .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
                .map((r) => (
                  <div key={r.id} className="ml-10 mt-3">
                    <CommentItem
                      c={r}
                      isMine={r.user_id === user?.id}
                      editing={editingId === r.id}
                      editBody={editBody}
                      setEditBody={setEditBody}
                      onStartEdit={() => {
                        setEditingId(r.id);
                        setEditBody(r.body);
                      }}
                      onCancelEdit={() => setEditingId(null)}
                      onSaveEdit={() => saveEdit(r)}
                      onLike={() => toggleLike(r)}
                      onReply={() => setReplyTo(c)}
                      onDelete={() => remove(r)}
                      loggedIn={!!user}
                      isAdmin={isAdmin}
                      onReport={() => report(r)}
                      onToggleHidden={() => toggleHidden(r)}
                      onBan={() => ban(r)}
                    />
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentItem({
  c,
  isMine,
  editing,
  editBody,
  setEditBody,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onLike,
  onReply,
  onDelete,
  loggedIn,
  isAdmin,
  onReport,
  onToggleHidden,
  onBan,
}: {
  c: Comment;
  isMine: boolean;
  editing: boolean;
  editBody: string;
  setEditBody: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onLike: () => void;
  onReply: () => void;
  onDelete: () => void;
  loggedIn: boolean;
  isAdmin: boolean;
  onReport: () => void;
  onToggleHidden: () => void;
  onBan: () => void;
}) {
  const name = c.author?.display_name || 'User';

  return (
    <div className="flex gap-3">
      {c.author?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.author.avatar_url}
          alt={name}
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-400">
          {name[0].toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-zinc-100">{name}</span>
          <span className="text-xs text-zinc-500">· {ago(c.created_at)}</span>
          {c.edited && <span className="text-xs text-zinc-600">· edited</span>}
          {c.hidden && (
            <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
              Hidden
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-1">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
            <div className="mt-1 flex gap-2">
              <button onClick={onSaveEdit} className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600">Save</button>
              <button onClick={onCancelEdit} className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{c.body}</p>
        )}

        {!editing && (
          <div className="mt-1.5 flex items-center gap-4 text-xs text-zinc-500">
            <button onClick={onLike} className="flex items-center gap-1 hover:text-zinc-300">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={c.likedByMe ? '#ef4444' : 'none'} stroke={c.likedByMe ? '#ef4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {c.like_count > 0 && <span>{c.like_count}</span>}
            </button>
            <button onClick={onReply} className="font-medium hover:text-zinc-300">Reply</button>
            {isMine && (
              <>
                <button onClick={onStartEdit} className="hover:text-zinc-300">Edit</button>
                <button onClick={onDelete} className="text-red-400/80 hover:text-red-400">Delete</button>
              </>
            )}
            {loggedIn && !isMine && (
              <button onClick={onReport} className="hover:text-zinc-300">Report</button>
            )}
            {isAdmin && (
              <>
                <button onClick={onToggleHidden} className="text-orange-400/80 hover:text-orange-400">
                  {c.hidden ? 'Unhide' : 'Hide'}
                </button>
                {!isMine && (
                  <button onClick={onBan} className="text-red-400/80 hover:text-red-400">Ban</button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
