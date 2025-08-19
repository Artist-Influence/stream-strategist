import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useCreateClient } from '@/hooks/useClients';
import { useCreateCampaignSubmission } from '@/hooks/useCampaignSubmissions';
import { useSalespeople } from '@/hooks/useSalespeople';

interface FormData {
  client_name: string;
  client_emails: string;
  campaign_name: string;
  price_paid: string;
  stream_goal: string;
  start_date: string;
  track_url: string;
  notes: string;
  salesperson: string;
}

export default function CampaignIntakePage() {
  const [isNewClient, setIsNewClient] = useState(false);
  const [customSalesperson, setCustomSalesperson] = useState('');
  const [formData, setFormData] = useState<FormData>({
    client_name: '',
    client_emails: '',
    campaign_name: '',
    price_paid: '',
    stream_goal: '',
    start_date: '',
    track_url: '',
    notes: '',
    salesperson: ''
  });

  const { data: clients = [] } = useClients();
  const { data: salespeople = [] } = useSalespeople();
  const createClient = useCreateClient();
  const createSubmission = useCreateCampaignSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.client_name || !formData.client_emails || !formData.campaign_name || 
        !formData.price_paid || !formData.stream_goal || !formData.start_date || 
        !formData.track_url || !formData.salesperson) {
      return;
    }

    try {
      // If new client, create them first
      if (isNewClient && formData.client_name) {
        const emailArray = formData.client_emails
          .split(',')
          .map(e => e.trim())
          .filter(e => e.length > 0)
          .slice(0, 5);

        await createClient.mutateAsync({
          name: formData.client_name,
          emails: emailArray,
          credit_balance: 0
        });
      }

      // Process emails into array
      const emailArray = formData.client_emails
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0)
        .slice(0, 5);

      // Create campaign submission
      const finalSalesperson = formData.salesperson === 'Other' ? customSalesperson : formData.salesperson;
      
      await createSubmission.mutateAsync({
        client_name: formData.client_name,
        client_emails: emailArray,
        campaign_name: formData.campaign_name,
        price_paid: parseFloat(formData.price_paid),
        stream_goal: parseInt(formData.stream_goal),
        start_date: formData.start_date,
        track_url: formData.track_url,
        notes: formData.notes,
        salesperson: finalSalesperson
      });

      // Reset form on success
      setFormData({
        client_name: '',
        client_emails: '',
        campaign_name: '',
        price_paid: '',
        stream_goal: '',
        start_date: '',
        track_url: '',
        notes: '',
        salesperson: ''
      });
      setCustomSalesperson('');
      setIsNewClient(false);

    } catch (error) {
      console.error('Error submitting campaign:', error);
    }
  };

  const handleClientSelection = (clientName: string) => {
    const client = clients.find(c => c.name === clientName);
    setFormData({
      ...formData,
      client_name: clientName,
      client_emails: client?.emails?.join(', ') || ''
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-destructive mb-2">
            ARTIST INFLUENCE
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Campaign Submission Form
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Submit new campaign details for approval. All fields marked with * are required.
          </p>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Salesperson Selection */}
              <div>
                <Label>Salesperson *</Label>
                <Select 
                  value={formData.salesperson} 
                  onValueChange={(value) => {
                    setFormData({...formData, salesperson: value});
                    if (value !== 'Other') {
                      setCustomSalesperson('');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    {salespeople.filter(sp => sp.is_active).map(person => (
                      <SelectItem key={person.id} value={person.name}>
                        {person.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">Other (specify below)</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.salesperson === 'Other' && (
                  <Input
                    className="mt-2"
                    placeholder="Enter salesperson name"
                    value={customSalesperson}
                    onChange={(e) => setCustomSalesperson(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Client Selection */}
              <div>
                <Label>Client *</Label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={!isNewClient ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsNewClient(false)}
                  >
                    Existing Client
                  </Button>
                  <Button
                    type="button"
                    variant={isNewClient ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsNewClient(true)}
                  >
                    New Client
                  </Button>
                </div>

                {!isNewClient ? (
                  <Select 
                    value={formData.client_name} 
                    onValueChange={handleClientSelection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Enter new client name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    required
                  />
                )}
              </div>

              {/* Client Emails */}
              <div>
                <Label>Client Emails (up to 5, comma-separated) *</Label>
                <Textarea
                  placeholder="email1@example.com, email2@example.com"
                  value={formData.client_emails}
                  onChange={(e) => setFormData({...formData, client_emails: e.target.value})}
                  rows={2}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.client_emails.split(',').filter(e => e.trim()).length}/5 emails
                </p>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Campaign Name *</Label>
                  <Input
                    placeholder="Artist - Song Title"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Price Paid ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount paid"
                    value={formData.price_paid}
                    onChange={(e) => setFormData({...formData, price_paid: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Stream Goal *</Label>
                  <Input
                    type="number"
                    placeholder="Target streams"
                    value={formData.stream_goal}
                    onChange={(e) => setFormData({...formData, stream_goal: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Track URL */}
              <div>
                <Label>Spotify Track URL *</Label>
                <Input
                  placeholder="https://open.spotify.com/track/..."
                  value={formData.track_url}
                  onChange={(e) => setFormData({...formData, track_url: e.target.value})}
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any special requirements or additional information"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-destructive hover:bg-destructive/90"
                disabled={createSubmission.isPending || createClient.isPending}
              >
                {createSubmission.isPending || createClient.isPending 
                  ? "Submitting..." 
                  : "Submit Campaign for Approval"
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Need help? Contact the Artist Influence team</p>
        </div>
      </div>
    </div>
  );
}