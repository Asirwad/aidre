"use client"

import * as React from "react"
import { Activity, Play, Terminal as TerminalIcon, AlertTriangle, CheckCircle, Brain, Layers } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/theme-toggle"
import { DataTableSelector } from "@/components/data-table-selector"
import { useReliabilityStream } from "@/hooks/use-reliability-stream"

export default function Page() {
  const [selectedTables, setSelectedTables] = React.useState<string[]>([])
  const { state, runCheck, stopCheck } = useReliabilityStream()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [state.logs])

  const handleRun = () => {
    runCheck(selectedTables)
  }

  const getPhaseColor = (status: string) => {
    switch (status) {
      case "COMPLETE": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "ERROR": return "bg-red-500/10 text-red-500 border-red-500/20"
      case "SCAN": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "ANALYZE": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "REPORT": return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default: return ""
    }
  }

  return (
    <div className="flex flex-col h-full bg-background transition-colors duration-300">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4 sticky top-0 z-10 transition-colors">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">AIDRE</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Mission Control</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] overflow-hidden">

        {/* Left Column: Controls & Status */}
        <div className="w-full lg:w-[320px] border-r bg-card/50 p-4 flex flex-col gap-4 overflow-y-auto">
          <DataTableSelector
            selectedTables={selectedTables}
            onSelectionChange={setSelectedTables}
          />

          <Card className="flex-col shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                <Activity className="h-4 w-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className={`flex items-center justify-between p-3 rounded-md border ${getPhaseColor(state.currentPhase) || "bg-muted"}`}>
                <span className="text-sm font-bold">{state.currentPhase}</span>
                {state.isRunning && <Activity className="h-4 w-4 animate-pulse" />}
              </div>

              {state.error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              <Button
                size="lg"
                className="w-full mt-2 gap-2 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
                onClick={state.isRunning ? stopCheck : handleRun}
                disabled={selectedTables.length === 0 && !state.isRunning}
                variant={state.isRunning ? "destructive" : "default"}
              >
                {state.isRunning ? (
                  <>Stop Process</>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Initiate Scan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Center: Live Feed & Findings */}
        <div className="flex-1 flex flex-col min-w-0 bg-background/50">
          {/* Top: Terminal Logs */}
          <div className="h-1/2 flex flex-col border-b">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TerminalIcon className="h-4 w-4" />
                EVENT STREAM
              </div>
              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">Live</Badge>
            </div>
            <div className="flex-1 overflow-hidden relative group">
              <ScrollArea className="h-full font-mono text-xs p-4" ref={scrollRef}>
                <div className="space-y-1" ref={scrollRef}>
                  {state.logs.length === 0 && (
                    <div className="text-muted-foreground/50 italic p-4 text-center">
                                    // Awaiting command input...
                    </div>
                  )}
                  {state.logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 py-0.5 hover:bg-muted/50 rounded px-1 transition-colors"
                    >
                      <span className="text-muted-foreground opacity-50 select-none w-16 text-right shrink-0">{log.timestamp}</span>
                      <span className={`font-bold shrink-0 w-32 ${log.type === 'error' ? 'text-destructive' :
                          log.type === 'finding_detected' ? 'text-yellow-500' :
                            log.type === 'complete' ? 'text-green-500' :
                              'text-primary'
                        }`}>{log.type}</span>
                      <span className="text-foreground/80 break-all opacity-80">
                        {JSON.stringify(log.data)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Bottom: Findings */}
          <div className="h-1/2 flex flex-col bg-card/30">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Brain className="h-4 w-4" />
                DETECTED ANOMALIES
                <Badge variant="secondary" className="ml-2">{state.findings.length}</Badge>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              {state.findings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                  <CheckCircle className="h-8 w-8 opacity-20" />
                  No issues detected
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {state.findings.map((finding) => (
                    <motion.div
                      key={finding.finding_id}
                      layout
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all cursor-default group shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={
                          finding.severity === 'critical' ? 'destructive' :
                            finding.severity === 'high' ? 'destructive' :
                              'outline'
                        } className="uppercase text-[10px]">
                          {finding.severity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">{finding.finding_type}</span>
                      </div>
                      <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{finding.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {finding.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Right Drawer: Report */}
        <AnimatePresence>
          {state.finalReport && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute inset-y-0 right-0 w-full lg:w-1/3 bg-background border-l shadow-2xl z-20 flex flex-col mt-14"
            >
              <div className="p-4 border-b flex items-center justify-between bg-muted/20 backdrop-blur-sm">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Reliability Report
                </h2>
                <Button variant="ghost" size="sm" onClick={() => state.finalReport = null}>
                  Dismiss
                </Button>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {state.finalReport}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
