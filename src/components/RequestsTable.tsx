import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { ColumnConfig } from "@/components/ColumnCustomizer";

interface RequestsTableProps {
  requests: any[];
  visibleColumns: ColumnConfig[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
  onRowClick: (request: any) => void;
}

export function RequestsTable({
  requests,
  visibleColumns,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
}: RequestsTableProps) {
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={column.id} className={column.id.includes("tokens") || column.id === "cost" ? "text-right" : ""}>
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    onClick={() => onSort(column.id)}
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
              onClick={() => onRowClick(request)}
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
                  {column.id === "was_blocked" && (request.was_blocked ? "Yes" : "No")}
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
  );
}
