import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 bg-[#121215] border-r border-zinc-800 relative overflow-hidden flex-col justify-center px-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-50 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"></div>
        
        <div className="relative z-10 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Activity size={28} />
            </div>
            <span className="text-3xl font-bold tracking-wide">
              Monitor<span className="text-emerald-500">Pro</span>
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl font-bold leading-tight mb-6"
          >
            Monitor.<br />Detect.<br />Respond.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-zinc-400 text-lg"
          >
            Real-time visibility into the health and performance of your web applications. Premium dashboard for professional software teams.
          </motion.p>
        </div>
        
        {/* Animated abstract visualization could go here */}
      </div>

      {/* Right Panel - Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-zinc-400 text-sm">Enter your credentials to access your dashboard</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="email" 
                    placeholder="admin@example.com"
                    defaultValue="admin@example.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-zinc-300">Password</label>
                  <a href="#" className="text-xs text-emerald-500 hover:text-emerald-400">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="password" 
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    defaultValue="password"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="remember" className="rounded border-zinc-800 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-background" />
                <label htmlFor="remember" className="text-sm text-zinc-400">Remember me for 30 days</label>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full mt-6 flex justify-center items-center gap-2 group"
                isLoading={isLoading}
              >
                {!isLoading && (
                  <>
                    Sign in to dashboard
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
