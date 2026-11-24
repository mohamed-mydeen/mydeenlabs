export type DateRangeOption = 'today' | '7d' | '30d' | '90d';

export interface OverviewMetrics {
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  avgSessionDurationSeconds: number;
  liveVisitors: number;
}

export interface TrafficPoint {
  date: string;
  visitors: number;
  pageViews: number;
}

export interface PageMetric {
  path: string;
  views: number;
  uniqueVisitors: number;
  avgTimeSeconds: number;
}

export interface TrafficSourceMetric {
  source: string;
  category: 'Direct' | 'Google' | 'LinkedIn' | 'GitHub' | 'Other';
  visitors: number;
  percentage: number;
}

export interface DeviceBreakdownItem {
  name: string;
  visitors: number;
  percentage: number;
}

export interface DevicesData {
  deviceTypes: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  browsers: DeviceBreakdownItem[];
  operatingSystems: DeviceBreakdownItem[];
}

export interface CustomEventCounts {
  project_clicked: number;
  resume_downloaded: number;
  contact_clicked: number;
  github_clicked: number;
  linkedin_clicked: number;
}

export interface AnalyticsDashboardResponse {
  range: DateRangeOption;
  connected: boolean;
  hasData: boolean;
  overview: OverviewMetrics;
  trafficSeries: TrafficPoint[];
  pages: PageMetric[];
  sources: TrafficSourceMetric[];
  devices: DevicesData;
  customEvents: CustomEventCounts;
  fetchedAt: string;
}

export interface LiveVisitor {
  visitor_id: string;
  current_page: string;
  device_type: 'Mobile' | 'Desktop' | 'Tablet';
  browser: string;
  os: string;
  country: string;
  last_active_at: string;
}

export type EnquiryCategory =
  | 'Website Development'
  | 'Freelance Project'
  | 'Collaboration'
  | 'Job Opportunity'
  | 'General Enquiry'
  | 'Other';

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  enquiry_category: EnquiryCategory;
  subject: string;
  message: string;
  is_read: boolean;
  is_replied: boolean;
  is_archived: boolean;
  created_at: string;
}

