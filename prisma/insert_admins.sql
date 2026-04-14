-- Create Admin Users
INSERT INTO "system_users" ("id", "fullName", "username", "email", "role", "passwordHash", "companyName", "isActive", "createdAt", "updatedAt")
VALUES 
(gen_random_uuid(), 'ROHIT KUMAR', 'rohitkumar', 'rohit.kumar@50hertz.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', '50HERTZ', true, NOW(), NOW()),
(gen_random_uuid(), 'MAHESH SHUKLA', 'maheshshukla', 'mahesh.shukla@50hertz.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', '50HERTZ', true, NOW(), NOW()),
(gen_random_uuid(), 'CHANDAN KUSHWAHA', 'chandankushwaha', 'chandan.kushwaha@mpl.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', 'MPL', true, NOW(), NOW()),
(gen_random_uuid(), 'AMIT KUMAR', 'amitkumar', 'amit.kumar@mpl.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', 'MPL', true, NOW(), NOW()),
(gen_random_uuid(), 'MOHIT SHUKLA', 'mohitshukla', 'mohit.shukla@mpl.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', 'MPL', true, NOW(), NOW()),
(gen_random_uuid(), 'AKHILESH YADAV', 'akhileshyadav', 'akhilesh.yadav@mpl.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', 'MPL', true, NOW(), NOW()),
(gen_random_uuid(), 'PARDEEP', 'pardeep', 'pardeep@mpl.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', 'MPL', true, NOW(), NOW()),
(gen_random_uuid(), 'GOURAV BEHL', 'gouravbehl', 'gourav.behl@mpl.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', 'MPL', true, NOW(), NOW()),
(gen_random_uuid(), 'HIMANI SHARMA', 'himanisharma', 'himani.sharma@mpl.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', 'MPL', true, NOW(), NOW()),
(gen_random_uuid(), 'Surendra Yadav', 'surendrayadav', 'surendra.yadav@mpl.com', 'admin', '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', 'MPL', true, NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
  "fullName" = EXCLUDED."fullName",
  "username" = EXCLUDED."username",
  "companyName" = EXCLUDED."companyName",
  "passwordHash" = EXCLUDED."passwordHash";
