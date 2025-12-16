import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import {
  ArrowLeft, File as FileIcon, Clock, ShieldCheck, ShieldAlert, ShieldX, Loader2, Trash2, RefreshCw, Info, Download
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { ScanRecord, ScanStatus, ScanVerdict } from '@shared/types';
const statusConfig: Record<ScanStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  processing: { label: 'Processing', icon: Loader2, color: 'text-blue-500', badgeVariant: 'secondary' },
  completed: { label: 'Completed', icon: ShieldCheck, color: 'text-green-500', badgeVariant: 'default' },
  flagged: { label: 'Flagged', icon: ShieldAlert, color: 'text-yellow-500', badgeVariant: 'outline' },
  error: { label: 'Error', icon: ShieldX, color: 'text-red-500', badgeVariant: 'destructive' },
};
const verdictConfig: Record<ScanVerdict, { color: string; badgeVariant: 'default' | 'destructive' | 'outline' }> = {
    clean: { color: 'text-green-500', badgeVariant: 'default' },
    suspicious: { color: 'text-yellow-500', badgeVariant: 'outline' },
    malicious: { color: 'text-red-500', badgeVariant: 'destructive' },
};
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
export function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const fetchScan = useCallback(async (scanId: string) => {
    setIsLoading(true);
    try {
      const data = await api<ScanRecord>(`/api/scans/${scanId}`);
      setScan(data);
      if (data.status === 'processing') {
        setTimeout(() => fetchScan(scanId), 3000);
      }
    } catch (error) {
      toast.error('Failed to fetch scan details.');
      navigate('/scans');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    if (id) fetchScan(id);
  }, [id, fetchScan]);
  const handleRetry = async () => {
    if (!id) return;
    setIsActionLoading(true);
    try {
      await api(`/api/scans/${id}/retry`, { method: 'POST' });
      toast.success('Scan re-initiated.');
      fetchScan(id);
    } catch (error) {
      toast.error('Failed to retry scan.');
    } finally {
      setIsActionLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!id) return;
    setIsActionLoading(true);
    try {
      await api(`/api/scans/${id}`, { method: 'DELETE' });
      toast.success('Scan deleted.');
      navigate('/scans');
    } catch (error) {
      toast.error('Failed to delete scan.');
      setIsActionLoading(false);
    }
  };
  const handleDownload = () => {
    if (!scan) return;
    const dataStr = JSON.stringify(scan, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan-metadata-${scan.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  if (isLoading || !scan) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="py-8 md:py-10 lg:py-12">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <div className="space-y-8">
            <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }
  const config = statusConfig[scan.status] || statusConfig.error;
  const Icon = config.icon;
  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <ThemeToggle />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <header className="mb-8 flex items-center justify-between gap-4">
              <h1 className="text-3xl md:text-4xl font-display font-bold break-all">{scan.filename}</h1>
              <Button asChild variant="outline" size="sm" className="flex-shrink-0">
                <Link to="/scans"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Link>
              </Button>
            </header>
            <main className="space-y-8">
              <Card>
                <CardHeader><CardTitle>Scan Summary</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center"><Icon className={cn('mr-3 h-6 w-6 flex-shrink-0', config.color, scan.status === 'processing' && 'animate-spin')} /><div><p className="text-sm text-muted-foreground">Status</p><Badge variant={config.badgeVariant}>{config.label}</Badge></div></div>
                  <div className="flex items-center"><ShieldCheck className={cn('mr-3 h-6 w-6 flex-shrink-0', scan.summary?.verdict ? verdictConfig[scan.summary.verdict].color : 'text-muted-foreground')} /><div><p className="text-sm text-muted-foreground">Verdict</p>{scan.summary?.verdict ? <Badge variant={verdictConfig[scan.summary.verdict].badgeVariant}>{scan.summary.verdict}</Badge> : <p className="font-medium">N/A</p>}</div></div>
                  <div className="flex items-center"><FileIcon className="mr-3 h-6 w-6 flex-shrink-0 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">File Size</p><p className="font-medium">{formatBytes(scan.size)}</p></div></div>
                  <div className="flex items-center"><Clock className="mr-3 h-6 w-6 flex-shrink-0 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Timestamp</p><p className="font-medium">{new Date(scan.ts).toLocaleString()}</p></div></div>
                </CardContent>
              </Card>
              {scan.fields && Object.keys(scan.fields).length > 0 && (
                <Card><CardHeader><CardTitle>Submitted Form Data</CardTitle></CardHeader><CardContent><dl className="divide-y divide-border">{Object.entries(scan.fields).map(([key, value]) => (<div key={key} className="py-3 grid grid-cols-3 gap-4"><dt className="text-sm font-medium text-muted-foreground capitalize">{key}</dt><dd className="text-sm col-span-2">{value}</dd></div>))}</dl></CardContent></Card>
              )}
              <Card><CardHeader><CardTitle>Scan Report</CardTitle></CardHeader><CardContent>{scan.summary?.reasons && scan.summary.reasons.length > 0 ? (<ul className="list-disc list-inside space-y-2">{scan.summary.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>) : (<div className="text-center text-muted-foreground py-6"><Info className="mx-auto h-8 w-8 mb-2" /><p>{scan.status === 'processing' ? 'Report is being generated...' : 'No specific issues found.'}</p></div>)}</CardContent></Card>
              <Card>
                <CardHeader><CardTitle>Scan Timeline</CardTitle></CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>File Uploaded</AccordionTrigger>
                      <AccordionContent>Timestamp: {new Date(scan.ts).toLocaleString()}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Scan In Progress</AccordionTrigger>
                      <AccordionContent>{scan.status === 'processing' ? `Started around ${new Date(scan.ts).toLocaleTimeString()}` : 'Processing complete.'}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Scan Completed</AccordionTrigger>
                      <AccordionContent>{scan.status === 'completed' || scan.status === 'flagged' || scan.status === 'error' ? `Finished with status: ${scan.status}` : 'Pending...'}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                  <Button onClick={handleRetry} disabled={isActionLoading || scan.status === 'processing'}><RefreshCw className={cn('mr-2 h-4 w-4', isActionLoading && 'animate-spin')} />Retry Scan</Button>
                  <Button onClick={handleDownload} variant="secondary"><Download className="mr-2 h-4 w-4" />Download Metadata</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" disabled={isActionLoading}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the scan record.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </div>
      <Toaster richColors closeButton />
    </>
  );
}