import { useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";

// Validation schemas
const businessUnitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  budget: z.number().positive("Budget must be positive").max(10000000, "Budget must be less than 10,000,000"),
});

const Admin = () => {
  const { businessUnits, isLoading, create, delete: deleteUnit } = useBusinessUnits();
  const [newBUName, setNewBUName] = useState("");
  const [newBUBudget, setNewBUBudget] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddBusinessUnit = () => {
    try {
      const validated = businessUnitSchema.parse({
        name: newBUName,
        budget: parseInt(newBUBudget) || 0,
      });
      
      create({
        name: validated.name,
        monthly_budget: validated.budget,
      });
      
      setNewBUName("");
      setNewBUBudget("");
      setIsDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleDeleteUnit = (id: string) => {
    if (confirm("Are you sure you want to delete this business unit?")) {
      deleteUnit(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administration</h1>
          <p className="text-muted-foreground mt-1">Manage business units, projects, and budgets</p>
        </div>

        {/* Business Units */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Business Units</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            {isLoading ? (
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
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleDeleteUnit(unit.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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
      </div>
    </Layout>
  );
};

export default Admin;
