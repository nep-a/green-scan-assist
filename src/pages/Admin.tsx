import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, Database, Activity, Key } from 'lucide-react';

export default function Admin() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalScans: 0,
    totalPredictions: 0,
    healthyScans: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if admin is already authenticated in session
    const adminAuth = sessionStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadStats();
    }
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '2543') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      loadStats();
      toast({
        title: 'Welcome Admin',
        description: 'Successfully authenticated to admin panel',
      });
    } else {
      toast({
        title: 'Access Denied',
        description: 'Invalid PIN. Please try again.',
        variant: 'destructive',
      });
    }
    setPin('');
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get total users from profiles
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total scans
      const { count: totalScans } = await supabase
        .from('plant_images')
        .select('*', { count: 'exact', head: true });

      // Get total predictions
      const { count: totalPredictions } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true });

      // Get healthy scans
      const { count: healthyScans } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true })
        .eq('disease_name', 'Healthy Plant');

      setStats({
        totalUsers: totalUsers || 0,
        totalScans: totalScans || 0,
        totalPredictions: totalPredictions || 0,
        healthyScans: healthyScans || 0,
      });
    } catch (error: any) {
      toast({
        title: 'Error loading statistics',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-4 py-16">
          <Card className="shadow-card">
            <CardHeader className="text-center">
              <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Admin Access</CardTitle>
              <CardDescription>
                Enter the secure PIN to access the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="pin">Security PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    maxLength={4}
                    className="text-center text-xl tracking-widest"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Key className="mr-2 h-4 w-4" />
                  Access Admin Panel
                </Button>
              </form>
              <Alert className="mt-4">
                <AlertDescription className="text-sm">
                  This is a secure area. Only authorized personnel should access this panel.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">CropCare System Administration</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScans}</div>
              <p className="text-xs text-muted-foreground">Plant images uploaded</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predictions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPredictions}</div>
              <p className="text-xs text-muted-foreground">AI analyses completed</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy Plants</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.healthyScans}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPredictions > 0 
                  ? `${Math.round((stats.healthyScans / stats.totalPredictions) * 100)}%` 
                  : '0%'} healthy rate
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Database Connection</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>AI Service</span>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Storage Service</span>
                <Badge variant="default">Available</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Authentication</span>
                <Badge variant="default">Secure</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Administrative tasks and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={loadStats}
                disabled={loading}
              >
                <Activity className="mr-2 h-4 w-4" />
                Refresh Statistics
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('https://supabase.com/dashboard/project/xkcpbvzxdeowhqjosuaw', '_blank')}
              >
                <Database className="mr-2 h-4 w-4" />
                Open Database Console
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('https://supabase.com/dashboard/project/xkcpbvzxdeowhqjosuaw/auth/users', '_blank')}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}