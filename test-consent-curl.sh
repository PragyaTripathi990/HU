#!/bin/bash

# Test Consent API using curl
# Make sure your server is running on localhost:3000

curl -X POST http://localhost:3000/internal/aa/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test-user-123",
    "mobile": "9876543210",
    "email": "user@email.com",
    "date_of_birth": "1990-01-01",
    "pan_number": "ABCDE1234F",
    "aa_id": ["dashboard-aa-preprod"],
    "fi_types": ["DEPOSIT"],
    "consent_start_date": "2025-11-05",
    "consent_expiry_date": "2026-05-05",
    "fi_datarange_from": "2025-08-05",
    "fi_datarange_to": "2025-11-05",
    "purpose_code": "102",
    "consent_mode": "STORE",
    "consent_types": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
    "fetch_type": "PERIODIC",
    "frequency_unit": "MONTH",
    "frequency_value": 1
  }' | jq '.'

