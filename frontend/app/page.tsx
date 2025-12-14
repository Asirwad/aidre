"use client"

import * as React from "react"
import { Activity, Play, Terminal as TerminalIcon, AlertTriangle, CheckCircle, Brain, Layers, StopCircle, RefreshCw, X } from "lucide-react"
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
import { fadeIn, staggerContainer, listItem, spring, hoverScale, slideUp } from "@/lib/motion"
import { cn } from "@/lib/utils"

export default function Page() {
  const [selectedTables, setSelectedTables] = React.useState<string[]>([])
  const { state, runCheck, stopCheck, dismissReport } = useReliabilityStream()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll logs with smooth behavior
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [state.logs])

  const handleRun = () => {
    runCheck(selectedTables)
  }

  const getPhaseEffects = (status: string) => {
    switch (status) {
      case "COMPLETE": return "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]"
      case "ERROR": return "bg-destructive/10 text-destructive border-destructive/20 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]"
      case "SCAN": return "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
      case "ANALYZE": return "bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]"
      case "REPORT": return "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]"
      default: return "bg-muted/50 text-muted-foreground border-transparent"
    }
  }

  return (
    <div className="flex flex-col h-full bg-background transition-colors duration-500">
      {/* Header - Glassmorphism */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/60 backdrop-blur-xl px-4 sticky top-0 z-20 transition-all duration-300"
      >
        <SidebarTrigger className="-ml-1 hover:bg-muted/50 transition-colors" />
        <Separator orientation="vertical" className="mr-2 h-4 opacity-50" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="font-medium tracking-tight hover:text-primary transition-colors">AIDRE</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold tracking-tight text-primary">Mission Control</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </motion.header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] overflow-hidden">

        {/* Left Column: Controls & Status */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, ...spring }}
          className="w-full lg:w-[340px] border-r bg-card/30 p-5 flex flex-col gap-6 overflow-hidden backdrop-blur-sm"
        >
          <div className="flex-1 min-h-0 flex flex-col">
            <DataTableSelector
              selectedTables={selectedTables}
              onSelectionChange={setSelectedTables}
            />
          </div>

          <Card className="flex-col shadow-none border bg-card/40 backdrop-blur-sm overflow-hidden shrink-0">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                <Activity className="h-3.5 w-3.5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <motion.div
                layout
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all duration-500",
                  getPhaseEffects(state.currentPhase)
                )}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-70 font-semibold tracking-wider">Current Phase</span>
                  <span className="text-lg font-black tracking-tight">{state.currentPhase}</span>
                </div>
                {state.isRunning && (
                  <div className="relative">
                    <Activity className="h-6 w-6 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                    </span>
                  </div>
                )}
              </motion.div>

              <AnimatePresence>
                {state.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 flex items-start gap-2 overflow-hidden"
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="font-medium">{state.error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                size="lg"
                className={cn(
                  "w-full mt-2 h-12 text-base font-bold shadow-lg transition-all duration-300",
                  state.isRunning
                    ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20"
                    : "bg-primary hover:bg-primary/90 shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                )}
                onClick={state.isRunning ? stopCheck : handleRun}
                disabled={selectedTables.length === 0 && !state.isRunning}
              >
                {state.isRunning ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <StopCircle className="h-5 w-5" />
                    Abort Sequence
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    Initiate Scan
                  </motion.div>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Center: Live Feed & Findings */}
        <div className="flex-1 flex flex-col min-w-0 bg-background/50 backdrop-blur-3xl">
          {/* Top: Terminal Logs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-1/2 flex flex-col border-b border-border/50"
          >
            <div className="flex items-center justify-between px-6 py-3 bg-muted/10 border-b border-border/50 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground tracking-tight">
                <div className="p-1.5 bg-muted/50 rounded-md">
                  <TerminalIcon className="h-4 w-4" />
                </div>
                EVENT STREAM
              </div>
              {state.isRunning && (
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                  Live Connection
                </Badge>
              )}
            </div>
            <div className="flex-1 overflow-hidden relative group bg-black/5 dark:bg-black/20">
              <ScrollArea className="h-full font-mono text-xs p-6" ref={scrollRef}>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="space-y-1.5"
                >
                  {state.logs.length === 0 && (
                    <motion.div
                      variants={fadeIn}
                      className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-4 mt-20"
                    >
                      <TerminalIcon className="h-12 w-12 opacity-20" />
                      <p className="text-sm font-medium">Awaiting command input...</p>
                    </motion.div>
                  )}
                  {state.logs.map((log, i) => (
                    <motion.div
                      key={i}
                      variants={listItem}
                      layout
                      className="flex gap-4 p-1.5 hover:bg-muted/10 rounded-md transition-colors border border-transparent hover:border-border/30"
                    >
                      <span className="text-muted-foreground/40 select-none w-20 text-right shrink-0 font-light">{log.timestamp}</span>
                      <span className={cn("font-bold shrink-0 w-32 tracking-tight",
                        log.type === 'error' ? 'text-destructive' :
                          log.type === 'finding_detected' ? 'text-yellow-500' :
                            log.type === 'complete' ? 'text-green-500' :
                              'text-primary'
                      )}>{log.type}</span>
                      <span className="text-foreground/70 break-all font-light">
                        {JSON.stringify(log.data)}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </ScrollArea>
            </div>
          </motion.div>

          {/* Bottom: Findings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-1/2 flex flex-col bg-card/20"
          >
            <div className="flex items-center justify-between px-6 py-3 bg-muted/10 border-b border-border/50 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground tracking-tight">
                <div className="p-1.5 bg-muted/50 rounded-md">
                  <Brain className="h-4 w-4" />
                </div>
                DETECTED ANOMALIES
              </div>
              <Badge variant="secondary" className="font-mono shadow-sm">{state.findings.length} Issues</Badge>
            </div>
            <ScrollArea className="flex-1 p-6">
              {state.findings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-3">
                  <CheckCircle className="h-10 w-10 opacity-20" />
                  <span className="text-sm">System healthy. No anomalies detected.</span>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  <AnimatePresence mode="popLayout">
                    {state.findings.map((finding) => (
                      <motion.div
                        key={finding.finding_id}
                        variants={listItem}
                        layout
                        whileHover={hoverScale}
                        className="p-5 rounded-xl border bg-card hover:bg-card/80 transition-colors shadow-sm hover:shadow-md cursor-default group relative overflow-hidden"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${finding.severity === 'critical' ? 'bg-destructive' :
                          finding.severity === 'high' ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`} />

                        <div className="flex items-start justify-between mb-3 pl-2">
                          <Badge variant={
                            finding.severity === 'critical' ? 'destructive' :
                              finding.severity === 'high' ? 'outline' : // Should optimize high variant
                                'secondary'
                          } className={cn(
                            "uppercase text-[10px] tracking-wider font-bold shadow-none",
                            finding.severity === 'high' && "text-orange-500 border-orange-500/20 bg-orange-500/10"
                          )}>
                            {finding.severity}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono opacity-60">{finding.finding_type}</span>
                        </div>
                        <h4 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors pl-2 pr-2">{finding.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-3 pl-2 leading-relaxed">
                          {finding.description}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </ScrollArea>
          </motion.div>
        </div>

        {/* Right Drawer: Report */}
        <AnimatePresence>
          {state.finalReport && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={dismissReport}
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: "100%", opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-y-0 right-0 w-full lg:w-[600px] bg-background/95 backdrop-blur-xl border-l shadow-2xl z-40 flex flex-col mt-14"
              >
                <div className="p-6 border-b flex items-center justify-between bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Reliability Report</h2>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Execution Complete</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={dismissReport} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-8">
                  <motion.div
                    variants={fadeIn}
                    initial="hidden"
                    animate="show"
                    className="prose dark:prose-invert prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {state.finalReport}
                    </ReactMarkdown>
                  </motion.div>
                </ScrollArea>
                <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
                  <Button variant="outline" onClick={dismissReport}>Close Report</Button>
                  <Button onClick={() => window.print()}>Export PDF</Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
