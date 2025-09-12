import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Play,
  FileText,
  Music,
  Shield
} from "lucide-react";
import { 
  useContentVerification, 
  useVerifyPlaylistContent,
  ContentVerificationLog 
} from "@/hooks/useContentVerification";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ContentVerificationPanelProps {
  playlistId?: string;
  campaignId?: string;
}

const ContentVerificationPanel: React.FC<ContentVerificationPanelProps> = ({
  playlistId,
  campaignId,
}) => {
  const { data: verificationLogs, isLoading } = useContentVerification(playlistId, campaignId);
  const verifyContent = useVerifyPlaylistContent();

  const getStatusIcon = (status: ContentVerificationLog['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: ContentVerificationLog['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'flagged':
        return <Badge variant="secondary">Flagged</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getVerificationTypeIcon = (type: ContentVerificationLog['verification_type']) => {
    switch (type) {
      case 'genre_matching':
        return <Music className="h-4 w-4" />;
      case 'content_quality':
        return <Shield className="h-4 w-4" />;
      case 'manual_review':
        return <FileText className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const handleVerifyContent = async (verificationType: 'genre_matching' | 'content_quality' | 'manual_review') => {
    if (!playlistId) return;
    
    await verifyContent.mutateAsync({
      playlistId,
      campaignId,
      verificationType,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Content Verification</span>
        </CardTitle>
        <CardDescription>
          Verify playlist content quality and genre matching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {playlistId && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVerifyContent('genre_matching')}
              disabled={verifyContent.isPending}
            >
              <Music className="h-4 w-4 mr-2" />
              Verify Genres
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVerifyContent('content_quality')}
              disabled={verifyContent.isPending}
            >
              <Shield className="h-4 w-4 mr-2" />
              Check Quality
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVerifyContent('manual_review')}
              disabled={verifyContent.isPending}
            >
              <FileText className="h-4 w-4 mr-2" />
              Manual Review
            </Button>
          </div>
        )}

        {verificationLogs && verificationLogs.length > 0 ? (
          <div className="space-y-4">
            {verificationLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getVerificationTypeIcon(log.verification_type)}
                    <span className="font-medium capitalize">
                      {log.verification_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(log.status)}
                    {getStatusBadge(log.status)}
                  </div>
                </div>

                {log.score !== null && log.score !== undefined && (
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Verification Score</span>
                      <span>{Math.round(log.score * 100)}%</span>
                    </div>
                    <Progress value={log.score * 100} />
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>Verified on {format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                  {log.notes && <p className="mt-1">{log.notes}</p>}
                </div>

                {log.verification_data && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-2">Verification Details:</p>
                    <div className="text-xs space-y-1">
                      {log.verification_data.genre_match_accuracy && (
                        <div className="flex justify-between">
                          <span>Genre Match Accuracy:</span>
                          <span>{Math.round(log.verification_data.genre_match_accuracy * 100)}%</span>
                        </div>
                      )}
                      {log.verification_data.content_quality_indicators && (
                        <div className="space-y-1">
                          <p className="font-medium">Quality Indicators:</p>
                          {Object.entries(log.verification_data.content_quality_indicators).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex justify-between ml-2">
                              <span className="capitalize">{key.replace('_', ' ')}:</span>
                              <span>{Math.round(value * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Shield className="mx-auto h-12 w-12 mb-4" />
            <p>No content verification logs found</p>
            {playlistId && (
              <p className="text-sm">Click the buttons above to start content verification</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentVerificationPanel;