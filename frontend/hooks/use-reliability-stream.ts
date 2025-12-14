"use client"

import { useState, useRef, useCallback } from "react"
import { Finding, LogEvent, ReliabilityEventData, ReliabilityEventType } from "@/types/api"

export type ReliabilityState = {
    isRunning: boolean
    currentPhase: string
    logs: LogEvent[]
    findings: Finding[]
    finalReport: string | null
    discoveredTables: string[]
    tableStats: Record<string, any>
    error: string | null
}

const initialState: ReliabilityState = {
    isRunning: false,
    currentPhase: "IDLE",
    logs: [],
    findings: [],
    finalReport: null,
    discoveredTables: [],
    tableStats: {},
    error: null,
}

export function useReliabilityStream() {
    const [state, setState] = useState<ReliabilityState>(initialState)
    const eventSourceRef = useRef<EventSource | null>(null)

    const runCheck = useCallback((tables: string[]) => {
        if (tables.length === 0) return

        // Reset state
        setState({ ...initialState, isRunning: true, currentPhase: "INITIALIZING" })

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
        const tablesParam = tables.join(",")
        const url = `${apiUrl}/stream-report?tables=${tablesParam}`

        const eventSource = new EventSource(url)
        eventSourceRef.current = eventSource

        const eventTypes: ReliabilityEventType[] = [
            "started", "phase_change", "tables_discovered",
            "table_scanned", "table_analyzed", "finding_detected",
            "report_ready", "error", "complete"
        ]

        eventTypes.forEach((type) => {
            eventSource.addEventListener(type, (e: MessageEvent) => {
                const data = JSON.parse(e.data)
                const timestamp = new Date().toLocaleTimeString()

                // 1. Log event
                setState(prev => ({
                    ...prev,
                    logs: [...prev.logs, { type, timestamp, data }]
                }))

                // 2. Handle State Updates
                if (type === "phase_change") {
                    const payload = data as ReliabilityEventData["phase_change"]
                    setState(prev => ({ ...prev, currentPhase: payload.phase.toUpperCase() }))
                }
                else if (type === "tables_discovered") {
                    const payload = data as ReliabilityEventData["tables_discovered"]
                    setState(prev => ({ ...prev, discoveredTables: payload.tables }))
                }
                else if (type === "finding_detected") {
                    const payload = data as ReliabilityEventData["finding_detected"]
                    setState(prev => ({ ...prev, findings: [...prev.findings, payload] }))
                }
                else if (type === "report_ready") {
                    const payload = data as ReliabilityEventData["report_ready"]
                    setState(prev => ({ ...prev, finalReport: payload.response }))
                }
                else if (type === "error") {
                    const payload = data as ReliabilityEventData["error"]
                    setState(prev => ({
                        ...prev,
                        isRunning: false,
                        currentPhase: "ERROR",
                        error: payload.error
                    }))
                    eventSource.close()
                }
                else if (type === "complete") {
                    // Only finish if we've actually reached the reporting phase OR have a non-empty report
                    // The backend emits 'complete' events after each step, and an empty 'report_ready' event initially.
                    setState(prev => {
                        if (prev.finalReport && prev.finalReport.length > 0) {
                            eventSource.close()
                            return { ...prev, isRunning: false, currentPhase: "COMPLETE" }
                        }
                        return prev
                    })
                }
            })
        })

        eventSource.onerror = () => {
            setState(prev => ({
                ...prev,
                isRunning: false,
                currentPhase: "ERROR",
                error: "Connection lost"
            }))
            eventSource.close()
        }

    }, [])

    const stopCheck = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
        setState(prev => ({ ...prev, isRunning: false }))
    }, [])

    return {
        state,
        runCheck,
        stopCheck
    }
}
