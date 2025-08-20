import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ClientSelector } from "@/components/ClientSelector";
import { 
  ArrowLeft, 
  ArrowRight, 
  Zap, 
  Target, 
  DollarSign,
  Calendar,
  Music,
  Sparkles
} from "lucide-react";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  client: z.string().min(1, "Client name is required"), // Keep for backward compatibility
  client_id: z.string().optional(),
  track_url: z.string().url("Please enter a valid Spotify URL"),
  track_name: z.string().optional(),
  stream_goal: z.number().min(1, "Stream goal must be greater than 0"),
  budget: z.number().min(1, "Budget must be greater than 0"),
  sub_genre: z.string().min(1, "At least one genre is required"),
  start_date: z.string().min(1, "Start date is required"),
  duration_days: z.number().min(1, "Duration must be at least 1 day").max(365, "Duration cannot exceed 365 days"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignBuilderProps {
  onNext: (data: CampaignFormData) => void;
  onBack?: () => void;
  initialData?: Partial<CampaignFormData>;
}

import { UNIFIED_GENRES } from "@/lib/constants";

const popularGenres = UNIFIED_GENRES;

export default function CampaignConfiguration({ onNext, onBack, initialData }: CampaignBuilderProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialData?.sub_genre ? initialData.sub_genre.split(', ') : []
  );
  const [trackName, setTrackName] = useState(initialData?.track_name || "");
  const [selectedClientId, setSelectedClientId] = useState(initialData?.client_id || "");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      duration_days: 90,
      ...initialData
    }
  });

  const watchedValues = watch();

  const onSubmit = async (data: CampaignFormData) => {
    // Validate client selection
    if (!selectedClientId) {
      alert('Please select a client');
      return;
    }

    // First, check if there are any playlists available
    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('*, vendor:vendors(*)')
      .limit(1);
    
    if (!playlists || playlists.length === 0) {
      console.log('No playlists available in database');
      alert('No playlists available. Please add playlists first in Vendors & Playlists section.');
      return;
    }
    
    console.log('Moving to step 2 with data:', { 
      ...data, 
      client_id: selectedClientId,
      sub_genre: selectedGenres.join(', '), 
      track_name: trackName 
    });
    console.log('Available playlists:', playlists.length);
    
    onNext({ 
      ...data, 
      client_id: selectedClientId,
      sub_genre: selectedGenres.join(', '), 
      track_name: trackName 
    });
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      let newGenres;
      if (prev.includes(genre)) {
        newGenres = prev.filter(g => g !== genre);
      } else if (prev.length < 3) {
        newGenres = [...prev, genre];
      } else {
        return prev;
      }
      
      // Update the form field with the joined genres
      setValue("sub_genre", newGenres.join(', '));
      return newGenres;
    });
  };

  const handleTrackUrlChange = async (url: string) => {
    setValue("track_url", url);
    
    if (url.includes('spotify.com/track/')) {
      try {
        const trackId = url.split('/track/')[1]?.split('?')[0];
        if (trackId) {
          const { data } = await supabase.functions.invoke('spotify-fetch', {
            body: { trackId, type: 'track' }
          });
          
          if (data?.name && data?.artists?.[0]?.name) {
            const campaignName = `${data.artists[0].name} - ${data.name}`;
            setTrackName(data.name);
            setValue("track_name", data.name);
            setValue("name", campaignName); // Auto-populate campaign name
          }
        }
      } catch (error) {
        console.log("Could not auto-fetch track data:", error);
      }
    }
  };

  const calculateCPSt = () => {
    if (watchedValues.budget && watchedValues.stream_goal) {
      return (watchedValues.budget / watchedValues.stream_goal).toFixed(4);
    }
    return "0.0000";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
          Campaign Configuration
        </h1>
        <p className="text-muted-foreground">
          Set up your Spotify playlisting campaign details
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Music className="w-5 h-5 text-primary" />
                  <span>Campaign Details</span>
                </CardTitle>
                <CardDescription>
                  Basic information about your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="name">Campaign Name *</Label>
                     <Input
                       id="name"
                       {...register("name")}
                       placeholder="Will auto-populate from Spotify URL"
                       className={errors.name ? "border-destructive" : ""}
                     />
                     {errors.name && (
                       <p className="text-sm text-destructive">{errors.name.message}</p>
                     )}
                   </div>
                  
                   <div className="space-y-2">
                     <Label htmlFor="client">Client *</Label>
                     <ClientSelector
                       value={selectedClientId}
                       onChange={setSelectedClientId}
                       placeholder="Select or add client..."
                     />
                     {!selectedClientId && (
                       <p className="text-sm text-destructive">Please select a client</p>
                     )}
                   </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track_url">Spotify Track URL *</Label>
                  <Input
                    id="track_url"
                    placeholder="https://open.spotify.com/track/..."
                    className={errors.track_url ? "border-destructive" : ""}
                    onChange={(e) => handleTrackUrlChange(e.target.value)}
                    defaultValue={initialData?.track_url}
                  />
                  {errors.track_url && (
                    <p className="text-sm text-destructive">{errors.track_url.message}</p>
                  )}
                  {trackName && (
                    <p className="text-sm text-accent">✓ Track: {trackName}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price & Margin Analysis */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-secondary" />
                  <span>Price & Margin Analysis</span>
                </CardTitle>
                <CardDescription>
                  Set pricing with 40% minimum margin requirement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stream_goal">Stream Goal *</Label>
                    <Input
                      id="stream_goal"
                      type="number"
                      {...register("stream_goal", { valueAsNumber: true })}
                      placeholder="100000"
                      className={errors.stream_goal ? "border-destructive" : ""}
                    />
                    {errors.stream_goal && (
                      <p className="text-sm text-destructive">{errors.stream_goal.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budget">Price Paid (USD) *</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      {...register("budget", { valueAsNumber: true })}
                      placeholder="2500.00"
                      className={errors.budget ? "border-destructive" : ""}
                    />
                    {errors.budget && (
                      <p className="text-sm text-destructive">{errors.budget.message}</p>
                    )}
                    {watchedValues.budget && (
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated costs (60%):</span>
                          <span>${(watchedValues.budget * 0.6).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target margin (40%):</span>
                          <span className="text-green-600">${(watchedValues.budget * 0.4).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      {...register("start_date")}
                      className={errors.start_date ? "border-destructive" : ""}
                    />
                    {errors.start_date && (
                      <p className="text-sm text-destructive">{errors.start_date.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration_days">Duration (Days) *</Label>
                    <Input
                      id="duration_days"
                      type="number"
                      {...register("duration_days", { valueAsNumber: true })}
                      placeholder="90"
                      className={errors.duration_days ? "border-destructive" : ""}
                    />
                    {errors.duration_days && (
                      <p className="text-sm text-destructive">{errors.duration_days.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Genre Selection */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <span>Genre Selection (1-3 genres)</span>
                </CardTitle>
                <CardDescription>
                  Choose up to 3 genres for AI playlist matching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {popularGenres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                        selectedGenres.includes(genre)
                          ? 'bg-primary text-primary-foreground shadow-neon'
                          : 'bg-muted hover:bg-accent/20 text-muted-foreground hover:text-accent-foreground'
                      }`}
                      disabled={!selectedGenres.includes(genre) && selectedGenres.length >= 3}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected genres ({selectedGenres.length}/3): {selectedGenres.join(', ') || 'None'}
                </p>
                {selectedGenres.length === 0 && (
                  <p className="text-sm text-destructive">Please select at least one genre</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <Card className="bg-gradient-glow border-primary/20 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <span>Campaign Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stream Goal</span>
                    <span className="font-mono text-sm">
                      {watchedValues.stream_goal?.toLocaleString() || "0"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price Paid</span>
                    <span className="font-mono text-sm">
                      ${watchedValues.budget?.toLocaleString() || "0"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target Margin</span>
                    <span className="font-mono text-sm text-green-600">
                      ${((watchedValues.budget || 0) * 0.4).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-mono text-sm">
                      {watchedValues.duration_days || 0} days
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-border/30 pt-3">
                    <span className="text-sm text-muted-foreground">Cost per Stream</span>
                    <span className="font-mono text-sm text-primary">
                      ${calculateCPSt()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cost per 1k Streams</span>
                    <span className="font-mono text-sm text-accent">
                      ${((parseFloat(calculateCPSt()) || 0) * 1000).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedGenres.length > 0 ? selectedGenres.map(genre => (
                        <Badge key={genre} variant="outline" className="text-xs">
                          {genre}
                        </Badge>
                      )) : (
                        <Badge variant="outline" className="text-xs">
                          None selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-border/30">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={!onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button 
            type="submit" 
            className="bg-gradient-primary hover:opacity-80 shadow-glow"
            disabled={selectedGenres.length === 0}
          >
            Continue to AI Recommendations
            <Zap className="w-4 h-4 ml-2" />
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </div>
  );
}