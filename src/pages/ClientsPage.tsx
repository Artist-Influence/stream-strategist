import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClientManager } from '@/components/ClientManager';
import { CampaignSubmissionsManager } from '@/components/CampaignSubmissionsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';

export default function ClientsPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'clients';
  });
  
  const submissionId = searchParams.get('submissionId');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="clients">Client Management</TabsTrigger>
            <TabsTrigger value="submissions">Campaign Submissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients">
            <ClientManager />
          </TabsContent>
          
          <TabsContent value="submissions">
            <CampaignSubmissionsManager highlightSubmissionId={submissionId} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}