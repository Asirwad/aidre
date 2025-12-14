"use client"

import * as React from "react"
import { Check, Database, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { staggerContainer, listItem, hoverScale, hoverLift } from "@/lib/motion"

export function DataTableSelector({
    selectedTables,
    onSelectionChange
}: {
    selectedTables: string[],
    onSelectionChange: (tables: string[]) => void
}) {
    const [tables, setTables] = React.useState<string[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        async function fetchTables() {
            try {
                // Simulate network delay for effect
                await new Promise(resolve => setTimeout(resolve, 600))

                const res = await fetch('http://localhost:8000/api/v1/tables')
                if (!res.ok) throw new Error('Failed to fetch tables')
                const data = await res.json()
                setTables(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }
        fetchTables()
    }, [])

    const toggleTable = (table: string) => {
        if (selectedTables.includes(table)) {
            onSelectionChange(selectedTables.filter(t => t !== table))
        } else {
            onSelectionChange([...selectedTables, table])
        }
    }

    return (
        <Card className="flex flex-col h-full border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    Data Inventory
                    {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
                </CardTitle>
                <CardDescription>Select tables to monitor</CardDescription>
            </CardHeader>
            <CardContent className="px-0 flex-1 overflow-auto">
                {loading ? (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        className="space-y-2"
                    >
                        {[1, 2, 3].map((i) => (
                            <motion.div variants={listItem} key={i}>
                                <Skeleton className="h-12 w-full rounded-lg bg-muted/50" />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : error ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-destructive text-sm p-4 border border-destructive/20 rounded-lg bg-destructive/5"
                    >
                        Error loading tables: {error}
                    </motion.div>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        className="grid gap-2"
                    >
                        {tables.map((table) => (
                            <motion.div
                                key={table}
                                variants={listItem}
                                whileHover={hoverScale}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleTable(table)}
                                className={cn(
                                    "flex items-center space-x-4 rounded-lg border p-3 cursor-pointer transition-colors relative overflow-hidden group",
                                    selectedTables.includes(table)
                                        ? "border-primary/50 bg-primary/10"
                                        : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-full transition-colors",
                                    selectedTables.includes(table) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                )}>
                                    <Database className="h-4 w-4" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className={cn(
                                        "text-sm font-medium leading-none transition-colors",
                                        selectedTables.includes(table) ? "text-primary" : "text-foreground"
                                    )}>{table}</p>
                                    <p className="text-[10px] text-muted-foreground">SNOWFLAKE_DB.BUSINESS_DATA</p>
                                </div>
                                <AnimatePresence>
                                    {selectedTables.includes(table) && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        >
                                            <Check className="h-4 w-4 text-primary" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Scanning Effect Background if selected? Maybe too much. Keep it clean. */}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </CardContent>
        </Card>
    )
}
