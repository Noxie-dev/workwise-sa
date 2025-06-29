import apiClient from './apiClient';

/**
 * Event types for analytics tracking
 */
export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  TAB_CHANGE = 'tab_change',
  FILTER_CHANGE = 'filter_change',
  JOB_CLICK = 'job_click',
  SKILL_VIEW = 'skill_view',
  DOWNLOAD = 'download',
  SEARCH = 'search',
  CHART_INTERACTION = 'chart_interaction',
  EXPORT_DATA = 'export_data',
  PAGINATION = 'pagination',
  VISUALIZATION_TOGGLE = 'visualization_toggle',
  NOTIFICATION_INTERACTION = 'notification_interaction',
  TIME_ON_PAGE = 'time_on_page',
  DASHBOARD_WIDGET_VIEW = 'dashboard_widget_view',
}

/**
 * Interface for analytics event data
 */
export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  userId?: string;
  timestamp: number;
  data: Record<string, any>;
}

/**
 * Service for tracking analytics events
 */
export const analyticsService = {
  /**
   * Track an analytics event
   */
  async trackEvent(eventType: AnalyticsEventType, userId: string | undefined, data: Record<string, any> = {}): Promise<void> {
    const event: AnalyticsEvent = {
      eventType,
      userId,
      timestamp: Date.now(),
      data,
    };

    try {
      // In production, send to API
      if (import.meta.env.PROD) {
        await apiClient.post('/api/analytics/track', event);
      } else {
        // In development, just log to console
        console.log('Analytics event:', event);
      }
    } catch (error) {
      // Silently fail for analytics - don't disrupt user experience
      console.error('Failed to track analytics event:', error);
    }
  },

  /**
   * Track a page view
   */
  trackPageView(userId: string | undefined, pageName: string, additionalData: Record<string, any> = {}): void {
    this.trackEvent(AnalyticsEventType.PAGE_VIEW, userId, {
      pageName,
      ...additionalData,
    });
  },

  /**
   * Track a tab change
   */
  trackTabChange(userId: string | undefined, tabName: string): void {
    this.trackEvent(AnalyticsEventType.TAB_CHANGE, userId, {
      tabName,
    });
  },

  /**
   * Track a filter change
   */
  trackFilterChange(userId: string | undefined, filterName: string, filterValue: string): void {
    this.trackEvent(AnalyticsEventType.FILTER_CHANGE, userId, {
      filterName,
      filterValue,
    });
  },

  /**
   * Track a job click
   */
  trackJobClick(userId: string | undefined, jobId: string, jobTitle: string): void {
    this.trackEvent(AnalyticsEventType.JOB_CLICK, userId, {
      jobId,
      jobTitle,
    });
  },

  /**
   * Track a skill view
   */
  trackSkillView(userId: string | undefined, skill: string): void {
    this.trackEvent(AnalyticsEventType.SKILL_VIEW, userId, {
      skill,
    });
  },

  /**
   * Track chart interaction
   */
  trackChartInteraction(userId: string | undefined, chartType: string, interactionType: string, detail?: string): void {
    this.trackEvent(AnalyticsEventType.CHART_INTERACTION, userId, {
      chartType,
      interactionType,
      detail,
    });
  },

  /**
   * Track data export
   */
  trackExportData(userId: string | undefined, dataType: string, format: string, filters?: Record<string, any>): void {
    this.trackEvent(AnalyticsEventType.EXPORT_DATA, userId, {
      dataType,
      format,
      filters,
    });
  },

  /**
   * Track pagination
   */
  trackPagination(userId: string | undefined, page: number, pageSize: number, totalItems: number, context: string): void {
    this.trackEvent(AnalyticsEventType.PAGINATION, userId, {
      page,
      pageSize,
      totalItems,
      context,
    });
  },

  /**
   * Track visualization toggle
   */
  trackVisualizationToggle(userId: string | undefined, visualizationType: string, newState: string): void {
    this.trackEvent(AnalyticsEventType.VISUALIZATION_TOGGLE, userId, {
      visualizationType,
      newState,
    });
  },

  /**
   * Track notification interaction
   */
  trackNotificationInteraction(userId: string | undefined, notificationType: string, action: string, notificationId?: string): void {
    this.trackEvent(AnalyticsEventType.NOTIFICATION_INTERACTION, userId, {
      notificationType,
      action,
      notificationId,
    });
  },

  /**
   * Track time spent on page
   */
  trackTimeOnPage(userId: string | undefined, pageName: string, timeInSeconds: number): void {
    this.trackEvent(AnalyticsEventType.TIME_ON_PAGE, userId, {
      pageName,
      timeInSeconds,
    });
  },

  /**
   * Track dashboard widget view
   */
  trackDashboardWidgetView(userId: string | undefined, widgetName: string, visibleTimeInSeconds: number): void {
    this.trackEvent(AnalyticsEventType.DASHBOARD_WIDGET_VIEW, userId, {
      widgetName,
      visibleTimeInSeconds,
    });
  },
};

export default analyticsService;
