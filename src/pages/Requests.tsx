import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useApiRequests } from "@/hooks/useApiRequests";
import { useProviders } from "@/hooks/useProviders";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";
import { format } from "date-fns";
import { subDays, subMonths } from "date-fns";

const Requests = () => {
  const [selectedFilter, setSelectedFilter] = useState("1m");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [provider, setProvider] = useState("all");
  const [businessUnit, setBusinessUnit] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: providers } = useProviders();
  const { businessUnits } = useBusinessUnits();

  // Calculate date range based on filter
  const getDateRange = () => {
    if (dateRange?.from && dateRange?.to) {
      return { from: dateRange.from, to: dateRange.to };
    }
    const today = new Date();
    switch (selectedFilter) {
      case "7d":
        return { from: subDays(today, 7), to: today };
      case "30d":
        return { from: subDays(today, 30), to: today };
      case "3m":
        return { from: subMonths(today, 3), to: today };
      default:
        return { from: subMonths(today, 1), to: today };
    }
  };

  const { data: requests, isLoading } = useApiRequests({
    dateRange: getDateRange(),
    provider,
    businessUnit,
    searchQuery,
  });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Requests</h1>
          <p className="text-muted-foreground mt-1">View and analyze all API requests</p>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <FilterBar
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers?.map((p) => (
                  <SelectItem key={p.id} value={p.display_name}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={businessUnit} onValueChange={setBusinessUnit}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {businessUnits?.map((bu) => (
                  <SelectItem key={bu.id} value={bu.name}>
                    {bu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Request Log</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Business Unit</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests && requests.length > 0 ? (
                      requests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">
                            {format(new Date(request.request_timestamp), "yyyy-MM-dd HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.providers?.display_name}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {request.models?.display_name}
                          </TableCell>
                          <TableCell>{request.business_units?.name || "N/A"}</TableCell>
                          <TableCell className="text-right font-mono">
                            {request.total_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${Number(request.cost).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={request.status_code && request.status_code >= 200 && request.status_code < 300 ? "default" : "destructive"}
                              className={request.status_code && request.status_code >= 200 && request.status_code < 300 ? "bg-success" : ""}
                            >
                              {request.status_code ? request.status_code : "N/A"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No requests found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Requests;
