import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function PortfolioCredentials() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [type, setType] = useState('cv');
  const [fileName, setFileName] = useState('');

  const addMutation = useMutation({
    mutationFn: () => sovereign.applicant.addCredential({ type, file_name: fileName || 'Document', file_path: '/uploads/placeholder.pdf' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-credentials'] });
      toast.success('Credential added');
      navigate(createPageUrl('ProfessionalPortfolio'));
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags title="Add credential | Shop The Barber" />
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-foreground mb-6">Add credential</h1>
        <p className="text-slate-600 text-sm mb-4">Document upload will be available in a future release. For now you can add a placeholder (e.g. CV name).</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white">
              <option value="cv">CV / Resume</option>
              <option value="certificate">Certificate</option>
              <option value="portfolio">Portfolio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Document name</label>
            <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g. Professional CV.pdf" className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 rounded-xl">Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="flex-1 bg-primary text-white rounded-xl">Add</Button>
          </div>
        </div>
      </div>
      <ClientBottomNav />
    </div>
  );
}
