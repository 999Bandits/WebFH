-- ============================================
-- SUPABASE PAYROLL SYSTEM - COMPLETE SETUP
-- Role-Based Access Control with RLS
-- ============================================

-- ============================================
-- STEP 1: CREATE ENUMERATION FOR USER ROLES
-- ============================================
-- First, create an enum type for user roles to ensure data integrity
CREATE TYPE user_role AS ENUM ('admin', 'employee');

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================

-- USERS TABLE
-- Stores employee and admin information linked to Supabase Auth
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE users IS 'Stores user profiles linked to Supabase Auth. Contains role information for RLS policies.';
COMMENT ON COLUMN users.role IS 'User role: admin (full access) or employee (limited access)';

-- GAMES TABLE
-- Stores game information and current currency rates for payroll calculations
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    currency_name TEXT NOT NULL,
    current_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    rate_unit BIGINT NOT NULL DEFAULT 1000000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE games IS 'Stores game information and current currency rates for payroll calculations.';

-- EARNINGS TABLE
-- Tracks employee farming earnings with calculated net income
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    amount_farmed NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    applied_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_income NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE earnings IS 'Tracks employee farming earnings. Net income is calculated from amount_farmed * applied_rate.';

-- INVENTORY_NEEDS TABLE
-- Tracks inventory items that need to be purchased
CREATE TABLE inventory_needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE inventory_needs IS 'Tracks items that need to be purchased for operations. Employees can request items and admins approve/fulfill them.';

-- ============================================
-- STEP 3: CREATE HELPER FUNCTIONS FOR RLS
-- ============================================

-- Function to check if the current user is an admin
-- This function retrieves the role from the users table for the currently authenticated user
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user's role is 'admin'
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS 'Returns true if the currently authenticated user has admin role';

-- Function to check if the current user owns the record
-- Used for employees to access only their own data
CREATE OR REPLACE FUNCTION is_owner(owner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Compare the provided owner_id with the current authenticated user's ID
    RETURN auth.uid() = owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_owner(UUID) IS 'Returns true if the current user owns the record (matches the user_id)';

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on games table
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Enable RLS on earnings table
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inventory_needs table
ALTER TABLE inventory_needs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE RLS POLICIES FOR USERS TABLE
-- ============================================

-- POLICY: Admin has full access to users table
-- Admins can perform ALL operations (SELECT, INSERT, UPDATE, DELETE) on any user record
CREATE POLICY admin_all_access_users
    ON users
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY admin_all_access_users ON users IS 'Admins have full CRUD access to all user records';

-- POLICY: Employees can view their own user record
-- Employees can only SELECT their own row from the users table
CREATE POLICY employee_select_own_user
    ON users
    FOR SELECT
    TO authenticated
    USING (is_owner(id));

COMMENT ON POLICY employee_select_own_user ON users IS 'Employees can only view their own user profile';

-- ============================================
-- STEP 6: CREATE RLS POLICIES FOR GAMES TABLE
-- ============================================

-- POLICY: Admin has full access to games table
-- Admins can perform ALL operations on game records
CREATE POLICY admin_all_access_games
    ON games
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY admin_all_access_games ON games IS 'Admins have full CRUD access to manage game configurations';

-- POLICY: Employees can view all games (read-only)
-- Games are reference data that all employees need to see for context
CREATE POLICY employee_select_games
    ON games
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON POLICY employee_select_games ON games IS 'Employees can view all games but cannot modify them';

-- ============================================
-- STEP 7: CREATE RLS POLICIES FOR EARNINGS TABLE
-- ============================================

-- POLICY: Admin has full access to earnings table
-- Admins can perform ALL operations on any earnings record
CREATE POLICY admin_all_access_earnings
    ON earnings
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY admin_all_access_earnings ON earnings IS 'Admins have full CRUD access to all earnings records for payroll management';

-- POLICY: Employees can only view their own earnings
-- Employees can only SELECT earnings records where user_id matches their own ID
CREATE POLICY employee_select_own_earnings
    ON earnings
    FOR SELECT
    TO authenticated
    USING (is_owner(user_id));

COMMENT ON POLICY employee_select_own_earnings ON earnings IS 'Employees can only view their own earnings records for privacy';

-- POLICY: Prevent employees from modifying earnings
-- This policy explicitly denies INSERT, UPDATE, DELETE for employees
-- (Not strictly needed as default is deny, but included for clarity)

-- ============================================
-- STEP 8: CREATE RLS POLICIES FOR INVENTORY_NEEDS TABLE
-- ============================================

-- POLICY: Admin has full access to inventory_needs table
-- Admins can perform ALL operations on inventory records
CREATE POLICY admin_all_access_inventory
    ON inventory_needs
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

COMMENT ON POLICY admin_all_access_inventory ON inventory_needs IS 'Admins have full CRUD access to manage inventory needs';

-- POLICY: Employees can view their own inventory requests
-- Employees can only SELECT their own requests or if they're admin
CREATE POLICY employee_select_own_inventory
    ON inventory_needs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

COMMENT ON POLICY employee_select_own_inventory ON inventory_needs IS 'Employees can view their own inventory requests and admins can view all';

-- POLICY: Employees can insert their own inventory requests
-- Employees can create new requests with their own user_id
CREATE POLICY employee_insert_own_inventory
    ON inventory_needs
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY employee_insert_own_inventory ON inventory_needs IS 'Employees can create their own inventory requests';

-- ============================================
-- STEP 9: CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for games table
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for inventory_needs table
CREATE TRIGGER update_inventory_needs_updated_at
    BEFORE UPDATE ON inventory_needs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 10: CREATE TRIGGER TO AUTO-CREATE USER PROFILE
-- ============================================

-- Function to automatically create a user profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on auth user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile when a new user signs up via Supabase Auth';

-- ============================================
-- STEP 11: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for earnings lookups by user_id (frequently used for employee queries)
CREATE INDEX idx_earnings_user_id ON earnings(user_id);

-- Index for earnings lookups by game_id
CREATE INDEX idx_earnings_game_id ON earnings(game_id);

-- Index for earnings date range queries
CREATE INDEX idx_earnings_created_at ON earnings(created_at);

-- Index for inventory purchase status
CREATE INDEX idx_inventory_purchased ON inventory_needs(is_purchased) WHERE is_purchased = false;

-- ============================================
-- STEP 12: GRANT PERMISSIONS
-- ============================================

-- Grant usage on the custom enum type
GRANT USAGE ON TYPE user_role TO authenticated;

-- ============================================
-- RLS POLICY SUMMARY
-- ============================================
-- 
-- USERS TABLE:
--   - Admin: FULL ACCESS (SELECT, INSERT, UPDATE, DELETE)
--   - Employee: SELECT own record only
--
-- GAMES TABLE:
--   - Admin: FULL ACCESS (SELECT, INSERT, UPDATE, DELETE)
--   - Employee: SELECT all records (read-only reference data)
--
-- EARNINGS TABLE:
--   - Admin: FULL ACCESS (SELECT, INSERT, UPDATE, DELETE)
--   - Employee: SELECT own records only
--
-- INVENTORY_NEEDS TABLE:
--   - Admin: FULL ACCESS (SELECT, INSERT, UPDATE, DELETE)
--   - Employee: SELECT own records, INSERT own records
--
-- ============================================

-- ============================================
-- SAMPLE DATA (Optional - Uncomment to insert)
-- ============================================

-- -- Insert sample games
-- INSERT INTO games (name, currency_name, current_rate) VALUES
--     ('Aion 2', 'Kinah', 0.05),
--     ('Lost Ark', 'Gold', 0.10),
--     ('Lineage 2', 'Adena', 0.03);

-- -- Insert sample inventory needs
-- INSERT INTO inventory_needs (item_name, is_purchased) VALUES
--     ('Beras', false),
     -- ('Gula Pasir', false),
--     ('Minyak Goreng', false);

-- ============================================
-- END OF SCRIPT
-- ============================================