-- 03_seed_test_data.sql
-- Seeds demo data WITH INTENTIONAL ISSUES for testing
USE DATABASE AIDRE_DB;
USE SCHEMA BUSINESS_DATA;
-- Clear existing data
TRUNCATE TABLE fact_events;
TRUNCATE TABLE dim_users;
TRUNCATE TABLE pipeline_runs;
-- ============================================
-- DIM_USERS: Some nulls in email (null spike demo)
-- ============================================
INSERT INTO dim_users (user_id, email, full_name, account_status, created_at, updated_at) VALUES
('U001', 'alice@example.com', 'Alice Smith', 'active', '2024-01-01', CURRENT_TIMESTAMP()),
('U002', 'bob@example.com', 'Bob Johnson', 'active', '2024-01-15', CURRENT_TIMESTAMP()),
('U003', NULL, 'Charlie Brown', 'active', '2024-02-01', CURRENT_TIMESTAMP()),  -- NULL email
('U004', NULL, 'Diana Prince', 'inactive', '2024-02-15', CURRENT_TIMESTAMP()),  -- NULL email
('U005', 'eve@example.com', 'Eve Wilson', 'active', '2024-03-01', CURRENT_TIMESTAMP()),
('U006', NULL, 'Frank Castle', 'active', '2024-03-15', CURRENT_TIMESTAMP()),  -- NULL email
('U007', 'grace@example.com', 'Grace Lee', 'active', '2024-04-01', CURRENT_TIMESTAMP()),
('U008', NULL, 'Hank Pym', 'inactive', '2024-04-15', CURRENT_TIMESTAMP()),  -- NULL email
('U009', 'ivy@example.com', 'Ivy Chen', 'active', '2024-05-01', CURRENT_TIMESTAMP()),
('U010', NULL, 'Jack Ryan', 'active', '2024-05-15', CURRENT_TIMESTAMP());  -- NULL email (50% null rate!)
-- ============================================
-- FACT_EVENTS: Good data, but STALE (freshness demo)
-- Last event was 3 days ago
-- ============================================
INSERT INTO fact_events (event_id, event_type, user_id, event_timestamp, event_data) VALUES
('E001', 'login', 'U001', DATEADD(day, -3, CURRENT_TIMESTAMP()), PARSE_JSON('{"device": "mobile"}')),
('E002', 'purchase', 'U001', DATEADD(day, -3, CURRENT_TIMESTAMP()), PARSE_JSON('{"amount": 99.99}')),
('E003', 'login', 'U002', DATEADD(day, -3, CURRENT_TIMESTAMP()), PARSE_JSON('{"device": "desktop"}')),
('E004', 'click', 'U002', DATEADD(day, -3, CURRENT_TIMESTAMP()), PARSE_JSON('{"page": "home"}')),
('E005', 'logout', 'U001', DATEADD(day, -3, CURRENT_TIMESTAMP()), PARSE_JSON('{}')),
('E006', 'login', 'U005', DATEADD(day, -4, CURRENT_TIMESTAMP()), PARSE_JSON('{"device": "tablet"}')),
('E007', 'purchase', 'U007', DATEADD(day, -4, CURRENT_TIMESTAMP()), PARSE_JSON('{"amount": 149.99}')),
('E008', 'click', 'U009', DATEADD(day, -5, CURRENT_TIMESTAMP()), PARSE_JSON('{"page": "products"}'));
-- ============================================
-- PIPELINE_RUNS: Shows failed runs (reliability signal)
-- ============================================
INSERT INTO pipeline_runs (run_id, pipeline_name, status, started_at, completed_at, rows_processed, error_message) VALUES
('R001', 'user_ingestion', 'success', DATEADD(day, -1, CURRENT_TIMESTAMP()), DATEADD(day, -1, CURRENT_TIMESTAMP()), 100, NULL),
('R002', 'event_ingestion', 'success', DATEADD(day, -1, CURRENT_TIMESTAMP()), DATEADD(day, -1, CURRENT_TIMESTAMP()), 500, NULL),
('R003', 'user_ingestion', 'failed', DATEADD(hour, -12, CURRENT_TIMESTAMP()), DATEADD(hour, -12, CURRENT_TIMESTAMP()), 0, 'Connection timeout'),
('R004', 'event_ingestion', 'failed', DATEADD(hour, -6, CURRENT_TIMESTAMP()), DATEADD(hour, -6, CURRENT_TIMESTAMP()), 0, 'Schema mismatch'),
('R005', 'analytics_rollup', 'success', DATEADD(hour, -3, CURRENT_TIMESTAMP()), DATEADD(hour, -3, CURRENT_TIMESTAMP()), 1000, NULL);
-- Verify data
SELECT 'dim_users' as table_name, COUNT(*) as row_count FROM dim_users
UNION ALL
SELECT 'fact_events', COUNT(*) FROM fact_events
UNION ALL
SELECT 'pipeline_runs', COUNT(*) FROM pipeline_runs;