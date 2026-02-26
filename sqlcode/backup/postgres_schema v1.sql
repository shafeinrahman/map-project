-- Create the CATEGORY table to store business categories.
CREATE TABLE IF NOT EXISTS category ( -- Start table definition.
    category_id BIGINT PRIMARY KEY, -- Unique identifier for the category.
    name TEXT, -- Human-readable category name.
    slug TEXT, -- URL-friendly category name.
    icon_key TEXT, -- Key/reference for the category icon.
    is_active BOOLEAN, -- Indicates whether the category is active.
    created_at TIMESTAMPTZ, -- Timestamp when the category was created.
    updated_at TIMESTAMPTZ -- Timestamp when the category was last updated.
); -- End table definition.

-- Create the BUSINESS_CLUSTER_CELL table to store aggregated business cluster cells.
CREATE TABLE IF NOT EXISTS business_cluster_cell ( -- Start table definition.
    cell_id TEXT PRIMARY KEY, -- Unique identifier for the cluster cell.
    zoom INT, -- Zoom level used for clustering.
    count INT, -- Number of businesses in the cluster cell.
    updated_at TIMESTAMPTZ, -- Timestamp when the cluster cell was last updated.
    latitude NUMERIC(9,6), -- Cluster cell latitude coordinate.
    longitude NUMERIC(9,6) -- Cluster cell longitude coordinate.
); -- End table definition.

-- Create the DELIVERY_DENSITY_CELL table to store aggregated delivery density cells.
CREATE TABLE IF NOT EXISTS delivery_density_cell ( -- Start table definition.
    cell_id TEXT PRIMARY KEY, -- Unique identifier for the density cell.
    window_key TEXT, -- Aggregation window key for the density cell.
    count INT, -- Number of delivery events in the cell.
    updated_at TIMESTAMPTZ, -- Timestamp when the density cell was last updated.
    latitude NUMERIC(9,6), -- Density cell latitude coordinate.
    longitude NUMERIC(9,6) -- Density cell longitude coordinate.
); -- End table definition.

-- Create the BUSINESS_LOCATION_HISTORY table to store location change history for businesses.
CREATE TABLE IF NOT EXISTS business_location_history ( -- Start table definition.
    history_id BIGINT PRIMARY KEY, -- Unique identifier for the history record.
    business_id BIGINT, -- Reference to the business whose location changed.
    changed_by BIGINT, -- Reference to the user who made the change.
    changed_at TIMESTAMPTZ, -- Timestamp when the location change happened.
    move_distance_m NUMERIC, -- Distance moved in meters.
    accuracy_m NUMERIC, -- Reported accuracy in meters.
    source TEXT, -- Source of the location update.
    note TEXT, -- Additional note about the location change.
    review_status TEXT, -- Review status of the location change.
    old_latitude NUMERIC(9,6), -- Previous latitude value.
    old_longitude NUMERIC(9,6), -- Previous longitude value.
    new_latitude NUMERIC(9,6), -- New latitude value.
    new_longitude NUMERIC(9,6), -- New longitude value.
    CONSTRAINT fk_business_location_history_business FOREIGN KEY (business_id) REFERENCES business(business_id), -- Enforce business reference.
    CONSTRAINT fk_business_location_history_changed_by FOREIGN KEY (changed_by) REFERENCES "user"(user_id) -- Enforce user reference.
); -- End table definition.

-- Create the OUTBOX_EVENT table to store integration events.
CREATE TABLE IF NOT EXISTS outbox_event ( -- Start table definition.
    outbox_event_id BIGINT PRIMARY KEY, -- Unique identifier for the outbox event.
    aggregate_type TEXT, -- Aggregate type that produced the event.
    aggregate_id TEXT, -- Aggregate identifier that produced the event.
    event_type TEXT, -- Type of event.
    payload JSONB, -- Event payload data.
    created_at TIMESTAMPTZ, -- Timestamp when the event was created.
    status TEXT, -- Current processing status of the event.
    attempts INT, -- Number of processing attempts.
    processed_at TIMESTAMPTZ -- Timestamp when the event was processed.
); -- End table definition.

-- Create the DELIVERY_EVENT table to store delivery transactions.
CREATE TABLE IF NOT EXISTS delivery_event ( -- Start table definition.
    delivery_event_id BIGINT PRIMARY KEY, -- Unique identifier for the delivery event.
    delivered_at TIMESTAMPTZ, -- Timestamp when the delivery happened.
    business_id BIGINT, -- Reference to the business for this delivery.
    route_id BIGINT, -- Reference to the route for this delivery.
    territory_id BIGINT, -- Reference to the territory for this delivery.
    quantity NUMERIC, -- Quantity delivered.
    value_amount NUMERIC, -- value amount from the delivery.
    status TEXT, -- Current status of the delivery event.
    metadata JSONB, -- Additional structured metadata for the delivery event.
    latitude NUMERIC(9,6), -- Delivery latitude coordinate.
    longitude NUMERIC(9,6), -- Delivery longitude coordinate.
    CONSTRAINT fk_delivery_event_business FOREIGN KEY (business_id) REFERENCES business(business_id), -- Enforce business reference.
    CONSTRAINT fk_delivery_event_route FOREIGN KEY (route_id) REFERENCES route(route_id), -- Enforce route reference.
    CONSTRAINT fk_delivery_event_territory FOREIGN KEY (territory_id) REFERENCES territory(territory_id) -- Enforce territory reference.
); -- End table definition.

-- Create the TERRITORY table to store territory records.
CREATE TABLE IF NOT EXISTS territory ( -- Start table definition.
    territory_id BIGINT PRIMARY KEY, -- Unique identifier for the territory.
    name TEXT, -- Name of the territory.
    code TEXT, -- Code of the territory.
    parent_territory_id BIGINT, -- Reference to the parent territory.
    created_at TIMESTAMPTZ, -- Timestamp when the territory was created.
    updated_at TIMESTAMPTZ, -- Timestamp when the territory was last updated.
    latitude NUMERIC(9,6), -- Territory latitude coordinate.
    longitude NUMERIC(9,6), -- Territory longitude coordinate.
    CONSTRAINT fk_territory_parent FOREIGN KEY (parent_territory_id) REFERENCES territory(territory_id) -- Enforce parent territory reference.
); -- End table definition.

-- Create the ROUTE table to store route records.
CREATE TABLE IF NOT EXISTS route ( -- Start table definition.
    route_id BIGINT PRIMARY KEY, -- Unique identifier for the route.
    name TEXT, -- Name of the route.
    code TEXT, -- Code of the route.
    territory_id BIGINT, -- Reference to the territory assigned to the route.
    is_active BOOLEAN, -- Indicates whether the route is active.
    created_at TIMESTAMPTZ, -- Timestamp when the route was created.
    updated_at TIMESTAMPTZ, -- Timestamp when the route was last updated.
    CONSTRAINT fk_route_territory FOREIGN KEY (territory_id) REFERENCES territory(territory_id) -- Enforce territory reference.
); -- End table definition.

-- Create the BUSINESS table to store business records.
CREATE TABLE IF NOT EXISTS business ( -- Start table definition.
    business_id BIGINT PRIMARY KEY, -- Unique identifier for the business.
    name TEXT, -- Name of the business.
    address TEXT, -- Physical address of the business.
    category_id BIGINT, -- Reference to the category of the business.
    route_id BIGINT, -- Reference to the route assigned to the business.
    territory_id BIGINT, -- Reference to the territory assigned to the business.
    status TEXT, -- Current status of the business.
    priority INT, -- Priority level of the business.
    created_at TIMESTAMPTZ, -- Timestamp when the business was created.
    created_by BIGINT, -- Reference to the user who created the business.
    updated_at TIMESTAMPTZ, -- Timestamp when the business was last updated.
    updated_by BIGINT, -- Reference to the user who last updated the business.
    latitude NUMERIC(9,6), -- Business latitude coordinate.
    longitude NUMERIC(9,6), -- Business longitude coordinate.
    CONSTRAINT fk_business_category FOREIGN KEY (category_id) REFERENCES category(category_id), -- Enforce category reference.
    CONSTRAINT fk_business_created_by FOREIGN KEY (created_by) REFERENCES "user"(user_id), -- Enforce creator user reference.
    CONSTRAINT fk_business_updated_by FOREIGN KEY (updated_by) REFERENCES "user"(user_id) -- Enforce updater user reference.
); -- End table definition.

-- Create the USER table to store application users.
CREATE TABLE IF NOT EXISTS "user" ( -- Start table definition.
    user_id BIGINT PRIMARY KEY, -- Unique identifier for the user.
    full_name TEXT, -- Full name of the user.
    email TEXT, -- Email address of the user.
    role TEXT, -- Role assigned to the user.
    status TEXT, -- Current status of the user.
    created_at TIMESTAMPTZ, -- Timestamp when the user was created.
    updated_at TIMESTAMPTZ, -- Timestamp when the user was last updated.
    latitude NUMERIC(9,6), -- User latitude coordinate.
    longitude NUMERIC(9,6) -- User longitude coordinate.
); -- End table definition.
