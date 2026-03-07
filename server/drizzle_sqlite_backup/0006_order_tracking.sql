-- Order tracking: display number, fulfillment status, estimated delivery
ALTER TABLE orders ADD COLUMN order_number text;
ALTER TABLE orders ADD COLUMN fulfillment_status text DEFAULT 'confirmed';
ALTER TABLE orders ADD COLUMN estimated_delivery_at text;
