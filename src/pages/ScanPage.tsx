import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { ArrowLeft, FileClock, Loader2, Calendar as CalendarIcon, X as ClearIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ScanCard } from '@/components/ScanCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { ScanRecord, ScanStatus } from '@shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
const filterSchema = z.object({
  dateRange: z.object({ from: z.date().optional(), to: z.date().optional() }).optional(),
  status: z.string().optional(),
});
type FilterValues = z.infer<typeof filterSchema>;
export function ScanPage() {
  const [allScans, setAllScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({});
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
  });
  useEffect(() => {
    const fetchAllScans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // In a real app, pagination would be server-side. For this demo, we fetch all and filter client-side.
        const result = await api<{ items: ScanRecord[] }>('/api/scans?limit=100');
        setAllScans(result.items);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch scans';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllScans();
  }, []);
  const filteredScans = useMemo(() => {
    return allScans.filter(scan => {
      const { dateRange, status } = filters;
      if (status && scan.status !== status) return false;
      if (dateRange?.from && new Date(scan.ts) < dateRange.from) return false;
      if (dateRange?.to && new Date(scan.ts) > new Date(dateRange.to.getTime() + 86400000 - 1)) return false; // include the whole 'to' day
      return true;
    });
  }, [allScans, filters]);
  const onFilterSubmit = (data: FilterValues) => {
    setFilters(data);
  };
  const clearFilters = () => {
    form.reset({ dateRange: { from: undefined, to: undefined }, status: '' });
    setFilters({});
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <ThemeToggle />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <header className="mb-8 md:mb-12">
              <div className="flex items-center justify-between">
                <h1 className="text-4xl md:text-5xl font-display font-bold">Scan History</h1>
                <Button asChild variant="outline">
                  <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload</Link>
                </Button>
              </div>
            </header>
            <Card className="mb-8">
              <CardContent className="p-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onFilterSubmit)} className="flex flex-col md:flex-row items-center gap-4">
                    <FormField
                      control={form.control}
                      name="dateRange"
                      render={({ field }) => (
                        <FormItem className="flex flex-col w-full md:w-auto">
                          <FormLabel>Date Range</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn("w-full md:w-[300px] justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value?.from ? (
                                  field.value.to ? (
                                    <>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>
                                  ) : (
                                    format(field.value.from, "LLL dd, y")
                                  )
                                ) : (
                                  <span>Pick a date range</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={field.value?.from}
                                selected={field.value as DateRange}
                                onSelect={field.onChange}
                                numberOfMonths={2}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="w-full md:w-auto">
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="All Statuses" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="flagged">Flagged</SelectItem>
                              <SelectItem value="error">Error</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end gap-2 w-full md:w-auto pt-2 md:pt-0">
                      <Button type="submit" className="w-full md:w-auto">Filter</Button>
                      <Button type="button" variant="ghost" onClick={clearFilters} className="w-full md:w-auto">Clear</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <main>
              {error && (
                <div className="text-center py-10 text-destructive bg-destructive/10 rounded-lg">
                  <p>Error: {error}</p>
                  <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
                </div>
              )}
              {!error && (
                <>
                  <AnimatePresence>
                    <motion.div
                      key={JSON.stringify(filters)}
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                      {isLoading && Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                      {!isLoading && filteredScans.map(scan => (
                        <motion.div key={scan.id} variants={itemVariants}>
                          <ScanCard scan={scan} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                  {!isLoading && filteredScans.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                      <FileClock className="mx-auto h-16 w-16 mb-4" />
                      <h2 className="text-2xl font-semibold mb-2">No Scans Found</h2>
                      <p>{Object.keys(filters).length > 0 ? "No scans match your current filters." : "You haven't submitted any files for scanning yet."}</p>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
      <Toaster richColors closeButton />
    </>
  );
}