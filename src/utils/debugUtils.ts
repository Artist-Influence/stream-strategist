// Debug utilities for troubleshooting cache and connection issues

export function clearBrowserCache() {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage  
    sessionStorage.clear();
    
    // Clear React Query cache keys related to campaigns
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('campaign') || key.includes('client') || key.includes('react-query'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('🧹 Browser cache cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
}

export function logCurrentProject() {
  console.log('🔍 Current Supabase Project Details:');
  console.log('Project ID: mwtrdhnctzasddbeilwm');
  console.log('URL: https://mwtrdhnctzasddbeilwm.supabase.co');
  console.log('Expected: Music promotion campaigns, NOT Instagram seeding');
}

export function validateCampaignData(campaigns: any[]) {
  if (!campaigns || campaigns.length === 0) {
    console.log('✅ No campaigns found');
    return true;
  }
  
  const suspiciousKeywords = ['instagram', 'seeding', 'influencer', 'tiktok', 'social'];
  const suspicious = campaigns.filter(campaign => 
    suspiciousKeywords.some(keyword => 
      campaign.name?.toLowerCase().includes(keyword)
    )
  );
  
  if (suspicious.length > 0) {
    console.warn('⚠️ WRONG PROJECT DATA DETECTED:');
    console.warn('Found campaigns that appear to be from Instagram seeding project:');
    suspicious.forEach(campaign => {
      console.warn(`- ${campaign.name} (ID: ${campaign.id})`);
    });
    return false;
  }
  
  console.log('✅ Campaign data appears correct for music promotion project');
  return true;
}