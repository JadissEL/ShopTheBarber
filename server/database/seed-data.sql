-- Seed data for testing reports and analytics

-- Insert test users
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, phone, city, role) VALUES
(1, 'client1@test.com', '$2b$10$test', 'Ahmed', 'Benali', '+212612345678', 'Casablanca', 'client'),
(2, 'client2@test.com', '$2b$10$test', 'Youssef', 'Bennani', '+212612345679', 'Marrakech', 'client'),
(3, 'client3@test.com', '$2b$10$test', 'Karim', 'Alaoui', '+212612345680', 'Rabat', 'client'),
(4, 'barber1@test.com', '$2b$10$test', 'Hassan', 'Alami', '+212612345681', 'Casablanca', 'barber'),
(5, 'barber2@test.com', '$2b$10$test', 'Mehdi', 'Benali', '+212612345682', 'Fès', 'barber'),
(6, 'barber3@test.com', '$2b$10$test', 'Omar', 'Tazi', '+212612345683', 'Rabat', 'barber'),
(7, 'admin@test.com', '$2b$10$test', 'Admin', 'User', '+212612345684', 'Casablanca', 'admin');

-- Insert barbers
INSERT OR IGNORE INTO barbers (id, user_id, name, salon_name, description, rating, review_count, location, accepts_home, accepts_shop) VALUES
(1, 4, 'Hassan Alami', 'Salon Royal', 'Barbier professionnel avec 10 ans d''expérience', 4.8, 45, 'Casablanca', true, true),
(2, 5, 'Mehdi Benali', 'Style Master', 'Spécialiste des coupes modernes', 4.7, 32, 'Fès', false, true),
(3, 6, 'Omar Tazi', 'Modern Cut', 'Expert en coiffures tendance', 4.9, 28, 'Rabat', true, true);

-- Insert services
INSERT OR IGNORE INTO services (id, name, category, duration_minutes, price_range, description) VALUES
(1, 'Coupe Homme', 'Coupe', 30, '50-100 MAD', 'Coupe classique pour homme'),
(2, 'Coupe + Barbe', 'Coupe', 45, '80-150 MAD', 'Coupe complète avec soin de barbe'),
(3, 'Rasage', 'Barbe', 20, '40-80 MAD', 'Rasage traditionnel'),
(4, 'Coloration', 'Couleur', 60, '120-200 MAD', 'Coloration professionnelle'),
(5, 'Lissage', 'Soin', 90, '150-300 MAD', 'Lissage permanent');

-- Insert barber services
INSERT OR IGNORE INTO barber_services (barber_id, service_id, price) VALUES
(1, 1, 80), (1, 2, 120), (1, 3, 60), (1, 4, 180), (1, 5, 250),
(2, 1, 70), (2, 2, 110), (2, 3, 50), (2, 4, 160), (2, 5, 220),
(3, 1, 90), (3, 2, 130), (3, 3, 70), (3, 4, 200), (3, 5, 280);

-- Insert appointments (last 6 months)
INSERT OR IGNORE INTO appointments (id, client_id, barber_id, appointment_date, appointment_time, location_type, status, total_price, notes) VALUES
-- January 2024
(1, 1, 1, '2024-01-15', '10:00', 'shop', 'completed', 120, 'Client satisfait'),
(2, 2, 1, '2024-01-20', '14:00', 'shop', 'completed', 80, ''),
(3, 3, 2, '2024-01-25', '11:00', 'shop', 'completed', 110, ''),

-- February 2024
(4, 1, 2, '2024-02-10', '09:00', 'shop', 'completed', 70, ''),
(5, 2, 3, '2024-02-15', '16:00', 'shop', 'completed', 130, ''),
(6, 3, 1, '2024-02-28', '13:00', 'shop', 'completed', 180, 'Coloration réussie'),

-- March 2024
(7, 1, 3, '2024-03-05', '10:30', 'shop', 'completed', 90, ''),
(8, 2, 1, '2024-03-12', '15:00', 'shop', 'completed', 120, ''),
(9, 3, 2, '2024-03-20', '12:00', 'shop', 'completed', 110, ''),

-- April 2024
(10, 1, 1, '2024-04-02', '11:00', 'shop', 'completed', 80, ''),
(11, 2, 3, '2024-04-10', '14:30', 'shop', 'completed', 130, ''),
(12, 3, 2, '2024-04-18', '09:30', 'shop', 'completed', 70, ''),

-- May 2024
(13, 1, 2, '2024-05-05', '10:00', 'shop', 'completed', 110, ''),
(14, 2, 1, '2024-05-12', '16:00', 'shop', 'completed', 120, ''),
(15, 3, 3, '2024-05-25', '13:00', 'shop', 'completed', 90, ''),

-- June 2024
(16, 1, 3, '2024-06-01', '11:30', 'shop', 'completed', 130, ''),
(17, 2, 2, '2024-06-08', '15:30', 'shop', 'completed', 70, ''),
(18, 3, 1, '2024-06-15', '10:00', 'shop', 'completed', 80, ''),

-- July 2024 (current month)
(19, 1, 1, '2024-07-05', '14:00', 'shop', 'completed', 120, ''),
(20, 2, 3, '2024-07-10', '11:00', 'shop', 'completed', 90, ''),
(21, 3, 2, '2024-07-18', '16:00', 'shop', 'completed', 110, ''),
(22, 1, 2, '2024-07-25', '09:00', 'shop', 'pending', 70, ''),
(23, 2, 1, '2024-07-30', '13:00', 'shop', 'confirmed', 80, '');

-- Insert appointment services
INSERT OR IGNORE INTO appointment_services (appointment_id, service_id, price) VALUES
-- January
(1, 2, 120), (2, 1, 80), (3, 2, 110),
-- February
(4, 1, 70), (5, 2, 130), (6, 4, 180),
-- March
(7, 1, 90), (8, 2, 120), (9, 2, 110),
-- April
(10, 1, 80), (11, 2, 130), (12, 1, 70),
-- May
(13, 2, 110), (14, 2, 120), (15, 1, 90),
-- June
(16, 2, 130), (17, 1, 70), (18, 1, 80),
-- July
(19, 2, 120), (20, 1, 90), (21, 2, 110), (22, 1, 70), (23, 1, 80);

-- Insert reviews
INSERT OR IGNORE INTO reviews (appointment_id, client_id, barber_id, rating, comment) VALUES
(1, 1, 1, 5, 'Excellent service, très professionnel'),
(2, 2, 1, 4, 'Bon travail, je recommande'),
(3, 3, 2, 5, 'Parfait, résultat impeccable'),
(4, 1, 2, 4, 'Service de qualité'),
(5, 2, 3, 5, 'Très satisfait du résultat'),
(6, 3, 1, 5, 'Coloration parfaite'),
(7, 1, 3, 4, 'Bon service'),
(8, 2, 1, 5, 'Excellent barbier'),
(9, 3, 2, 4, 'Travail soigné'),
(10, 1, 1, 5, 'Toujours satisfait'),
(11, 2, 3, 4, 'Bon rapport qualité-prix'),
(12, 3, 2, 5, 'Service impeccable'),
(13, 1, 2, 4, 'Professionnel'),
(14, 2, 1, 5, 'Excellent'),
(15, 3, 3, 4, 'Bon travail'),
(16, 1, 3, 5, 'Très satisfait'),
(17, 2, 2, 4, 'Service correct'),
(18, 3, 1, 5, 'Parfait'),
(19, 1, 1, 4, 'Bon service'),
(20, 2, 3, 5, 'Excellent'),
(21, 3, 2, 4, 'Satisfait');

-- Insert favorites
INSERT OR IGNORE INTO favorites (client_id, barber_id) VALUES
(1, 1), (1, 2),
(2, 1), (2, 3),
(3, 2), (3, 3);

-- Insert notifications
INSERT OR IGNORE INTO notifications (user_id, type, title, message, read) VALUES
(1, 'appointment', 'Réservation confirmée', 'Votre rendez-vous du 25 juillet a été confirmé', false),
(2, 'promotion', 'Offre spéciale', '20% de réduction sur votre prochaine visite', false),
(3, 'reminder', 'Rappel de rendez-vous', 'N''oubliez pas votre rendez-vous demain', false),
(4, 'review', 'Nouvel avis', 'Vous avez reçu un nouvel avis 5 étoiles', false),
(5, 'appointment', 'Nouvelle réservation', 'Nouvelle réservation pour le 30 juillet', false);

-- Insert user settings
INSERT OR IGNORE INTO user_settings (user_id, notifications, privacy, app) VALUES
(1, '{"email": true, "sms": false, "push": true}', '{"profile_visible": true, "show_phone": false}', '{"theme": "dark", "language": "fr"}'),
(2, '{"email": true, "sms": true, "push": true}', '{"profile_visible": true, "show_phone": true}', '{"theme": "light", "language": "fr"}'),
(3, '{"email": false, "sms": true, "push": false}', '{"profile_visible": false, "show_phone": false}', '{"theme": "dark", "language": "fr"}');

-- Insert barber settings
INSERT OR IGNORE INTO barber_settings (user_id, business, notifications) VALUES
(4, '{"working_hours": {"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-16:00", "sunday": "closed"}, "home_service": true, "max_distance": 10}', '{"new_appointments": true, "cancellations": true, "reviews": true}'),
(5, '{"working_hours": {"monday": "10:00-19:00", "tuesday": "10:00-19:00", "wednesday": "10:00-19:00", "thursday": "10:00-19:00", "friday": "10:00-19:00", "saturday": "10:00-17:00", "sunday": "closed"}, "home_service": false, "max_distance": 0}', '{"new_appointments": true, "cancellations": true, "reviews": true}'),
(6, '{"working_hours": {"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00", "saturday": "08:00-15:00", "sunday": "closed"}, "home_service": true, "max_distance": 15}', '{"new_appointments": true, "cancellations": true, "reviews": true}');

-- Insert admin settings
INSERT OR IGNORE INTO admin_settings (user_id, system, security, moderation) VALUES
(7, '{"maintenance_mode": false, "auto_backup": true, "log_level": "info"}', '{"two_factor_auth": true, "session_timeout": 3600, "max_login_attempts": 5}', '{"auto_moderation": true, "spam_detection": true, "content_filter": true}');

-- Insert blog articles for moderation testing
INSERT OR IGNORE INTO blog_articles (author_id, author_type, title, content, excerpt, status, created_at) VALUES
(2, 'barber', 'Les Tendances de Coiffure 2024', 'Contenu complet sur les tendances de coiffure...', 'Découvrez les nouvelles tendances de coiffure pour 2024', 'pending_review', '2024-01-15 10:30:00'),
(3, 'barber', 'Comment Entretenir sa Barbe', 'Guide complet pour l''entretien de la barbe...', 'Conseils et astuces pour une barbe parfaite', 'pending_review', '2024-01-16 14:20:00'),
(4, 'barber', 'Les Meilleurs Produits de Soin', 'Comparatif des produits de soin capillaires...', 'Sélection des meilleurs produits pour vos cheveux', 'pending_review', '2024-01-17 09:15:00'),
(2, 'barber', 'Techniques de Coupe Moderne', 'Explication des nouvelles techniques de coupe...', 'Maîtrisez les techniques de coupe les plus demandées', 'draft', '2024-01-18 16:45:00'),
(3, 'barber', 'Conseils pour Choisir son Barbier', 'Guide pour bien choisir son barbier...', 'Les critères importants pour choisir le bon barbier', 'rejected', '2024-01-19 11:30:00');

-- Insert article categories
INSERT OR IGNORE INTO article_categories (name, description) VALUES
('Tendances', 'Articles sur les tendances de coiffure'),
('Conseils', 'Conseils et astuces'),
('Produits', 'Comparatifs et recommandations de produits'),
('Techniques', 'Techniques de coiffure et de barbier'),
('Guide', 'Guides et tutoriels');

-- Link articles to categories
INSERT OR IGNORE INTO article_category_relations (article_id, category_id) VALUES
(1, 1), (1, 2),  -- Tendances de Coiffure 2024 -> Tendances, Conseils
(2, 2), (2, 4),  -- Entretenir sa Barbe -> Conseils, Techniques
(3, 3), (3, 2),  -- Produits de Soin -> Produits, Conseils
(4, 4), (4, 2),  -- Techniques de Coupe -> Techniques, Conseils
(5, 2), (5, 1);  -- Choisir son Barbier -> Conseils, Guide 