-- Seed data for Online Quiz System

-- Insert sample users
INSERT INTO users (full_name, email, password, role) VALUES
('Admin User', 'admin@example.com', '$2b$10$8KIX1p.vypmCycgCYSrqeuGkpJNf1W.Y7MFYoD6UWuWvK7v7xGK ei', 'admin'),
('John Student', 'john@example.com', '$2b$10$8KIX1p.vypmCycgCYSrqeuGkpJNf1W.Y7MFYoD6UWuWvK7v7xGK ei', 'student'),
('Jane Student', 'jane@example.com', '$2b$10$8KIX1p.vypmCycgCYSrqeuGkpJNf1W.Y7MFYoD6UWuWvK7v7xGK ei', 'student');

-- Insert sample quizzes
INSERT INTO quizzes (title, description, duration_minutes, is_active) VALUES
('JavaScript Fundamentals', 'Test your knowledge of JavaScript basics', 30, TRUE),
('HTML & CSS Basics', 'Learn the fundamentals of web development', 25, TRUE);

-- Insert questions for JavaScript Fundamentals quiz (quiz_id = 1)
INSERT INTO questions (quiz_id, question_text, marks) VALUES
(1, 'What is the correct way to declare a JavaScript variable?', 2),
(1, 'Which company developed JavaScript?', 2),
(1, 'What does JSON stand for?', 2),
(1, 'Which method is used to parse a JSON string in JavaScript?', 2),
(1, 'What is the result of 5 + "5" in JavaScript?', 2);

-- Insert options for JavaScript Fundamentals quiz
INSERT INTO options (question_id, option_text, is_correct) VALUES
(1, 'var myVar;', TRUE),
(1, 'variable myVar;', FALSE),
(1, 'v myVar;', FALSE),
(1, 'declare myVar;', FALSE),

(2, 'Microsoft', FALSE),
(2, 'Netscape', TRUE),
(2, 'IBM', FALSE),
(2, 'Google', FALSE),

(3, 'JavaScript Object Notation', TRUE),
(3, 'JavaScript Object Notation', FALSE), -- Duplicate for variety but marked incorrect
(3, 'Joint Operational Notification', FALSE),
(3, 'Java Ordered Notification', FALSE),

(4, 'JSON.parse()', TRUE),
(4, 'JSON.stringify()', FALSE),
(4, 'JSON.parseString()', FALSE),
(4, 'JSON.convert()', FALSE),

(5, '55 (string concatenation)', TRUE),
(5, '10 (numeric addition)', FALSE),
(5, 'Error', FALSE),
(5, 'null', FALSE);

-- Insert questions for HTML & CSS Basics quiz (quiz_id = 2)
INSERT INTO questions (quiz_id, question_text, marks) VALUES
(2, 'What does HTML stand for?', 2),
(2, 'Which CSS property controls text size?', 2),
(2, 'What is the correct HTML for creating a hyperlink?', 2),
(2, 'Which CSS property is used to change the background color?', 2),
(2, 'What is the correct way to comment in HTML?', 2);

-- Insert options for HTML & CSS Basics quiz
INSERT INTO options (question_id, option_text, is_correct) VALUES
(6, 'Hyper Text Markup Language', TRUE),
(6, 'Home Tool Markup Language', FALSE),
(6, 'Hyperlinks and Text Markup Language', FALSE),
(6, 'Hyperlinking Text Markup Language', FALSE),

(7, 'font-size', TRUE),
(7, 'text-size', FALSE),
(7, 'font-style', FALSE),
(7, 'font-weight', FALSE),

(8, '<a href="url">Link text</a>', TRUE),
(8, '<link>Link text</link>', FALSE),
(8, '<a>Link text</a>', FALSE),
(8, '<hyperlink>Link text</hyperlink>', FALSE),

(9, 'background-color', TRUE),
(9, 'color', FALSE),
(9, 'background-image', FALSE),
(9, 'bgcolor', FALSE),

(10, '<!-- This is a comment -->', TRUE),
(10, '<!-- This is a comment -->', FALSE), -- Duplicate but marked incorrect
(10, '// This is a comment', FALSE),
(10, '/* This is a comment */', FALSE);