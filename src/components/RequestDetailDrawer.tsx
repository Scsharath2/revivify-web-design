import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface RequestDetailDrawerProps {
  request: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDetailDrawer({ request, open, onOpenChange }: RequestDetailDrawerProps) {
  if (!request) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Request Details</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Timestamp:</span>
                  <p className="font-mono mt-1">{format(new Date(request.request_timestamp), "yyyy-MM-dd HH:mm:ss")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Request ID:</span>
                  <p className="font-mono mt-1 text-xs break-all">{request.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider:</span>
                  <div className="mt-1">
                    <Badge variant="outline">{request.providers?.display_name}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Model:</span>
                  <p className="font-medium mt-1">{request.models?.display_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Business Unit:</span>
                  <p className="mt-1">{request.business_units?.name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-1">
                    <Badge
                      variant={request.status_code && request.status_code >= 200 && request.status_code < 300 ? "default" : "destructive"}
                    >
                      {request.status_code || "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Performance Metrics */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Tokens:</span>
                  <p className="font-mono mt-1">{request.total_tokens.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <p className="font-mono mt-1 font-semibold">${Number(request.cost).toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prompt Tokens:</span>
                  <p className="font-mono mt-1">{request.prompt_tokens.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Completion Tokens:</span>
                  <p className="font-mono mt-1">{request.completion_tokens.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Response Time:</span>
                  <p className="font-mono mt-1">{request.response_time_ms ? `${request.response_time_ms}ms` : "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Blocked:</span>
                  <p className="mt-1">{request.was_blocked ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Request Message */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Request Message</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                  {request.request_message || "No request message available"}
                </pre>
              </div>
            </div>

            <Separator />

            {/* Response Message */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Response Message</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                  {request.response_message || "No response message available"}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
