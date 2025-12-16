import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { CheckCircle2, FileText, Home, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { ScanRecord } from '@shared/types';
export function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    const fetchScanData = async () => {
      setIsLoading(true);
      try {
        const data = await api<ScanRecord>(`/api/scans/${id}`);
        setScan(data);
      } catch (error) {
        console.error("Failed to fetch scan data", error);
        // Handle error, maybe show a message
      } finally {
        setIsLoading(false);
      }
    };
    fetchScanData();
  }, [id]);
  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.5, 
        ease: "easeOut" 
      } 
    },
  };
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative">
      <ThemeToggle className="!fixed" />
      <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-transparent to-slate-100/20 dark:from-green-900/10 dark:to-slate-900/10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="py-8 md:py-10 lg:py-12 flex justify-center">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-lg"
          >
            <Card className="shadow-lg text-center">
              <CardHeader>
                <div className="mx-auto bg-green-100 dark:bg-green-900/50 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl md:text-3xl">¡Archivo subido correctamente!</CardTitle>
                <CardDescription>Your file has been received and is being processed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </div>
                ) : scan ? (
                  <div className="p-4 bg-muted/50 rounded-lg text-sm">
                    <p className="font-semibold break-all">
                      Filename: <span className="font-normal text-muted-foreground">{scan.filename}</span>
                    </p>
                    <p className="font-semibold">
                      Status: <span className="font-normal text-muted-foreground capitalize flex items-center justify-center gap-2">
                        {scan.status}
                        {scan.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-destructive">Could not load scan details.</p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild className="w-full sm:w-auto" disabled={!id}>
                    <Link to={`/scans/${id}`}><FileText className="mr-2 h-4 w-4" /> View Scan Details</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link to="/"><Home className="mr-2 h-4 w-4" /> Upload Another File</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}