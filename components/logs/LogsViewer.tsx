/**
 * LogsViewer Component
 * 
 * A comprehensive log viewing interface that displays system logs with filtering,
 * searching, and export capabilities. The component provides real-time log monitoring
 * with support for different log levels and event types.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Loader2, Search, RefreshCw, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FormEventType } from "@/lib/formLogger";
import { useDictionary } from "@/hooks/useDictionary";

// Event type display names mapping
const EVENT_DISPLAY_NAMES: Record<FormEventType, string> = {
  'FORM_CREATED': 'Form Created',
  'FORM_UPDATED': 'Form Updated',
  'FORM_DELETED': 'Form Deleted',
  'FORM_MADE_PRIVATE': 'Made Private',
  'FORM_MADE_PUBLIC': 'Made Public',
  'FORM_SUBMITTED': 'Form Submitted',
  'FORM_RESPONSE_VIEWED': 'Response Viewed',
  'FORM_SHARED': 'Form Shared',
  'FORM_REQUEST_UNAUTHORIZED': 'Unauthorized Request',
  'FORM_REQUEST_PROCESSING': 'Request Processing',
  'FORM_REQUEST_NOT_FOUND': 'Request Not Found',
  'FORM_REQUEST_FORBIDDEN': 'Request Forbidden',
  'FORM_REQUEST_ACCEPTED': 'Request Accepted',
  'FORM_REQUEST_REJECTED': 'Request Rejected',
  'FORM_REQUEST_ERROR': 'Request Error'
};

/**
 * LogEntry Interface
 * Defines the structure of a log entry in the system
 */
interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  event?: FormEventType;
  formId?: string;
  userId?: string;
  userName?: string;
  formTitle?: string;
  additionalInfo?: Record<string, unknown>;
  rawMessage?: string;
}

interface LogsViewerProps {
  initialLogs?: LogEntry[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function LogsViewer({
  initialLogs = [],
  autoRefresh = false,
  refreshInterval = 5000,
}: LogsViewerProps) {
  const dict = useDictionary();
  const [logs, setLogs] = useState<LogEntry[]>(sortLogsByTimestamp(initialLogs));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  // Helper function to sort logs by timestamp
  function sortLogsByTimestamp(logsToSort: LogEntry[]): LogEntry[] {
    return [...logsToSort].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Helper function to check if a value matches the search query
  function matchesSearchQuery(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some(v => matchesSearchQuery(v));
    }
    return String(value).toLowerCase().includes(searchQuery.toLowerCase());
  }

  /**
   * Fetches logs from the API endpoint
   * Handles loading states and error conditions
   */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(dict.logs.title);
      
      const response = await fetch("/api/logs");
      console.log(dict.logs.metadata.title, response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error(dict.logs.errors.fetchFailed, errorData);
        throw new Error(errorData?.error || dict.logs.errors.fetchFailed);
      }
      
      const data = await response.json();
      console.log(dict.logs.metadata.description.replace("{0}", data.logs?.length?.toString() || "0"));
      
      if (!Array.isArray(data.logs)) {
        console.error(dict.logs.errors.invalidData, data);
        throw new Error(dict.logs.errors.invalidData);
      }
      
      const sortedLogs = sortLogsByTimestamp(data.logs);
      setLogs(sortedLogs);
    } catch (err) {
      console.error(dict.logs.errors.fetchFailed, err);
      setError(err instanceof Error ? err.message : dict.logs.errors.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [dict.logs]);

  useEffect(() => {
    fetchLogs();

    if (autoRefresh) {
      const interval = setInterval(fetchLogs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchLogs]);

  // Filter logs with improved search
  const filteredLogs = logs.filter((log) => {
    // Deep search in log object including additionalInfo
    const matchesSearch = !searchQuery || (
      matchesSearchQuery(log.event) ||
      matchesSearchQuery(log.formTitle) ||
      matchesSearchQuery(log.userName) ||
      matchesSearchQuery(log.userId) ||
      matchesSearchQuery(log.formId) ||
      matchesSearchQuery(log.additionalInfo)
    );

    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesEvent = eventFilter === "all" || log.event === eventFilter;

    console.log("Filtering log:", {
      event: log.event,
      level: log.level,
      matchesSearch,
      matchesLevel,
      matchesEvent
    });

    return matchesSearch && matchesLevel && matchesEvent;
  });

  /**
   * Returns appropriate color classes for different log levels
   */
  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "warn":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "debug":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  /**
   * Formats timestamp string to a more readable format
   */
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, "MMM d, yyyy HH:mm:ss");
    } catch {
      return timestamp;
    }
  };

  /**
   * Escapes special characters in CSV values
   */
  const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  /**
   * Exports filtered logs to CSV format
   */
  const exportLogs = () => {
    try {
      const csvContent = [
        ["Timestamp", "Level", "Event", "Form", "User"].join(","),
        ...filteredLogs.map((log) => [
          escapeCsvValue(formatTimestamp(log.timestamp)),
          escapeCsvValue(log.level),
          escapeCsvValue(log.event || ""),
          escapeCsvValue(log.formTitle || ""),
          escapeCsvValue(log.userName || log.userId || "-"),
        ].join(","))
      ].join("\n");

      const blob = new Blob(["\ufeff", csvContent], { 
        type: "text/csv;charset=utf-8;" 
      });
      
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const timestamp = format(new Date(), "yyyy-MM-dd-HH-mm");
      
      link.setAttribute("href", url);
      link.setAttribute("download", `form-logs-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting logs:", error);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={dict.logs.filters.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={dict.logs.filters.level.title} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dict.logs.filters.level.all}</SelectItem>
              <SelectItem value="error">{dict.logs.filters.level.error}</SelectItem>
              <SelectItem value="warn">{dict.logs.filters.level.warn}</SelectItem>
              <SelectItem value="info">{dict.logs.filters.level.info}</SelectItem>
              <SelectItem value="debug">{dict.logs.filters.level.debug}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={dict.logs.filters.event.title} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dict.logs.filters.event.all}</SelectItem>
              {Object.entries(EVENT_DISPLAY_NAMES).map(([eventType, displayName]) => (
                <SelectItem key={eventType} value={eventType}>
                  {displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchLogs}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dict.logs.actions.refresh}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={exportLogs}
                  disabled={loading || filteredLogs.length === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dict.logs.actions.export}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">
          <p className="font-semibold">{dict.logs.errors.title}</p>
          <p className="mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchLogs}
          >
            {dict.logs.actions.tryAgain}
          </Button>
        </div>
      )}

      <ScrollArea className="h-[600px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dict.logs.table.headers.timestamp}</TableHead>
              <TableHead>{dict.logs.table.headers.level}</TableHead>
              <TableHead>{dict.logs.table.headers.event}</TableHead>
              <TableHead>{dict.logs.table.headers.form}</TableHead>
              <TableHead>{dict.logs.table.headers.user}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">{dict.logs.title}</p>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {logs.length === 0 ? (
                    <div>
                      <p>{dict.logs.metadata.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dict.logs.metadata.description}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>{dict.logs.filters.searchPlaceholder}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dict.logs.filters.level.title}
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, index) => (
                <TableRow key={`${log.timestamp}-${index}`}>
                  <TableCell className="whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getLevelColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="max-w-[150px] truncate">
                            {log.event ? EVENT_DISPLAY_NAMES[log.event] : "-"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{dict.logs.table.tooltips.event}: {log.event || "-"}</p>
                          {log.rawMessage && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {dict.logs.table.tooltips.raw}: {log.rawMessage}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {log.formTitle ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="max-w-[200px] truncate">
                              {log.formTitle}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{log.formTitle}</p>
                            {log.formId && (
                              <p className="text-xs text-muted-foreground">
                                {dict.logs.table.tooltips.form.id}: {log.formId}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="max-w-[150px] truncate">
                            {log.userName || log.userId || "-"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{dict.logs.table.tooltips.user.title}: {log.userName || "-"}</p>
                          {log.userId && (
                            <p className="text-xs text-muted-foreground">
                              {dict.logs.table.tooltips.user.id}: {log.userId}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
} 