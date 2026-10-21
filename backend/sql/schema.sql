-- =============================================================================
-- JANA KALYAN — DATABASE SCHEMA (MySQL / MariaDB syntax)
-- -----------------------------------------------------------------------------
-- Run this once against a fresh database, e.g.:
--   mysql -u root -p -e "CREATE DATABASE jana_kalyan;"
--   mysql -u root -p jana_kalyan < schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS members (
    member_id       VARCHAR(20)   PRIMARY KEY,        -- e.g. JK00184213
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(150)  UNIQUE,
    phone           VARCHAR(15)   UNIQUE,
    password_hash   VARCHAR(255),                      -- store a bcrypt/argon2 hash, never plain text
    auth_provider   ENUM('email', 'phone', 'google') NOT NULL DEFAULT 'email',
    role            ENUM('member', 'admin')            NOT NULL DEFAULT 'member',
    photo_url       VARCHAR(255),
    nominee_name    VARCHAR(120),
    nominee_id      VARCHAR(60),                       -- Aadhaar / Voter ID etc.
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    account_no      VARCHAR(20)   PRIMARY KEY,         -- auto-generated, see JanaKalyanApp.java
    member_id       VARCHAR(20)   NOT NULL,
    balance         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    opened_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    txn_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_no      VARCHAR(20)   NOT NULL,
    txn_type        ENUM('deposit', 'withdrawal', 'interest', 'loan_disbursement') NOT NULL,
    description     VARCHAR(150)  NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    txn_date        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quarter_key     VARCHAR(10)   NULL,                -- e.g. "2026-03-31", used to prevent duplicate interest credit
    FOREIGN KEY (account_no) REFERENCES accounts(account_no) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loan_types (
    loan_type_id    INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(60)   NOT NULL,             -- "Kalyan loan", "Vehicle loan", ...
    interest_rate   DECIMAL(5,2)  NOT NULL,              -- percent per annum
    is_enabled      BOOLEAN       NOT NULL DEFAULT FALSE -- only Kalyan loan is TRUE per spec
);

INSERT INTO loan_types (name, interest_rate, is_enabled) VALUES
    ('Kalyan loan', 13.00, TRUE),
    ('Vehicle loan', 11.50, FALSE),
    ('Education loan', 9.00, FALSE),
    ('Housing loan', 8.50, FALSE);

CREATE TABLE IF NOT EXISTS loan_durations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    min_amount      DECIMAL(12,2) NOT NULL,   -- loan amount bracket this duration list applies to
    duration_months INT           NOT NULL
);

-- Loan amount -> available duration table, taken directly from the client spec.
INSERT INTO loan_durations (min_amount, duration_months) VALUES
    (6000, 3), (6000, 6),
    (12000, 3), (12000, 6), (12000, 12),
    (18000, 3), (18000, 6), (18000, 12), (18000, 18),
    (24000, 3), (24000, 6), (24000, 12), (24000, 18), (24000, 24),
    (60000, 3), (60000, 6), (60000, 12), (60000, 18), (60000, 24), (60000, 30),
    (360000, 3), (360000, 6), (360000, 12), (360000, 18), (360000, 24), (360000, 30), (360000, 36);

CREATE TABLE IF NOT EXISTS loan_applications (
    loan_app_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id       VARCHAR(20)   NOT NULL,
    loan_type_id    INT           NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    duration_months INT           NOT NULL,
    status          ENUM('pending', 'approved', 'rejected', 'closed') NOT NULL DEFAULT 'pending',
    applied_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (loan_type_id) REFERENCES loan_types(loan_type_id)
);

-- Helpful indexes for large-scale querying (spec: "SQL for large data handling").
CREATE INDEX idx_transactions_account_date ON transactions(account_no, txn_date);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone);
