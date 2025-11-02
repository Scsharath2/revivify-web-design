import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <Card className="border-dashed">
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
        <div className="mb-4 rounded-full bg-muted/50 p-6">
          <Icon className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="hover-scale">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
};
