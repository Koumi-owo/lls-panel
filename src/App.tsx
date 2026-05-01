import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';

// 暫時使用簡單版本，日後替換為完整的管理面板元件
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ role?: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await api.getProfile();
          setProfile(p as { role?: string });
        } catch {}
      } else {
        setProfile(null);
      }
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('帳號或密碼不正確');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0D0F12', color:'#E2E8F0', fontFamily:'system-ui' }}>
        <div style={{ width:360 }}>
          <h1 style={{ color:'#00B4D8', fontSize:28, marginBottom:8 }}>LLS 懶懶生存</h1>
          <h2 style={{ fontSize:18, marginBottom:24, color:'#8B95A2' }}>管理面板</h2>
          <form onSubmit={handleLogin} style={{ background:'#141619', border:'1px solid #2D3138', borderRadius:10, padding:24 }}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, color:'#8B95A2', marginBottom:4 }}>電子郵件</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width:'100%', background:'#0D0F12', border:'1px solid #2D3138', borderRadius:6, padding:'7px 10px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box' }}
                placeholder="admin@lls.dev" />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, color:'#8B95A2', marginBottom:4 }}>密碼</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{ width:'100%', background:'#0D0F12', border:'1px solid #2D3138', borderRadius:6, padding:'7px 10px', color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box' }}
                placeholder="••••••••" />
            </div>
            {error && <div style={{ color:'#EF4444', fontSize:13, marginBottom:10 }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ width:'100%', background:'#00B4D8', color:'#000', border:'none', borderRadius:6, padding:'9px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:'#0D0F12', color:'#E2E8F0', height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'system-ui' }}>
      <h2 style={{ color:'#00B4D8' }}>LLS 懶懶生存管理面板</h2>
      <p>已登入：{user.email}</p>
      <p>身分組：{profile?.role || '載入中...'}</p>
      <p style={{ color:'#8B95A2', fontSize:13 }}>完整介面開發中，請使用 prototype HTML 預覽。</p>
      <button onClick={() => signOut(auth)}
        style={{ marginTop:16, background:'transparent', border:'1px solid #EF4444', color:'#EF4444', borderRadius:6, padding:'6px 16px', cursor:'pointer' }}>
        登出
      </button>
    </div>
  );
}

export default App;