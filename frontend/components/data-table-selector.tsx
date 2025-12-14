"use client"

import * as React from "react"
import { Check, Database } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

    if (loading) {
        return <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    }

    if (error) {
        return <div className="text-destructive text-sm">Error loading tables: {error}</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Data Inventory</CardTitle>
                <CardDescription>Select tables to monitor</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
                {tables.map((table) => (
                    <div
                        key={table}
                        onClick={() => toggleTable(table)}
                        className={cn(
                            "flex items-center space-x-4 rounded-md border p-3 cursor-pointer transition-all hover:bg-accent",
                            selectedTables.includes(table) ? "border-primary bg-accent/50" : "border-transparent"
                        )}
                    >
                        <Database className="h-5 w-5 opacity-50" />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{table}</p>
                        </div>
                        {selectedTables.includes(table) && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
