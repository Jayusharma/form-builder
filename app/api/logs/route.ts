import { NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { db } from "@/lib/db";

// Schema for validating log file names
const LogFileNameSchema = z.string().regex(/^(combined|error)-\d{4}-\d{2}-\d{2}\.log$/);

// Function to remove ANSI color codes
function stripAnsiCodes(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Function to fetch user names for a list of user IDs
async function fetchUserNames(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  
  const uniqueUserIds = [...new Set(userIds)];
  const users = await db.user.findMany({
    where: {
      id: {
        in: uniqueUserIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  return users.reduce((acc, user) => ({
    ...acc,
    [user.id]: user.name || 'Unknown User'
  }), {});
}

export async function GET() {
  try {
    // Verify user authentication and authorization
    const session = await auth();
    if (!session?.user) {
      console.log("Auth failed: No session or user");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only allow SADMIN and ADMIN to view logs
    if (!["SADMIN",].includes(session.user.role)) {
      console.log("Auth failed: Invalid role", { role: session.user.role });
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Read the logs directory
    const logsDir = path.join(process.cwd(), "logs");
    console.log("Reading logs directory:", logsDir);
    
    try {
      const files = await fs.readdir(logsDir);
      console.log("Found log files:", files);

      // Filter and validate log files
      const logFiles = files.filter(file => LogFileNameSchema.safeParse(file).success);
      console.log("Valid log files:", logFiles);

      if (logFiles.length === 0) {
        console.log("No valid log files found");
        return NextResponse.json({ logs: [] });
      }

      // Read and combine logs from all files
      const allLogs = await Promise.all(
        logFiles.map(async (file) => {
          console.log("Reading file:", file);
          const content = await fs.readFile(path.join(logsDir, file), "utf-8");
          const lines = content.split("\n").filter(Boolean);
          console.log(`Found ${lines.length} lines in ${file}`);
          
          return lines.map(line => {
            const cleanLine = stripAnsiCodes(line);
            // Simple parsing for now
            const parts = cleanLine.split(" ");
            if (parts.length < 3) return null;

            const timestamp = `${parts[0]} ${parts[1]}`;
            const level = parts[2].replace(":", "");
            
            // Try to extract JSON data
            const jsonStart = cleanLine.indexOf("{");
            const jsonEnd = cleanLine.lastIndexOf("}");
            
            if (jsonStart === -1 || jsonEnd === -1) {
              return {
                timestamp,
                level,
                rawMessage: cleanLine
              };
            }

            try {
              const jsonStr = cleanLine.slice(jsonStart, jsonEnd + 1);
              const jsonData = JSON.parse(jsonStr);
              return {
                timestamp,
                level,
                ...jsonData,
                rawMessage: cleanLine
              };
            } catch (e) {
              console.error("JSON parse error:", e);
              return {
                timestamp,
                level,
                rawMessage: cleanLine
              };
            }
          }).filter(Boolean);
        })
      );

      // Combine and sort logs by timestamp
      const logs = allLogs
        .flat()
        .filter(Boolean)
        .sort((a, b) => {
          try {
            const timestampA = new Date(a.timestamp).getTime();
            const timestampB = new Date(b.timestamp).getTime();
            return timestampB - timestampA;
          } catch (e) {
            console.error("Sort error:", e);
            return 0;
          }
        });

      // Extract all user IDs from logs
      const userIds = logs
        .filter(log => log.userId)
        .map(log => log.userId);

      // Fetch user names
      const userNames = await fetchUserNames(userIds);

      // Add user names to logs
      const logsWithUserNames = logs.map(log => ({
        ...log,
        userName: log.userId ? userNames[log.userId] : undefined
      }));

      console.log(`Returning ${logsWithUserNames.length} parsed logs`);
      return NextResponse.json({ logs: logsWithUserNames });
    } catch (error) {
      console.error("Error reading logs directory:", error);
      return NextResponse.json({ error: "Failed to read logs directory" }, { status: 500 });
    }
  } catch (error) {
    console.error("LOGS_FETCH_ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 