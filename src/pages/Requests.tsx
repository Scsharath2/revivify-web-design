import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingTable } from "@/components/LoadingCard";
import { ColumnCustomizer, ColumnConfig } from "@/components/ColumnCustomizer";
import { RequestDetailDrawer } from "@/components/RequestDetailDrawer";
import { RequestsFilters } from "@/components/RequestsFilters";
import { RequestsTable } from "@/components/RequestsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Download, FileText } from "lucide-react";
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
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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

  const handleRowClick = (request: any) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
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

          <RequestsFilters
            searchQuery={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
            providers={providers}
            selectedProviders={selectedProviders}
            onProvidersChange={(values) => {
              setSelectedProviders(values);
              setCurrentPage(1);
            }}
            models={models}
            selectedModels={selectedModels}
            onModelsChange={(values) => {
              setSelectedModels(values);
              setCurrentPage(1);
            }}
            businessUnits={businessUnits}
            selectedBusinessUnits={selectedBusinessUnits}
            onBusinessUnitsChange={(values) => {
              setSelectedBusinessUnits(values);
              setCurrentPage(1);
            }}
          />
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
              <RequestsTable
                requests={requests}
                visibleColumns={visibleColumns}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onRowClick={handleRowClick}
              />
              
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

        <RequestDetailDrawer
          request={selectedRequest}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      </div>
    </Layout>
  );
};

export default Requests;
