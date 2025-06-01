/**
 * LogsViewer Component
 * 
 * A comprehensive log viewing interface that displays system logs with filtering,
 * searching, and export capabilities. The component provides real-time log monitoring
 * with support for different log levels and event types.
 */

"use client";

import { useState, useEffect } from "react";
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
import { useDictionary } from "@/hooks/useDictionary";

/**
 * LogEntry Interface
 * Defines the structure of a log entry in the system
 */
interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  event?: string;
  formId?: string;
  userId?: string;
  userName?: string;
  formTitle?: string;
  additionalInfo?: Record<string, any>;
  rawMessage?: string;
}

export function LogsViewer() {
  const dict = useDictionary();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  /**
   * Fetches logs from the API endpoint
   * Handles loading states and error conditions
   */
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching logs...");
      
      const response = await fetch("/api/logs");
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Error response:", errorData);
        throw new Error(errorData?.error || dict.logs.errors.fetchFailed.replace("{0}", response.status.toString()));
      }
      
      const data = await response.json();
      console.log("Received logs:", data);
      
      if (!Array.isArray(data.logs)) {
        console.error("Invalid logs data:", data);
        throw new Error(dict.logs.errors.invalidData);
      }
      
      setLogs(data.logs);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err instanceof Error ? err.message : dict.logs.errors.fetchFailed.replace("{0}", ""));
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs on component mount
  useEffect(() => {
    fetchLogs();
  }, []);

  /**
   * Filters logs based on search query, level, and event type
   * Returns filtered array of logs matching all criteria
   */
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = searchQuery
      ? Object.values(log).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true;

    const matchesLevel =
      levelFilter === "all" ? true : log.level === levelFilter;

    const matchesEvent =
      eventFilter === "all" ? true : log.event === eventFilter;

    return matchesSearch && matchesLevel && matchesEvent;
  });

  /**
   * Returns appropriate color classes for different log levels
   * @param level - The log level to get color for
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
   * @param timestamp - The timestamp string to format
   */
  const formatTimestamp = (timestamp: string) => {
    try {
      // Handle the custom timestamp format (YYYY-MM-DD HH:mm:ss:SSSS)
      const [datePart, timePart] = timestamp.split(" ");
      const [hours, minutes, seconds] = timePart.split(":");
      const date = new Date(datePart);
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
      return format(date, "MMM d, yyyy HH:mm:ss");
    } catch {
      return timestamp;
    }
  };

  /**
   * Escapes special characters in CSV values
   * @param value - The value to escape for CSV format
   */
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // If the value contains commas, quotes, or newlines, wrap it in quotes and escape existing quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  /**
   * Exports filtered logs to CSV format
   * Creates and triggers download of CSV file
   */
  const exportLogs = () => {
    try {
      const csvContent = [
        // CSV Header
        ["Timestamp", "Level", "Event", "Form", "User",].join(","),
        // CSV Rows
        ...filteredLogs.map((log) => [
          escapeCsvValue(formatTimestamp(log.timestamp)),
          escapeCsvValue(log.level),
          escapeCsvValue(log.event || ""),
          escapeCsvValue(log.formTitle || ""),
          escapeCsvValue(log.userName || log.userId || "-"),
        ].join(","))
      ].join("\n");

      // Create blob with proper encoding
      const blob = new Blob(["\ufeff", csvContent], { 
        type: "text/csv;charset=utf-8;" 
      });
      
      // Create download link
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const timestamp = format(new Date(), "yyyy-MM-dd-HH-mm");
      
      link.setAttribute("href", url);
      link.setAttribute("download", `form-logs-${timestamp}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting logs:", error);
      // You might want to show an error message to the user here
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
          {/* <Select value={levelFilter} onValueChange={setLevelFilter}>
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
          </Select> */}
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={dict.logs.filters.event.title} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dict.logs.filters.event.all}</SelectItem>
              <SelectItem value="FORM_CREATED">{dict.logs.filters.event.formCreated}</SelectItem>
              <SelectItem value="FORM_SUBMITTED">{dict.logs.filters.event.formSubmitted}</SelectItem>
              <SelectItem value="FORM_MADE_PRIVATE">{dict.logs.filters.event.formMadePrivate}</SelectItem>
              <SelectItem value="FORM_MADE_PUBLIC">{dict.logs.filters.event.formMadePublic}</SelectItem>
              <SelectItem value="FORM_DELETED">{dict.logs.filters.event.formDeleted}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchLogs}
            disabled={loading}
            title={dict.logs.actions.refresh}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={exportLogs}
            disabled={loading || filteredLogs.length === 0}
            title={dict.logs.actions.export}
          >
            <Download className="h-4 w-4" />
          </Button>
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
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">{dict.logs.table.loading}</p>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {logs.length === 0 ? (
                    <div>
                      <p>{dict.logs.table.noLogs.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dict.logs.table.noLogs.description}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>{dict.logs.table.noResults.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dict.logs.table.noResults.description}
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
                            {log.event || "-"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{dict.logs.table.tooltips.event.replace("{0}", log.event || "N/A")}</p>
                          {log.rawMessage && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {dict.logs.table.tooltips.raw.replace("{0}", log.rawMessage)}
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
                                {dict.logs.table.tooltips.form.id.replace("{0}", log.formId)}
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
                          <p>{dict.logs.table.tooltips.user.title.replace("{0}", log.userName || "N/A")}</p>
                          {log.userId && (
                            <p className="text-xs text-muted-foreground">
                              {dict.logs.table.tooltips.user.id.replace("{0}", log.userId)}
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