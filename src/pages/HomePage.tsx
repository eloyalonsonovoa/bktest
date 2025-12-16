import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { FileClock, Shield, Cloud, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FileUploader } from '@/components/FileUploader';
import { ScanCard } from '@/components/ScanCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { apiForm, api } from '@/lib/api-client';
import type { ScanRecord } from '@shared/types';
const formSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  file: z.instanceof(File).refine(file => file.size > 0, 'File is required.'),
});
type FormValues = z.infer<typeof formSchema>;
export function HomePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [latestScan, setLatestScan] = useState<ScanRecord | null>(null);
  const [isFetchingLatest, setIsFetchingLatest] = useState(true);
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', description: '', file: undefined },
    mode: 'onChange',
  });
  const handleFileSelect = useCallback((file: File) => {
    form.setValue('file', file, { shouldValidate: true });
  }, [form]);
  const onSubmit = async (data: FormValues) => {
    console.log('Form submitted. Preparing to upload...');
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    console.log('FormData created:', {
      file: data.file.name,
      title: data.title,
      description: data.description,
    });
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 95 ? prev + 10 : prev));
    }, 200);
    try {
      //console.log('Calling API /api/scan...');
      //const response = await apiForm<{ id: string }>(`/api/scan`, formData);
      //console.log('API call successful:', response);
      //EMPIEZA AQUI
      // --- PEGA ESTO EN SU LUGAR ---
console.log('Calling API /api/scan...');

// 1. Usamos fetch nativo en vez de apiForm para tener control total
const rawResponse = await fetch('/api/scan', {
  method: 'POST',
  body: formData,
  // No ponemos headers manuales, el navegador pone el multipart correcto
});

// 2. DETECTOR DE BLOQUEO WAF (Aquí está la magia)
if (rawResponse.status === 403) {
  clearInterval(progressInterval); // Paramos la barra de carga
  const htmlBlockPage = await rawResponse.text(); // Leemos el HTML de Cloudflare
  
  // Escribimos ese HTML en la pantalla actual
  document.open();
  document.write(htmlBlockPage);
  document.close();
  return; // ¡Importante! Detenemos la función aquí
}

// 3. Si hay otro error que no es bloqueo
if (!rawResponse.ok) {
  throw new Error(`Error en la subida: ${rawResponse.statusText}`);
}

// 4. Si todo salió bien (no virus), leemos el JSON manualmente
const response = await rawResponse.json() as { id: string };
console.log('API call successful:', response);

      ///ACABA AQUI
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('File uploaded successfully!');
      navigate(`/success/${response.id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Upload failed: ${errorMessage}`);
    }
  };
  const pollScanStatus = useCallback(async (scanId: string) => {
    const poll = async () => {
      try {
        const scan = await api<ScanRecord>(`/api/scans/${scanId}`);
        if (scan.status !== 'processing') {
          setLatestScan(scan);
        } else {
          setLatestScan(scan);
          setTimeout(poll, 3000);
        }
      } catch (error) {
        console.error('Failed to poll scan status.', error);
      }
    };
    poll();
  }, []);
  useEffect(() => {
    const fetchLatest = async () => {
      setIsFetchingLatest(true);
      try {
        const result = await api<{ items: ScanRecord[] }>('/api/scans?limit=1');
        if (result.items.length > 0) {
          const latest = result.items[0];
          if (latest.status === 'processing') {
            pollScanStatus(latest.id);
          } else {
            setLatestScan(latest);
          }
        }
      } catch (error) {
        console.error("Could not fetch latest scan", error);
      } finally {
        setIsFetchingLatest(false);
      }
    };
    fetchLatest();
  }, [pollScanStatus]);
  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };
  return (
    <>
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <ThemeToggle />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 via-transparent to-slate-100/20 dark:from-orange-900/10 dark:to-slate-900/10 pointer-events-none" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <header className="text-center space-y-4 mb-12">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-block"
              >
               {/* <div className="flex items-center justify-center gap-2 text-primary font-bold text-4xl md:text-5xl font-display">
                  <Cloud className="h-10 w-10 text-orange-500" />
                  <span>ScanForm</span>
                  <span className="text-sm text-muted-foreground ml-2">v1.0.3</span>
                </div>*/}

                
                {/* --- BLOQUE NUEVO CON LOGO --- */}
<div className="flex items-center justify-center gap-3">
  {/* Ajusta 'h-16' si quieres el logo más grande o más pequeño */}
  <img 
    src="/logo.png" 
    alt="ScanForm Logo" 
    className="h-16 w-auto object-contain" 
  />
  
  {/* Ajustamos la versión para que quede alineada abajo a la derecha del logo */}
  <span className="text-sm text-muted-foreground self-end mb-2">v1.0.5</span>
</div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                A demo for Cloudflare's Web Content Scanning. Upload a file with your form submission to receive a simulated security report.
              </motion.p>
            </header>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <Card className="shadow-lg transition-shadow hover:shadow-xl">
                  <CardHeader>
                    <CardTitle>Submit a File for Scanning</CardTitle>
                    <CardDescription>Fill in the details and upload your file.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <motion.div variants={fieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Quarterly Report" {...field} disabled={isUploading} className="transition-all" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                        <motion.div variants={fieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="A brief description of the file..." {...field} disabled={isUploading} className="transition-all" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                        <motion.div variants={fieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.7 }}>
                          <FormField
                            control={form.control}
                            name="file"
                            render={() => (
                              <FormItem>
                                <FormLabel>File</FormLabel>
                                <FormControl>
                                  <FileUploader
                                    onUpload={handleFileSelect}
                                    isUploading={isUploading}
                                    progress={uploadProgress}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                        <motion.div variants={fieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.8 }}>
                          <Button type="submit" className="w-full btn-gradient" disabled={isUploading || !form.formState.isValid}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isUploading ? 'Uploading...' : 'Upload and Scan'}
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="space-y-8"
              >
                <Card className="bg-secondary/50">
                  <CardHeader>
                    <CardTitle>Latest Scan Result</CardTitle>
                    <CardDescription>The result of the most recent scan will appear here.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isFetchingLatest ? (
                      <div className="space-y-3 p-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : latestScan ? (
                      <ScanCard scan={latestScan} />
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <Shield className="mx-auto h-12 w-12 mb-4" />
                        <p>No scan results yet. Submit a file to begin.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Scan History</CardTitle>
                    <CardDescription>Review all your previous scan submissions.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <FileClock className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                    <Button asChild>
                      <Link to="/scans">View All Scans</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </main>
            <footer className="text-center mt-16 text-muted-foreground/70 text-sm">
              <p>Built with ❤��� at Cloudflare</p>
            </footer>
          </div>
        </div>
      </div>
      <Toaster richColors closeButton />
    </>
  );
}
