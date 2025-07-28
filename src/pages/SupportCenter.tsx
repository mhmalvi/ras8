
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import { MessageSquare, Search, Clock, AlertTriangle, CheckCircle, Users, Mail, Phone, MessageCircle } from "lucide-react";

const SupportCenterPage = () => {
  const tickets = [
    {
      id: "SUP-001",
      subject: "Integration Issues with Shopify",
      customer: "Sarah Johnson (Bloom & Co)",
      priority: "high",
      status: "open",
      lastActivity: "2 hours ago",
      assignee: "Admin Team"
    },
    {
      id: "SUP-002", 
      subject: "Billing Questions - Pro Plan",
      customer: "Mike Chen (TechWear)",
      priority: "medium",
      status: "pending",
      lastActivity: "1 day ago",
      assignee: "Billing Team"
    },
    {
      id: "SUP-003",
      subject: "Feature Request - Custom Branding",
      customer: "Emma Wilson (Lifestyle Store)",
      priority: "low",
      status: "closed",
      lastActivity: "3 days ago",
      assignee: "Product Team"
    },
    {
      id: "SUP-004",
      subject: "API Rate Limiting Issues",
      customer: "David Rodriguez (Fashion Hub)",
      priority: "high",
      status: "open",
      lastActivity: "30 minutes ago",
      assignee: "Technical Team"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      closed: "bg-green-100 text-green-800"
    };
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800", 
      low: "bg-blue-100 text-blue-800"
    };
    return <Badge variant="outline" className={variants[priority as keyof typeof variants]}>{priority}</Badge>;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Support Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get help and manage support requests
          </p>
        </div>
        {/* Support Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">5 high priority</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4h</div>
              <p className="text-xs text-muted-foreground">-30min from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">+2.1% this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Merchants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">248</div>
              <p className="text-xs text-muted-foreground">Across all support channels</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-16 flex flex-col gap-2">
                <Mail className="h-5 w-5" />
                <span>Send Broadcast</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-2">
                <Phone className="h-5 w-5" />
                <span>Schedule Call</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col gap-2">
                <Users className="h-5 w-5" />
                <span>Merchant Portal</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Support Tickets
                </CardTitle>
                <CardDescription>
                  Monitor and manage customer support requests
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search tickets..." 
                    className="pl-10 w-64"
                  />
                </div>
                <Button>New Ticket</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{ticket.subject}</p>
                        <span className="text-sm text-muted-foreground">#{ticket.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{ticket.customer}</p>
                      <p className="text-xs text-muted-foreground">Assigned to {ticket.assignee} • {ticket.lastActivity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SupportCenterPage;
