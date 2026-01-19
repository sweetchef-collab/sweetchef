-- Add order_count column to daily_metrics table
ALTER TABLE daily_metrics 
ADD COLUMN IF NOT EXISTS order_count numeric DEFAULT 0;

-- Update the comment for clarity
COMMENT ON COLUMN daily_metrics.order_count IS 'Nombre de commandes (Ventes)';
