import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Monitor, Activity, LogOut } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('stats');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, sessionsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/sessions')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-[#CCFF00] font-['JetBrains_Mono']">LOADING ADMIN PANEL...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <nav className="border-b border-zinc-800 bg-[#18181B]">
        <div className="max-w-[1920px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">
            RemoteDesk <span className="text-[#CCFF00]">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 font-['JetBrains_Mono'] text-sm">{user?.email}</span>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1920px] mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="font-['Space_Grotesk'] text-5xl font-bold mb-2">
            Admin <span className="text-[#CCFF00]">Control</span>
          </h1>
          <p className="text-zinc-400 text-lg">System overview and management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-400">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold font-['JetBrains_Mono']">
                  {stats?.total_users || 0}
                </span>
                <Users className="w-8 h-8 text-zinc-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-400">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold font-['JetBrains_Mono'] text-[#CCFF00]">
                  {stats?.active_subscriptions || 0}
                </span>
                <Activity className="w-8 h-8 text-[#CCFF00]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-400">Online Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold font-['JetBrains_Mono']">
                  {stats?.online_devices || 0}
                </span>
                <Monitor className="w-8 h-8 text-zinc-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-400">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold font-['JetBrains_Mono']">
                  {stats?.active_sessions || 0}
                </span>
                <Activity className="w-8 h-8 text-zinc-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setView('stats')}
            variant={view === 'stats' ? 'default' : 'outline'}
            className={view === 'stats' ? 'bg-[#CCFF00] text-black' : 'border-zinc-700 text-white'}
            data-testid="stats-tab-btn"
          >
            Overview
          </Button>
          <Button
            onClick={() => setView('users')}
            variant={view === 'users' ? 'default' : 'outline'}
            className={view === 'users' ? 'bg-[#CCFF00] text-black' : 'border-zinc-700 text-white'}
            data-testid="users-tab-btn"
          >
            Users
          </Button>
          <Button
            onClick={() => setView('sessions')}
            variant={view === 'sessions' ? 'default' : 'outline'}
            className={view === 'sessions' ? 'bg-[#CCFF00] text-black' : 'border-zinc-700 text-white'}
            data-testid="sessions-tab-btn"
          >
            Session Logs
          </Button>
        </div>

        {view === 'users' && (
          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white font-['Space_Grotesk']">All Users</CardTitle>
              <CardDescription>Registered user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left">
                      <th className="pb-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">EMAIL</th>
                      <th className="pb-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">NAME</th>
                      <th className="pb-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">ROLE</th>
                      <th className="pb-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">CREATED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                        <td className="py-3 font-['JetBrains_Mono'] text-sm">{u.email}</td>
                        <td className="py-3">{u.name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-sm text-xs font-['JetBrains_Mono'] ${
                            u.role === 'admin' ? 'bg-[#CCFF00]/20 text-[#CCFF00]' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">
                          {formatDate(u.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'sessions' && (
          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white font-['Space_Grotesk']">Session Logs</CardTitle>
              <CardDescription>Recent remote desktop sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left">
                      <th className="pb-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">SESSION ID</th>
                      <th className="pb-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">USER ID</th>
                      <th className="pb-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">DEVICE ID</th>
                      <th className="pb-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">STATUS</th>
                      <th className="pb-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">STARTED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                        <td className="py-3 font-['JetBrains_Mono'] text-sm text-[#CCFF00]">
                          {s.session_id}
                        </td>
                        <td className="py-3 font-['JetBrains_Mono'] text-xs text-zinc-400">
                          {s.user_id.substring(0, 8)}
                        </td>
                        <td className="py-3 font-['JetBrains_Mono'] text-xs text-zinc-400">
                          {s.device_id.substring(0, 8)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-sm text-xs font-['JetBrains_Mono'] ${
                            s.status === 'active' 
                              ? 'bg-[#CCFF00]/20 text-[#CCFF00]' 
                              : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {s.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400 font-['JetBrains_Mono'] text-xs">
                          {formatDate(s.started_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
