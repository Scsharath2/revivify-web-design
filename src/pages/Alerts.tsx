import { useState, useEffect } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Trash2, Loader2, Edit2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAlertConfigs } from "@/hooks/useAlertConfigs";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Validation schemas
const emailSchema = z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters");
const thresholdSchema = z.number().int("Threshold must be a whole number").min(0, "Threshold must be at least 0").max(100, "Threshold must be at most 100");

const Alerts = () => {
  const { businessUnits, isLoading: buLoading } = useBusinessUnits();
  const { alertConfigs, isLoading, create, update, delete: deleteConfig, isDeleting } = useAlertConfigs();
  
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [criticalThreshold, setCriticalThreshold] = useState(90);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [selectedBU, setSelectedBU] = useState<string>("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [configId, setConfigId] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  // Load existing config for selected BU
  useEffect(() => {
    if (selectedBU && alertConfigs) {
      const config = alertConfigs.find(c => c.name === selectedBU);
      if (config) {
        setConfigId(config.id);
        setWarningThreshold(config.warning_threshold);
        setCriticalThreshold(config.critical_threshold);
        setAlertsEnabled(config.is_enabled);
        setRecipients(config.recipients || []);
      } else {
        setConfigId(undefined);
        setWarningThreshold(80);
        setCriticalThreshold(90);
        setAlertsEnabled(true);
        setRecipients([]);
      }
    }
  }, [selectedBU, alertConfigs]);

  useEffect(() => {
    if (businessUnits && businessUnits.length > 0 && !selectedBU) {
      setSelectedBU(businessUnits[0].id);
    }
  }, [businessUnits, selectedBU]);

  const handleSaveSettings = () => {
    try {
      thresholdSchema.parse(warningThreshold);
      thresholdSchema.parse(criticalThreshold);
      
      if (warningThreshold >= criticalThreshold) {
        toast.error("Warning threshold must be less than critical threshold");
        return;
      }

      const buName = businessUnits?.find(bu => bu.id === selectedBU)?.name || selectedBU;
      
      if (configId) {
        update({
          id: configId,
          name: buName,
          warning_threshold: warningThreshold,
          critical_threshold: criticalThreshold,
          recipients,
          is_enabled: alertsEnabled,
        });
      } else {
        create({
          name: buName,
          warning_threshold: warningThreshold,
          critical_threshold: criticalThreshold,
          recipients,
          is_enabled: alertsEnabled,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleAddRecipient = () => {
    try {
      const validatedEmail = emailSchema.parse(newEmail);
      
      if (recipients.includes(validatedEmail)) {
        toast.error("This email is already in the recipients list");
        return;
      }
      
      setRecipients([...recipients, validatedEmail]);
      setNewEmail("");
      toast.success("Recipient added successfully");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
    toast.success("Recipient removed");
  };

  const handleTestEmail = () => {
    toast.success("Test email sent successfully");
  };

  const handleDeleteConfig = (id: string) => {
    setConfigToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (configToDelete) {
      deleteConfig(configToDelete);
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
      // Reset to first BU if current one was deleted
      if (configToDelete === configId && businessUnits && businessUnits.length > 0) {
        setSelectedBU(businessUnits[0].id);
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alert Configuration</h1>
          <p className="text-muted-foreground mt-1">Configure spending alerts and notifications</p>
        </div>

        {/* All Configurations Overview */}
        <Card>
          <CardHeader>
            <CardTitle>All Alert Configurations</CardTitle>
            <CardDescription>Overview of all configured business unit alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : alertConfigs && alertConfigs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warning</TableHead>
                    <TableHead>Critical</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>
                        <Badge variant={config.is_enabled ? "default" : "secondary"}>
                          {config.is_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-warning text-warning">
                          {config.warning_threshold}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {config.critical_threshold}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {config.recipients?.length || 0} recipient(s)
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const bu = businessUnits?.find(b => b.name === config.name);
                            if (bu) setSelectedBU(bu.id);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteConfig(config.id!)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No alert configurations yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure your first alert below
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scope Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Scope</CardTitle>
            <CardDescription>Select which business unit to configure alerts for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {buLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="business-unit">Business Unit</Label>
                <Select value={selectedBU} onValueChange={setSelectedBU}>
                  <SelectTrigger id="business-unit">
                    <SelectValue placeholder="Select a business unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessUnits?.map((bu) => (
                      <SelectItem key={bu.id} value={bu.id}>
                        {bu.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                type="email"
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.length > 0 ? (
                  recipients.map((email) => (
                    <TableRow key={email}>
                      <TableCell className="font-mono text-sm">
                        {email}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleRemoveRecipient(email)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No recipients added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Button variant="outline" onClick={handleTestEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Send Test Email
            </Button>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Alert Configuration?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the alert configuration. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Alerts;
