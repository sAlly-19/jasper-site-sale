ALTER TABLE licenses ADD COLUMN order_slot INTEGER;

CREATE UNIQUE INDEX idx_licenses_order_slot
  ON licenses(order_id, order_slot)
  WHERE order_id IS NOT NULL AND order_slot IS NOT NULL;

CREATE TABLE device_nonces (
  device_id TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (device_id, nonce),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE INDEX idx_device_nonces_created ON device_nonces(created_at);
