import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Globe2,
  ListChecks,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import AdminLayout from '@/components/marketing-rules/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type LedgerSource = {
  slug: string;
  displayName: string;
  url: string | null;
  spider: string | null;
  checkedAt: string;
  statusCode: number | null;
  robotsAllowed: boolean | null;
  blocked: boolean;
  blockReason: string;
  safeToAttempt: boolean;
  allowIngest: boolean;
  hasSpider: boolean;
  registered: boolean;
  registryStatus: string;
  rolloutStage: string;
  reason: string;
  blockScore: number;
  lastBlocked: boolean;
};

type LedgerPayload = {
  ledger: {
    updatedAt?: string;
    runs: Array<{
      runId: string;
      generatedAt: string;
      batchSize: number;
      safeToAttempt: number;
      blocked: number;
      noSpider: number;
      ingestApproved: number;
      sources: string[];
    }>;
    latestRun?: {
      runId: string;
      generatedAt: string;
      batchSize: number;
      safeToAttempt: number;
      blocked: number;
      noSpider: number;
      ingestApproved: number;
      sources: LedgerSource[];
    } | null;
    sources: Record<string, LedgerSource>;
  };
};

type ScrapingStatsPayload = {
  stats: {
    totalJobs: number;
    recentJobs: number;
    totalCompanies: number;
    lastScrapingSession: string | null;
    scrapingHistory: {
      totalSessions: number;
      completedSessions: number;
      failedSessions: number;
    };
  };
};

const statusTone = (source: LedgerSource) => {
  if (source.safeToAttempt) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (source.blocked) return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const StatCard = ({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const AdminScraping: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const ledgerQuery = useQuery({
    queryKey: ['admin-scraping-ledger'],
    queryFn: async () => {
      const response = await apiClient.get<LedgerPayload>('/scraping/ledger');
      return response.data.ledger;
    },
    enabled: isAdmin,
  });

  const statsQuery = useQuery({
    queryKey: ['admin-scraping-stats'],
    queryFn: async () => {
      const response = await apiClient.get<ScrapingStatsPayload>('/scraping/stats');
      return response.data.stats;
    },
    enabled: isAdmin,
  });

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
            You do not have permission to manage scraping.
          </p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const ledger = ledgerQuery.data;
  const latestRun = ledger?.latestRun;
  const sources = latestRun?.sources || Object.values(ledger?.sources || {});
  const stats = statsQuery.data;

  return (
    <AdminLayout>
      <Helmet>
        <title>Job Scraping | Admin | WorkWise SA</title>
        <meta
          name="description"
          content="Monitor WorkWise SA job scraping source safety, blocking, ingest status, and job population."
        />
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Job Scraping Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Track source safety, robots checks, blocking reasons, spider readiness, and ingest results.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Jobs in UI"
          value={stats?.totalJobs ?? '...'}
          description={`${stats?.recentJobs ?? 0} added in the last 7 days`}
          icon={<Database className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Latest Batch Safe"
          value={latestRun?.safeToAttempt ?? '...'}
          description={`${latestRun?.batchSize ?? 0} sources audited`}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        />
        <StatCard
          title="Blocked"
          value={latestRun?.blocked ?? '...'}
          description="Robots, access, rate limit, or network blockers"
          icon={<XCircle className="h-4 w-4 text-red-600" />}
        />
        <StatCard
          title="No Spider"
          value={latestRun?.noSpider ?? '...'}
          description="Audited but not yet runnable by WorkWise"
          icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Latest Source Ledger</CardTitle>
          <CardDescription>
            Last updated {formatDate(latestRun?.generatedAt || ledger?.updatedAt)}. Block score
            rises when a source blocks repeatedly or changes from open to blocked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ledgerQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading scraping ledger...</p>
          ) : sources.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4">Source</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Robots</th>
                    <th className="py-3 pr-4">HTTP</th>
                    <th className="py-3 pr-4">Spider</th>
                    <th className="py-3 pr-4">Ingest</th>
                    <th className="py-3 pr-4">Score</th>
                    <th className="py-3 pr-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sources.map(source => (
                    <tr key={source.slug}>
                      <td className="py-3 pr-4 align-top">
                        <div className="font-medium">{source.displayName}</div>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                          >
                            <Globe2 className="h-3 w-3" />
                            {source.slug}
                          </a>
                        )}
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <Badge className={statusTone(source)}>
                          {source.safeToAttempt
                            ? 'Runnable'
                            : source.blocked
                              ? source.blockReason
                              : 'Needs spider'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        {source.robotsAllowed === null
                          ? 'Unknown'
                          : source.robotsAllowed
                            ? 'Allowed'
                            : 'Disallowed'}
                      </td>
                      <td className="py-3 pr-4 align-top">{source.statusCode ?? 'N/A'}</td>
                      <td className="py-3 pr-4 align-top">
                        {source.hasSpider ? source.spider : 'Missing'}
                      </td>
                      <td className="py-3 pr-4 align-top">
                        {source.allowIngest ? 'Approved' : 'Not approved'}
                      </td>
                      <td className="py-3 pr-4 align-top font-semibold">{source.blockScore}</td>
                      <td className="max-w-[360px] py-3 pr-4 align-top text-muted-foreground">
                        {source.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No ledger has been generated yet. Run the source ledger audit first.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Run History</CardTitle>
          <CardDescription>Recent source batches and outcomes.</CardDescription>
        </CardHeader>
        <CardContent>
          {ledger?.runs?.length ? (
            <div className="space-y-3">
              {ledger.runs
                .slice()
                .reverse()
                .slice(0, 6)
                .map(run => (
                  <div
                    key={run.runId}
                    className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{run.runId}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(run.generatedAt)} · {run.sources.join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{run.safeToAttempt} runnable</Badge>
                      <Badge variant="outline">{run.blocked} blocked</Badge>
                      <Badge variant="outline">{run.noSpider} no spider</Badge>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-6 text-center text-muted-foreground">No run history yet.</p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminScraping;
