import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignSubmission {
  id: string;
  client_name: string;
  client_emails: string[];
  campaign_name: string;
  price_paid: number;
  stream_goal: number;
  start_date: string;
  track_url: string;
  notes?: string;
  salesperson: string;
  created_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record } = await req.json() as { record: CampaignSubmission };
    console.log('New campaign submission received:', record);

    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
    if (!slackWebhookUrl) {
      console.error('SLACK_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Slack webhook not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Format the date nicely
    const startDate = new Date(record.start_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format currency
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(record.price_paid);

    // Format stream goal with commas
    const formattedStreamGoal = record.stream_goal.toLocaleString();

    // Create the Slack message
    const slackMessage = {
      text: "🎵 New Campaign Submission",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎵 New Campaign Submission"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Campaign:* ${record.campaign_name}`
            },
            {
              type: "mrkdwn", 
              text: `*Client:* ${record.client_name}`
            },
            {
              type: "mrkdwn",
              text: `*Salesperson:* ${record.salesperson}`
            },
            {
              type: "mrkdwn",
              text: `*Budget:* ${formattedPrice}`
            },
            {
              type: "mrkdwn",
              text: `*Stream Goal:* ${formattedStreamGoal} streams`
            },
            {
              type: "mrkdwn",
              text: `*Start Date:* ${startDate}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Client Emails:*\n${record.client_emails.join('\n')}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Track URL:*\n${record.track_url}`
          }
        }
      ]
    };

    // Add notes section if notes exist
    if (record.notes && record.notes.trim()) {
      slackMessage.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Notes:*\n${record.notes}`
        }
      });
    }

    // Add action section with link to admin dashboard
    slackMessage.blocks.push(
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Review and approve this submission in the admin dashboard"
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Review Submission"
          },
          url: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://localhost:3000'}/dashboard`,
          action_id: "review_submission"
        }
      }
    );

    // Send to Slack
    const slackResponse = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error('Slack webhook failed:', slackResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send Slack notification',
          details: errorText 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Slack notification sent successfully');
    return new Response(
      JSON.stringify({ success: true, message: 'Slack notification sent' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in campaign-submission-notify function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);