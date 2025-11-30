import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const AddDevice = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const deviceKey = "device_demo_key_abc123xyz";

  const handleCopy = () => {
    navigator.clipboard.writeText(deviceKey);
    setCopied(true);
    toast.success('Device key copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <nav className="border-b border-zinc-800 bg-[#18181B]">
        <div className="max-w-[1920px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">
            RemoteDesk <span className="text-[#CCFF00]">Pro</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-zinc-400 hover:text-white"
            data-testid="back-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="font-['Space_Grotesk'] text-5xl font-bold mb-4">
            Add New <span className="text-[#CCFF00]">Device</span>
          </h1>
          <p className="text-zinc-400 text-lg">Download client and register your device</p>
        </div>

        <div className="space-y-8">
          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white font-['Space_Grotesk'] flex items-center gap-2">
                <span className="bg-[#CCFF00] text-black w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                Download Windows Client
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Download and install the RemoteDesk client on your Windows machine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-sm uppercase tracking-widest"
                data-testid="download-client-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Client (Windows)
              </Button>
              <p className="text-sm text-zinc-500 mt-4">
                Version 1.0.0 | Windows 10/11 (x64) | 5.2 MB
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white font-['Space_Grotesk'] flex items-center gap-2">
                <span className="bg-[#CCFF00] text-black w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                Install and Run Client
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Follow the installation wizard to install the client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[#09090B] border border-zinc-800 p-4 rounded-sm font-['JetBrains_Mono'] text-sm space-y-2">
                <div className="text-zinc-400">1. Run RemoteDeskSetup.exe</div>
                <div className="text-zinc-400">2. Accept the waiver agreement</div>
                <div className="text-zinc-400">3. Complete installation</div>
                <div className="text-zinc-400">4. Launch RemoteDesk Client</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white font-['Space_Grotesk'] flex items-center gap-2">
                <span className="bg-[#CCFF00] text-black w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                Enter Your Device Key
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Copy this key and paste it in the client during first run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#09090B] border border-zinc-800 p-4 rounded-sm font-['JetBrains_Mono'] text-sm text-[#CCFF00]">
                  {deviceKey}
                </div>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="border-zinc-700 hover:border-[#CCFF00]"
                  data-testid="copy-key-btn"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-zinc-500 mt-4">
                This key is unique to your account and will be used to register the device.
                The device will be automatically identified using MAC address and CPU ID.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white font-['Space_Grotesk'] flex items-center gap-2">
                <span className="bg-[#CCFF00] text-black w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                Device Registration
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Client will automatically register your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[#09090B] border border-zinc-800 p-6 rounded-sm text-center">
                <div className="text-[#CCFF00] font-['JetBrains_Mono'] mb-2">AUTOMATIC REGISTRATION</div>
                <p className="text-zinc-400 text-sm">
                  Once you enter the key, the client will automatically register your device
                  using hardware fingerprinting (MAC address + CPU ID). Your device will appear
                  in the dashboard within seconds.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="border-zinc-700 hover:border-[#CCFF00] text-white rounded-sm"
              data-testid="back-to-dashboard-btn"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDevice;
