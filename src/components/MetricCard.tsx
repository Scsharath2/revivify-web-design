import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  trend?: "up" | "down";
  className?: string;
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon, 
  trend,
  className 
}: MetricCardProps) => {
  const showChange = change !== undefined;
  const isPositive = trend === "up";

  return (
    <Card className={cn(
      "animate-fade-in transition-all duration-300 hover-lift hover-glow group cursor-pointer", 
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform">
              {value}
            </p>
            {showChange && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium transition-all",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 animate-bounce" />
                ) : (
                  <TrendingDown className="h-4 w-4 animate-bounce" />
                )}
                <span>{Math.abs(change)}%</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="rounded-lg bg-primary/10 p-3 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
