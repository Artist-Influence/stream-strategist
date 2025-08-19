import { ClientManager } from '@/components/ClientManager';
import { CampaignSubmissionsManager } from '@/components/CampaignSubmissionsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';

export default function ClientsPage() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="clients">Client Management</TabsTrigger>
            <TabsTrigger value="submissions">Campaign Submissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients">
            <ClientManager />
          </TabsContent>
          
          <TabsContent value="submissions">
            <CampaignSubmissionsManager />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}