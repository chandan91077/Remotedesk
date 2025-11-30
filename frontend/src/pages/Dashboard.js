import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Plus, CreditCard, Calendar, LogOut } from 'lucide-react';
import api from '@/lib/axios';
import { calculateDaysRemaining, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devicesRes, userRes] = await Promise.all([
        api.get('/device/list'),
        api.get('/auth/me')
      ]);
      setDevices(devicesRes.data);
      setSubscription(userRes.data.subscription);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
        <div className="text-[#CCFF00] font-['JetBrains_Mono']">LOADING...</div>
      </div>
    );
  }

  const daysRemaining = subscription ? calculateDaysRemaining(subscription.end_date) : 0;

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <nav className="border-b border-zinc-800 bg-[#18181B]">
        <div className="max-w-[1920px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">
            RemoteDesk <span className="text-[#CCFF00]">Pro</span>
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
            Control <span className="text-[#CCFF00]">Room</span>
          </h1>
          <p className="text-zinc-400 text-lg">Manage your devices and sessions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white font-['Space_Grotesk']">Subscription</CardTitle>
              <CardDescription className="text-zinc-400">Current plan status</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription && subscription.status === 'active' ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-[#CCFF00] font-['JetBrains_Mono']">
                      {daysRemaining}
                    </span>
                    <span className="text-zinc-400">days left</span>
                  </div>
                  <p className="text-sm text-zinc-500">Expires: {formatDate(subscription.end_date)}</p>
                </>
              ) : (
                <>
                  <div className="text-zinc-400 mb-4">No active subscription</div>
                  <Button
                    onClick={() => navigate('/subscribe')}
                    className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-sm"
                    data-testid="subscribe-btn"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white font-['Space_Grotesk']">Devices</CardTitle>
              <CardDescription className="text-zinc-400">Registered endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-white font-['JetBrains_Mono']">
                  {devices.length}
                </span>
                <span className="text-zinc-400">/ {subscription ? '10' : '1'}</span>
              </div>
              <p className="text-sm text-zinc-500">Device slots used</p>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white font-['Space_Grotesk']">Status</CardTitle>
              <CardDescription className="text-zinc-400">System health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#CCFF00] rounded-full shadow-[0_0_8px_#CCFF00]" />
                <span className="text-white font-['JetBrains_Mono']">OPERATIONAL</span>
              </div>
              <p className="text-sm text-zinc-500 mt-2">All systems online</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 flex justify-between items-center">
          <h2 className="font-['Space_Grotesk'] text-3xl font-bold">Your Devices</h2>
          <Button
            onClick={() => navigate('/devices/add')}
            className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-sm uppercase tracking-widest"
            data-testid="add-device-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.length === 0 ? (
            <div className="col-span-full bg-[#18181B] border border-zinc-800 rounded-sm p-12 text-center">
              <Monitor className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">No devices registered yet</p>
              <Button
                onClick={() => navigate('/devices/add')}
                variant="outline"
                className="border-zinc-700 hover:border-[#CCFF00] text-white"
                data-testid="add-first-device-btn"
              >
                Add Your First Device
              </Button>
            </div>
          ) : (
            devices.map((device) => (
              <Card key={device.id} className="bg-[#18181B] border-zinc-800 hover:border-[#CCFF00] transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white font-['Space_Grotesk'] text-lg">
                        {device.hostname}
                      </CardTitle>
                      <CardDescription className="font-['JetBrains_Mono'] text-xs mt-1">
                        {device.id.substring(0, 8)}
                      </CardDescription>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      device.online ? 'bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]' : 'bg-zinc-600'
                    }`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">OS:</span>
                      <span className="text-zinc-300 font-['JetBrains_Mono']">
                        {device.os_version || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Last Seen:</span>
                      <span className="text-zinc-300 font-['JetBrains_Mono'] text-xs">
                        {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/session/${device.id}`)}
                      disabled={!device.online}
                      className="flex-1 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-sm disabled:opacity-50"
                      data-testid={`connect-device-${device.id}`}
                    >
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
