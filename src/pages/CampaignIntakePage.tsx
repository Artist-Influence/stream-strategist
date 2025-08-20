import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ClientSelector } from '@/components/ClientSelector';
import { useClients } from '@/hooks/useClients';
import { useIsVendorManager } from '@/hooks/useIsVendorManager';
import { useCreateCampaignSubmission } from '@/hooks/useCampaignSubmissions';
import { useSalespeople } from '@/hooks/useSalespeople';
import { UNIFIED_GENRES } from '@/lib/constants';

interface FormData {
  client_id: string;
  client_name: string;
  client_emails: string;
  campaign_name: string;
  price_paid: string;
  stream_goal: string;
  start_date: string;
  track_url: string;
  notes: string;
  salesperson: string;
  music_genres: string[];
  territory_preferences: string[];
  content_types: string[];
}

export default function CampaignIntakePage() {
  const [isNewClient, setIsNewClient] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    client_id: '',
    client_name: '',
    client_emails: '',
    campaign_name: '',
    price_paid: '',
    stream_goal: '',
    start_date: '',
    track_url: '',
    notes: '',
    salesperson: '',
    music_genres: [],
    territory_preferences: [],
    content_types: []
  });

  const { data: clients = [] } = useClients();
  const { data: salespeople = [] } = useSalespeople();
  const { data: isVendorManager } = useIsVendorManager();
  // Removed client creation hook - handled by admin during approval process
  const createSubmission = useCreateCampaignSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.client_name || !formData.client_emails || !formData.campaign_name || 
        !formData.price_paid || !formData.stream_goal || !formData.start_date || 
        !formData.track_url || !formData.salesperson || formData.music_genres.length === 0) {
      return;
    }

    try {
      // Process emails into array
      const emailArray = formData.client_emails
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0)
        .slice(0, 5);

      // Create campaign submission
      await createSubmission.mutateAsync({
        client_name: formData.client_name,
        client_emails: emailArray,
        campaign_name: formData.campaign_name,
        price_paid: parseFloat(formData.price_paid),
        stream_goal: parseInt(formData.stream_goal),
        start_date: formData.start_date,
        track_url: formData.track_url,
        notes: formData.notes,
        salesperson: formData.salesperson,
        music_genres: formData.music_genres,
        territory_preferences: formData.territory_preferences,
        content_types: formData.content_types
      });

      // Reset form on success
      setFormData({
        client_id: '',
        client_name: '',
        client_emails: '',
        campaign_name: '',
        price_paid: '',
        stream_goal: '',
        start_date: '',
        track_url: '',
        notes: '',
        salesperson: '',
        music_genres: [],
        territory_preferences: [],
        content_types: []
      });
      setIsNewClient(false);

    } catch (error) {
      console.error('Error submitting campaign:', error);
    }
  };

  const handleClientSelection = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    const clientEmails = client?.emails && client.emails.length > 0 
      ? client.emails.join(', ') 
      : '';
    setFormData({
      ...formData,
      client_id: clientId,
      client_name: client?.name || '',
      client_emails: clientEmails
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
                  onValueChange={(value) => setFormData({...formData, salesperson: value})}
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
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Don't see your name? Contact admin to be added as a salesperson.
                </p>
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
                  <ClientSelector
                    value={formData.client_id}
                    onChange={handleClientSelection}
                    placeholder="Search and select existing client..."
                    allowCreate={isVendorManager || false}
                  />
                ) : (
                  <Input
                    placeholder="Enter new client name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value, client_id: ''})}
                    required
                  />
                )}
              </div>

              {/* Client Emails */}
              <div>
                <Label>Client Emails (up to 5, comma-separated) *</Label>
                <Textarea
                  placeholder={isNewClient ? "email1@example.com, email2@example.com" : 
                    (formData.client_emails ? "Emails auto-populated from client record" : "No emails found for this client - contact admin")}
                  value={formData.client_emails}
                  onChange={(e) => setFormData({...formData, client_emails: e.target.value})}
                  rows={2}
                  required
                  readOnly={!isNewClient}
                  className={!isNewClient ? "bg-muted" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isNewClient ? (
                    `${formData.client_emails.split(',').filter(e => e.trim()).length}/5 emails`
                  ) : !isNewClient && !formData.client_emails ? (
                    "⚠️ This client has no emails on file - contact admin to add client emails before submitting"
                  ) : (
                    "Emails are managed from the admin client view - contact admin for changes"
                  )}
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
                <Label>Track URL *</Label>
                <Input
                  placeholder="Spotify, SoundCloud, Dropbox, or other streaming link"
                  value={formData.track_url}
                  onChange={(e) => setFormData({...formData, track_url: e.target.value})}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For released songs: Spotify URL. For unreleased: SoundCloud, Dropbox, or private streaming link.
                </p>
              </div>

              {/* Music Genres */}
              <div>
                <Label>Music Genres (1-3 required) *</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {UNIFIED_GENRES.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => {
                        const currentGenres = formData.music_genres;
                        if (currentGenres.includes(genre)) {
                          setFormData({
                            ...formData,
                            music_genres: currentGenres.filter(g => g !== genre)
                          });
                        } else if (currentGenres.length < 3) {
                          setFormData({
                            ...formData,
                            music_genres: [...currentGenres, genre]
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                        formData.music_genres.includes(genre)
                          ? 'bg-destructive text-destructive-foreground shadow-md'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                      }`}
                      disabled={!formData.music_genres.includes(genre) && formData.music_genres.length >= 3}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected genres ({formData.music_genres.length}/3): {formData.music_genres.join(', ') || 'None selected'}
                </p>
                {formData.music_genres.length === 0 && (
                  <p className="text-xs text-destructive mt-1">Please select at least one genre</p>
                )}
              </div>

              {/* Territory Preferences */}
              <div>
                <Label>Territory Preferences (Optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {['US', 'UK', 'Germany', 'France', 'Canada', 'Australia', 'Brazil', 'Global'].map((territory) => (
                    <button
                      key={territory}
                      type="button"
                      onClick={() => {
                        const currentTerritories = formData.territory_preferences;
                        if (currentTerritories.includes(territory)) {
                          setFormData({
                            ...formData,
                            territory_preferences: currentTerritories.filter(t => t !== territory)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            territory_preferences: [...currentTerritories, territory]
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                        formData.territory_preferences.includes(territory)
                          ? 'bg-destructive text-destructive-foreground shadow-md'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {territory}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected territories: {formData.territory_preferences.join(', ') || 'None selected'}
                </p>
              </div>

              {/* Content Types */}
              <div>
                <Label>Content Types (Optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {['Playlist Feature', 'Blog Review', 'Social Media Post', 'Video Content', 'Podcast Feature'].map((contentType) => (
                    <button
                      key={contentType}
                      type="button"
                      onClick={() => {
                        const currentTypes = formData.content_types;
                        if (currentTypes.includes(contentType)) {
                          setFormData({
                            ...formData,
                            content_types: currentTypes.filter(t => t !== contentType)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            content_types: [...currentTypes, contentType]
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                        formData.content_types.includes(contentType)
                          ? 'bg-destructive text-destructive-foreground shadow-md'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {contentType}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected content types: {formData.content_types.join(', ') || 'None selected'}
                </p>
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
                disabled={createSubmission.isPending}
              >
                {createSubmission.isPending 
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