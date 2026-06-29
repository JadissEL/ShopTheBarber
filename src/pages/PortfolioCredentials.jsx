import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

const MAX_MB = 5;
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp';

export default function PortfolioCredentials() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [type, setType] = useState('cv');
  const [file, setFile] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: () => sovereign.applicant.uploadCredential({ type, file }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-credentials'] });
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      toast.success('Document uploaded');
      navigate(createPageUrl('ProfessionalPortfolio'));
    },
    onError: (e) => toast.error(e.message),
  });

  const onFileChange = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MB} MB`);
      return;
    }
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (picked.type && !allowed.includes(picked.type)) {
      toast.error('Use PDF, PNG, JPG, or WEBP');
      return;
    }
    setFile(picked);
  };

  return (
    <div className="stb-page lg:pb-8">
      <MetaTags title="Upload credential | Shop The Barber" />
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-foreground mb-2">Upload document</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Add your CV, certificates, or portfolio images. PDF and images up to {MAX_MB} MB.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">Document type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-card">
              <option value="cv">CV / Resume</option>
              <option value="certificate">Certificate</option>
              <option value="portfolio">Portfolio (image or PDF)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">File</label>
            <input ref={inputRef} type="file" accept={ACCEPT} onChange={onFileChange} className="hidden" />
            {!file ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-medium text-foreground/90">Choose file</span>
                <span className="text-xs text-muted-foreground">PDF, PNG, JPG, WEBP</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-card">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-600" aria-label="Remove file">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 rounded-xl">Cancel</Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!file || uploadMutation.isPending}
              className="flex-1 bg-primary text-white rounded-xl"
            >
              {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
