import { Metadata } from "next";
import { LogsViewer } from "@/components/logs/LogsViewer";

export const metadata: Metadata = {
  title: "Form Logs | Admin Dashboard",
  description: "View and analyze form activity logs",
};

export default function LogsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Activity Logs</h1>
          <p className="text-muted-foreground">
            Monitor form creation, submissions, and other activities
          </p>
        </div>
      </div>
      <LogsViewer />
    </div>
  );
} 