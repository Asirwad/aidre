export type Severity = "low" | "medium" | "high" | "critical";

export type Finding = {
    finding_id: string;
    table_name: string;
    finding_type: string;
    severity: Severity;
    title: string;
    description: string;
    evidence: Record<string, any>;
    detected_at: string;
};

export type TableStats = {
    table_name: string;
    row_count: number;
    null_counts?: Record<string, number>;
    freshness_hours?: number;
};

export type ReliabilityEventData = {
    // Started
    started: { run_id: string };
    // Phase Change
    phase_change: { phase: string; status: string };
    // Discovery
    tables_discovered: { tables: string[] };
    // Scanning
    table_scanned: { table: string; row_count: number };
    // Analysis
    table_analyzed: { table: string; is_healthy: boolean; finding_count: number };
    // Findings
    finding_detected: Finding;
    // Report
    report_ready: { summary: string; response: string };
    // Completion
    complete: { status: string };
    // Error
    error: { error: string };
};

export type ReliabilityEventType = keyof ReliabilityEventData;

export interface LogEvent {
    type: ReliabilityEventType;
    timestamp: string;
    data: any; // Narrowed in UI based on type
}
