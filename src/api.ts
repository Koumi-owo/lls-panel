import { auth, WORKERS_API } from './firebase';

// 通用 API 呼叫函式，自動帶入 Firebase ID Token
export async function callAPI(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const user = auth.currentUser;
  if (!user) throw new Error('尚未登入');

  const token = await user.getIdToken();

  const res = await fetch(`${WORKERS_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }

  return data;
}

// 常用 API 函式
export const api = {
  // 取得目前使用者資料
  getProfile: () => callAPI('/api/auth/profile'),
  
  // 取得管理員列表
  getUsers: () => callAPI('/api/admin/users'),
  
  // 新增管理員
  addUser: (email: string, role: string) =>
    callAPI('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  
  // 綁定 Pterodactyl
  bindPterodactyl: (panelUrl: string, apiKey: string) =>
    callAPI('/api/minecraft/bind', {
      method: 'POST',
      body: JSON.stringify({ panel_url: panelUrl, api_key: apiKey }),
    }),

  // 控制伺服器電源
  serverPower: (serverId: string, signal: 'start' | 'stop' | 'restart' | 'kill') =>
    callAPI(`/api/minecraft/servers/${serverId}/power`, {
      method: 'POST',
      body: JSON.stringify({ signal }),
    }),
  
  // 禁言 Discord 成員
  timeoutMember: (memberId: string, durationMinutes: number, reason: string, guildId: string) =>
    callAPI(`/api/discord/members/${memberId}/timeout`, {
      method: 'POST',
      body: JSON.stringify({ duration_minutes: durationMinutes, reason, guild_id: guildId }),
    }),
  
  // 封鎖 Discord 成員
  banMember: (memberId: string, reason: string, guildId: string) =>
    callAPI(`/api/discord/members/${memberId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason, guild_id: guildId }),
    }),
  
  // 查詢審計日誌
  getAuditLogs: (params?: { category?: string; result?: string; limit?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return callAPI(`/api/audit/logs${query ? '?' + query : ''}`);
  },
};