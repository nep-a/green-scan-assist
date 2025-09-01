import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Mail, Lock, User } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean any previous auth state to avoid conflicts
      const { cleanupAuthState } = await import('@/lib/authCleanup');
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' } as any);
      } catch {}

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) throw error;

        // If session is returned (email confirmation disabled), go straight to dashboard
        if (data.session) {
          toast({ title: 'Welcome!', description: 'Account created successfully.' });
          window.location.href = '/dashboard';
          return;
        }

        // Fallback: try password sign-in immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInError) {
          window.location.href = '/dashboard';
          return;
        }

        // If still not signed in, likely email confirmation is required on the project
        toast({
          title: 'Check project email settings',
          description: 'Email confirmation seems enabled. Disable it in Supabase Auth > Providers to allow instant login.',
          variant: 'destructive',
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          window.location.href = '/dashboard';
          return;
        }
        navigate('/dashboard');
      }
    } catch (error: any) {
      const msg = error?.message?.toLowerCase?.() || '';
      const friendly = msg.includes('invalid login credentials')
        ? 'Invalid email or password. If you just signed up, disable email confirmation in Supabase settings to log in instantly.'
        : error.message;
      toast({ title: 'Authentication error', description: friendly, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-earth px-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <Leaf className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
          <CardDescription>CropGuard AI - Protect your crops with AI</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="name" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary hover:underline">
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}