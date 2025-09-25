-- Complete Supabase Database Export
-- Generated on: 2025-09-17T10:40:34.457Z
-- Database URL: https://pfhgslnozindfcgsofvl.supabase.co
-- Discovered tables: 12
-- Exported tables: 12
-- Table list: admin_appointments_view, appointments, clinics, emergency_requests, notifications, patients, pet_owner_profiles, profiles, reviews, services, veterinarian_applications, veterinarians

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =====================================
-- COMPLETE DATABASE EXPORT
-- =====================================

-- =====================================
-- TABLE: ADMIN_APPOINTMENTS_VIEW
-- Rows: 7
-- Columns: 25
-- =====================================

DROP TABLE IF EXISTS "admin_appointments_view" CASCADE;
CREATE TABLE "admin_appointments_view" (
    "id" INTEGER,
    "pet_owner_id" INTEGER,
    "patient_id" INTEGER,
    "veterinarian_id" INTEGER,
    "clinic_id" INTEGER,
    "service_id" TEXT,
    "appointment_date" TEXT,
    "appointment_time" TEXT,
    "estimated_duration" INTEGER,
    "booking_type" TEXT,
    "reason_for_visit" TEXT,
    "symptoms" TEXT,
    "notes" TEXT,
    "status" TEXT,
    "is_approved" BOOLEAN,
    "approved_by" UUID,
    "approved_at" TIMESTAMP WITH TIME ZONE,
    "total_amount" DECIMAL,
    "payment_status" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE,
    "updated_at" TIMESTAMP WITH TIME ZONE,
    "patients" JSONB,
    "pet_owner_profiles" JSONB,
    "veterinarians" JSONB,
    "clinics" JSONB
);

-- Columns in admin_appointments_view: id, pet_owner_id, patient_id, veterinarian_id, clinic_id, service_id, appointment_date, appointment_time, estimated_duration, booking_type, reason_for_visit, symptoms, notes, status, is_approved, approved_by, approved_at, total_amount, payment_status, created_at, updated_at, patients, pet_owner_profiles, veterinarians, clinics

-- Data for admin_appointments_view (7 rows)
INSERT INTO "admin_appointments_view" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at", "patients", "pet_owner_profiles", "veterinarians", "clinics") VALUES (4, 2, 5, 1, 4, NULL, '2025-06-30', '10:30:00', 30, 'web', 'Testing', 'Testing', NULL, 'confirmed', true, '57520192-acb2-46f7-b915-d23d071c8a80', '2025-07-09T10:27:03.264+00:00', 2.14, 'pending', '2025-06-30T05:05:08.560374+00:00', '2025-07-09T10:27:03.28652+00:00', '{"name":"Testing","breed":"Testing","species":"Dog"}', '{"phone":"09270640618","address":"Ruste Drive","full_name":"Ahmidserhan Halon"}', '{"full_name":"Dora Popo","specialization":"Cardiology"}', '{"name":"Clinic ni Halon","phone":"09369852144","address":"9th Street, Southcom Village, San Roque, Zamboanga City, Zamboanga Peninsula, 7000, Philippines"}');
INSERT INTO "admin_appointments_view" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at", "patients", "pet_owner_profiles", "veterinarians", "clinics") VALUES (6, 2, 5, 1, 4, NULL, '2025-06-30', '10:30:00', 30, 'web', 'sample', 'sample', 'DECLINED: Decline Appointment Testing', 'cancelled', false, NULL, NULL, 2.14, 'pending', '2025-06-30T06:41:59.307706+00:00', '2025-07-09T10:27:34.618955+00:00', '{"name":"Testing","breed":"Testing","species":"Dog"}', '{"phone":"09270640618","address":"Ruste Drive","full_name":"Ahmidserhan Halon"}', '{"full_name":"Dora Popo","specialization":"Cardiology"}', '{"name":"Clinic ni Halon","phone":"09369852144","address":"9th Street, Southcom Village, San Roque, Zamboanga City, Zamboanga Peninsula, 7000, Philippines"}');
INSERT INTO "admin_appointments_view" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at", "patients", "pet_owner_profiles", "veterinarians", "clinics") VALUES (5, 2, 5, 1, 4, NULL, '2025-06-30', '13:30:00', 30, 'web', 'Sjsb', 'Hxb', NULL, 'confirmed', true, '57520192-acb2-46f7-b915-d23d071c8a80', '2025-07-09T10:41:38.669+00:00', 2.14, 'pending', '2025-06-30T05:12:04.737476+00:00', '2025-07-09T10:41:38.723284+00:00', '{"name":"Testing","breed":"Testing","species":"Dog"}', '{"phone":"09270640618","address":"Ruste Drive","full_name":"Ahmidserhan Halon"}', '{"full_name":"Dora Popo","specialization":"Cardiology"}', '{"name":"Clinic ni Halon","phone":"09369852144","address":"9th Street, Southcom Village, San Roque, Zamboanga City, Zamboanga Peninsula, 7000, Philippines"}');
INSERT INTO "admin_appointments_view" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at", "patients", "pet_owner_profiles", "veterinarians", "clinics") VALUES (8, 2, 5, 1, 4, NULL, '2025-07-09', '13:30:00', 30, 'web', 'Hddh', 'Absbb', NULL, 'confirmed', true, '57520192-acb2-46f7-b915-d23d071c8a80', '2025-07-09T11:02:15.731+00:00', 2.14, 'pending', '2025-07-09T11:02:03.438918+00:00', '2025-07-09T11:02:15.847164+00:00', '{"name":"Testing","breed":"Testing","species":"Dog"}', '{"phone":"09270640618","address":"Ruste Drive","full_name":"Ahmidserhan Halon"}', '{"full_name":"Dora Popo","specialization":"Cardiology"}', '{"name":"Clinic ni Halon","phone":"09369852144","address":"9th Street, Southcom Village, San Roque, Zamboanga City, Zamboanga Peninsula, 7000, Philippines"}');
INSERT INTO "admin_appointments_view" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at", "patients", "pet_owner_profiles", "veterinarians", "clinics") VALUES (9, 2, 8, 1, 4, NULL, '2025-07-13', '10:00:00', 30, 'web', 'Nagsusuka ng dugo', 'ayaw kumain', NULL, 'cancelled', false, NULL, NULL, 2.14, 'pending', '2025-07-12T16:06:02.147988+00:00', '2025-08-10T15:12:15.630747+00:00', '{"name":"Douglas","breed":"Askal","species":"Dog"}', '{"phone":"09270640618","address":"Ruste Drive","full_name":"Ahmidserhan Halon"}', '{"full_name":"Dora Popo","specialization":"Cardiology"}', '{"name":"Clinic ni Halon","phone":"09369852144","address":"9th Street, Southcom Village, San Roque, Zamboanga City, Zamboanga Peninsula, 7000, Philippines"}');
INSERT INTO "admin_appointments_view" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at", "patients", "pet_owner_profiles", "veterinarians", "clinics") VALUES (12, 2, 5, 1, 4, NULL, '2025-08-11', '12:30:00', 30, 'mobile_app', 'fhgc', 'dghb', 'DECLINED: im not okey', 'cancelled', false, NULL, NULL, NULL, 'pending', '2025-08-10T23:55:41.42975+00:00', '2025-08-16T03:06:36.325179+00:00', '{"name":"Testing","breed":"Testing","species":"Dog"}', '{"phone":"09270640618","address":"Ruste Drive","full_name":"Ahmidserhan Halon"}', '{"full_name":"Dora Popo","specialization":"Cardiology"}', '{"name":"Clinic ni Halon","phone":"09369852144","address":"9th Street, Southcom Village, San Roque, Zamboanga City, Zamboanga Peninsula, 7000, Philippines"}');
INSERT INTO "admin_appointments_view" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at", "patients", "pet_owner_profiles", "veterinarians", "clinics") VALUES (13, 18, 16, 1, 4, NULL, '2025-09-04', '09:00:00', 30, 'web', 'vaccine', '', NULL, 'pending', false, NULL, NULL, 2.14, 'pending', '2025-09-04T08:45:30.660962+00:00', '2025-09-04T08:45:30.660962+00:00', '{"name":"Kitkat","breed":"pug","species":"Dog"}', '{"phone":"09777002026","address":"8th street southcom calarian zamboanga city","full_name":"Earle Gabriel Pacleb"}', '{"full_name":"Dora Popo","specialization":"Cardiology"}', '{"name":"Clinic ni Halon","phone":"09369852144","address":"9th Street, Southcom Village, San Roque, Zamboanga City, Zamboanga Peninsula, 7000, Philippines"}');

-- =====================================
-- TABLE: APPOINTMENTS
-- Rows: 7
-- Columns: 21
-- =====================================

DROP TABLE IF EXISTS "appointments" CASCADE;
CREATE TABLE "appointments" (
    "id" INTEGER,
    "pet_owner_id" INTEGER,
    "patient_id" INTEGER,
    "veterinarian_id" INTEGER,
    "clinic_id" INTEGER,
    "service_id" TEXT,
    "appointment_date" TEXT,
    "appointment_time" TEXT,
    "estimated_duration" INTEGER,
    "booking_type" TEXT,
    "reason_for_visit" TEXT,
    "symptoms" TEXT,
    "notes" TEXT,
    "status" TEXT,
    "is_approved" BOOLEAN,
    "approved_by" UUID,
    "approved_at" TIMESTAMP WITH TIME ZONE,
    "total_amount" DECIMAL,
    "payment_status" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE,
    "updated_at" TIMESTAMP WITH TIME ZONE
);

-- Columns in appointments: id, pet_owner_id, patient_id, veterinarian_id, clinic_id, service_id, appointment_date, appointment_time, estimated_duration, booking_type, reason_for_visit, symptoms, notes, status, is_approved, approved_by, approved_at, total_amount, payment_status, created_at, updated_at

-- Data for appointments (7 rows)
INSERT INTO "appointments" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at") VALUES (4, 2, 5, 1, 4, NULL, '2025-06-30', '10:30:00', 30, 'web', 'Testing', 'Testing', NULL, 'confirmed', true, '57520192-acb2-46f7-b915-d23d071c8a80', '2025-07-09T10:27:03.264+00:00', 2.14, 'pending', '2025-06-30T05:05:08.560374+00:00', '2025-07-09T10:27:03.28652+00:00');
INSERT INTO "appointments" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at") VALUES (6, 2, 5, 1, 4, NULL, '2025-06-30', '10:30:00', 30, 'web', 'sample', 'sample', 'DECLINED: Decline Appointment Testing', 'cancelled', false, NULL, NULL, 2.14, 'pending', '2025-06-30T06:41:59.307706+00:00', '2025-07-09T10:27:34.618955+00:00');
INSERT INTO "appointments" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at") VALUES (5, 2, 5, 1, 4, NULL, '2025-06-30', '13:30:00', 30, 'web', 'Sjsb', 'Hxb', NULL, 'confirmed', true, '57520192-acb2-46f7-b915-d23d071c8a80', '2025-07-09T10:41:38.669+00:00', 2.14, 'pending', '2025-06-30T05:12:04.737476+00:00', '2025-07-09T10:41:38.723284+00:00');
INSERT INTO "appointments" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at") VALUES (8, 2, 5, 1, 4, NULL, '2025-07-09', '13:30:00', 30, 'web', 'Hddh', 'Absbb', NULL, 'confirmed', true, '57520192-acb2-46f7-b915-d23d071c8a80', '2025-07-09T11:02:15.731+00:00', 2.14, 'pending', '2025-07-09T11:02:03.438918+00:00', '2025-07-09T11:02:15.847164+00:00');
INSERT INTO "appointments" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at") VALUES (9, 2, 8, 1, 4, NULL, '2025-07-13', '10:00:00', 30, 'web', 'Nagsusuka ng dugo', 'ayaw kumain', NULL, 'cancelled', false, NULL, NULL, 2.14, 'pending', '2025-07-12T16:06:02.147988+00:00', '2025-08-10T15:12:15.630747+00:00');
INSERT INTO "appointments" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at") VALUES (12, 2, 5, 1, 4, NULL, '2025-08-11', '12:30:00', 30, 'mobile_app', 'fhgc', 'dghb', 'DECLINED: im not okey', 'cancelled', false, NULL, NULL, NULL, 'pending', '2025-08-10T23:55:41.42975+00:00', '2025-08-16T03:06:36.325179+00:00');
INSERT INTO "appointments" ("id", "pet_owner_id", "patient_id", "veterinarian_id", "clinic_id", "service_id", "appointment_date", "appointment_time", "estimated_duration", "booking_type", "reason_for_visit", "symptoms", "notes", "status", "is_approved", "approved_by", "approved_at", "total_amount", "payment_status", "created_at", "updated_at") VALUES (13, 18, 16, 1, 4, NULL, '2025-09-04', '09:00:00', 30, 'web', 'vaccine', '', NULL, 'pending', false, NULL, NULL, 2.14, 'pending', '2025-09-04T08:45:30.660962+00:00', '2025-09-04T08:45:30.660962+00:00');

-- =====================================
-- TABLE: CLINICS
-- Rows: 1
-- Columns: 12
-- =====================================

DROP TABLE IF EXISTS "clinics" CASCADE;
CREATE TABLE "clinics" (
    "id" INTEGER,
    "name" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "latitude" DECIMAL,
    "longitude" DECIMAL,
    "operating_hours" JSONB,
    "is_active" BOOLEAN,
    "is_emergency_available" BOOLEAN,
    "created_at" TIMESTAMP WITH TIME ZONE,
    "updated_at" TIMESTAMP WITH TIME ZONE
);

-- Columns in clinics: id, name, address, phone, email, latitude, longitude, operating_hours, is_active, is_emergency_available, created_at, updated_at

-- Data for clinics (1 rows)
INSERT INTO "clinics" ("id", "name", "address", "phone", "email", "latitude", "longitude", "operating_hours", "is_active", "is_emergency_available", "created_at", "updated_at") VALUES (4, 'Clinic ni Halon', '9th Street, Southcom Village, San Roque, Zamboanga City, Zamboanga Peninsula, 7000, Philippines', '09369852144', NULL, 6.92596698, 122.04356676, '{}', true, false, '2025-06-28T11:23:48.520946+00:00', '2025-06-28T11:23:48.520946+00:00');

-- =====================================
-- TABLE: EMERGENCY_REQUESTS
-- Rows: 0
-- Columns: 0
-- =====================================

DROP TABLE IF EXISTS "emergency_requests" CASCADE;
-- No data found in emergency_requests, creating minimal structure
CREATE TABLE "emergency_requests" (id SERIAL PRIMARY KEY);

-- No data in table: emergency_requests

-- =====================================
-- TABLE: NOTIFICATIONS
-- Rows: 0
-- Columns: 0
-- =====================================

DROP TABLE IF EXISTS "notifications" CASCADE;
-- No data found in notifications, creating minimal structure
CREATE TABLE "notifications" (id SERIAL PRIMARY KEY);

-- No data in table: notifications

-- =====================================
-- TABLE: PATIENTS
-- Rows: 13
-- Columns: 14
-- =====================================

DROP TABLE IF EXISTS "patients" CASCADE;
CREATE TABLE "patients" (
    "id" INTEGER,
    "owner_id" INTEGER,
    "name" TEXT,
    "species" TEXT,
    "breed" TEXT,
    "gender" TEXT,
    "date_of_birth" TEXT,
    "weight" DECIMAL,
    "vaccination_records" JSONB,
    "medical_conditions" JSONB,
    "is_active" BOOLEAN,
    "created_at" TIMESTAMP WITH TIME ZONE,
    "updated_at" TIMESTAMP WITH TIME ZONE,
    "profile_picture_url" TEXT
);

-- Columns in patients: id, owner_id, name, species, breed, gender, date_of_birth, weight, vaccination_records, medical_conditions, is_active, created_at, updated_at, profile_picture_url

-- Data for patients (13 rows)
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (1, 2, 'asd', 'Dog', 'asd', 'male', '2020-12-12', 5.2, '[]', '[]', false, '2025-06-28T18:08:58.317378+00:00', '2025-06-30T00:16:15.293698+00:00', NULL);
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (2, 2, 'asddsa', 'Bird', 'asddsa', 'male', '2025-06-25', 5.2, '[]', '[]', false, '2025-06-28T18:21:13.492452+00:00', '2025-06-30T00:43:25.896491+00:00', NULL);
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (3, 2, 'sample', 'Dog', 'sample', 'male', '2025-06-01', 5, '[]', '[]', false, '2025-06-30T00:02:46.895356+00:00', '2025-06-30T00:43:41.413933+00:00', 'https://pfhgslnozindfcgsofvl.supabase.co/storage/v1/object/public/pet-images/pet-profiles/3-1751241767086.jpg');
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (4, 2, 'sasa', 'Dog', 'sasa', 'male', '2025-06-01', 2, '[]', '[]', false, '2025-06-30T00:56:55.010994+00:00', '2025-06-30T00:57:20.070152+00:00', 'https://pfhgslnozindfcgsofvl.supabase.co/storage/v1/object/public/pet-images/pet-profiles/4-1751245015207.jpg');
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (10, 2, 'angely', 'Dog', 'Askal', 'male', '2024-08-07', 5, '[]', NULL, false, '2025-08-07T13:30:05.352021+00:00', '2025-08-07T13:30:23.352092+00:00', NULL);
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (5, 2, 'Testing', 'Dog', 'Testing', 'male', '2025-06-01', 2, '[]', '[]', true, '2025-06-30T04:01:12.743023+00:00', '2025-08-07T14:34:47.379001+00:00', 'https://pfhgslnozindfcgsofvl.supabase.co/storage/v1/object/public/pet-images/pet-profiles/5-1751256072670.jpg');
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (8, 2, 'Douglas', 'Dog', 'Askal', 'male', '2025-07-01', 5, '[]', '[]', false, '2025-07-12T16:01:48.134335+00:00', '2025-08-17T12:47:27.282276+00:00', 'https://pfhgslnozindfcgsofvl.supabase.co/storage/v1/object/public/pet-images/pet-profiles/8-1752336110511.jpg');
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (16, 18, 'Kitkat', 'Dog', 'pug', 'male', '2025-07-24', 2.5, '[]', '[]', true, '2025-09-04T08:20:36.286091+00:00', '2025-09-04T08:20:36.286091+00:00', NULL);
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (15, 18, 'Kitkat', 'Dog', 'pug', 'male', '2025-07-24', 2.5, '[]', '[]', false, '2025-09-04T08:20:36.253364+00:00', '2025-09-04T08:20:50.92057+00:00', NULL);
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (14, 18, 'Kitkat', 'Dog', 'pug', 'male', '2025-07-24', 2.5, '[]', '[]', false, '2025-09-04T08:20:36.019216+00:00', '2025-09-04T08:20:57.166032+00:00', NULL);
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (12, 18, 'Kitkat', 'Dog', 'pug', 'male', '2025-07-24', 2.5, '[]', '[]', false, '2025-09-04T08:20:35.915343+00:00', '2025-09-04T08:21:09.151024+00:00', NULL);
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (11, 18, 'Kitkat', 'Dog', 'pug', 'male', '2025-07-24', 2.5, '[]', '[]', false, '2025-09-04T08:20:35.889589+00:00', '2025-09-04T08:21:14.123924+00:00', NULL);
INSERT INTO "patients" ("id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "vaccination_records", "medical_conditions", "is_active", "created_at", "updated_at", "profile_picture_url") VALUES (13, 18, 'Kitkat', 'Dog', 'pug', 'male', '2025-07-24', 2.5, '[]', '[]', false, '2025-09-04T08:20:35.887855+00:00', '2025-09-04T08:21:22.668821+00:00', NULL);

-- =====================================
-- TABLE: PET_OWNER_PROFILES
-- Rows: 5
-- Columns: 10
-- =====================================

DROP TABLE IF EXISTS "pet_owner_profiles" CASCADE;
CREATE TABLE "pet_owner_profiles" (
    "id" INTEGER,
    "user_id" UUID,
    "full_name" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE,
    "updated_at" TIMESTAMP WITH TIME ZONE,
    "profile_picture_url" TEXT
);

-- Columns in pet_owner_profiles: id, user_id, full_name, phone, address, emergency_contact_name, emergency_contact_phone, created_at, updated_at, profile_picture_url

-- Data for pet_owner_profiles (5 rows)
INSERT INTO "pet_owner_profiles" ("id", "user_id", "full_name", "phone", "address", "emergency_contact_name", "emergency_contact_phone", "created_at", "updated_at", "profile_picture_url") VALUES (3, '7643ea1b-2275-4184-ac38-b7b44ab9c7ce', 'Cabasag Halon', '09123456789', 'Southcom Village', 'Pokemon Poopo', '09632517894', '2025-06-28T02:47:19.262059+00:00', '2025-06-28T02:47:19.262059+00:00', NULL);
INSERT INTO "pet_owner_profiles" ("id", "user_id", "full_name", "phone", "address", "emergency_contact_name", "emergency_contact_phone", "created_at", "updated_at", "profile_picture_url") VALUES (2, '44907ccd-09ed-4ef8-9ae3-54ffda9e0106', 'Ahmidserhan Halon', '09270640618', 'Ruste Drive', 'Angely Cabasag', '09369852147', '2025-06-28T02:25:41.10437+00:00', '2025-07-12T15:57:42.30687+00:00', 'https://pfhgslnozindfcgsofvl.supabase.co/storage/v1/object/public/profile-images/profile-images/44907ccd-09ed-4ef8-9ae3-54ffda9e0106-1752335863744.jpg');
INSERT INTO "pet_owner_profiles" ("id", "user_id", "full_name", "phone", "address", "emergency_contact_name", "emergency_contact_phone", "created_at", "updated_at", "profile_picture_url") VALUES (12, '18da21cc-3bc0-4b8c-8ba2-11eb3a783136', 'DylzGwapo', '+639658644327', 'Southcom village 14th street lane 1 calarian Zamboanga City, Zamboanga del sur 7000', 'Way Amahko', '09090909099', '2025-08-17T05:27:14.350234+00:00', '2025-08-17T05:27:14.350234+00:00', NULL);
INSERT INTO "pet_owner_profiles" ("id", "user_id", "full_name", "phone", "address", "emergency_contact_name", "emergency_contact_phone", "created_at", "updated_at", "profile_picture_url") VALUES (13, '4a6c9dcb-0ce2-4042-a7b6-fd7af7a8f01a', 'Wayamahko G. Nalawa', '+639658644327', '14th street lane 1 southcom village calarian Zamboanga city, Zamboanga del sur 7000', 'Amahko nalawa ', '09090909091', '2025-08-17T05:29:47.258244+00:00', '2025-08-17T05:29:47.258244+00:00', NULL);
INSERT INTO "pet_owner_profiles" ("id", "user_id", "full_name", "phone", "address", "emergency_contact_name", "emergency_contact_phone", "created_at", "updated_at", "profile_picture_url") VALUES (18, 'b03c911e-1144-4b02-acd7-6acbd7061fad', 'Earle Gabriel Pacleb', '09777002026', '8th street southcom calarian zamboanga city', 'Anje', '09171282592', '2025-09-04T05:47:19.960995+00:00', '2025-09-04T05:47:19.960995+00:00', NULL);

-- =====================================
-- TABLE: PROFILES
-- Rows: 8
-- Columns: 9
-- =====================================

DROP TABLE IF EXISTS "profiles" CASCADE;
CREATE TABLE "profiles" (
    "id" UUID,
    "email" TEXT,
    "full_name" TEXT,
    "phone" TEXT,
    "user_role" TEXT,
    "is_active" BOOLEAN,
    "created_at" TIMESTAMP WITH TIME ZONE,
    "updated_at" TIMESTAMP WITH TIME ZONE,
    "verification_status" TEXT
);

-- Columns in profiles: id, email, full_name, phone, user_role, is_active, created_at, updated_at, verification_status

-- Data for profiles (8 rows)
INSERT INTO "profiles" ("id", "email", "full_name", "phone", "user_role", "is_active", "created_at", "updated_at", "verification_status") VALUES ('44907ccd-09ed-4ef8-9ae3-54ffda9e0106', 'halonahmidserhan5@gmail.com', 'Ahmidserhan Halon', '09270640618', 'pet_owner', true, '2025-06-28T02:22:11.519839+00:00', '2025-06-28T02:25:40.83698+00:00', 'pending');
INSERT INTO "profiles" ("id", "email", "full_name", "phone", "user_role", "is_active", "created_at", "updated_at", "verification_status") VALUES ('7643ea1b-2275-4184-ac38-b7b44ab9c7ce', 'kmforce018@gmail.com', 'Cabasag Halon', '09123456789', 'admin', true, '2025-06-28T02:47:18.871986+00:00', '2025-06-28T03:05:52.586805+00:00', 'pending');
INSERT INTO "profiles" ("id", "email", "full_name", "phone", "user_role", "is_active", "created_at", "updated_at", "verification_status") VALUES ('57520192-acb2-46f7-b915-d23d071c8a80', 'halonahmidserhan@gmail.com', 'Dora Popo', NULL, 'veterinarian', true, '2025-06-28T04:18:14.846377+00:00', '2025-06-28T04:18:14.846377+00:00', 'pending');
INSERT INTO "profiles" ("id", "email", "full_name", "phone", "user_role", "is_active", "created_at", "updated_at", "verification_status") VALUES ('56f379e5-3687-47c2-a955-6fe0a8c31d68', 'kmking@gmail.com', 'Dylan Alce', NULL, 'veterinarian', true, '2025-06-30T06:57:35.273311+00:00', '2025-06-30T06:57:35.273311+00:00', 'pending');
INSERT INTO "profiles" ("id", "email", "full_name", "phone", "user_role", "is_active", "created_at", "updated_at", "verification_status") VALUES ('18da21cc-3bc0-4b8c-8ba2-11eb3a783136', 'Mrquak@gmail.com', 'DylzGwapo', '+639658644327', 'pet_owner', true, '2025-08-17T05:27:13.695273+00:00', '2025-08-17T05:27:13.695273+00:00', 'pending');
INSERT INTO "profiles" ("id", "email", "full_name", "phone", "user_role", "is_active", "created_at", "updated_at", "verification_status") VALUES ('4a6c9dcb-0ce2-4042-a7b6-fd7af7a8f01a', 'alcedylan@gmail.com', 'Wayamahko G. Nalawa', '+639658644327', 'pet_owner', true, '2025-08-17T05:29:46.579096+00:00', '2025-08-17T05:29:46.579096+00:00', 'pending');
INSERT INTO "profiles" ("id", "email", "full_name", "phone", "user_role", "is_active", "created_at", "updated_at", "verification_status") VALUES ('b03c911e-1144-4b02-acd7-6acbd7061fad', 'gabrielpacleb29@gmail.com', 'Earle Gabriel Pacleb', '09777002026', 'pet_owner', true, '2025-09-04T05:47:19.220289+00:00', '2025-09-04T05:47:19.220289+00:00', 'pending');
INSERT INTO "profiles" ("id", "email", "full_name", "phone", "user_role", "is_active", "created_at", "updated_at", "verification_status") VALUES ('26f6d47a-ea72-49cb-9c7a-da14777361a4', 'vetzambo@gmail.com', 'Chupa Kulo', '09123456789', 'veterinarian', false, '2025-09-08T02:07:41.450603+00:00', '2025-09-08T02:07:41.450603+00:00', 'pending');

-- =====================================
-- TABLE: REVIEWS
-- Rows: 0
-- Columns: 0
-- =====================================

DROP TABLE IF EXISTS "reviews" CASCADE;
-- No data found in reviews, creating minimal structure
CREATE TABLE "reviews" (id SERIAL PRIMARY KEY);

-- No data in table: reviews

-- =====================================
-- TABLE: SERVICES
-- Rows: 0
-- Columns: 0
-- =====================================

DROP TABLE IF EXISTS "services" CASCADE;
-- No data found in services, creating minimal structure
CREATE TABLE "services" (id SERIAL PRIMARY KEY);

-- No data in table: services

-- =====================================
-- TABLE: VETERINARIAN_APPLICATIONS
-- Rows: 1
-- Columns: 19
-- =====================================

DROP TABLE IF EXISTS "veterinarian_applications" CASCADE;
CREATE TABLE "veterinarian_applications" (
    "id" INTEGER,
    "email" TEXT,
    "full_name" TEXT,
    "phone" TEXT,
    "specialization" TEXT,
    "license_number" TEXT,
    "years_experience" INTEGER,
    "consultation_fee" INTEGER,
    "clinic_id" TEXT,
    "business_permit_url" TEXT,
    "professional_license_url" TEXT,
    "government_id_url" TEXT,
    "status" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TEXT,
    "review_notes" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE,
    "updated_at" TIMESTAMP WITH TIME ZONE
);

-- Columns in veterinarian_applications: id, email, full_name, phone, specialization, license_number, years_experience, consultation_fee, clinic_id, business_permit_url, professional_license_url, government_id_url, status, reviewed_by, reviewed_at, review_notes, rejection_reason, created_at, updated_at

-- Data for veterinarian_applications (1 rows)
INSERT INTO "veterinarian_applications" ("id", "email", "full_name", "phone", "specialization", "license_number", "years_experience", "consultation_fee", "clinic_id", "business_permit_url", "professional_license_url", "government_id_url", "status", "reviewed_by", "reviewed_at", "review_notes", "rejection_reason", "created_at", "updated_at") VALUES (1, 'vetzambo@gmail.com', 'Chupa Kulo', '09123456789', NULL, 'VET123345567', 0, 0, NULL, 'business-permits/26f6d47a-ea72-49cb-9c7a-da14777361a4_1757297259441.png', NULL, 'government-ids/26f6d47a-ea72-49cb-9c7a-da14777361a4_1757297261137.png', 'pending', NULL, NULL, NULL, NULL, '2025-09-08T02:07:42.534+00:00', '2025-09-08T02:07:42.534+00:00');

-- =====================================
-- TABLE: VETERINARIANS
-- Rows: 2
-- Columns: 12
-- =====================================

DROP TABLE IF EXISTS "veterinarians" CASCADE;
CREATE TABLE "veterinarians" (
    "id" INTEGER,
    "user_id" UUID,
    "clinic_id" INTEGER,
    "full_name" TEXT,
    "specialization" TEXT,
    "license_number" TEXT,
    "years_experience" INTEGER,
    "consultation_fee" DECIMAL,
    "is_available" BOOLEAN,
    "average_rating" INTEGER,
    "created_at" TIMESTAMP WITH TIME ZONE,
    "updated_at" TIMESTAMP WITH TIME ZONE
);

-- Columns in veterinarians: id, user_id, clinic_id, full_name, specialization, license_number, years_experience, consultation_fee, is_available, average_rating, created_at, updated_at

-- Data for veterinarians (2 rows)
INSERT INTO "veterinarians" ("id", "user_id", "clinic_id", "full_name", "specialization", "license_number", "years_experience", "consultation_fee", "is_available", "average_rating", "created_at", "updated_at") VALUES (1, '57520192-acb2-46f7-b915-d23d071c8a80', 4, 'Dora Popo', 'Cardiology', 'VET123456789', 4, 2.14, true, 0, '2025-06-28T04:18:14.973355+00:00', '2025-06-28T11:23:48.698603+00:00');
INSERT INTO "veterinarians" ("id", "user_id", "clinic_id", "full_name", "specialization", "license_number", "years_experience", "consultation_fee", "is_available", "average_rating", "created_at", "updated_at") VALUES (2, '56f379e5-3687-47c2-a955-6fe0a8c31d68', NULL, 'Dylan Alce', 'Testing', 'TEST101', 20, 150, true, 0, '2025-06-30T06:57:35.484472+00:00', '2025-06-30T06:57:35.484472+00:00');

-- =====================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================

ALTER TABLE "admin_appointments_view" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emergency_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pet_owner_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "veterinarian_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "veterinarians" ENABLE ROW LEVEL SECURITY;

-- =====================================
-- EXPORT SUMMARY
-- =====================================
-- Total tables exported: 12
-- Total rows exported: 44
-- Export completed: 2025-09-17T10:40:36.007Z
-- =====================================
