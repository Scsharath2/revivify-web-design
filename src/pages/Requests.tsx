import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingTable } from "@/components/LoadingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Download, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useApiRequests } from "@/hooks/useApiRequests";
import { useProviders } from "@/hooks/useProviders";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";
import { useModels } from "@/hooks/useModels";
import { format, subDays, subMonths } from "date-fns";
import { toast } from "sonner";

const Requests = () => {
  const [selectedFilter, setSelectedFilter] = useState("1m");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data: providers } = useProviders();
  const { businessUnits } = useBusinessUnits();
  const { data: models } = useModels();

// Calculate and memoize date range based on filter
  const computedRange = useMemo(() => {
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
  }, [selectedFilter, dateRange]);

  const { data: requestsData, isLoading } = useApiRequests({
    dateRange: computedRange,
    providers: selectedProviders,
    businessUnits: selectedBusinessUnits,
    models: selectedModels,
    searchQuery,
    sortBy,
    sortOrder,
    page: currentPage,
    pageSize,
  });

  const requests = requestsData?.data || [];
  const totalCount = requestsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleExport = () => {
    if (!requests || requests.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content
    const headers = ["Timestamp", "Provider", "Model", "Business Unit", "Tokens", "Cost", "Status", "Response Time"];
    const rows = requests.map(req => [
      format(new Date(req.request_timestamp), "yyyy-MM-dd HH:mm:ss"),
      req.providers?.display_name || "N/A",
      req.models?.display_name || "N/A",
      req.business_units?.name || "N/A",
      req.total_tokens.toString(),
      Number(req.cost).toFixed(4),
      req.status_code?.toString() || "N/A",
      req.response_time_ms ? `${req.response_time_ms}ms` : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `api-requests-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${requests.length} requests to CSV`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Requests</h1>
          <p className="text-muted-foreground mt-1">View and analyze all API requests</p>
        </div>

        {/* Filters */}
        <div className="space-y-4 animate-fade-in animate-stagger-1">
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 transition-all duration-300 focus:shadow-md"
                />
              </div>
            </div>
            <MultiSelect
              options={providers?.map((p) => ({ label: p.display_name, value: p.display_name })) || []}
              selected={selectedProviders}
              onChange={(values) => {
                setSelectedProviders(values);
                setCurrentPage(1);
              }}
              placeholder="Providers"
              className="w-[200px]"
            />
            <MultiSelect
              options={models?.map((m) => ({ label: m.display_name, value: m.display_name })) || []}
              selected={selectedModels}
              onChange={(values) => {
                setSelectedModels(values);
                setCurrentPage(1);
              }}
              placeholder="Models"
              className="w-[200px]"
            />
            <MultiSelect
              options={businessUnits?.map((bu) => ({ label: bu.name, value: bu.name })) || []}
              selected={selectedBusinessUnits}
              onChange={(values) => {
                setSelectedBusinessUnits(values);
                setCurrentPage(1);
              }}
              placeholder="Business Units"
              className="w-[200px]"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="animate-fade-in">
            <LoadingTable />
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="animate-fade-up">
            <EmptyState
              icon={FileText}
              title="No Requests Found"
              description="No API requests match your current filters. Try adjusting the date range or removing some filters to see more results."
            />
          </div>
        ) : (
          <Card className="animate-fade-in animate-stagger-2 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Request Log</CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleExport}
                className="hover-scale"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("timestamp")}
                          className="hover:bg-transparent p-0"
                        >
                          Timestamp
                          <SortIcon column="timestamp" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("provider")}
                          className="hover:bg-transparent p-0"
                        >
                          Provider
                          <SortIcon column="provider" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("model")}
                          className="hover:bg-transparent p-0"
                        >
                          Model
                          <SortIcon column="model" />
                        </Button>
                      </TableHead>
                      <TableHead>Business Unit</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("tokens")}
                          className="hover:bg-transparent p-0"
                        >
                          Tokens
                          <SortIcon column="tokens" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("cost")}
                          className="hover:bg-transparent p-0"
                        >
                          Cost
                          <SortIcon column="cost" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request, index) => (
                      <TableRow 
                        key={request.id} 
                        className="hover:bg-muted/50 transition-colors duration-200 cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <TableCell className="font-mono text-sm">
                          {format(new Date(request.request_timestamp), "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="transition-all duration-200 hover:bg-primary/10">
                            {request.providers?.display_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {request.models?.display_name}
                        </TableCell>
                        <TableCell>{request.business_units?.name || "N/A"}</TableCell>
                        <TableCell className="text-right font-mono">
                          {request.total_tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          ${Number(request.cost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={request.status_code && request.status_code >= 200 && request.status_code < 300 ? "default" : "destructive"}
                            className={request.status_code && request.status_code >= 200 && request.status_code < 300 ? "bg-success hover-scale" : "hover-scale"}
                          >
                            {request.status_code ? request.status_code : "N/A"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} requests
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Requests;
