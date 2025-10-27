import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  quickFilters?: Array<{ label: string; value: string }>;
  selectedFilter?: string;
  onFilterChange?: (value: string) => void;
}

export const FilterBar = ({
  dateRange,
  onDateRangeChange,
  quickFilters = [
    { label: "24H", value: "24h" },
    { label: "7D", value: "7d" },
    { label: "1M", value: "1m" },
    { label: "3M", value: "3m" },
  ],
  selectedFilter,
  onFilterChange,
}: FilterBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {quickFilters.map((filter) => (
        <Button
          key={filter.value}
          variant={selectedFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange?.(filter.value)}
          className="h-9"
        >
          {filter.label}
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Custom range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
