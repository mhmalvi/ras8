
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import RealReturnsTable from "@/components/RealReturnsTable";
import AppLayout from "@/components/AppLayout";
import { Search, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const Returns = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Returns Management
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              View and manage all return requests from your customers
            </p>
            <Separator className="mt-4" />
          </div>
          
          {/* Filters Section */}
          <section className="animate-fade-in">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Filter className="h-5 w-5 text-primary" />
                  </div>
                  <span>Filter Returns</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Search and filter return requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by customer email or order ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Returns Table Section */}
          <section className="animate-fade-in">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-primary" />
                  </div>
                  <span>Return Requests</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  All customer return requests and their current status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <RealReturnsTable 
                  searchTerm={searchTerm}
                  statusFilter={statusFilter}
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Returns;
