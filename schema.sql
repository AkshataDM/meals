-- D1 Database Schema for Meal Planner
-- Run this in your Cloudflare D1 database

CREATE TABLE IF NOT EXISTS meal_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    week_start TEXT NOT NULL,
    week_end TEXT NOT NULL,
    meals TEXT NOT NULL, -- JSON string of meal data
    ingredients TEXT, -- Generated ingredients list
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, week_start, week_end)
);

-- Create index for session-based lookups
CREATE INDEX IF NOT EXISTS idx_meal_plans_session ON meal_plans(session_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meal_plans_week ON meal_plans(session_id, week_start, week_end);

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_meal_plans_dates ON meal_plans(created_at, updated_at);
