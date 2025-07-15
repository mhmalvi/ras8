
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import MasterAdminLayout from "@/components/MasterAdminLayout";
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Search, Shield, Mail, Calendar } from "lucide-react";

const UserManagementPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        console.error('Error fetching profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(profile => 
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MasterAdminLayout 
      title="User Management" 
      description="System-wide user administration and role management"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Total Users</h3>
              {loading ? <Skeleton className="h-6 w-8 mx-auto mt-1" /> : <p className="text-2xl font-bold text-blue-800">{profiles.length}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Master Admins</h3>
              {loading ? <Skeleton className="h-6 w-8 mx-auto mt-1" /> : <p className="text-2xl font-bold text-purple-800">{profiles.filter(p => p.role === 'master_admin').length}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Admins</h3>
              {loading ? <Skeleton className="h-6 w-8 mx-auto mt-1" /> : <p className="text-2xl font-bold text-green-800">{profiles.filter(p => p.role === 'admin' || !p.role).length}</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Administration
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Search users..." 
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button><UserPlus className="h-4 w-4 mr-2" />Add User</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-32" /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProfiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{profile.email}</h4>
                        <Badge className={profile.role === 'master_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                          {profile.role || 'admin'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MasterAdminLayout>
  );
};

export default UserManagementPage;
