-- First insert base campaigns and vendors for ML data
INSERT INTO vendors (id, name, max_daily_streams, cost_per_1k_streams, max_concurrent_campaigns) VALUES
('20000000-0000-0000-0000-000000000001', 'Premium Music Network', 50000, 0.045, 8),
('20000000-0000-0000-0000-000000000002', 'StreamFlow Partners', 35000, 0.052, 6),
('20000000-0000-0000-0000-000000000003', 'Viral Beats Co', 42000, 0.048, 7),
('20000000-0000-0000-0000-000000000004', 'Digital Audio Labs', 28000, 0.055, 5);

-- Insert playlists for the vendors
INSERT INTO playlists (id, vendor_id, name, url, genres, avg_daily_streams, follower_count) VALUES
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Electronic Beats', 'https://spotify.com/pl1', ARRAY['electronic', 'dance'], 1250, 45000),
('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Pop Vibes', 'https://spotify.com/pl2', ARRAY['pop', 'mainstream'], 980, 32000),
('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Hip Hop Central', 'https://spotify.com/pl3', ARRAY['hip-hop', 'rap'], 850, 28000),
('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'Indie Discoveries', 'https://spotify.com/pl4', ARRAY['indie', 'alternative'], 620, 22000),
('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'Rock Anthems', 'https://spotify.com/pl5', ARRAY['rock', 'classic-rock'], 750, 35000),
('10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 'Chill Sounds', 'https://spotify.com/pl6', ARRAY['ambient', 'chill'], 420, 18000);

-- Insert campaigns for ML testing
INSERT INTO campaigns (id, name, brand_name, description, budget, stream_goal, start_date, duration_days, music_genres, content_types, territory_preferences, status, client, track_url, track_name) VALUES
('00000000-0000-0000-0000-000000000001', 'Electronic Summer Campaign', 'SoundWave Records', 'Summer electronic music promotion', 25000, 150000, '2024-06-01', 60, ARRAY['electronic', 'dance'], ARRAY['playlists'], ARRAY['US', 'UK'], 'active', 'SoundWave Records', 'https://spotify.com/track1', 'Summer Nights'),
('00000000-0000-0000-0000-000000000002', 'Hip Hop Rise', 'Urban Beats Label', 'Emerging hip hop artist promotion', 18000, 100000, '2024-05-15', 45, ARRAY['hip-hop', 'rap'], ARRAY['playlists'], ARRAY['US', 'CA'], 'active', 'Urban Beats Label', 'https://spotify.com/track2', 'Rise Up'),
('00000000-0000-0000-0000-000000000003', 'Indie Discovery', 'Independent Music Co', 'Alternative indie artist campaign', 12000, 75000, '2024-05-01', 90, ARRAY['indie', 'alternative'], ARRAY['playlists'], ARRAY['US', 'EU'], 'active', 'Independent Music Co', 'https://spotify.com/track3', 'Midnight Drive');

-- Now insert the ML learning data
INSERT INTO algorithm_learning_log (campaign_id, decision_type, input_data, decision_data, performance_impact, confidence_score, algorithm_version) VALUES
('00000000-0000-0000-0000-000000000001', 'playlist_selection', 
 '{"budget": 10000, "target_genres": ["electronic", "dance"], "target_streams": 50000}',
 '{"selected_playlists": ["10000000-0000-0000-0000-000000000001"], "reasoning": "High genre match + reliable vendor"}',
 0.85, 0.92, '2.1'),
 
('00000000-0000-0000-0000-000000000002', 'budget_allocation',
 '{"total_budget": 15000, "playlists": 3, "priority_genres": ["hip-hop"]}',
 '{"allocations": {"10000000-0000-0000-0000-000000000003": 8000}, "strategy": "Performance-weighted"}',
 0.78, 0.88, '2.1'),

('00000000-0000-0000-0000-000000000003', 'optimization',
 '{"current_performance": 0.65, "target_performance": 0.80, "adjustment_type": "vendor_weights"}',
 '{"adjustments": {"vendor_reliability": 1.2, "genre_matching": 1.1}, "expected_lift": 0.15}',
 0.92, 0.95, '2.1'),

('00000000-0000-0000-0000-000000000001', 'fraud_detection',
 '{"suspicious_patterns": ["unusual_spike"], "playlist_id": "10000000-0000-0000-0000-000000000001"}',
 '{"risk_score": 0.25, "action": "monitor", "confidence": 0.78}',
 0.88, 0.78, '2.1'),

('00000000-0000-0000-0000-000000000002', 'playlist_selection',
 '{"budget": 8000, "target_genres": ["hip-hop", "rap"], "target_streams": 30000}',
 '{"selected_playlists": ["10000000-0000-0000-0000-000000000003"], "reasoning": "Genre specialists"}',
 0.72, 0.84, '2.0');

-- Insert campaign allocations performance data
INSERT INTO campaign_allocations_performance (campaign_id, playlist_id, vendor_id, allocated_streams, predicted_streams, actual_streams, cost_per_stream, actual_cost_per_stream, performance_score) VALUES
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 15000, 14500, 16200, 0.045, 0.042, 0.95),
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 12000, 11800, 11600, 0.052, 0.053, 0.88),
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 20000, 19000, 17500, 0.045, 0.048, 0.78),
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 8000, 8200, 7800, 0.048, 0.051, 0.82),
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 25000, 24000, 18000, 0.052, 0.068, 0.65),
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 10000, 9500, 8200, 0.055, 0.061, 0.72);

-- Insert vendor reliability scores
INSERT INTO vendor_reliability_scores (vendor_id, delivery_consistency, stream_accuracy, cost_efficiency, response_time_hours, quality_score, total_campaigns, successful_campaigns) VALUES
('20000000-0000-0000-0000-000000000001', 0.94, 0.89, 0.92, 8, 0.91, 45, 42),
('20000000-0000-0000-0000-000000000002', 0.87, 0.82, 0.88, 12, 0.85, 38, 31),
('20000000-0000-0000-0000-000000000003', 0.91, 0.85, 0.86, 10, 0.87, 52, 46),
('20000000-0000-0000-0000-000000000004', 0.78, 0.79, 0.81, 18, 0.79, 29, 22);

-- Insert performance alerts
INSERT INTO performance_alerts (campaign_id, alert_type, severity, message, threshold_value, current_value) VALUES
('00000000-0000-0000-0000-000000000001', 'performance_drop', 'medium', 'Campaign performance below expected threshold', 0.80, 0.72),
('00000000-0000-0000-0000-000000000002', 'budget_overspend', 'high', 'Campaign exceeding budget allocation', 10000, 11500),
('00000000-0000-0000-0000-000000000003', 'delivery_delay', 'low', 'Playlist delivery behind schedule', 7, 10),
('00000000-0000-0000-0000-000000000001', 'fraud_risk', 'high', 'Unusual traffic patterns detected', 0.15, 0.68);

-- Insert fraud detection alerts
INSERT INTO fraud_detection_alerts (campaign_id, playlist_id, vendor_id, alert_type, severity, detection_data, confidence_score, status) VALUES
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'bot_traffic', 'high', 
 '{"unusual_spike_percentage": 45, "bot_score": 0.78, "geographic_anomaly": true}', 0.85, 'open'),
 
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'fake_engagement', 'medium',
 '{"engagement_spike": 250, "follower_quality_score": 0.45, "suspicious_timing": true}', 0.72, 'investigating'),

('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'unusual_pattern', 'low',
 '{"deviation_from_norm": 1.8, "historical_comparison": "anomalous"}', 0.58, 'resolved');

-- Insert playlist performance history
INSERT INTO playlist_performance_history (playlist_id, campaign_id, period_start, period_end, avg_daily_streams, peak_streams, genre_match_score, reliability_score, performance_trend) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2024-01-01', '2024-01-31', 850, 1200, 0.92, 0.95, 'upward'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2024-02-01', '2024-02-29', 920, 1350, 0.91, 0.96, 'upward'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '2024-01-01', '2024-01-31', 650, 780, 0.88, 0.89, 'stable'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '2024-02-01', '2024-02-29', 670, 790, 0.87, 0.90, 'stable'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '2024-01-01', '2024-01-31', 420, 580, 0.75, 0.82, 'downward'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '2024-02-01', '2024-02-29', 380, 520, 0.73, 0.78, 'downward');