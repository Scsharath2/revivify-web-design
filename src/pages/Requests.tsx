import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingTable } from "@/components/LoadingCard";
import { ColumnCustomizer, ColumnConfig } from "@/components/ColumnCustomizer";
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
  const pageSize = 100;

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: "timestamp", label: "Timestamp", visible: true, sortable: true },
    { id: "provider", label: "Provider", visible: true, sortable: true },
    { id: "model", label: "Model", visible: true, sortable: true },
    { id: "request_message", label: "Request Message", visible: true, sortable: false },
    { id: "response_message", label: "Response Message", visible: true, sortable: false },
    { id: "business_unit", label: "Business Unit", visible: true, sortable: false },
    { id: "tokens", label: "Total Tokens", visible: true, sortable: true },
    { id: "prompt_tokens", label: "Prompt Tokens", visible: false, sortable: true },
    { id: "completion_tokens", label: "Completion Tokens", visible: false, sortable: true },
    { id: "cost", label: "Cost", visible: true, sortable: true },
    { id: "status", label: "Status", visible: true, sortable: false },
    { id: "response_time", label: "Response Time", visible: false, sortable: true },
    { id: "was_blocked", label: "Blocked", visible: false, sortable: false },
    { id: "request_id", label: "Request ID", visible: false, sortable: false },
  ]);

  const { data: providers } = useProviders();
  const { businessUnits } = useBusinessUnits();
  const { data: models } = useModels();

  const visibleColumns = useMemo(() => columns.filter(col => col.visible), [columns]);

// Calculate and memoize date range based on filter
  const computedRange = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return { from: dateRange.from, to: dateRange.to };
    }
    const today = new Date();
    switch (selectedFilter) {
      case "24h":
        return { from: subDays(today, 1), to: today };
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

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setDateRange(undefined); // Clear custom date range when preset filter is selected
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSelectedFilter(""); // Clear quick filter highlight when custom range is selected
    setCurrentPage(1);
  };
  
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
    const dataToExport = requestsData?.allData || [];
    if (dataToExport.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content based on visible columns
    const headers = visibleColumns.map(col => col.label);
    const rows = dataToExport.map(req => {
      return visibleColumns.map(col => {
        switch (col.id) {
          case "timestamp":
            return format(new Date(req.request_timestamp), "yyyy-MM-dd HH:mm:ss");
          case "provider":
            return req.providers?.display_name || "N/A";
          case "model":
            return req.models?.display_name || "N/A";
          case "business_unit":
            return req.business_units?.name || "N/A";
          case "tokens":
            return req.total_tokens.toString();
          case "prompt_tokens":
            return req.prompt_tokens.toString();
          case "completion_tokens":
            return req.completion_tokens.toString();
          case "cost":
            return Number(req.cost).toFixed(4);
          case "status":
            return req.status_code?.toString() || "N/A";
          case "response_time":
            return req.response_time_ms ? `${req.response_time_ms}ms` : "N/A";
          case "was_blocked":
            return req.was_blocked ? "Yes" : "No";
          case "request_id":
            return req.id;
          case "request_message":
            return (req.request_message || "").replace(/"/g, '""');
          case "response_message":
            return (req.response_message || "").replace(/"/g, '""');
          default:
            return "N/A";
        }
      });
    });

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
    
    toast.success(`Exported ${dataToExport.length} requests to CSV`);
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
            onFilterChange={handleFilterChange}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
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
              <CardTitle>Request Log ({totalCount.toLocaleString()} total)</CardTitle>
              <div className="flex gap-2">
                <ColumnCustomizer columns={columns} onColumnsChange={setColumns} />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleExport}
                  className="hover-scale"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.map((column) => (
                        <TableHead key={column.id} className={column.id.includes("tokens") || column.id === "cost" ? "text-right" : ""}>
                          {column.sortable ? (
                            <Button
                              variant="ghost"
                              onClick={() => handleSort(column.id)}
                              className="hover:bg-transparent p-0"
                            >
                              {column.label}
                              <SortIcon column={column.id} />
                            </Button>
                          ) : (
                            column.label
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request, index) => (
                      <TableRow 
                        key={request.id} 
                        className="hover:bg-muted/50 transition-colors duration-200 cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${Math.min(index * 0.02, 1)}s` }}
                      >
                        {visibleColumns.map((column) => (
                          <TableCell 
                            key={column.id}
                            className={
                              column.id === "timestamp" ? "font-mono text-sm" :
                              column.id.includes("tokens") || column.id === "cost" ? "text-right font-mono" :
                              column.id === "model" ? "font-medium" :
                              column.id === "request_id" ? "font-mono text-xs" :
                              ""
                            }
                          >
                            {column.id === "timestamp" && format(new Date(request.request_timestamp), "yyyy-MM-dd HH:mm:ss")}
                            {column.id === "provider" && (
                              <Badge variant="outline" className="transition-all duration-200 hover:bg-primary/10">
                                {request.providers?.display_name}
                              </Badge>
                            )}
            {column.id === "model" && request.models?.display_name}
            {column.id === "business_unit" && (request.business_units?.name || "N/A")}
            {column.id === "tokens" && request.total_tokens.toLocaleString()}
            {column.id === "prompt_tokens" && request.prompt_tokens.toLocaleString()}
            {column.id === "completion_tokens" && request.completion_tokens.toLocaleString()}
            {column.id === "cost" && (
              <span className="font-semibold">${Number(request.cost).toFixed(4)}</span>
            )}
            {column.id === "status" && (
              <Badge
                variant={request.status_code && request.status_code >= 200 && request.status_code < 300 ? "default" : "destructive"}
                className={request.status_code && request.status_code >= 200 && request.status_code < 300 ? "bg-success hover-scale" : "hover-scale"}
              >
                {request.status_code || "N/A"}
              </Badge>
            )}
            {column.id === "response_time" && (
              request.response_time_ms ? `${request.response_time_ms}ms` : "N/A"
            )}
            {column.id === "request_message" && (
              <span className="truncate block max-w-[420px]" title={request.request_message || ""}>
                {request.request_message || "—"}
              </span>
            )}
            {column.id === "response_message" && (
              <span className="truncate block max-w-[420px]" title={request.response_message || ""}>
                {request.response_message || "—"}
              </span>
            )}
            {column.id === "request_id" && (
              <span className="truncate block max-w-[100px]" title={request.id}>
                {request.id.substring(0, 8)}...
              </span>
            )}
                          </TableCell>
                        ))}
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
