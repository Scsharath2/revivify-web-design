import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetItem {
  name: string;
  spent: number;
  budget: number;
  unit?: string;
}

interface BudgetProgressProps {
  items: BudgetItem[];
}

export const BudgetProgress = ({ items }: BudgetProgressProps) => {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-warning";
    return "text-success";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-warning";
    return "bg-success";
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item) => {
          const percentage = (item.spent / item.budget) * 100;
          const unit = item.unit || "$";

          return (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {item.name}
                </span>
                <span className={cn("text-sm font-semibold", getStatusColor(percentage))}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
                indicatorClassName={getProgressColor(percentage)}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {unit}{item.spent.toLocaleString()} spent
                </span>
                <span>
                  {unit}{item.budget.toLocaleString()} budget
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
