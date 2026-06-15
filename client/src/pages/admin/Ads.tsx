import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Image, Plus, Save, ShieldAlert, Trash2, Upload } from 'lucide-react';
import AdminLayout from '@/components/marketing-rules/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type CampaignStatus = 'draft' | 'active' | 'paused' | 'archived';

type AdCampaign = {
  id: number;
  advertiserName: string;
  title: string;
  description: string | null;
  placement: string;
  imageUrl: string | null;
  targetUrl: string;
  startAt: string | null;
  endAt: string | null;
  budgetCents: number;
  currency: string;
  status: CampaignStatus;
  impressions: number;
  clicks: number;
  updatedAt: string;
};

type CampaignForm = {
  advertiserName: string;
  title: string;
  description: string;
  placement: string;
  imageUrl: string;
  targetUrl: string;
  startAt: string;
  endAt: string;
  budget: string;
  currency: string;
  status: CampaignStatus;
};

const placements = [
  'global-top-banner',
  'home-inline',
  'jobs-inline',
  'wiseup-inline',
  'footer-banner',
];

const emptyForm: CampaignForm = {
  advertiserName: '',
  title: '',
  description: '',
  placement: 'global-top-banner',
  imageUrl: '',
  targetUrl: '',
  startAt: '',
  endAt: '',
  budget: '',
  currency: 'ZAR',
  status: 'draft',
};

const formatDateInput = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatCurrency = (cents: number, currency = 'ZAR') =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format((cents || 0) / 100);

const toForm = (campaign: AdCampaign): CampaignForm => ({
  advertiserName: campaign.advertiserName,
  title: campaign.title,
  description: campaign.description || '',
  placement: campaign.placement,
  imageUrl: campaign.imageUrl || '',
  targetUrl: campaign.targetUrl,
  startAt: formatDateInput(campaign.startAt),
  endAt: formatDateInput(campaign.endAt),
  budget: String((campaign.budgetCents || 0) / 100),
  currency: campaign.currency,
  status: campaign.status,
});

const AdminAds: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ad-campaigns'],
    queryFn: async () => {
      const response = await apiClient.get<{ campaigns: AdCampaign[] }>('/admin/ads/campaigns');
      return response.data.campaigns;
    },
    enabled: isAdmin,
  });

  const campaigns = data || [];
  const activeTopBanner = useMemo(
    () =>
      campaigns.find(
        campaign => campaign.placement === 'global-top-banner' && campaign.status === 'active'
      ),
    [campaigns]
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('file', file);
      const response = await apiClient.post<{ imageUrl: string }>('/admin/ads/upload', body);
      return response.data.imageUrl;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CampaignForm) => {
      let imageUrl = payload.imageUrl;
      if (selectedFile) {
        imageUrl = await uploadMutation.mutateAsync(selectedFile);
      }

      const body = {
        ...payload,
        imageUrl,
        startAt: payload.startAt || null,
        endAt: payload.endAt || null,
      };

      if (editingId) {
        const response = await apiClient.put(`/admin/ads/campaigns/${editingId}`, body);
        return response.data;
      }

      const response = await apiClient.post('/admin/ads/campaigns', body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ad-campaigns'] });
      setForm(emptyForm);
      setEditingId(null);
      setSelectedFile(null);
      toast({
        title: 'Ad campaign saved',
        description: 'The creative is ready for its configured placement.',
      });
    },
    onError: error => {
      toast({
        title: 'Could not save ad campaign',
        description: error instanceof Error ? error.message : 'Please check the campaign fields.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      await apiClient.delete(`/admin/ads/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ad-campaigns'] });
      toast({
        title: 'Ad campaign removed',
        description: 'Drafts are deleted; live campaigns are archived.',
      });
    },
  });

  const updateField = (field: keyof CampaignForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const editCampaign = (campaign: AdCampaign) => {
    setEditingId(campaign.id);
    setForm(toForm(campaign));
    setSelectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    saveMutation.mutate(form);
  };

  if (!isAdmin) {
    return (
      <div className="container py-8 max-w-[1200px] mx-auto">
        <Helmet>
          <title>Access Denied | WorkWise SA</title>
        </Helmet>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <ShieldAlert className="mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold">Access Denied</h1>
          <p className="mb-6 text-muted-foreground">
            You do not have permission to manage ads.
          </p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Ad Manager | Admin | WorkWise SA</title>
        <meta
          name="description"
          content="Upload and schedule ad creatives for WorkWise SA placements."
        />
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Ad Manager</h1>
        <p className="mt-2 text-muted-foreground">
          Upload creatives, set advertiser URLs, schedule flight dates, and manage budgets.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Campaign' : 'New Campaign'}</CardTitle>
            <CardDescription>
              Active campaigns appear when their placement, dates, and status match.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitForm}>
              <div className="space-y-2">
                <Label htmlFor="advertiserName">Advertiser</Label>
                <Input
                  id="advertiserName"
                  value={form.advertiserName}
                  onChange={event => updateField('advertiserName', event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Creative headline</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={event => updateField('title', event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={event => updateField('description', event.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Placement</Label>
                  <Select
                    value={form.placement}
                    onValueChange={value => updateField('placement', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {placements.map(placement => (
                        <SelectItem key={placement} value={placement}>
                          {placement}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={value => updateField('status', value as CampaignStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetUrl">Advertiser URL</Label>
                <Input
                  id="targetUrl"
                  value={form.targetUrl}
                  onChange={event => updateField('targetUrl', event.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Creative image</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    value={form.imageUrl}
                    onChange={event => updateField('imageUrl', event.target.value)}
                    placeholder="/uploads/ad-creatives/banner.webp"
                  />
                  <Button type="button" variant="outline" asChild>
                    <Label htmlFor="creativeFile" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Label>
                  </Button>
                </div>
                <Input
                  id="creativeFile"
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={event => setSelectedFile(event.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">{selectedFile.name} selected</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startAt">Start date</Label>
                  <Input
                    id="startAt"
                    type="date"
                    value={form.startAt}
                    onChange={event => updateField('startAt', event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endAt">End date</Label>
                  <Input
                    id="endAt"
                    type="date"
                    value={form.endAt}
                    onChange={event => updateField('endAt', event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_96px]">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.budget}
                    onChange={event => updateField('budget', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={form.currency}
                    onChange={event => updateField('currency', event.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saveMutation.isPending || uploadMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? 'Save Campaign' : 'Create Campaign'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                      setSelectedFile(null);
                    }}
                  >
                    New
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Banner Preview</CardTitle>
              <CardDescription>
                {activeTopBanner
                  ? `${activeTopBanner.title} is active for the global top banner.`
                  : 'No active global top banner campaign is currently scheduled.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[90px] items-center gap-4 rounded-md border border-dashed p-4">
                {activeTopBanner?.imageUrl ? (
                  <img
                    src={activeTopBanner.imageUrl}
                    alt=""
                    className="h-16 w-28 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-28 items-center justify-center rounded-md bg-muted">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {activeTopBanner?.title || 'Fallback advertise-here creative'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activeTopBanner?.description ||
                      'Create and activate a global-top-banner campaign to replace this.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Campaigns</CardTitle>
                  <CardDescription>Manage all uploaded ad creatives.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setSelectedFile(null);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="py-8 text-center text-muted-foreground">Loading campaigns...</p>
              ) : campaigns.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-3 pr-4">Creative</th>
                        <th className="py-3 pr-4">Placement</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4">Budget</th>
                        <th className="py-3 pr-4">Metrics</th>
                        <th className="py-3 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {campaigns.map(campaign => (
                        <tr key={campaign.id}>
                          <td className="py-3 pr-4">
                            <div className="font-medium">{campaign.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {campaign.advertiserName}
                            </div>
                          </td>
                          <td className="py-3 pr-4">{campaign.placement}</td>
                          <td className="py-3 pr-4 capitalize">{campaign.status}</td>
                          <td className="py-3 pr-4">
                            {formatCurrency(campaign.budgetCents, campaign.currency)}
                          </td>
                          <td className="py-3 pr-4">
                            {campaign.impressions} views / {campaign.clicks} clicks
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editCampaign(campaign)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => deleteMutation.mutate(campaign.id)}
                                aria-label="Archive or delete campaign"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No ad campaigns yet. Create one to start filling ad placements.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAds;
