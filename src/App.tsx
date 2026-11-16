
import { useEffect, useState } from 'react';
import { supabase, configured } from './lib/supabase';

type Post = {
  id: string;
  content: string;
  created_at: string;
  likes?: { id: string }[];
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
};

const demo: Post[] = [
  {
    id: '1',
    content: 'Sometimes I act like everything is okay, but I just need someone to ask how I really am.',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    content: 'I miss the old version of myself. I hope I meet that person again.',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

export default function App() {
  const [posts, setPosts] = useState<Post[]>(demo);
  const [text, setText] = useState('');
  const [uid, setUid] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<string[]>([]);
  const [reportPost, setReportPost] = useState('');
  const [reportReason, setReportReason] = useState('Spam');

  async function load() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('confessions')
      .select('id,content,created_at,likes(id)')
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setPosts(data || []);
  }

  useEffect(() => {
    const client = supabase!;
    if (!client) return;

    let channel: ReturnType<typeof client.channel>;

    async function start() {
      const { data } = await client.auth.getSession();
      let user = data.session?.user;

      if (!user) {
        const result = await client.auth.signInAnonymously();
        user = result.data.user || undefined;
        if (result.error) setError(result.error.message);
      }

      if (user) setUid(user.id);
      await load();

      channel = client.channel('public-feed')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'confessions'
        }, load)
        .subscribe();
    }

    start();

    return () => {
      if (channel) client.removeChannel(channel);
    };
  }, []);

  async function publish() {
    if (!text.trim() || !supabase) return;
    if (!uid) {
      setError('Please refresh the page and try again.');
      return;
    }

    setBusy(true);
    setError('');

    const { error } = await supabase.from('confessions').insert({
      content: text.trim(),
      user_id: uid
    });

    if (error) setError(error.message);
    else {
      setText('');
      await load();
    }

    setBusy(false);
  }

  async function like(id: string) {
    if (!supabase || !uid) return;

    const { data } = await supabase.from('likes')
      .select('id')
      .eq('confession_id', id)
      .eq('user_id', uid)
      .maybeSingle();

    if (data) {
      await supabase.from('likes').delete().eq('id', data.id);
    } else {
      await supabase.from('likes').insert({
        confession_id: id,
        user_id: uid
      });
    }

    await load();
  }

  async function showComments(id: string) {
    if (!supabase) return;

    if (openComments.includes(id)) {
      setOpenComments(openComments.filter(item => item !== id));
      return;
    }

    setOpenComments([...openComments, id]);

    const { data, error } = await supabase.from('comments')
      .select('id,content,created_at')
      .eq('confession_id', id)
      .order('created_at', { ascending: true });

    if (error) setError(error.message);
    else setComments(previous => ({ ...previous, [id]: data || [] }));
  }

  async function addComment(id: string) {
    const content = commentText[id]?.trim();
    if (!supabase || !uid || !content) return;

    const { error } = await supabase.from('comments').insert({
      confession_id: id,
      user_id: uid,
      content
    });

    if (error) {
      setError(error.message);
      return;
    }

    setCommentText(previous => ({ ...previous, [id]: '' }));

    const { data } = await supabase.from('comments')
      .select('id,content,created_at')
      .eq('confession_id', id)
      .order('created_at', { ascending: true });

    setComments(previous => ({ ...previous, [id]: data || [] }));
  }

  async function submitReport(id: string) {
    if (!supabase || !uid) return;

    const { error } = await supabase.from('reports').insert({
      confession_id: id,
      reporter_id: uid,
      reason: reportReason
    });

    if (error) setError(error.message);
    else setError('Thank you. Your report has been submitted.');

    setReportPost('');
  }

  return (
    <main>
      <header>
        <div className="logo">C</div>
        <div>
          <b>confessly</b>
          <small>your safe space to let it out</small>
        </div>
        <span className="anon">● anonymous</span>
      </header>

      <section className="hero">
        <p className="eyebrow">NO NAMES. NO JUDGEMENT.</p>
        <h1>Let it out.<br /><em>Feel lighter.</em></h1>
        <p className="sub">
          A little corner of the internet where you can be completely honest.
        </p>
      </section>

      <section className="composer">
        <label>What's on your mind?</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={2000}
          placeholder="Write what you've been holding inside..."
        />
        <div className="composefoot">
          <span>{text.length}/2000 · posted anonymously</span>
          <button onClick={publish} disabled={busy || !text.trim()}>
            {busy ? 'Posting…' : 'Share confession ↗'}
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="feedhead">
        <div>
          <p className="eyebrow">THE COMMUNITY</p>
          <h2>Confessions <span>♥</span></h2>
        </div>
        <span className="live">● LIVE FEED</span>
      </section>

      <section className="feed">
        {posts.map(p => (
          <article className="post" key={p.id}>
            <div className="posttop">
              <span className="avatar">✦</span>
              <div>
                <b>Anonymous</b>
                <small>{new Date(p.created_at).toLocaleString()}</small>
              </div>
            </div>

            <p>{p.content}</p>

            <div className="postactions">
              <button onClick={() => like(p.id)}>
                ♡ {p.likes?.length || 0} <span>support</span>
              </button>
              <button onClick={() => showComments(p.id)}>
                💬 Comments
              </button>
              <button onClick={() => setReportPost(reportPost === p.id ? '' : p.id)}>
                ⚑ Report
              </button>
            </div>

            {reportPost === p.id && (
              <div style={{ padding: 12, marginTop: 10, background: '#21172f', borderRadius: 10 }}>
                <label>Why are you reporting this?</label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  style={{ display: 'block', width: '100%', padding: 10, margin: '10px 0' }}
                >
                  <option>Spam</option>
                  <option>Harassment or bullying</option>
                  <option>Hate speech</option>
                  <option>Inappropriate content</option>
                  <option>Other</option>
                </select>
                <button onClick={() => submitReport(p.id)}>Submit report</button>
              </div>
            )}

            {openComments.includes(p.id) && (
              <div style={{ marginTop: 14, padding: 12, background: '#21172f', borderRadius: 10 }}>
                <b>Comments</b>

                {(comments[p.id] || []).map(c => (
                  <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid #443451' }}>
                    <small>Anonymous</small>
                    <p>{c.content}</p>
                  </div>
                ))}

                <textarea
                  value={commentText[p.id] || ''}
                  onChange={e => setCommentText(previous => ({
                    ...previous,
                    [p.id]: e.target.value
                  }))}
                  maxLength={1000}
                  placeholder="Write a supportive comment..."
                  style={{ width: '100%', marginTop: 12 }}
                />

                <button onClick={() => addComment(p.id)}>
                  Post comment
                </button>
              </div>
            )}

            <div style={{ marginTop: 12, color: '#aaa' }}>
              ☁ You are not alone
            </div>
          </article>
        ))}
      </section>

      <footer>
        Made for the thoughts you can't say out loud. <span>✦</span>
      </footer>

      {!configured && (
        <div className="notice">
          Preview mode · Add your Supabase settings to enable shared posting.
        </div>
      )}
    </main>
  );
                                          }
                
