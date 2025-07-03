import { useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import RealReturnsTable from "@/components/RealReturnsTable";
import ImprovedBulkProcessor from "@/components/ImprovedBulkProcessor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Returns = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("list");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Returns Management</h1>
                  <p className="text-sm text-slate-500">View and manage all return requests</p>
                </div>
              </div>
              <UserMenu />
            </div>
          </header>

          <main className="px-6 py-8 bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-6">
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="list">Returns List</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk Processing</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-6">
                  {/* Filters */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <Input
                            placeholder="Search by order, customer, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-40">
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
                  </div>

                  {/* Returns Table */}
                  <div className="bg-white rounded-lg border">
                    <RealReturnsTable 
                      searchTerm={searchTerm}
                      statusFilter={statusFilter}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="bulk">
                  <ImprovedBulkProcessor />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Returns;
