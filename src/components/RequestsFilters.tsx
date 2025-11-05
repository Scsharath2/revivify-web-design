import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Search } from "lucide-react";

interface RequestsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  providers: Array<{ display_name: string }> | undefined;
  selectedProviders: string[];
  onProvidersChange: (values: string[]) => void;
  models: Array<{ display_name: string }> | undefined;
  selectedModels: string[];
  onModelsChange: (values: string[]) => void;
  businessUnits: Array<{ name: string }> | undefined;
  selectedBusinessUnits: string[];
  onBusinessUnitsChange: (values: string[]) => void;
}

export function RequestsFilters({
  searchQuery,
  onSearchChange,
  providers,
  selectedProviders,
  onProvidersChange,
  models,
  selectedModels,
  onModelsChange,
  businessUnits,
  selectedBusinessUnits,
  onBusinessUnitsChange,
}: RequestsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 transition-all duration-300 focus:shadow-md"
          />
        </div>
      </div>
      <MultiSelect
        options={providers?.map((p) => ({ label: p.display_name, value: p.display_name })) || []}
        selected={selectedProviders}
        onChange={onProvidersChange}
        placeholder="Providers"
        className="w-[200px]"
      />
      <MultiSelect
        options={models?.map((m) => ({ label: m.display_name, value: m.display_name })) || []}
        selected={selectedModels}
        onChange={onModelsChange}
        placeholder="Models"
        className="w-[200px]"
      />
      <MultiSelect
        options={businessUnits?.map((bu) => ({ label: bu.name, value: bu.name })) || []}
        selected={selectedBusinessUnits}
        onChange={onBusinessUnitsChange}
        placeholder="Business Units"
        className="w-[200px]"
      />
    </div>
  );
}
