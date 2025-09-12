-- Insert mockup data for ML learning system

-- Insert algorithm learning log entries
INSERT INTO algorithm_learning_log (campaign_id, decision_type, input_data, decision_data, performance_impact, confidence_score, algorithm_version) VALUES
-- Recent learning entries
('00000000-0000-0000-0000-000000000001', 'playlist_selection', 
 '{"budget": 10000, "target_genres": ["pop", "electronic"], "target_streams": 50000}',
 '{"selected_playlists": ["pl1", "pl2"], "reasoning": "High genre match + reliable vendors"}',
 0.85, 0.92, '2.1'),
 
('00000000-0000-0000-0000-000000000002', 'budget_allocation',
 '{"total_budget": 15000, "playlists": 5, "priority_genres": ["hip-hop"]}',
 '{"allocations": {"pl1": 6000, "pl2": 4000, "pl3": 5000}, "strategy": "Performance-weighted"}',
 0.78, 0.88, '2.1'),

('00000000-0000-0000-0000-000000000003', 'optimization',
 '{"current_performance": 0.65, "target_performance": 0.80, "adjustment_type": "vendor_weights"}',
 '{"adjustments": {"vendor_reliability": 1.2, "genre_matching": 1.1}, "expected_lift": 0.15}',
 0.92, 0.95, '2.1'),

-- Historical learning data for trends
('00000000-0000-0000-0000-000000000004', 'playlist_selection',
 '{"budget": 8000, "target_genres": ["rock", "indie"], "target_streams": 30000}',
 '{"selected_playlists": ["pl3", "pl4"], "reasoning": "Genre specialists"}',
 0.72, 0.84, '2.0'),

('00000000-0000-0000-0000-000000000005', 'fraud_detection',
 '{"suspicious_patterns": ["unusual_spike", "bot_traffic"], "vendor_id": "v1"}',
 '{"risk_score": 0.75, "action": "flag_for_review", "confidence": 0.88}',
 0.95, 0.88, '2.1');

-- Insert campaign allocations performance data
INSERT INTO campaign_allocations_performance (campaign_id, playlist_id, vendor_id, allocated_streams, predicted_streams, actual_streams, cost_per_stream, actual_cost_per_stream, performance_score) VALUES
-- High performing campaigns
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 15000, 14500, 16200, 0.05, 0.048, 0.95),
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 12000, 11800, 11600, 0.06, 0.061, 0.88),

-- Medium performing campaigns  
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 20000, 19000, 17500, 0.04, 0.045, 0.78),
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 8000, 8200, 7800, 0.07, 0.072, 0.82),

-- Underperforming campaigns
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 25000, 24000, 18000, 0.05, 0.065, 0.65),
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 10000, 9500, 8200, 0.08, 0.089, 0.72);

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
-- Trending up playlists
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2024-01-01', '2024-01-31', 850, 1200, 0.92, 0.95, 'upward'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2024-02-01', '2024-02-29', 920, 1350, 0.91, 0.96, 'upward'),

-- Stable performers
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '2024-01-01', '2024-01-31', 650, 780, 0.88, 0.89, 'stable'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '2024-02-01', '2024-02-29', 670, 790, 0.87, 0.90, 'stable'),

-- Declining performers  
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '2024-01-01', '2024-01-31', 420, 580, 0.75, 0.82, 'downward'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '2024-02-01', '2024-02-29', 380, 520, 0.73, 0.78, 'downward');