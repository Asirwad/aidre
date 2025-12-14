USE DATABASE AIDRE_DB;

-- (Part 1: Business Data)

USE SCHEMA BUSINESS_DATA;

-- Fact table: Transactional events (e.g., orders, clicks, logins)
CREATE OR REPLACE TABLE fact_events (
    event_id STRING NOT NULL,
    event_type STRING NOT NULL,
    user_id STRING,
    event_timestamp TIMESTAMP_NTZ NOT NULL,
    event_data VARIANT,  -- JSON payload
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Dimension table: User attributes
CREATE OR REPLACE TABLE dim_users (
    user_id STRING NOT NULL,
    email STRING,
    full_name STRING,
    account_status STRING,
    created_at TIMESTAMP_NTZ,
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Pipeline tracking: When data was loaded
CREATE OR REPLACE TABLE pipeline_runs (
    run_id STRING NOT NULL,
    pipeline_name STRING NOT NULL,
    status STRING NOT NULL,  -- 'success', 'failed', 'running'
    started_at TIMESTAMP_NTZ NOT NULL,
    completed_at TIMESTAMP_NTZ,
    rows_processed INTEGER,
    error_message STRING
);

-- (Part 2: AIDRE Internal)

USE SCHEMA AIDRE_INTERNAL;

-- Schema version tracking: Detect schema drift
CREATE OR REPLACE TABLE schema_snapshots (
    snapshot_id STRING NOT NULL,
    table_name STRING NOT NULL,
    schema_hash STRING NOT NULL,  -- Hash of column definitions
    column_count INTEGER NOT NULL,
    columns_json VARIANT NOT NULL,  -- Full column metadata
    captured_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Data quality snapshots: Point-in-time statistics
CREATE OR REPLACE TABLE quality_snapshots (
    snapshot_id STRING NOT NULL,
    table_name STRING NOT NULL,
    row_count INTEGER NOT NULL,
    null_counts VARIANT,  -- {"column_name": null_count, ...}
    value_distributions VARIANT,  -- {"column_name": {"value": count}, ...}
    freshness_hours FLOAT,  -- Hours since last data
    captured_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Reliability findings: What we detected
CREATE OR REPLACE TABLE reliability_findings (
    finding_id STRING NOT NULL,
    table_name STRING NOT NULL,
    finding_type STRING NOT NULL,  -- 'freshness', 'schema_drift', 'volume_anomaly', etc.
    severity STRING NOT NULL,  -- 'low', 'medium', 'high', 'critical'
    description STRING NOT NULL,
    evidence VARIANT,  -- Supporting data
    detected_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);