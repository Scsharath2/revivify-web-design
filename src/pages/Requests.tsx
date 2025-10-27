import { useState } from "react";
import { Layout } from "@/components/Layout";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DateRange } from "react-day-picker";

const mockRequests = [
  {
    id: "req_001",
    timestamp: "2024-02-15 14:23:45",
    provider: "OpenAI",
    model: "GPT-4",
    businessUnit: "Finance",
    project: "Alpha",
    tokens: 1250,
    cost: 0.05,
    status: "success",
  },
  {
    id: "req_002",
    timestamp: "2024-02-15 14:22:18",
    provider: "Anthropic",
    model: "Claude-3",
    businessUnit: "R&D",
    project: "Beta",
    tokens: 890,
    cost: 0.04,
    status: "success",
  },
  {
    id: "req_003",
    timestamp: "2024-02-15 14:20:52",
    provider: "OpenAI",
    model: "GPT-3.5",
    businessUnit: "CloudOps",
    project: "Gamma",
    tokens: 650,
    cost: 0.02,
    status: "success",
  },
  {
    id: "req_004",
    timestamp: "2024-02-15 14:18:33",
    provider: "Google",
    model: "Gemini",
    businessUnit: "Finance",
    project: "Alpha",
    tokens: 1100,
    cost: 0.03,
    status: "error",
  },
  {
    id: "req_005",
    timestamp: "2024-02-15 14:15:21",
    provider: "Anthropic",
    model: "Claude-3",
    businessUnit: "R&D",
    project: "Delta",
    tokens: 2340,
    cost: 0.09,
    status: "success",
  },
];

const Requests = () => {
  const [selectedFilter, setSelectedFilter] = useState("1m");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [provider, setProvider] = useState("all");
  const [businessUnit, setBusinessUnit] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="cohere">Cohere</SelectItem>
              </SelectContent>
            </Select>
            <Select value={businessUnit} onValueChange={setBusinessUnit}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="rnd">R&D</SelectItem>
                <SelectItem value="cloudops">CloudOps</SelectItem>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {request.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.provider}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {request.model}
                      </TableCell>
                      <TableCell>{request.businessUnit}</TableCell>
                      <TableCell>{request.project}</TableCell>
                      <TableCell className="text-right font-mono">
                        {request.tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${request.cost.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={request.status === "success" ? "default" : "destructive"}
                          className={request.status === "success" ? "bg-success" : ""}
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Requests;
