INSERT INTO "system_users" ("id", "fullName", "username", "email", "role", "passwordHash", "companyName", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(), 
  'Sonu Bhagat', 
  'sonubhagat', 
  'sonu.bhagat@mams.com', 
  'admin', 
  '$2b$10$SEUzwSbnkDFmiJiHccLE3.ViwSG7poT78CRRt4JY6dTHtJqash81u', 
  'MAMS', 
  true, 
  NOW(), 
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET "role" = 'admin';
