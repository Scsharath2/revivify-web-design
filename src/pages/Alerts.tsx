import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

const mockRecipients = [
  { id: 1, email: "admin@company.com", role: "Admin" },
  { id: 2, email: "finance@company.com", role: "Finance Manager" },
];

const Alerts = () => {
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [criticalThreshold, setCriticalThreshold] = useState(90);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [selectedBU, setSelectedBU] = useState("finance");
  const [recipients, setRecipients] = useState(mockRecipients);
  const [newEmail, setNewEmail] = useState("");

  const handleSaveSettings = () => {
    toast.success("Alert settings saved successfully");
  };

  const handleAddRecipient = () => {
    if (newEmail) {
      setRecipients([
        ...recipients,
        {
          id: recipients.length + 1,
          email: newEmail,
          role: "User",
        },
      ]);
      setNewEmail("");
      toast.success("Recipient added successfully");
    }
  };

  const handleTestEmail = () => {
    toast.success("Test email sent successfully");
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alert Configuration</h1>
          <p className="text-muted-foreground mt-1">Configure spending alerts and notifications</p>
        </div>

        {/* Scope Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Scope</CardTitle>
            <CardDescription>Select which business unit to configure alerts for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="business-unit">Business Unit</Label>
                <Select value={selectedBU} onValueChange={setSelectedBU}>
                  <SelectTrigger id="business-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="rnd">R&D</SelectItem>
                    <SelectItem value="cloudops">CloudOps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="alpha">Alpha</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Thresholds</CardTitle>
            <CardDescription>Configure when alerts should be triggered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when thresholds are exceeded
                </p>
              </div>
              <Switch
                checked={alertsEnabled}
                onCheckedChange={setAlertsEnabled}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warning">Warning Threshold (%)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="warning"
                    type="number"
                    min="0"
                    max="100"
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(parseInt(e.target.value))}
                    className="w-24"
                  />
                  <Badge variant="outline" className="border-warning text-warning">
                    Warning Level
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send a warning email when budget reaches this percentage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="critical">Critical Threshold (%)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="critical"
                    type="number"
                    min="0"
                    max="100"
                    value={criticalThreshold}
                    onChange={(e) => setCriticalThreshold(parseInt(e.target.value))}
                    className="w-24"
                  />
                  <Badge variant="destructive">
                    Critical Level
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send urgent alerts when budget reaches this percentage
                </p>
              </div>
            </div>

            <Button onClick={handleSaveSettings}>
              Save Alert Settings
            </Button>
          </CardContent>
        </Card>

        {/* Email Recipients */}
        <Card>
          <CardHeader>
            <CardTitle>Email Recipients</CardTitle>
            <CardDescription>Manage who receives alert notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="email@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRecipient()}
              />
              <Button onClick={handleAddRecipient}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-mono text-sm">
                      {recipient.email}
                    </TableCell>
                    <TableCell>{recipient.role}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button variant="outline" onClick={handleTestEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Send Test Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Alerts;
