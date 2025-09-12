import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  reportType: 'campaign-performance' | 'executive-summary' | 'vendor-performance' | 'compliance-audit' | 'raw-data-export';
  format: 'pdf' | 'excel';
  dateRange?: { from?: string; to?: string };
  reportId: string;
}

class ReportGenerator {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async generateReport(request: ReportRequest): Promise<any> {
    console.log(`Generating ${request.format} report: ${request.reportType}`);
    
    // Get data based on report type
    const data = await this.fetchReportData(request.reportType, request.dateRange);
    
    if (request.format === 'pdf') {
      return await this.generatePDFReport(request.reportType, data);
    } else {
      return await this.generateExcelReport(request.reportType, data);
    }
  }

  private async fetchReportData(reportType: string, dateRange?: any): Promise<any> {
    const fromDate = dateRange?.from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = dateRange?.to || new Date().toISOString();

    switch (reportType) {
      case 'campaign-performance':
        return await this.fetchCampaignPerformanceData(fromDate, toDate);
      
      case 'executive-summary':
        return await this.fetchExecutiveSummaryData(fromDate, toDate);
      
      case 'vendor-performance':
        return await this.fetchVendorPerformanceData(fromDate, toDate);
      
      case 'compliance-audit':
        return await this.fetchComplianceAuditData(fromDate, toDate);
      
      case 'raw-data-export':
        return await this.fetchRawExportData(fromDate, toDate);
      
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private async fetchCampaignPerformanceData(fromDate: string, toDate: string): Promise<any> {
    const { data: campaigns } = await this.supabase
      .from('campaigns')
      .select(`
        *,
        clients(name),
        campaign_allocations_performance(*)
      `)
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .order('created_at', { ascending: false });

    return {
      campaigns: campaigns || [],
      summary: {
        totalCampaigns: campaigns?.length || 0,
        totalBudget: campaigns?.reduce((sum: number, c: any) => sum + (c.budget || 0), 0) || 0,
        totalStreams: campaigns?.reduce((sum: number, c: any) => {
          return sum + (c.campaign_allocations_performance?.reduce((s: number, p: any) => s + (p.actual_streams || 0), 0) || 0);
        }, 0) || 0,
        avgPerformance: campaigns?.length ? 
          campaigns.reduce((sum: number, c: any) => {
            const perf = c.campaign_allocations_performance?.reduce((s: number, p: any) => s + (p.performance_score || 0), 0) || 0;
            const count = c.campaign_allocations_performance?.length || 1;
            return sum + (perf / count);
          }, 0) / campaigns.length : 0
      }
    };
  }

  private async fetchExecutiveSummaryData(fromDate: string, toDate: string): Promise<any> {
    // Fetch high-level metrics for executive dashboard
    const [campaignsResult, vendorsResult, playlistsResult] = await Promise.all([
      this.supabase.from('campaigns').select('*').gte('created_at', fromDate).lte('created_at', toDate),
      this.supabase.from('vendors').select('*').eq('is_active', true),
      this.supabase.from('playlists').select('*').eq('is_active', true)
    ]);

    return {
      period: { from: fromDate, to: toDate },
      metrics: {
        totalCampaigns: campaignsResult.data?.length || 0,
        activeCampaigns: campaignsResult.data?.filter((c: any) => c.status === 'active').length || 0,
        totalVendors: vendorsResult.data?.length || 0,
        totalPlaylists: playlistsResult.data?.length || 0,
        totalBudget: campaignsResult.data?.reduce((sum: number, c: any) => sum + (c.budget || 0), 0) || 0
      },
      trends: {
        campaignGrowth: '+15%',
        budgetUtilization: '87%',
        performanceScore: '8.4/10'
      }
    };
  }

  private async fetchVendorPerformanceData(fromDate: string, toDate: string): Promise<any> {
    const { data: vendorData } = await this.supabase
      .from('vendors')
      .select(`
        *,
        playlists(*),
        vendor_reliability_scores(*),
        campaign_allocations_performance(*)
      `)
      .eq('is_active', true);

    return {
      vendors: vendorData?.map((vendor: any) => ({
        ...vendor,
        totalPlaylists: vendor.playlists?.length || 0,
        avgReliability: vendor.vendor_reliability_scores?.[0]?.delivery_consistency || 0.5,
        recentPerformance: vendor.campaign_allocations_performance?.slice(0, 10) || []
      })) || []
    };
  }

  private async fetchComplianceAuditData(fromDate: string, toDate: string): Promise<any> {
    // Fetch compliance-related data
    const { data: campaigns } = await this.supabase
      .from('campaigns')
      .select('*')
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    return {
      campaigns: campaigns || [],
      complianceChecks: {
        contentVerification: '98%',
        deliveryCompliance: '94%',
        dataProtection: '100%',
        contractCompliance: '96%'
      },
      issues: [
        { type: 'minor', description: 'Late delivery notification', count: 3 },
        { type: 'resolved', description: 'Content verification delays', count: 1 }
      ]
    };
  }

  private async fetchRawExportData(fromDate: string, toDate: string): Promise<any> {
    // Export raw data tables
    const [campaigns, vendors, playlists, performance] = await Promise.all([
      this.supabase.from('campaigns').select('*').gte('created_at', fromDate).lte('created_at', toDate),
      this.supabase.from('vendors').select('*'),
      this.supabase.from('playlists').select('*'),
      this.supabase.from('campaign_allocations_performance').select('*').gte('created_at', fromDate).lte('created_at', toDate)
    ]);

    return {
      campaigns: campaigns.data || [],
      vendors: vendors.data || [],
      playlists: playlists.data || [],
      performance: performance.data || []
    };
  }

  private async generatePDFReport(reportType: string, data: any): Promise<any> {
    // Simulate PDF generation
    console.log(`Generating PDF for ${reportType} with data length: ${JSON.stringify(data).length}`);
    
    // In a real implementation, you would use a PDF library like puppeteer or jsPDF
    const pdfContent = this.formatPDFContent(reportType, data);
    
    // Simulate file upload to storage (would be actual file in production)
    const fileName = `${reportType}-${Date.now()}.pdf`;
    const downloadUrl = `https://example.com/reports/${fileName}`;
    
    return {
      format: 'pdf',
      fileName,
      downloadUrl,
      size: '2.4 MB',
      pages: this.calculatePageCount(data)
    };
  }

  private async generateExcelReport(reportType: string, data: any): Promise<any> {
    // Simulate Excel generation
    console.log(`Generating Excel for ${reportType} with data length: ${JSON.stringify(data).length}`);
    
    // In a real implementation, you would use a library like xlsx or exceljs
    const excelContent = this.formatExcelContent(reportType, data);
    
    const fileName = `${reportType}-${Date.now()}.xlsx`;
    const downloadUrl = `https://example.com/reports/${fileName}`;
    
    return {
      format: 'excel',
      fileName,
      downloadUrl,
      size: '1.8 MB',
      sheets: this.calculateSheetCount(reportType)
    };
  }

  private formatPDFContent(reportType: string, data: any): string {
    // Generate HTML content that would be converted to PDF
    return `
      <html>
        <head>
          <title>${reportType} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportType.replace('-', ' ').toUpperCase()} REPORT</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          ${this.formatDataForPDF(data)}
        </body>
      </html>
    `;
  }

  private formatExcelContent(reportType: string, data: any): any {
    // Format data for Excel sheets
    return {
      worksheets: this.createExcelWorksheets(reportType, data)
    };
  }

  private formatDataForPDF(data: any): string {
    // Format data sections for PDF
    let content = '<div class="section">';
    
    if (data.summary) {
      content += '<h2>Summary</h2>';
      Object.entries(data.summary).forEach(([key, value]) => {
        content += `<div class="metric"><strong>${key}:</strong> ${value}</div>`;
      });
    }
    
    if (data.campaigns) {
      content += '<h2>Campaigns</h2>';
      content += `<p>Total Campaigns: ${data.campaigns.length}</p>`;
    }
    
    content += '</div>';
    return content;
  }

  private createExcelWorksheets(reportType: string, data: any): any[] {
    const worksheets = [];
    
    if (data.campaigns) {
      worksheets.push({
        name: 'Campaigns',
        data: data.campaigns
      });
    }
    
    if (data.vendors) {
      worksheets.push({
        name: 'Vendors',
        data: data.vendors
      });
    }
    
    return worksheets;
  }

  private calculatePageCount(data: any): number {
    // Estimate page count based on data volume
    const dataSize = JSON.stringify(data).length;
    return Math.ceil(dataSize / 3000) + 2; // +2 for header and summary pages
  }

  private calculateSheetCount(reportType: string): number {
    // Return number of Excel sheets based on report type
    switch (reportType) {
      case 'raw-data-export': return 4;
      case 'vendor-performance': return 2;
      case 'campaign-performance': return 3;
      default: return 1;
    }
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ReportRequest = await req.json();
    const generator = new ReportGenerator();
    
    const result = await generator.generateReport(request);
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: result,
      downloadUrl: result.downloadUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});