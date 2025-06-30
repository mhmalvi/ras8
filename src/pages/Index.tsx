
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardStats from "@/components/DashboardStats";
import BulkActionsReturns from "@/components/BulkActionsReturns";
import MetricsChart from "@/components/MetricsChart";
import EnhancedAIInsights from "@/components/EnhancedAIInsights";
import NotificationCenter from "@/components/NotificationCenter";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RA</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Returns Automation</h1>
              <p className="text-sm text-slate-500">Merchant Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <NotificationCenter />
              </PopoverContent>
            </Popover>
            <Link to="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Pro Plan
            </Badge>
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-slate-600 text-sm font-medium">JS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome back, John's Store
            </h2>
            <p className="text-slate-600">
              Here's what's happening with your returns this month
            </p>
          </div>

          {/* Dashboard Stats */}
          <DashboardStats />

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="returns" className="mt-8">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="returns">Returns</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
              <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="returns" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <CardTitle>Returns Management</CardTitle>
                      <CardDescription>
                        View and manage all return requests from your customers
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Search by order number or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                      />
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="requested">Requested</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                {/* Use existing ReturnsTable component for basic functionality */}
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="grid gap-6">
                <MetricsChart />
              </div>
            </TabsContent>

            <TabsContent value="ai-insights" className="mt-6">
              <EnhancedAIInsights />
            </TabsContent>

            <TabsContent value="bulk-actions" className="mt-6">
              <BulkActionsReturns />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
