"use client";

import { useState, useCallback } from 'react';
import { fetchLogin } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export default function Login() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await fetchLogin(email, password);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
        const userId = result.data.user._id;
        router.push(`/user/${userId}`);
      } else {
        toast({
          title: "Login Failed",
          description: "Please check your email and password",
          type: "error"
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred, please try again later",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, router, toast]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row min-h-screen"
    >
      {/* Left Section - Design */}
      <div className="relative w-full md:w-1/2 bg-gradient-to-b from-blue-600 to-emerald-700 p-4 md:p-8 flex items-center justify-center text-white min-h-[40vh] md:min-h-screen">
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4 md:space-y-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            Bridging Research and Innovation
          </h2>
          <p className="text-base md:text-lg text-blue-50 max-w-xl mx-auto px-4">
            Connecting academic research with design practice, inspiring innovation, and creating better user experiences.
          </p>
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-20" />
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full md:w-1/2 bg-primary p-4 md:p-8 flex items-center justify-center min-h-[60vh] md:min-h-screen">
        <div className="max-w-md w-full">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Welcome back</h1>
              <p className="text-text-secondary">Enter your account information</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-primary">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter your email"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-secondary text-text-primary placeholder:text-text-placeholder border-border-secondary focus:border-border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-text-primary">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-secondary text-text-primary placeholder:text-text-placeholder border-border-secondary focus:border-border-primary"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="border-border-secondary" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium text-text-primary leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  href="#"
                  className="text-sm text-text-link hover:text-text-linkHover"
                >
                  Forgot password?
                </Link>
              </div>

              <Button 
                className="w-full bg-secondary hover:bg-border-secondary text-text-primary" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-secondary" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-primary text-text-secondary">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                disabled={isLoading}
                className="border-border-secondary text-text-primary hover:bg-secondary"
              >
                Google
              </Button>
              <Button 
                variant="outline" 
                disabled={isLoading}
                className="border-border-secondary text-text-primary hover:bg-secondary"
              >
                GitHub
              </Button>
            </div>

            <div className="text-center text-sm text-text-secondary">
              Don't have an account?{" "}
              <Link href="/user/register" className="text-text-link hover:text-text-linkHover">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
