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
                        'Content-Type': 'application/json',
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
                resultDiv.innerHTML = 'element' // Placeholder to prevent unused variable warning
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
            const quizTableBody = document.getElementById('quiz-table-body');

            if (quizSection && quizTableBody) {
                try {
                    // Show loading state
                    quizTableBody.innerHTML = '<tr><td colspan="5">Loading quizzes...</td></tr>';
                    quizSection.style.display = 'block';

                    // Fetch quizzes from API
                    const data = await api.get('/api/quizzes');

                    if (data.status === 'success' && Array.isArray(data.data)) {
                        const quizzes = data.data;

                        if (quizzes.length === 0) {
                            quizTableBody.innerHTML = '<tr><td colspan="5">No quizzes found</td></tr>';
                        } else {
                            // Clear and populate table
                            quizTableBody.innerHTML = '';
                            quizzes.forEach(quiz => {
                                const row = document.createElement('tr');

                                const statusBadge = quiz.is_active
                                    ? '<span class="status-badge status-active">Active</span>'
                                    : '<span class="status-badge status-inactive">Inactive</span>';

                                row.innerHTML = `
                                    <td>${quiz.title}</td>
                                    <td>${quiz.description || 'No description'}</td>
                                    <td>${quiz.duration_minutes}</td>
                                    <td>${statusBadge}</td>
                                    <td><button class="start-quiz-btn" data-quiz-id="${quiz.id}">Start Quiz</button></td>
                                `;

                                quizTableBody.appendChild(row);
                            });

                            // Add event listeners to start quiz buttons
                            const startQuizButtons = quizTableBody.querySelectorAll('.start-quiz-btn');
                            startQuizButtons.forEach(button => {
                                button.addEventListener('click', (e) => {
                                    const quizId = e.target.getAttribute('data-quiz-id');
                                    window.location.href = `quiz.html?id=${quizId}`;
                                });
                            });
                        }
                    } else {
                        quizTableBody.innerHTML = '<tr><td colspan="5">Error loading quiz data</td></tr>';
                    }
                } catch (error) {
                    console.error('Error fetching quizzes:', error);
                    quizTableBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
                }
            }
        });
    }
    
    // Initialize any tooltips or interactive elements
    console.log('Application initialized');
});
