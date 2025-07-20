-- ShopTheBarber Seed Data

-- Insert test user (password: test123)
INSERT INTO users (email, password_hash, first_name, last_name, phone, city, address, role) VALUES
('client@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test', 'Client', '0612345678', 'Casablanca', '123 Rue Test', 'client');

-- Insert services only (no mock barbers - only real barber accounts will be created)
INSERT INTO services (name, category, duration_minutes, price_range, description) VALUES
('Coupe Homme', 'Coupe', 30, '50-150', 'Coupe classique pour homme'),
('Coupe Femme', 'Coupe', 45, '80-200', 'Coupe moderne pour femme'),
('Coloration', 'Couleur', 120, '150-400', 'Coloration complète'),
('Mèches', 'Couleur', 90, '120-300', 'Technique de mèches'),
('Lissage', 'Soin', 180, '200-500', 'Lissage permanent'),
('Permanente', 'Soin', 150, '150-350', 'Permanente classique'),
('Shampoing', 'Soin', 20, '30-80', 'Shampoing et soin'),
('Brushing', 'Coiffure', 45, '60-150', 'Brushing professionnel'),
('Barbe', 'Barbier', 30, '40-100', 'Taille et entretien de barbe'),
('Rasage', 'Barbier', 20, '30-80', 'Rasage traditionnel');

-- No mock data - only real barber accounts and real appointments will be created 