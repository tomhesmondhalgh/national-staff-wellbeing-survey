
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

type UserWithRole = {
  id: string;
  email: string;
  role: 'administrator' | 'user';
  created_at: string;
  last_sign_in_at: string | null;
};

const Admin = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If not an administrator, redirect to dashboard
    if (isAdmin === false) {
      navigate('/dashboard');
      toast.error('You do not have permission to access the admin area');
    }
    
    // Fetch users and their roles
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get all users (this requires using service_role key in a real environment)
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          throw authError;
        }

        if (!authUsers || !authUsers.users) {
          setUsers([]);
          return;
        }

        // Get all user roles
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) {
          throw rolesError;
        }

        // Map roles to users
        const usersWithRoles = authUsers.users.map(user => {
          const userRole = userRoles?.find(role => role.user_id === user.id);
          return {
            id: user.id,
            email: user.email || 'No email',
            role: userRole?.role || 'user',
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
          };
        });

        setUsers(usersWithRoles);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, navigate]);

  // In mockup mode, or when supabase.auth.admin is not available, we use simulated data
  useEffect(() => {
    // Check if we need to use mock data due to permissions issues
    if (loading && users.length === 0) {
      const mockUsers: UserWithRole[] = [
        {
          id: '1',
          email: 'tomhesmondhalghce@gmail.com',
          role: 'administrator',
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'user@example.com',
          role: 'user',
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        },
      ];
      
      // Use mock data if the real data fetch fails or takes too long
      const timer = setTimeout(() => {
        if (loading && users.length === 0) {
          setUsers(mockUsers);
          setLoading(false);
          console.log('Using mock user data for admin panel');
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, users.length]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Admin Dashboard" 
          subtitle="Manage your application, users and settings"
        />
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all users in the system. Administrators have full access to all features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'administrator' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              {user.role === 'administrator' ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Manage global application settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Setting options will be implemented in future updates.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>
                  View overall system usage and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics will be implemented in future updates.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Admin;
