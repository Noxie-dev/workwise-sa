import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Filter,
  ImageIcon,
  Megaphone,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import {
  blogWiseCategories,
  heroBlogs,
  latestPosts,
  popularPosts,
} from '@/data/blogWiseContent';
import type { BlogWisePost } from '@/data/blogWiseContent';

type PreparationStatus = 'Drafting' | 'Needs Review' | 'Ready' | 'Scheduled';

type PreparedPost = BlogWisePost & {
  status: PreparationStatus;
  channel: string;
  owner: string;
  publishWindow: string;
  readiness: number;
  tasks: {
    copy: boolean;
    image: boolean;
    seo: boolean;
    social: boolean;
  };
};

const allPosts = [...heroBlogs, ...popularPosts, ...latestPosts];

const statusStyles: Record<PreparationStatus, string> = {
  Drafting: 'border-slate-200 bg-slate-50 text-slate-700',
  'Needs Review': 'border-amber-200 bg-amber-50 text-amber-800',
  Ready: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Scheduled: 'border-sky-200 bg-sky-50 text-sky-800',
};

const channelByCategory: Record<string, string> = {
  'Career Tips': 'Career Hub',
  'Industry Insights': 'LinkedIn + Blog',
  'Professional Development': 'Newsletter',
  'Tech Updates': 'Blog Feature',
  'Work Culture': 'Social Carousel',
};

const owners = ['Content Lead', 'SEO Editor', 'Social Producer', 'Design Desk'];

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));

const buildPreparationQueue = (posts: BlogWisePost[]): PreparedPost[] =>
  posts.map((post, index) => {
    const taskValues = {
      copy: post.excerpt.length > 80,
      image: Boolean(post.image),
      seo: post.title.length >= 24 && post.category.length > 0,
      social: post.views > 1400 || post.likes > 80,
    };
    const completedTasks = Object.values(taskValues).filter(Boolean).length;
    const readiness = Math.round((completedTasks / Object.keys(taskValues).length) * 100);
    const status: PreparationStatus =
      readiness === 100
        ? index % 3 === 0
          ? 'Scheduled'
          : 'Ready'
        : readiness >= 75
          ? 'Needs Review'
          : 'Drafting';

    return {
      ...post,
      status,
      channel: channelByCategory[post.category] ?? 'Editorial',
      owner: owners[index % owners.length],
      publishWindow: index < 3 ? 'This week' : index < 7 ? 'Next week' : 'Backlog',
      readiness,
      tasks: taskValues,
    };
  });

const preparedPosts = buildPreparationQueue(allPosts);

const StatCard = ({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) => (
  <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon size={20} aria-hidden="true" />
      </span>
    </div>
    <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
  </div>
);

const TaskPill = ({ complete, label }: { complete: boolean; label: string }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
      complete
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-slate-50 text-slate-600'
    }`}
  >
    {complete ? (
      <CheckCircle2 size={12} aria-hidden="true" />
    ) : (
      <Clock3 size={12} aria-hidden="true" />
    )}
    {label}
  </span>
);

const QueueItem = ({ post }: { post: PreparedPost }) => (
  <article className="grid gap-4 rounded-lg border border-border bg-white p-4 shadow-sm transition hover:border-primary/30 sm:grid-cols-[136px_1fr]">
    <div className="relative overflow-hidden rounded-md bg-muted">
      <img src={post.image} alt="" className="h-36 w-full object-cover sm:h-full" loading="lazy" />
      <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-foreground shadow-sm">
        {post.category}
      </span>
    </div>

    <div className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-snug text-foreground">{post.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
        </div>
        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyles[post.status]}`}
        >
          {post.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
        <span className="flex items-center gap-2">
          <UserRound size={15} aria-hidden="true" />
          {post.owner}
        </span>
        <span className="flex items-center gap-2">
          <Megaphone size={15} aria-hidden="true" />
          {post.channel}
        </span>
        <span className="flex items-center gap-2">
          <CalendarDays size={15} aria-hidden="true" />
          {post.publishWindow}
        </span>
        <span className="flex items-center gap-2">
          <Eye size={15} aria-hidden="true" />
          {post.views.toLocaleString()} views
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
          <span>Preparation readiness</span>
          <span>{post.readiness}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${post.readiness}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TaskPill complete={post.tasks.copy} label="Copy" />
        <TaskPill complete={post.tasks.image} label="Image" />
        <TaskPill complete={post.tasks.seo} label="SEO" />
        <TaskPill complete={post.tasks.social} label="Social" />
      </div>
    </div>
  </article>
);

const BlogWise = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<PreparationStatus | 'All'>('All');

  const filteredPosts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return preparedPosts.filter(post => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || post.status === selectedStatus;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [post.title, post.excerpt, post.author, post.owner, post.channel]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [searchTerm, selectedCategory, selectedStatus]);

  const scheduledCount = preparedPosts.filter(post => post.status === 'Scheduled').length;
  const readyCount = preparedPosts.filter(post => post.status === 'Ready').length;
  const reviewCount = preparedPosts.filter(post => post.status === 'Needs Review').length;
  const averageReadiness = Math.round(
    preparedPosts.reduce((total, post) => total + post.readiness, 0) / preparedPosts.length
  );
  const heroPost = preparedPosts[0];

  return (
    <>
      <Helmet>
        <title>Blog Wise Content Dashboard - WorkWise SA</title>
        <meta
          name="description"
          content="Prepare, review, and schedule Blog Wise content for WorkWise SA."
        />
      </Helmet>

      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px] lg:px-6">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  Blog Wise
                </span>
                <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  Content preparation dashboard
                </span>
              </div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Prepare career content from draft idea to publish-ready asset.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                Track the Blog Wise queue, spot posts that need editorial attention, and confirm
                each article has copy, imagery, SEO, and social promotion ready before it ships.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Queue"
                  value={`${preparedPosts.length}`}
                  detail="Articles in preparation"
                  icon={Edit3}
                />
                <StatCard
                  label="Ready"
                  value={`${readyCount + scheduledCount}`}
                  detail="Ready or scheduled"
                  icon={CheckCircle2}
                />
                <StatCard
                  label="Review"
                  value={`${reviewCount}`}
                  detail="Need final checks"
                  icon={AlertCircle}
                />
                <StatCard
                  label="Readiness"
                  value={`${averageReadiness}%`}
                  detail="Average prep score"
                  icon={Target}
                />
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-slate-950 p-5 text-white shadow-sm">
              <div className="relative mb-4 overflow-hidden rounded-md">
                <img src={heroPost.image} alt="" className="h-40 w-full object-cover opacity-85" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-md bg-white/15 px-2 py-1 text-xs font-semibold backdrop-blur">
                  Priority feature
                </span>
              </div>
              <h2 className="text-xl font-bold">{heroPost.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{heroPost.excerpt}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <span className="rounded-md bg-white/10 p-3">
                  <span className="block text-slate-400">Owner</span>
                  <span className="font-semibold">{heroPost.owner}</span>
                </span>
                <span className="rounded-md bg-white/10 p-3">
                  <span className="block text-slate-400">Window</span>
                  <span className="font-semibold">{heroPost.publishWindow}</span>
                </span>
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
              <label className="relative block">
                <span className="sr-only">Search content queue</span>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search title, owner, channel, or brief"
                  className="h-11 w-full rounded-md border border-input bg-white pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Filter by category</span>
                <Filter
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                  aria-hidden="true"
                />
                <select
                  value={selectedCategory}
                  onChange={event => setSelectedCategory(event.target.value)}
                  className="h-11 w-full appearance-none rounded-md border border-input bg-white pl-10 pr-8 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  {blogWiseCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="relative block">
                <span className="sr-only">Filter by status</span>
                <Sparkles
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                  aria-hidden="true"
                />
                <select
                  value={selectedStatus}
                  onChange={event =>
                    setSelectedStatus(event.target.value as PreparationStatus | 'All')
                  }
                  className="h-11 w-full appearance-none rounded-md border border-input bg-white pl-10 pr-8 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="All">All statuses</option>
                  <option value="Drafting">Drafting</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="Ready">Ready</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Preparation Queue</h2>
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredPosts.length} of {preparedPosts.length} articles
                  </p>
                </div>
                <a
                  href="/resources"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  View resources
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>

              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => <QueueItem key={post.id} post={post} />)
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center">
                  <Search className="mx-auto text-muted-foreground" size={28} aria-hidden="true" />
                  <h2 className="mt-3 text-lg font-semibold text-foreground">No articles found</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Adjust the search or filters to bring content back into view.
                  </p>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-bold text-foreground">Finalization Checklist</h2>
                <div className="mt-4 space-y-3">
                  {([
                    ['Confirm priority feature image ratios', ImageIcon],
                    ['Review meta descriptions and titles', Search],
                    ['Prepare social captions for ready posts', MessageSquare],
                    ['Schedule newsletter-ready articles', CalendarDays],
                  ] as [string, LucideIcon][]).map(([label, Icon]) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-md bg-slate-50 p-3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-primary shadow-sm">
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-bold text-foreground">Audience Signals</h2>
                <div className="mt-4 space-y-4">
                  {preparedPosts
                    .slice()
                    .sort((a, b) => b.views + b.likes - (a.views + a.likes))
                    .slice(0, 3)
                    .map(post => (
                      <div
                        key={post.id}
                        className="border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <p className="text-sm font-semibold leading-5 text-foreground">
                          {post.title}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye size={12} aria-hidden="true" />
                            {post.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={12} aria-hidden="true" />
                            {post.likes} saves
                          </span>
                          <span>{formatDate(post.date)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
};

export default BlogWise;
