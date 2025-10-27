import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const mockBusinessUnits = [
  { id: 1, name: "Finance", projects: 3, budget: 5000 },
  { id: 2, name: "R&D", projects: 5, budget: 10000 },
  { id: 3, name: "CloudOps", projects: 4, budget: 4000 },
];

const mockProjects = [
  { id: 1, name: "Alpha", businessUnit: "Finance", budget: 2000 },
  { id: 2, name: "Beta", businessUnit: "R&D", budget: 3500 },
  { id: 3, name: "Gamma", businessUnit: "CloudOps", budget: 1500 },
  { id: 4, name: "Delta", businessUnit: "R&D", budget: 2800 },
];

const Admin = () => {
  const [businessUnits, setBusinessUnits] = useState(mockBusinessUnits);
  const [projects, setProjects] = useState(mockProjects);
  const [newBUName, setNewBUName] = useState("");
  const [newBUBudget, setNewBUBudget] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectBU, setNewProjectBU] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");

  const handleAddBusinessUnit = () => {
    if (newBUName && newBUBudget) {
      setBusinessUnits([
        ...businessUnits,
        {
          id: businessUnits.length + 1,
          name: newBUName,
          projects: 0,
          budget: parseInt(newBUBudget),
        },
      ]);
      setNewBUName("");
      setNewBUBudget("");
      toast.success("Business unit created successfully");
    }
  };

  const handleAddProject = () => {
    if (newProjectName && newProjectBU && newProjectBudget) {
      setProjects([
        ...projects,
        {
          id: projects.length + 1,
          name: newProjectName,
          businessUnit: newProjectBU,
          budget: parseInt(newProjectBudget),
        },
      ]);
      setNewProjectName("");
      setNewProjectBU("");
      setNewProjectBudget("");
      toast.success("Project created successfully");
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
            <Dialog>
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
                    Add a new business unit to organize your projects
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead className="text-right">Monthly Budget</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.projects}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${unit.budget.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                  <DialogDescription>
                    Add a new project under a business unit
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Name</Label>
                    <Input
                      id="project-name"
                      placeholder="Project Omega"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-bu">Business Unit</Label>
                    <Input
                      id="project-bu"
                      placeholder="Finance"
                      value={newProjectBU}
                      onChange={(e) => setNewProjectBU(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-budget">Budget ($)</Label>
                    <Input
                      id="project-budget"
                      type="number"
                      placeholder="2000"
                      value={newProjectBudget}
                      onChange={(e) => setNewProjectBudget(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddProject}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Business Unit</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.businessUnit}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${project.budget.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
