// Run in Mongo shell against your UniCloud database.
// Example: use <your-db-name>; load("create-indexes.mongodb.js")

db.getCollection("pf_user_plants").createIndex(
  { uid: 1, plant_id: 1 },
  { unique: true, name: "uniq_uid_plant_id" }
);

db.getCollection("pf_actions_log").createIndex(
  { idempotency_key: 1 },
  { unique: true, name: "uniq_idempotency_key" }
);

db.getCollection("pf_actions_log").createIndex(
  { uid: 1, user_plant_id: 1, action_date: 1, action_type: 1 },
  { name: "idx_action_daily_query" }
);

db.getCollection("pf_exchange_orders").createIndex(
  { user_plant_id: 1, status: 1 },
  {
    unique: true,
    name: "uniq_user_plant_pending_ship",
    partialFilterExpression: { status: "pending_ship" }
  }
);

db.getCollection("pf_exchange_orders").createIndex(
  { uid: 1, create_time: -1 },
  { name: "idx_order_uid_time" }
);
