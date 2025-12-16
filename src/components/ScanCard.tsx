import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { File, Clock, ShieldCheck, ShieldAlert, ShieldX, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ScanRecord, ScanStatus } from '@shared/types';
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
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
interface ScanCardProps {
  scan: ScanRecord;
}
export function ScanCard({ scan }: ScanCardProps) {
  const config = statusConfig[scan.status] || statusConfig.error;
  const Icon = config.icon;
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full transition-shadow duration-300 hover:shadow-xl dark:hover:shadow-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg font-semibold break-all">{scan.filename}</CardTitle>
            <Badge variant={config.badgeVariant} className="flex-shrink-0">{config.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Icon className={cn('mr-2 h-5 w-5', config.color, scan.status === 'processing' && 'animate-spin')} />
            <span>
              {scan.summary?.verdict ? `Verdict: ${scan.summary.verdict}` : 'Awaiting analysis...'}
            </span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <File className="mr-2 h-5 w-5" />
            <span>{formatBytes(scan.size)}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-5 w-5" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{new Date(scan.ts).toLocaleDateString()}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{new Date(scan.ts).toLocaleString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild size="sm" className="w-full">
            <Link to={`/scans/${scan.id}`}>View Details</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}