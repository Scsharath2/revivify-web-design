import { useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Building2, DollarSign, ShieldCheck, Users2, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";
import { useBudgets } from "@/hooks/useBudgets";
import { usePolicies } from "@/hooks/usePolicies";
import { useProviders } from "@/hooks/useProviders";
import { useUsers, UserRole } from "@/hooks/useUsers";
import { format } from "date-fns";

// Validation schemas
const businessUnitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  budget: z.number().positive("Budget must be positive").max(10000000, "Budget must be less than 10,000,000"),
});

const budgetSchema = z.object({
  allocated_amount: z.number().positive("Amount must be positive"),
  period_start: z.string().min(1, "Start date is required"),
  period_end: z.string().min(1, "End date is required"),
});

const policySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  policy_type: z.string().min(1, "Type is required"),
});

const Admin = () => {
  const { businessUnits, isLoading: buLoading, create: createBU, delete: deleteBU } = useBusinessUnits();
  const { budgets, isLoading: budgetsLoading, create: createBudget, delete: deleteBudget } = useBudgets();
  const { policies, isLoading: policiesLoading, create: createPolicy, update: updatePolicy, delete: deletePolicy } = usePolicies();
  const { users, isLoading: usersLoading, addRole, removeRole } = useUsers();
  const providersQuery = useProviders();
  const providers = providersQuery.data;

  // Business Unit states
  const [newBUName, setNewBUName] = useState("");
  const [newBUBudget, setNewBUBudget] = useState("");
  const [isBUDialogOpen, setIsBUDialogOpen] = useState(false);

  // Budget states
  const [selectedBUId, setSelectedBUId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);

  // Policy states
  const [policyName, setPolicyName] = useState("");
  const [policyType, setPolicyType] = useState("");
  const [maxCostPerRequest, setMaxCostPerRequest] = useState("");
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);

  const handleAddBusinessUnit = () => {
    try {
      const validated = businessUnitSchema.parse({
        name: newBUName,
        budget: parseInt(newBUBudget) || 0,
      });
      
      createBU({
        name: validated.name,
        monthly_budget: validated.budget,
      });
      
      setNewBUName("");
      setNewBUBudget("");
      setIsBUDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleDeleteUnit = (id: string) => {
    if (confirm("Are you sure you want to delete this business unit?")) {
      deleteBU(id);
    }
  };

  const handleAddBudget = () => {
    try {
      const validated = budgetSchema.parse({
        allocated_amount: parseFloat(budgetAmount),
        period_start: periodStart,
        period_end: periodEnd,
      });

      if (new Date(validated.period_start) >= new Date(validated.period_end)) {
        toast.error("Start date must be before end date");
        return;
      }

      createBudget({
        business_unit_id: selectedBUId || undefined,
        provider_id: selectedProviderId || undefined,
        allocated_amount: validated.allocated_amount,
        period_start: validated.period_start,
        period_end: validated.period_end,
      });

      setSelectedBUId("");
      setSelectedProviderId("");
      setBudgetAmount("");
      setPeriodStart("");
      setPeriodEnd("");
      setIsBudgetDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleAddPolicy = () => {
    try {
      const validated = policySchema.parse({
        name: policyName,
        policy_type: policyType,
      });

      const config: Record<string, any> = {};
      if (maxCostPerRequest) {
        config.max_cost_per_request = parseFloat(maxCostPerRequest);
      }

      createPolicy({
        name: validated.name,
        policy_type: validated.policy_type,
        config: config as any,
        is_active: false,
      });

      setPolicyName("");
      setPolicyType("");
      setMaxCostPerRequest("");
      setIsPolicyDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleTogglePolicy = (id: string, currentState: boolean) => {
    const policy = policies?.find(p => p.id === id);
    if (!policy) return;
    
    updatePolicy({
      id,
      name: policy.name,
      policy_type: policy.policy_type,
      config: policy.config as any,
      is_active: !currentState,
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administration</h1>
          <p className="text-muted-foreground mt-1">Manage business units, budgets, and policies</p>
        </div>

        <Tabs defaultValue="units" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Units
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budgets
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Business Units Tab */}
          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Business Units</CardTitle>
                  <CardDescription>Manage organizational units and their budgets</CardDescription>
                </div>
                <Dialog open={isBUDialogOpen} onOpenChange={setIsBUDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Business Unit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Business Unit</DialogTitle>
                      <DialogDescription>
                        Add a new business unit to manage AI spending
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="bu-name">Name</Label>
                        <Input
                          id="bu-name"
                          placeholder="Engineering"
                          value={newBUName}
                          onChange={(e) => setNewBUName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bu-budget">Monthly Budget ($)</Label>
                        <Input
                          id="bu-budget"
                          type="number"
                          min="0"
                          max="10000000"
                          placeholder="5000"
                          value={newBUBudget}
                          onChange={(e) => setNewBUBudget(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddBusinessUnit}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {buLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Monthly Budget</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businessUnits && businessUnits.length > 0 ? (
                        businessUnits.map((unit) => (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.name}</TableCell>
                            <TableCell className="text-muted-foreground">{unit.description || "—"}</TableCell>
                            <TableCell className="text-right font-mono">
                              ${unit.monthly_budget ? Number(unit.monthly_budget).toLocaleString() : "0"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => handleDeleteUnit(unit.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No business units found. Create one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Budget Allocation</CardTitle>
                  <CardDescription>Set spending limits for specific periods</CardDescription>
                </div>
                <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Budget
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Budget</DialogTitle>
                      <DialogDescription>
                        Set a budget for a specific period and scope
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="bu-select">Business Unit (Optional)</Label>
                        <Select value={selectedBUId} onValueChange={setSelectedBUId}>
                          <SelectTrigger id="bu-select">
                            <SelectValue placeholder="Select business unit" />
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
                      <div className="space-y-2">
                        <Label htmlFor="provider-select">Provider (Optional)</Label>
                        <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                          <SelectTrigger id="provider-select">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers?.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget-amount">Allocated Amount ($)</Label>
                        <Input
                          id="budget-amount"
                          type="number"
                          min="0"
                          placeholder="1000"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="period-start">Start Date</Label>
                          <Input
                            id="period-start"
                            type="date"
                            value={periodStart}
                            onChange={(e) => setPeriodStart(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="period-end">End Date</Label>
                          <Input
                            id="period-end"
                            type="date"
                            value={periodEnd}
                            onChange={(e) => setPeriodEnd(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddBudget}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {budgetsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scope</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Allocated</TableHead>
                        <TableHead className="text-right">Spent</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgets && budgets.length > 0 ? (
                        budgets.map((budget: any) => {
                          const remaining = budget.allocated_amount - (budget.spent_amount || 0);
                          return (
                            <TableRow key={budget.id}>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {budget.business_units && (
                                    <span className="font-medium">{budget.business_units.name}</span>
                                  )}
                                  {budget.providers && (
                                    <span className="text-sm text-muted-foreground">{budget.providers.display_name}</span>
                                  )}
                                  {!budget.business_units && !budget.providers && (
                                    <span className="text-muted-foreground">Global</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(budget.period_start), "MMM d, yyyy")} - {format(new Date(budget.period_end), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ${Number(budget.allocated_amount).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ${Number(budget.spent_amount || 0).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                <span className={remaining < 0 ? "text-destructive" : ""}>
                                  ${Number(remaining).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Delete this budget?")) {
                                      deleteBudget(budget.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No budgets configured. Create one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Usage Policies</CardTitle>
                  <CardDescription>Configure rules and limits for AI usage</CardDescription>
                </div>
                <Dialog open={isPolicyDialogOpen} onOpenChange={setIsPolicyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Policy</DialogTitle>
                      <DialogDescription>
                        Define a new usage policy
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="policy-name">Policy Name</Label>
                        <Input
                          id="policy-name"
                          placeholder="Cost per request limit"
                          value={policyName}
                          onChange={(e) => setPolicyName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="policy-type">Type</Label>
                        <Select value={policyType} onValueChange={setPolicyType}>
                          <SelectTrigger id="policy-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cost_limit">Cost Limit</SelectItem>
                            <SelectItem value="rate_limit">Rate Limit</SelectItem>
                            <SelectItem value="model_restriction">Model Restriction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {policyType === "cost_limit" && (
                        <div className="space-y-2">
                          <Label htmlFor="max-cost">Max Cost Per Request ($)</Label>
                          <Input
                            id="max-cost"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.10"
                            value={maxCostPerRequest}
                            onChange={(e) => setMaxCostPerRequest(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddPolicy}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {policiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Configuration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies && policies.length > 0 ? (
                        policies.map((policy) => (
                          <TableRow key={policy.id}>
                            <TableCell className="font-medium">{policy.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {policy.policy_type.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {typeof policy.config === 'object' && policy.config !== null && 'max_cost_per_request' in policy.config && 
                                `Max: $${policy.config.max_cost_per_request}`}
                              {typeof policy.config === 'object' && policy.config !== null && Object.keys(policy.config).length === 0 && "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={policy.is_active}
                                  onCheckedChange={() => handleTogglePolicy(policy.id!, policy.is_active)}
                                />
                                <Badge variant={policy.is_active ? "default" : "secondary"}>
                                  {policy.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Delete this policy?")) {
                                    deletePolicy(policy.id!);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No policies configured. Create one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.length > 0 ? (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {user.roles.length > 0 ? (
                                  user.roles.map((role) => (
                                    <Badge 
                                      key={role}
                                      variant={role === "admin" ? "default" : "secondary"}
                                      className="gap-1"
                                    >
                                      {role}
                                      <button
                                        onClick={() => removeRole({ userId: user.id, role })}
                                        className="ml-1 hover:text-destructive"
                                      >
                                        <UserMinus className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">No roles</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!user.roles.includes("admin") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addRole({ userId: user.id, role: "admin" })}
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Admin
                                  </Button>
                                )}
                                {!user.roles.includes("analyst") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addRole({ userId: user.id, role: "analyst" })}
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Analyst
                                  </Button>
                                )}
                                {!user.roles.includes("viewer") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addRole({ userId: user.id, role: "viewer" })}
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Viewer
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
