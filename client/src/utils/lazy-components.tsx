import { lazy } from 'react';

// Lazy load heavy components that aren't needed immediately
export const LazyAdminDashboard = lazy(() => import('../pages/AdminDashboard'));
export const LazyCVBuilder = lazy(() => import('../pages/CVBuilder'));
export const LazyCompanyProfile = lazy(() => import('../pages/CompanyProfile'));
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyJobDetails = lazy(() => import('../pages/JobDetails'));
export const LazyProfileSetup = lazy(() => import('../pages/ProfileSetup'));
export const LazyUserProfile = lazy(() => import('../pages/UserProfile'));

// Lazy load resource-heavy components
export const LazyFAQWheelPage = lazy(() => import('../pages/FAQWheelPage'));
export const LazyMarketingRulesPage = lazy(() => import('../pages/MarketingRulesPage'));

// Lazy load employer-specific components
export const LazyEmployerDashboard = lazy(() => import('../pages/employers/EmployerDashboard'));
export const LazyJobPostingForm = lazy(() => import('../components/JobPostingForm'));

// Lazy load chart/visualization components
export const LazyChartComponents = lazy(() => import('../components/dashboard/Charts'));

// Lazy load PDF/document components
export const LazyPDFComponents = lazy(() => import('../components/PDFExport'));