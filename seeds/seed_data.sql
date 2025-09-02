-- Seed data for WorkWise SA database
-- This script populates all core tables with realistic sample data

-- Clear existing data (optional - remove if you want to keep existing data)
DELETE FROM user_notifications;
DELETE FROM job_applications;
DELETE FROM user_interactions;
DELETE FROM user_sessions;
DELETE FROM user_job_preferences;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM job_credits;
DELETE FROM payments;
DELETE FROM payment_methods;
DELETE FROM billing_addresses;
DELETE FROM subscriptions;
DELETE FROM jobs;
DELETE FROM users;
DELETE FROM companies;
DELETE FROM categories;

-- Insert Categories
INSERT INTO categories (name, icon, slug, job_count) VALUES
('Technology', 'laptop', 'technology', 245),
('Finance', 'dollar-sign', 'finance', 156),
('Healthcare', 'heart', 'healthcare', 189),
('Education', 'graduation-cap', 'education', 134),
('Marketing', 'megaphone', 'marketing', 112),
('Sales', 'trending-up', 'sales', 203),
('Engineering', 'cog', 'engineering', 167),
('Design', 'palette', 'design', 89),
('Human Resources', 'users', 'human-resources', 78),
('Customer Service', 'phone', 'customer-service', 145),
('Legal', 'briefcase', 'legal', 67),
('Operations', 'settings', 'operations', 123),
('Consulting', 'user-check', 'consulting', 91),
('Administration', 'file-text', 'administration', 102),
('Retail', 'shopping-cart', 'retail', 234);

-- Insert Companies
INSERT INTO companies (name, logo, location, slug, open_positions) VALUES
('Takealot', 'https://via.placeholder.com/150x150/007bff/ffffff?text=T', 'Cape Town', 'takealot', 23),
('Discovery', 'https://via.placeholder.com/150x150/28a745/ffffff?text=D', 'Sandton', 'discovery', 34),
('Shoprite', 'https://via.placeholder.com/150x150/dc3545/ffffff?text=S', 'Western Cape', 'shoprite', 45),
('Standard Bank', 'https://via.placeholder.com/150x150/17a2b8/ffffff?text=SB', 'Johannesburg', 'standard-bank', 28),
('MTN', 'https://via.placeholder.com/150x150/ffc107/ffffff?text=MTN', 'Johannesburg', 'mtn', 19),
('Vodacom', 'https://via.placeholder.com/150x150/6610f2/ffffff?text=V', 'Midrand', 'vodacom', 31),
('Capitec Bank', 'https://via.placeholder.com/150x150/fd7e14/ffffff?text=C', 'Stellenbosch', 'capitec-bank', 22),
('Naspers', 'https://via.placeholder.com/150x150/e83e8c/ffffff?text=N', 'Cape Town', 'naspers', 27),
('Sasol', 'https://via.placeholder.com/150x150/20c997/ffffff?text=S', 'Sandton', 'sasol', 16),
('Anglo American', 'https://via.placeholder.com/150x150/6f42c1/ffffff?text=AA', 'Johannesburg', 'anglo-american', 18),
('Investec', 'https://via.placeholder.com/150x150/fd7e14/ffffff?text=I', 'Sandton', 'investec', 21),
('Absa', 'https://via.placeholder.com/150x150/dc3545/ffffff?text=A', 'Johannesburg', 'absa', 29),
('Nedbank', 'https://via.placeholder.com/150x150/28a745/ffffff?text=NB', 'Sandton', 'nedbank', 25),
('Pick n Pay', 'https://via.placeholder.com/150x150/007bff/ffffff?text=PnP', 'Cape Town', 'pick-n-pay', 33),
('Woolworths', 'https://via.placeholder.com/150x150/6c757d/ffffff?text=W', 'Cape Town', 'woolworths', 24),
('FirstRand', 'https://via.placeholder.com/150x150/17a2b8/ffffff?text=FR', 'Sandton', 'firstrand', 20),
('Clicks', 'https://via.placeholder.com/150x150/ffc107/ffffff?text=C', 'Cape Town', 'clicks', 15),
('Mr Price', 'https://via.placeholder.com/150x150/6610f2/ffffff?text=MP', 'Durban', 'mr-price', 26),
('Steinhoff', 'https://via.placeholder.com/150x150/e83e8c/ffffff?text=S', 'Stellenbosch', 'steinhoff', 12),
('Multichoice', 'https://via.placeholder.com/150x150/20c997/ffffff?text=M', 'Randburg', 'multichoice', 30);

-- Insert Users (Mix of candidates and employers)
INSERT INTO users (username, password, email, name, location, bio, phone_number, willing_to_relocate, preferences, experience, education, skills, last_active, engagement_score, notification_preference, user_type, subscription_status, stripe_customer_id, created_at) VALUES
('john.doe', '$2b$10$encrypted_password_hash', 'john.doe@example.com', 'John Doe', 'Cape Town', 'Full-stack developer with 5 years experience in React and Node.js', '+27823456789', 1, 'Remote work preferred', 'Senior Developer at TechCorp', 'BSc Computer Science - UCT', 'JavaScript,React,Node.js,Python,SQL', datetime('now', '-2 hours'), 85, 1, 'candidate', 'free', NULL, datetime('now', '-30 days')),
('sarah.smith', '$2b$10$encrypted_password_hash', 'sarah.smith@example.com', 'Sarah Smith', 'Johannesburg', 'Digital marketing specialist with expertise in SEO and social media', '+27834567890', 0, 'Growth-focused companies', 'Marketing Manager at AdCorp', 'BA Marketing - Wits', 'Digital Marketing,SEO,Social Media,Google Analytics', datetime('now', '-1 hour'), 92, 1, 'candidate', 'free', NULL, datetime('now', '-25 days')),
('mike.johnson', '$2b$10$encrypted_password_hash', 'mike.johnson@example.com', 'Mike Johnson', 'Durban', 'Financial analyst with CFA certification', '+27845678901', 1, 'Banking and finance sector', 'Senior Analyst at InvestCorp', 'BCom Finance - UKZN', 'Financial Analysis,Excel,Bloomberg,Risk Management', datetime('now', '-3 hours'), 78, 1, 'candidate', 'free', NULL, datetime('now', '-20 days')),
('lisa.williams', '$2b$10$encrypted_password_hash', 'lisa.williams@example.com', 'Lisa Williams', 'Pretoria', 'HR recruiter specializing in tech talent acquisition', '+27856789012', 0, 'Technology companies', 'Recruitment Specialist at TalentCorp', 'BA Psychology - UP', 'Recruitment,HR,Talent Acquisition,Interviewing', datetime('now', '-30 minutes'), 88, 1, 'employer', 'trial', 'cus_stripe_12345', datetime('now', '-15 days')),
('david.brown', '$2b$10$encrypted_password_hash', 'david.brown@example.com', 'David Brown', 'Cape Town', 'UX/UI designer with 7 years experience in product design', '+27867890123', 1, 'Startups and scale-ups', 'Lead Designer at DesignCorp', 'BFA Design - Stellenbosch', 'UI/UX Design,Figma,Sketch,Adobe Creative Suite', datetime('now', '-4 hours'), 91, 1, 'candidate', 'free', NULL, datetime('now', '-18 days')),
('emma.davis', '$2b$10$encrypted_password_hash', 'emma.davis@example.com', 'Emma Davis', 'Sandton', 'Software engineer passionate about AI and machine learning', '+27878901234', 1, 'AI/ML companies', 'ML Engineer at DataCorp', 'MSc Computer Science - Wits', 'Python,TensorFlow,PyTorch,Machine Learning,AI', datetime('now', '-1 hour'), 94, 1, 'candidate', 'free', NULL, datetime('now', '-22 days')),
('james.wilson', '$2b$10$encrypted_password_hash', 'james.wilson@example.com', 'James Wilson', 'Johannesburg', 'Sales manager with proven track record in B2B sales', '+27889012345', 0, 'Enterprise sales roles', 'Sales Manager at SalesCorp', 'BCom Sales - UJ', 'B2B Sales,CRM,Salesforce,Negotiation', datetime('now', '-2 hours'), 82, 1, 'candidate', 'free', NULL, datetime('now', '-28 days')),
('anna.taylor', '$2b$10$encrypted_password_hash', 'anna.taylor@example.com', 'Anna Taylor', 'Cape Town', 'Project manager with PMP certification', '+27890123456', 1, 'Large projects', 'Senior PM at ProjectCorp', 'MBA - GSB', 'Project Management,Agile,Scrum,Leadership', datetime('now', '-45 minutes'), 87, 1, 'candidate', 'free', NULL, datetime('now', '-12 days')),
('robert.anderson', '$2b$10$encrypted_password_hash', 'robert.anderson@example.com', 'Robert Anderson', 'Pretoria', 'DevOps engineer specializing in cloud infrastructure', '+27901234567', 1, 'Cloud-first companies', 'DevOps Engineer at CloudCorp', 'BSc IT - UP', 'AWS,Docker,Kubernetes,Terraform,CI/CD', datetime('now', '-3 hours'), 89, 1, 'candidate', 'free', NULL, datetime('now', '-35 days')),
('olivia.thomas', '$2b$10$encrypted_password_hash', 'olivia.thomas@example.com', 'Olivia Thomas', 'Durban', 'Data scientist with PhD in Statistics', '+27912345678', 1, 'Data-driven companies', 'Data Scientist at DataCorp', 'PhD Statistics - UKZN', 'Python,R,SQL,Machine Learning,Statistics', datetime('now', '-1 hour'), 96, 1, 'candidate', 'free', NULL, datetime('now', '-40 days')),
('hr.manager', '$2b$10$encrypted_password_hash', 'hr@takealot.com', 'Takealot HR Team', 'Cape Town', 'Official HR account for Takealot', '+27215551234', 0, NULL, NULL, NULL, NULL, datetime('now', '-15 minutes'), 75, 1, 'employer', 'active', 'cus_stripe_67890', datetime('now', '-60 days')),
('recruiter.discovery', '$2b$10$encrypted_password_hash', 'jobs@discovery.co.za', 'Discovery Talent Team', 'Sandton', 'Discovery talent acquisition team', '+27115552345', 0, NULL, NULL, NULL, NULL, datetime('now', '-30 minutes'), 80, 1, 'employer', 'active', 'cus_stripe_11111', datetime('now', '-45 days'));

-- Insert Jobs
INSERT INTO jobs (title, description, location, salary, job_type, work_mode, company_id, category_id, is_featured, created_at) VALUES
('Senior React Developer', 'We are looking for a Senior React Developer to join our dynamic team. You will be responsible for developing and maintaining our e-commerce platform using React, Redux, and modern JavaScript frameworks.', 'Cape Town', 'R45,000 - R60,000', 'Full-time', 'Hybrid', 1, 1, 1, datetime('now', '-3 days')),
('Financial Analyst', 'Join our finance team as a Financial Analyst. You will analyze financial data, prepare reports, and support strategic decision-making processes.', 'Sandton', 'R35,000 - R50,000', 'Full-time', 'Office', 2, 2, 0, datetime('now', '-5 days')),
('UX/UI Designer', 'We need a creative UX/UI Designer to enhance our digital products. You will work closely with product managers and developers to create intuitive user experiences.', 'Cape Town', 'R30,000 - R45,000', 'Full-time', 'Remote', 1, 8, 1, datetime('now', '-2 days')),
('DevOps Engineer', 'Looking for a DevOps Engineer to manage our cloud infrastructure. Experience with AWS, Docker, and Kubernetes required.', 'Johannesburg', 'R50,000 - R70,000', 'Full-time', 'Hybrid', 5, 7, 1, datetime('now', '-1 day')),
('Digital Marketing Manager', 'Join our marketing team to lead digital marketing campaigns. Experience with SEO, SEM, and social media marketing required.', 'Cape Town', 'R40,000 - R55,000', 'Full-time', 'Office', 3, 5, 0, datetime('now', '-4 days')),
('Data Scientist', 'We are seeking a Data Scientist to analyze large datasets and build predictive models. Python and machine learning experience required.', 'Sandton', 'R55,000 - R75,000', 'Full-time', 'Hybrid', 2, 1, 1, datetime('now', '-6 days')),
('Sales Representative', 'Join our sales team as a Sales Representative. You will be responsible for acquiring new clients and maintaining existing relationships.', 'Johannesburg', 'R25,000 - R35,000 + Commission', 'Full-time', 'Office', 4, 6, 0, datetime('now', '-7 days')),
('Software Engineer', 'We need a Software Engineer to develop and maintain our mobile applications. Experience with React Native or Flutter preferred.', 'Midrand', 'R40,000 - R60,000', 'Full-time', 'Remote', 6, 1, 0, datetime('now', '-8 days')),
('HR Specialist', 'Looking for an HR Specialist to manage recruitment and employee relations. SHRM certification preferred.', 'Stellenbosch', 'R30,000 - R40,000', 'Full-time', 'Office', 7, 9, 0, datetime('now', '-9 days')),
('Project Manager', 'We are seeking a Project Manager with PMP certification to lead our product development projects.', 'Cape Town', 'R45,000 - R65,000', 'Full-time', 'Hybrid', 8, 12, 1, datetime('now', '-10 days')),
('Backend Developer', 'Join our engineering team as a Backend Developer. Experience with Node.js, Python, or Java required.', 'Johannesburg', 'R40,000 - R55,000', 'Full-time', 'Remote', 9, 1, 0, datetime('now', '-11 days')),
('Business Analyst', 'We need a Business Analyst to analyze business processes and recommend improvements. SQL knowledge preferred.', 'Sandton', 'R35,000 - R50,000', 'Full-time', 'Office', 10, 14, 0, datetime('now', '-12 days')),
('Customer Success Manager', 'Looking for a Customer Success Manager to ensure client satisfaction and retention. CRM experience required.', 'Sandton', 'R38,000 - R52,000', 'Full-time', 'Hybrid', 11, 10, 0, datetime('now', '-13 days')),
('Frontend Developer', 'We are seeking a Frontend Developer with expertise in Vue.js or Angular. Modern CSS framework knowledge required.', 'Johannesburg', 'R35,000 - R50,000', 'Full-time', 'Remote', 12, 1, 0, datetime('now', '-14 days')),
('Quality Assurance Tester', 'Join our QA team to ensure product quality. Experience with automated testing tools preferred.', 'Sandton', 'R30,000 - R42,000', 'Full-time', 'Office', 13, 1, 0, datetime('now', '-15 days')),
('Content Marketing Specialist', 'We need a Content Marketing Specialist to create engaging content for our digital platforms.', 'Cape Town', 'R28,000 - R38,000', 'Full-time', 'Hybrid', 14, 5, 0, datetime('now', '-16 days')),
('Network Administrator', 'Looking for a Network Administrator to manage our IT infrastructure. Cisco certifications preferred.', 'Cape Town', 'R35,000 - R48,000', 'Full-time', 'Office', 15, 1, 0, datetime('now', '-17 days')),
('Graphic Designer', 'We are seeking a Graphic Designer to create visual content for marketing campaigns. Adobe Creative Suite expertise required.', 'Sandton', 'R25,000 - R35,000', 'Full-time', 'Remote', 16, 8, 0, datetime('now', '-18 days')),
('Operations Manager', 'Join our operations team as an Operations Manager. Experience in supply chain management preferred.', 'Cape Town', 'R50,000 - R70,000', 'Full-time', 'Office', 17, 12, 1, datetime('now', '-19 days')),
('Mobile App Developer', 'We need a Mobile App Developer to build native iOS and Android applications. Swift and Kotlin experience required.', 'Durban', 'R40,000 - R58,000', 'Full-time', 'Hybrid', 18, 1, 0, datetime('now', '-20 days'));

-- Insert User Job Preferences
INSERT INTO user_job_preferences (user_id, preferred_categories, preferred_locations, preferred_job_types, willing_to_relocate, min_salary, updated_at) VALUES
(1, 'Technology', 'Cape Town,Remote', 'Full-time', 1, 40000, datetime('now', '-5 days')),
(2, 'Marketing', 'Johannesburg', 'Full-time', 0, 35000, datetime('now', '-3 days')),
(3, 'Finance', 'Durban,Johannesburg', 'Full-time', 1, 30000, datetime('now', '-7 days')),
(5, 'Design', 'Cape Town,Remote', 'Full-time,Contract', 1, 35000, datetime('now', '-2 days')),
(6, 'Technology', 'Sandton,Remote', 'Full-time', 1, 50000, datetime('now', '-1 day')),
(7, 'Sales', 'Johannesburg', 'Full-time', 0, 25000, datetime('now', '-4 days')),
(8, 'Operations', 'Cape Town', 'Full-time', 1, 40000, datetime('now', '-6 days')),
(9, 'Technology', 'Pretoria,Remote', 'Full-time', 1, 45000, datetime('now', '-8 days')),
(10, 'Technology', 'Durban,Remote', 'Full-time', 1, 50000, datetime('now', '-9 days'));

-- Insert Subscriptions
INSERT INTO subscriptions (user_id, stripe_subscription_id, plan_type, status, current_period_start, current_period_end, trial_start, trial_end, created_at) VALUES
(4, 'sub_stripe_12345', 'basic', 'trialing', datetime('now', '-15 days'), datetime('now', '+15 days'), datetime('now', '-15 days'), datetime('now', '+15 days'), datetime('now', '-15 days')),
(11, 'sub_stripe_67890', 'professional', 'active', datetime('now', '-30 days'), datetime('now', '+30 days'), NULL, NULL, datetime('now', '-60 days')),
(12, 'sub_stripe_11111', 'enterprise', 'active', datetime('now', '-20 days'), datetime('now', '+40 days'), NULL, NULL, datetime('now', '-45 days'));

-- Insert Payment Methods
INSERT INTO payment_methods (user_id, stripe_payment_method_id, type, card_brand, card_last4, card_exp_month, card_exp_year, is_default, created_at) VALUES
(4, 'pm_stripe_12345', 'card', 'visa', '4242', 12, 2027, 1, datetime('now', '-15 days')),
(11, 'pm_stripe_67890', 'card', 'mastercard', '5555', 8, 2026, 1, datetime('now', '-60 days')),
(12, 'pm_stripe_11111', 'card', 'visa', '4444', 10, 2028, 1, datetime('now', '-45 days'));

-- Insert Billing Addresses
INSERT INTO billing_addresses (user_id, line1, line2, city, state, postal_code, country, is_default, created_at) VALUES
(4, '123 Main Street', 'Unit 4B', 'Pretoria', 'Gauteng', '0001', 'ZA', 1, datetime('now', '-15 days')),
(11, '456 Oak Avenue', NULL, 'Cape Town', 'Western Cape', '8001', 'ZA', 1, datetime('now', '-60 days')),
(12, '789 Pine Road', 'Suite 200', 'Sandton', 'Gauteng', '2196', 'ZA', 1, datetime('now', '-45 days'));

-- Insert Payments
INSERT INTO payments (user_id, subscription_id, stripe_payment_intent_id, amount, currency, status, payment_method, description, created_at) VALUES
(11, 2, 'pi_stripe_67890', 599.00, 'ZAR', 'succeeded', 'card', 'Professional Plan - Monthly', datetime('now', '-30 days')),
(12, 3, 'pi_stripe_11111', 1299.00, 'ZAR', 'succeeded', 'card', 'Enterprise Plan - Monthly', datetime('now', '-20 days'));

-- Insert Job Credits
INSERT INTO job_credits (user_id, subscription_id, credits_total, credits_used, credits_remaining, expires_at, created_at) VALUES
(4, 1, 5, 0, 5, datetime('now', '+15 days'), datetime('now', '-15 days')),
(11, 2, 25, 8, 17, datetime('now', '+30 days'), datetime('now', '-30 days')),
(12, 3, 100, 12, 88, datetime('now', '+40 days'), datetime('now', '-20 days'));

-- Insert Job Applications
INSERT INTO job_applications (user_id, job_id, status, applied_at, resume_url, cover_letter, notes) VALUES
(1, 1, 'applied', datetime('now', '-2 days'), 'https://example.com/resume1.pdf', 'I am excited to apply for the Senior React Developer position...', NULL),
(1, 3, 'interviewed', datetime('now', '-5 days'), 'https://example.com/resume1.pdf', 'I would love to join your design team...', 'Phone interview scheduled for tomorrow'),
(2, 5, 'applied', datetime('now', '-1 day'), 'https://example.com/resume2.pdf', 'My marketing experience aligns perfectly with your needs...', NULL),
(3, 2, 'reviewed', datetime('now', '-3 days'), 'https://example.com/resume3.pdf', 'I have extensive experience in financial analysis...', 'Application under review'),
(5, 3, 'applied', datetime('now', '-4 days'), 'https://example.com/resume5.pdf', 'I am passionate about creating exceptional user experiences...', NULL),
(6, 6, 'applied', datetime('now', '-1 day'), 'https://example.com/resume6.pdf', 'My machine learning expertise would be valuable...', NULL),
(7, 7, 'applied', datetime('now', '-2 days'), 'https://example.com/resume7.pdf', 'I have a proven track record in B2B sales...', NULL),
(8, 10, 'interviewed', datetime('now', '-6 days'), 'https://example.com/resume8.pdf', 'I would bring strong project management skills...', 'Second interview next week'),
(9, 4, 'applied', datetime('now', '-3 days'), 'https://example.com/resume9.pdf', 'My DevOps experience matches your requirements...', NULL),
(10, 6, 'applied', datetime('now', '-5 days'), 'https://example.com/resume10.pdf', 'I am excited about this data science opportunity...', NULL);

-- Insert User Sessions
INSERT INTO user_sessions (user_id, start_time, end_time, duration, device, ip_address) VALUES
(1, datetime('now', '-2 hours'), datetime('now', '-1 hour'), 3600, 'Desktop - Chrome', '192.168.1.100'),
(2, datetime('now', '-1 hour'), datetime('now', '-30 minutes'), 1800, 'Mobile - Safari', '192.168.1.101'),
(3, datetime('now', '-3 hours'), datetime('now', '-2 hours'), 3600, 'Desktop - Firefox', '192.168.1.102'),
(4, datetime('now', '-30 minutes'), datetime('now', '-10 minutes'), 1200, 'Tablet - Chrome', '192.168.1.103'),
(5, datetime('now', '-4 hours'), datetime('now', '-3 hours'), 3600, 'Desktop - Edge', '192.168.1.104'),
(6, datetime('now', '-1 hour'), datetime('now', '-45 minutes'), 900, 'Mobile - Chrome', '192.168.1.105'),
(7, datetime('now', '-2 hours'), datetime('now', '-1 hour 30 minutes'), 1800, 'Desktop - Chrome', '192.168.1.106'),
(8, datetime('now', '-45 minutes'), datetime('now', '-15 minutes'), 1800, 'Desktop - Safari', '192.168.1.107'),
(9, datetime('now', '-3 hours'), datetime('now', '-2 hours 30 minutes'), 1800, 'Mobile - Firefox', '192.168.1.108'),
(10, datetime('now', '-1 hour'), datetime('now', '-30 minutes'), 1800, 'Desktop - Chrome', '192.168.1.109');

-- Insert User Interactions
INSERT INTO user_interactions (user_id, interaction_type, interaction_time, job_id, category_id, duration, metadata) VALUES
(1, 'job_view', datetime('now', '-2 hours'), 1, 1, 120, '{"source": "search", "position": 1}'),
(1, 'job_apply', datetime('now', '-2 days'), 1, 1, 300, '{"application_id": 1}'),
(2, 'job_view', datetime('now', '-1 hour'), 5, 5, 90, '{"source": "featured", "position": 2}'),
(2, 'job_apply', datetime('now', '-1 day'), 5, 5, 180, '{"application_id": 2}'),
(3, 'job_view', datetime('now', '-3 hours'), 2, 2, 150, '{"source": "category", "position": 3}'),
(3, 'job_apply', datetime('now', '-3 days'), 2, 2, 240, '{"application_id": 3}'),
(4, 'job_view', datetime('now', '-30 minutes'), 3, 8, 75, '{"source": "search", "position": 1}'),
(5, 'job_view', datetime('now', '-4 hours'), 3, 8, 200, '{"source": "recommended", "position": 1}'),
(5, 'job_apply', datetime('now', '-4 days'), 3, 8, 360, '{"application_id": 4}'),
(6, 'job_view', datetime('now', '-1 hour'), 6, 1, 100, '{"source": "search", "position": 2}'),
(6, 'job_apply', datetime('now', '-1 day'), 6, 1, 220, '{"application_id": 5}'),
(7, 'job_view', datetime('now', '-2 hours'), 7, 6, 80, '{"source": "category", "position": 1}'),
(7, 'job_apply', datetime('now', '-2 days'), 7, 6, 150, '{"application_id": 6}'),
(8, 'job_view', datetime('now', '-45 minutes'), 10, 12, 180, '{"source": "featured", "position": 3}'),
(8, 'job_apply', datetime('now', '-6 days'), 10, 12, 300, '{"application_id": 7}'),
(9, 'job_view', datetime('now', '-3 hours'), 4, 7, 120, '{"source": "search", "position": 1}'),
(9, 'job_apply', datetime('now', '-3 days'), 4, 7, 270, '{"application_id": 8}'),
(10, 'job_view', datetime('now', '-1 hour'), 6, 1, 95, '{"source": "recommended", "position": 2}'),
(10, 'job_apply', datetime('now', '-5 days'), 6, 1, 210, '{"application_id": 9}');

-- Insert User Notifications
INSERT INTO user_notifications (user_id, type, content, job_id, is_read, created_at, sent_at) VALUES
(1, 'application_status', 'Your application for Senior React Developer has been received', 1, 1, datetime('now', '-2 days'), datetime('now', '-2 days')),
(1, 'new_job_match', 'New job matching your preferences: DevOps Engineer', 4, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
(2, 'application_status', 'Your application for Digital Marketing Manager has been received', 5, 1, datetime('now', '-1 day'), datetime('now', '-1 day')),
(3, 'application_status', 'Your application for Financial Analyst is being reviewed', 2, 0, datetime('now', '-3 days'), datetime('now', '-3 days')),
(5, 'application_status', 'Your application for UX/UI Designer has been received', 3, 1, datetime('now', '-4 days'), datetime('now', '-4 days')),
(6, 'application_status', 'Your application for Data Scientist has been received', 6, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
(7, 'application_status', 'Your application for Sales Representative has been received', 7, 1, datetime('now', '-2 days'), datetime('now', '-2 days')),
(8, 'application_status', 'Interview scheduled for Project Manager position', 10, 0, datetime('now', '-5 days'), datetime('now', '-5 days')),
(9, 'application_status', 'Your application for DevOps Engineer has been received', 4, 1, datetime('now', '-3 days'), datetime('now', '-3 days')),
(10, 'application_status', 'Your application for Data Scientist has been received', 6, 0, datetime('now', '-5 days'), datetime('now', '-5 days'));

-- Update job counts for categories based on inserted jobs
UPDATE categories SET job_count = (
  SELECT COUNT(*) FROM jobs WHERE jobs.category_id = categories.id
);

-- Update open positions for companies based on inserted jobs
UPDATE companies SET open_positions = (
  SELECT COUNT(*) FROM jobs WHERE jobs.company_id = companies.id
);

-- Update user engagement scores based on interactions
UPDATE users SET engagement_score = (
  SELECT COUNT(*) * 10 FROM user_interactions WHERE user_interactions.user_id = users.id
) WHERE id IN (SELECT DISTINCT user_id FROM user_interactions);

-- Update last active times for users with recent interactions
UPDATE users SET last_active = (
  SELECT MAX(interaction_time) FROM user_interactions WHERE user_interactions.user_id = users.id
) WHERE id IN (SELECT DISTINCT user_id FROM user_interactions);

-- Final verification queries (commented out - uncomment to run verification)
-- SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
-- UNION ALL
-- SELECT 'Companies', COUNT(*) FROM companies
-- UNION ALL
-- SELECT 'Users', COUNT(*) FROM users
-- UNION ALL
-- SELECT 'Jobs', COUNT(*) FROM jobs
-- UNION ALL
-- SELECT 'Job Applications', COUNT(*) FROM job_applications
-- UNION ALL
-- SELECT 'User Sessions', COUNT(*) FROM user_sessions
-- UNION ALL
-- SELECT 'User Interactions', COUNT(*) FROM user_interactions
-- UNION ALL
-- SELECT 'Notifications', COUNT(*) FROM user_notifications
-- UNION ALL
-- SELECT 'Subscriptions', COUNT(*) FROM subscriptions
-- UNION ALL
-- SELECT 'Payments', COUNT(*) FROM payments;
