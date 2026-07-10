// Main JavaScript for Online Quiz System
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');

    // Add active class to current nav link
    const currentLocation = location.href;
    const menuItems = document.querySelectorAll('nav a');
    menuItems.forEach(item => {
        if (item.href === currentLocation) {
            item.classList.add('active');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form validation
    const forms = document.querySelectorAll('form.validate');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Prevent submission if validation fails
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
    });

    // Simple form validation
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

        inputs.forEach(input => {
            // Remove previous error styles
            input.classList.remove('is-invalid');
            const errorDiv = input.parentElement.querySelector('.invalid-feedback');
            if (errorDiv) errorDiv.remove();

            // Check if empty
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('is-invalid');

                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.textContent = 'This field is required';
                input.parentElement.appendChild(errorDiv);
            }
        });

        return isValid;
    }

    // API helper functions
    window.api = {
        get: async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        },
        post: async (url, data) => {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        }
    };

    // Handle health check button if exists
    const healthCheckBtn = document.getElementById('health-check-btn');
    if (healthCheckBtn) {
        healthCheckBtn.addEventListener('click', async () => {
            const resultDiv = document.getElementById('health-check-result');
            if (resultDiv) {
                resultDiv.innerHTML = '<p>Checking API...</p>';
                try {
                    const data = await api.get('/api/health');
                    resultDiv.innerHTML = `
                        <h3>API Health Check</h3>
                        <p><strong>Status:</strong> ${data.status}</p>
                        <p><strong>Database:</strong> ${data.database}</p>
                        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                    `;
                } catch (error) {
                    resultDiv.innerHTML = `
                        <h3>API Health Check</h3>
                        <p><strong>Status:</strong> ERROR</p>
                        <p><strong>Message:</strong> ${error.message}</p>
                    `;
                }
            }
        });
    }

    // Handle view quizzes button if exists
    const viewQuizzesBtn = document.getElementById('view-quizzes-btn');
    if (viewQuizzesBtn) {
        viewQuizzesBtn.addEventListener('click', async () => {
            const quizSection = document.getElementById('quiz-section');
            const quizCardsContainer = document.getElementById('quiz-cards-container');

            if (quizSection && quizCardsContainer) {
                try {
                    // Show loading state
                    quizCardsContainer.innerHTML = '<p class="loading-message">Loading quizzes...</p>';
                    quizSection.style.display = 'block';

                    // Fetch quizzes from API
                    const data = await api.get('/api/quizzes');

                    if (data.status === 'success' && Array.isArray(data.data)) {
                        const quizzes = data.data;

                        if (quizzes.length === 0) {
                            quizCardsContainer.innerHTML = '<p class="no-quizzes-message">No quizzes available at the moment.</p>';
                        } else {
                            // Clear and populate cards
                            quizCardsContainer.innerHTML = '';
                            quizzes.forEach(quiz => {
                                const card = document.createElement('div');
                                card.className = 'quiz-card card';
                                card.innerHTML = `
                                    <div class="card-content">
                                        <h3>${quiz.title}</h3>
                                        <p class="quiz-description">${quiz.description || 'No description available'}</p>
                                        <div class="quiz-meta">
                                            <span class="meta-item"><strong>Duration:</strong> ${quiz.duration_minutes} minutes</span>
                                            <span class="meta-item status-badge ${quiz.is_active ? 'status-active' : 'status-inactive'}">
                                                ${quiz.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <button class="start-quiz-btn btn btn-primary" data-quiz-id="${quiz.id}">Start Quiz</button>
                                    </div>
                                `;
                                quizCardsContainer.appendChild(card);
                            });

                            // Add event listeners to start quiz buttons
                            const startQuizButtons = quizCardsContainer.querySelectorAll('.start-quiz-btn');
                            startQuizButtons.forEach(button => {
                                button.addEventListener('click', (e) => {
                                    const quizId = e.target.getAttribute('data-quiz-id');
                                    window.location.href = `quiz.html?id=${quizId}`;
                                });
                            });
                        }
                    } else {
                        quizCardsContainer.innerHTML = '<p class="error-message">Error loading quiz data</p>';
                    }
                } catch (error) {
                    console.error('Error fetching quizzes:', error);
                    quizCardsContainer.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
                }
            }
        });
    }

    // Initialize any tooltips or interactive elements
    console.log('Application initialized');
});