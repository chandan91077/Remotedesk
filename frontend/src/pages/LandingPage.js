import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Monitor, Shield, Zap, Users } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <nav className="border-b border-zinc-800 backdrop-blur-xl bg-[#09090B]/80 fixed w-full z-50">
        <div className="max-w-[1920px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">
            RemoteDesk <span className="text-[#CCFF00]">Pro</span>
          </div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-white hover:text-[#CCFF00]"
              data-testid="login-nav-btn"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-sm uppercase tracking-widest font-semibold"
              data-testid="register-nav-btn"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-32 px-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#CCFF00]/10 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-[1920px] mx-auto">
          <div className="max-w-4xl pt-32 pb-24">
            <h1 className="font-['Space_Grotesk'] text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-8">
              Control Room.
              <br />
              <span className="text-[#CCFF00]">Command Center.</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
              Enterprise-grade remote desktop access. Secure. Fast. Professional.
              Built for IT teams who demand precision control.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/register')}
                className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-sm px-8 py-6 text-lg uppercase tracking-widest font-semibold"
                data-testid="hero-cta-btn"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                className="border-zinc-700 hover:border-[#CCFF00] text-white rounded-sm px-8 py-6 text-lg"
                data-testid="view-pricing-btn"
              >
                View Pricing
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mt-32">
            {[
              {
                icon: Zap,
                title: 'Lightning Fast',
                desc: 'Real-time WebRTC streaming with sub-100ms latency'
              },
              {
                icon: Shield,
                title: 'Military Grade',
                desc: 'End-to-end encryption with hardware fingerprinting'
              },
              {
                icon: Users,
                title: 'Scalable',
                desc: 'From 1 to unlimited devices based on your needs'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-[#18181B] border border-zinc-800 p-8 rounded-sm hover:border-[#CCFF00] transition-colors"
              >
                <feature.icon className="w-8 h-8 text-[#CCFF00] mb-4" />
                <h3 className="font-['Space_Grotesk'] text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="pricing" className="py-32 px-8 bg-[#18181B]/50">
        <div className="max-w-[1920px] mx-auto">
          <h2 className="font-['Space_Grotesk'] text-5xl font-bold mb-4 text-center">
            Flexible <span className="text-[#CCFF00]">Pricing</span>
          </h2>
          <p className="text-xl text-zinc-400 text-center mb-16">
            Pay only for the days you need. No hidden fees.
          </p>
          
          <div className="max-w-2xl mx-auto bg-[#09090B] border border-zinc-800 p-12 rounded-sm">
            <div className="text-center mb-8">
              <div className="font-['JetBrains_Mono'] text-6xl font-bold mb-2">
                $5<span className="text-2xl text-zinc-400">/day</span>
              </div>
              <p className="text-zinc-400">Custom duration, volume discounts available</p>
            </div>
            
            <div className="space-y-4 mb-8">
              {[
                'Up to 10 devices per subscription',
                'Full remote control access',
                'File transfer capabilities',
                '24/7 Support',
                'Hardware fingerprinting security'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#CCFF00] rounded-full shadow-[0_0_8px_#CCFF00]" />
                  <span className="text-zinc-300">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate('/register')}
              className="w-full bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-sm py-6 text-lg uppercase tracking-widest font-semibold"
              data-testid="pricing-cta-btn"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>

      <footer className="py-12 px-8 border-t border-zinc-800">
        <div className="max-w-[1920px] mx-auto text-center text-zinc-500">
          <p className="font-['JetBrains_Mono'] text-sm">© 2025 RemoteDesk Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
