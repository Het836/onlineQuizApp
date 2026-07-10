// Quiz JavaScript for Online Quiz System
document.addEventListener('DOMContentLoaded', function() {
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
        }
    };

    // Get quiz ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    if (!quizId) {
        showError('Quiz ID is missing');
        return;
    }

    // Show loading state
    showLoading();

    // Fetch quiz data
    fetchQuizData(quizId);
});

function showLoading() {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = `
        <div class="loading">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading quiz...</p>
        </div>
    `;
}

function showError(message) {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = `
        <div class="error">
            <h3>Error</h3>
            <p>${message}</p>
            <a href="/" class="btn-back">Back to Home</a>
        </div>
    `;
}

function showQuiz(quizData) {
    const quizContainer = document.getElementById('quiz-container');

    // Create quiz header
    const quizHeader = document.createElement('div');
    quizHeader.className = 'quiz-header';
    quizHeader.innerHTML = `
        <h1 class="quiz-title">${quizData.title}</h1>
        <p class="quiz-description">${quizData.description || 'No description available'}</p>
    `;

    // Create quiz body
    const quizBody = document.createElement('div');
    quizBody.className = 'quiz-body';

    // Add questions
    if (quizData.questions && quizData.questions.length > 0) {
        quizData.questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question';
            questionElement.innerHTML = `
                <div class="question-number">Question ${index + 1}:</div>
                <div class="question-text">${question.question_text}</div>
                <ul class="options">
                    ${question.options.map((option, optIndex) => `
                        <li class="option-item">
                            <label class="option-label">
                                <input type="radio" name="question_${index}" value="${option.id}">
                                <span class="option-text">${option.option_text}</span>
                            </label>
                        </li>
                    `).join('')}
                </ul>
            `;
            quizBody.appendChild(questionElement);
        });
    } else {
        quizBody.innerHTML = '<p>No questions available for this quiz.</p>';
    }

    // Append to container
    quizContainer.innerHTML = '';
    quizContainer.appendChild(quizHeader);
    quizContainer.appendChild(quizBody);
}

async function fetchQuizData(quizId) {
    try {
        const data = await api.get(`/api/quizzes/${quizId}`);

        if (data.status === 'success') {
            showQuiz(data.data);
        } else {
            showError('Failed to load quiz data');
        }
    } catch (error) {
        console.error('Error fetching quiz:', error);
        showError('An error occurred while loading the quiz. Please try again.');
    }
}