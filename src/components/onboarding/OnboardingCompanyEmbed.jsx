import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { invalidateOnboardingQueries } from '@/lib/bootstrapProvider';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

const profileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  website: z.string().optional(),
  logo_url: z.string().optional(),
  location: z.string().optional(),
});

const jobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location_text: z.string().optional(),
});

export function OnboardingCompanyEmbed({ stepId, onSaved }) {
  const queryClient = useQueryClient();
  const { companyProfile, jobs } = useOnboardingProgress();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: companyProfile?.name || '',
      description: companyProfile?.description || '',
      website: companyProfile?.website || '',
      logo_url: companyProfile?.logo_url || '',
      location: companyProfile?.location || '',
    },
  });

  const jobForm = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      location_text: '',
    },
  });

  useEffect(() => {
    if (!companyProfile) return;
    profileForm.reset({
      name: companyProfile.name || '',
      description: companyProfile.description || '',
      website: companyProfile.website || '',
      logo_url: companyProfile.logo_url || '',
      location: companyProfile.location || '',
    });
  }, [companyProfile, profileForm]);

  const saveProfileMutation = useMutation({
    mutationFn: (data) =>
      sovereign.onboarding.updateCompanyProfile({
        name: data.name.trim(),
        description: data.description.trim(),
        website: data.website?.trim() || undefined,
        logo_url: data.logo_url?.trim() || undefined,
        location: data.location?.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-company-profile'] });
      invalidateOnboardingQueries(queryClient);
      toast.success('Company profile saved');
      onSaved?.();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save profile'),
  });

  const createJobMutation = useMutation({
    mutationFn: (data) =>
      sovereign.jobs.create({
        title: data.title.trim(),
        description: data.description.trim(),
        category: 'management',
        employer_type: 'company',
        company_id: companyProfile?.company_id || companyProfile?.id,
        employment_type: 'full_time',
        location_type: 'on_site',
        location_text: data.location_text?.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-jobs'] });
      toast.success('Job draft created');
      onSaved?.();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create job'),
  });

  if (stepId === 'profile') {
    return (
      <Card>
        <CardContent className="p-6">
          <form
            className="space-y-4 max-w-lg"
            onSubmit={profileForm.handleSubmit((data) => saveProfileMutation.mutate(data))}
          >
            <div className="space-y-2">
              <Label htmlFor="company-name">Company name</Label>
              <Input id="company-name" {...profileForm.register('name')} placeholder="Acme Barbershop Group" />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-description">About your company</Label>
              <Textarea
                id="company-description"
                rows={4}
                {...profileForm.register('description')}
                placeholder="Tell candidates about your culture, locations, and what makes you a great employer."
              />
              {profileForm.formState.errors.description && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.description.message}</p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-website">Website (optional)</Label>
                <Input id="company-website" {...profileForm.register('website')} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-logo">Logo URL (optional)</Label>
                <Input id="company-logo" {...profileForm.register('logo_url')} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-location">Headquarters / primary location (optional)</Label>
              <Input id="company-location" {...profileForm.register('location')} placeholder="City, State" />
            </div>
            <Button type="submit" disabled={saveProfileMutation.isPending}>
              {saveProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save company profile
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (stepId === 'jobs') {
    if (jobs.length > 0) {
      return (
        <Card>
          <CardContent className="p-6 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold">You have {jobs.length} job listing{jobs.length === 1 ? '' : 's'}</p>
              <p className="text-sm text-muted-foreground">Open My Jobs to publish drafts or add more roles.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-6">
          <form
            className="space-y-4 max-w-lg"
            onSubmit={jobForm.handleSubmit((data) => createJobMutation.mutate(data))}
          >
            <div className="space-y-2">
              <Label htmlFor="job-title">Role title</Label>
              <Input id="job-title" {...jobForm.register('title')} placeholder="Senior barber" />
              {jobForm.formState.errors.title && (
                <p className="text-sm text-destructive">{jobForm.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Role description</Label>
              <Textarea
                id="job-description"
                rows={4}
                {...jobForm.register('description')}
                placeholder="Responsibilities, requirements, and what success looks like."
              />
              {jobForm.formState.errors.description && (
                <p className="text-sm text-destructive">{jobForm.formState.errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-location">Location (optional)</Label>
              <Input id="job-location" {...jobForm.register('location_text')} placeholder="On-site — Downtown" />
            </div>
            <Button type="submit" disabled={createJobMutation.isPending || !companyProfile?.id}>
              {createJobMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create job draft
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return null;
}
