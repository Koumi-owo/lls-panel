import { useState, useEffect, useRef, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

// ─── 登入頁面 ─────────────────────────────────────────────────

function LoginPage({
  onLogin,
}: {
  onLogin: (email: string, pw: string) => Promise<void>;
}) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('請填入電子郵件和密碼'); return; }
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch {
      setError('帳號或密碼不正確，或帳號尚未被授予存取權限。');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0D0F12',
    border: '1px solid #2D3138',
    borderRadius: 6,
    padding: '7px 10px',
    color: '#E2E8F0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0D0F12',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#E2E8F0',
    }}>
      <div style={{ width: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
          <div style={{
            width: 36, height: 36, background: '#00B4D8', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, color: '#000',
          }}>LLS</div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>LLS 懶懶生存</div>
            <div style={{ fontSize: 11, color: '#525A64' }}>管理面板</div>
          </div>
        </div>

        <div style={{ background: '#141619', border: '1px solid #2D3138', borderRadius: 10, padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>管理員登入</div>
          <div style={{ fontSize: 12, color: '#525A64', marginBottom: 18 }}>請使用授權帳號登入</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 13 }}>
              <label style={{ fontSize: 12, color: '#8B95A2', display: 'block', marginBottom: 4, fontWeight: 500 }}>電子郵件</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@lls.dev" autoFocus style={inputStyle} />
            </div>
            <div style={{ marginBottom: 13 }}>
              <label style={{ fontSize: 12, color: '#8B95A2', display: 'block', marginBottom: 4, fontWeight: 500 }}>密碼</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={inputStyle} />
            </div>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,.08)', borderLeft: '3px solid #EF4444',
                color: '#EF4444', padding: '9px 13px', borderRadius: 6,
                fontSize: 13, marginBottom: 10,
              }}>{error}</div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', background: '#00B4D8', border: 'none',
              borderRadius: 6, padding: '9px', color: '#000',
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.8 : 1,
            }}>
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#525A64' }}>
          v0.2.0 · 僅授權人員可登入
        </div>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────

function Spinner({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0D0F12', color: '#8B95A2', fontFamily: 'system-ui',
    }}>
      <style>{`@keyframes _sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, border: '3px solid #2D3138',
          borderTop: '3px solid #00B4D8', borderRadius: '50%',
          animation: '_sp .8s linear infinite', margin: '0 auto 12px',
        }} />
        <div style={{ fontSize: 13 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── 管理面板 iframe ──────────────────────────────────────────

function PanelIframe({ user }: { user: User }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // 用 number 型別避免 TypeScript 的 setInterval 型別問題
  const readyRef  = useRef<boolean>(false);
  const retryRef  = useRef<number>(0);

  const userData = {
    email:       user.email       ?? '',
    displayName: user.displayName ?? user.email?.split('@')[0] ?? '管理員',
    role:        'owner',
    uid:         user.uid,
  };

  const sendUser = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'INIT_USER', user: userData },
      '*',
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data?.type) return;

      // iframe 回報已就緒
      if (e.data.type === 'IFRAME_READY' && !readyRef.current) {
        readyRef.current = true;
        setReady(true);
        window.clearInterval(retryRef.current);
        sendUser();
        return;
      }

      // 使用者點登出
      if (e.data.type === 'LOGOUT') {
        signOut(auth).catch(() => {});
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sendUser]);

  // 每 300ms PING iframe，直到 iframe 回 IFRAME_READY
  useEffect(() => {
    retryRef.current = window.setInterval(() => {
      if (readyRef.current) {
        window.clearInterval(retryRef.current);
        return;
      }
      iframeRef.current?.contentWindow?.postMessage({ type: 'PING' }, '*');
    }, 300);

    return () => window.clearInterval(retryRef.current);
  }, []);

  // user 物件更新時補送一次
  useEffect(() => {
    if (ready) sendUser();
  }, [ready, sendUser]);

  const panelSrc = `${import.meta.env.BASE_URL}panel_iframe.html`;

  return (
    <>
      <style>{`@keyframes _sp{to{transform:rotate(360deg)}}`}</style>
      {!ready && (
        <div style={{
          position: 'fixed', inset: 0, background: '#0D0F12',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8B95A2', fontFamily: 'system-ui', zIndex: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, border: '3px solid #2D3138',
              borderTop: '3px solid #00B4D8', borderRadius: '50%',
              animation: '_sp .8s linear infinite', margin: '0 auto 12px',
            }} />
            <div style={{ fontSize: 13 }}>載入管理面板中...</div>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={panelSrc}
        title="LLS 懶懶生存管理面板"
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          border: 'none', display: 'block',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
      />
    </>
  );
}

// ─── 根元件 ───────────────────────────────────────────────────

export default function App() {
  const [user, setUser]         = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
  }, []);

  if (checking) return <Spinner label="驗證登入狀態..." />;

  if (!user) {
    return (
      <LoginPage
        onLogin={async (email, pw) => {
          await signInWithEmailAndPassword(auth, email, pw);
        }}
      />
    );
  }

  return <PanelIframe user={user} />;
}
