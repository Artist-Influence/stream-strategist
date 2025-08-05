import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  client: z.string().min(1, "Client name is required"),
  track_url: z.string().url("Please enter a valid Spotify URL"),
  stream_goal: z.number().min(1, "Stream goal must be greater than 0"),
  budget: z.number().min(1, "Budget must be greater than 0"),
  sub_genre: z.string().min(1, "Sub-genre is required"),
  start_date: z.string().min(1, "Start date is required"),
  duration_days: z.number().min(1, "Duration must be at least 1 day").max(365, "Duration cannot exceed 365 days"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignBuilderProps {
  onNext: (data: CampaignFormData) => void;
  onBack?: () => void;
  initialData?: Partial<CampaignFormData>;
}

const popularGenres = [
  "pop", "rock", "hip-hop", "electronic", "indie", "r&b", "country", 
  "folk", "jazz", "classical", "reggae", "punk", "metal", "blues",
  "funk", "soul", "disco", "house", "techno", "dubstep", "trap",
  "lo-fi", "synthwave", "bedroom-pop", "indie-rock", "alt-rock"
];

export default function CampaignConfiguration({ onNext, onBack, initialData }: CampaignBuilderProps) {
  const [selectedGenre, setSelectedGenre] = useState(initialData?.sub_genre || "");
  
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

  const onSubmit = (data: CampaignFormData) => {
    onNext({ ...data, sub_genre: selectedGenre });
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
                      placeholder="Summer 2024 Single Launch"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client">Client/Artist Name *</Label>
                    <Input
                      id="client"
                      {...register("client")}
                      placeholder="Artist Name / Label"
                      className={errors.client ? "border-destructive" : ""}
                    />
                    {errors.client && (
                      <p className="text-sm text-destructive">{errors.client.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track_url">Spotify Track URL *</Label>
                  <Input
                    id="track_url"
                    {...register("track_url")}
                    placeholder="https://open.spotify.com/track/..."
                    className={errors.track_url ? "border-destructive" : ""}
                  />
                  {errors.track_url && (
                    <p className="text-sm text-destructive">{errors.track_url.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Goals & Budget */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-secondary" />
                  <span>Goals & Budget</span>
                </CardTitle>
                <CardDescription>
                  Define your campaign objectives and budget
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
                    <Label htmlFor="budget">Budget (USD) *</Label>
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
                  <span>Sub-Genre Selection</span>
                </CardTitle>
                <CardDescription>
                  Choose the primary sub-genre for AI playlist matching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {popularGenres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={selectedGenre === genre ? "default" : "secondary"}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        selectedGenre === genre 
                          ? "bg-primary text-primary-foreground shadow-neon" 
                          : "hover:bg-accent/20 hover:text-accent-foreground"
                      }`}
                      onClick={() => {
                        setSelectedGenre(genre);
                        setValue("sub_genre", genre);
                      }}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
                {!selectedGenre && (
                  <p className="text-sm text-destructive">Please select a sub-genre</p>
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
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <span className="font-mono text-sm">
                      ${watchedValues.budget?.toLocaleString() || "0"}
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
                    <span className="text-sm text-muted-foreground">Sub-Genre</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedGenre || "Not selected"}
                    </Badge>
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
            disabled={!selectedGenre}
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