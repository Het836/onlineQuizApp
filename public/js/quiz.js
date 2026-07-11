// Quiz JavaScript for Online Quiz System
document.addEventListener('DOMContentLoaded', function() {
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

let currentQuizData = null;
let currentQuizId = null;

function showLoading() {
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = `
        <div class="loading">
            <div class="spinner" role="status">
                <span class="visually-hidden">Loading quiz...</span>
            </div>
            <p>Loading quiz...</p>
        </div>
    `;
}

function showError(message) {
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <a href="/dashboard" class="btn btn-outline">Back to Dashboard</a>
        </div>
    `;
}

function showQuiz(quizData) {
    currentQuizData = quizData;
    currentQuizId = quizData.id;

    const questionsContainer = document.getElementById('questions-container');

    // Create quiz header
    const quizHeader = document.createElement('div');
    quizHeader.className = 'quiz-header';
    quizHeader.innerHTML = `
        <h1>${quizData.title}</h1>
        <p class="quiz-description">${quizData.description || 'No description available'}</p>
        <div class="progress-container">
            <div id="progress-bar" class="progress-bar"></div>
        </div>
    `;

    // Create questions form with submit button inside
    const quizForm = document.createElement('form');
    quizForm.id = 'quiz-form';
    quizForm.innerHTML = `
        <div class="questions-list">
            ${quizData.questions.map((question, index) => `
                <div class="question-card">
                    <h2>Question ${index + 1}</h2>
                    <p class="question-text">${question.question_text}</p>
                    <div class="options-list">
                        ${question.options.map(option => `
                            <label class="option-label">
                                <input type="radio" name="question_${index}" value="${option.id}">
                                <span class="option-text">${option.option_text}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="submit-container">
            <button id="submit-btn" class="btn btn-primary w-full">Submit Quiz</button>
        </div>
    `;

    // Clear and append elements
    questionsContainer.innerHTML = '';
    questionsContainer.appendChild(quizHeader);
    questionsContainer.appendChild(quizForm);

    // Add event listeners
    quizForm.addEventListener('submit', handleSubmitQuiz);

    // Update progress initially
    updateProgressBar();
}

function updateProgressBar() {
    if (!currentQuizData || !currentQuizData.questions) return;

    const form = document.getElementById('quiz-form');
    if (!form) return;

    const answeredQuestions = [];
    currentQuizData.questions.forEach((question, index) => {
        const selectedOption = form.elements[`question_${index}`];
        if (selectedOption && selectedOption.value) {
            answeredQuestions.push(index);
        }
    });

    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const totalQuestions = currentQuizData.questions.length;
        const progressPercent = answeredQuestions.length === 0 ? 0 :
            ((answeredQuestions.length / totalQuestions) * 100);
        progressBar.style.width = `${progressPercent}%`;
    }
}

async function handleSubmitQuiz(e) {
    e.preventDefault();

    if (!currentQuizData || !currentQuizData.questions) {
        showError('Quiz data not available');
        return;
    }

    const form = document.getElementById('quiz-form');
    const answers = [];
    let hasUnanswered = false;

    currentQuizData.questions.forEach((question, index) => {
        const selectedOption = form.elements[`question_${index}`];
        if (selectedOption && selectedOption.value) {
            answers.push({
                question_id: question.id,
                selected_option_id: parseInt(selectedOption.value)
            });
        } else {
            hasUnanswered = true;
        }
    });

    if (hasUnanswered) {
        if (!confirm('You have unanswered questions. Submit anyway?')) {
            return;
        }
    }

    // Disable submit button
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    try {
        const response = await fetch(`/api/quizzes/${currentQuizId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
            showResult(result.data);
        } else {
            throw new Error('Invalid response from server');
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        showError('An error occurred while submitting the quiz. Please try again.');

        // Re-enable button
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Quiz';
        }
    }
}

function showResult(result) {
    const questionsContainer = document.getElementById('questions-container');

    const passed = result.percentage >= 60; // Assuming 60% is passing

    questionsContainer.innerHTML = `
        <div class="result-container">
            <div class="result-header">
                <h2>Quiz Completed</h2>
                <div class="score-badge ${passed ? 'passed' : 'failed'}">
                    <span class="badge-score">${result.score}</span>
                    <span class="badge-label">/${result.total_questions}</span>
                </div>
            </div>

            <div class="score-summary">
                <div class="percentage-container">
                    <span class="percentage-value">${result.percentage}%</span>
                    <span class="percentage-label">${passed ? 'Passed' : 'Failed'}</span>
                </div>
                <div class="score-details">
                    <div class="score-item">
                        <span class="label">Correct Answers:</span>
                        <span class="value correct-count">${result.correct_answers}</span>
                    </div>
                    <div class="score-item">
                        <span class="label">Wrong Answers:</span>
                        <span class="value wrong-count">${result.wrong_answers}</span>
                    </div>
                </div>
            </div>

            <div class="question-results-title">
                <h3>Question Review</h3>
                <p>Review your answers below. Correct answers are marked in green, incorrect in red.</p>
            </div>
            <ol class="question-results">
                ${result.results.map((questionResult, index) => {
                    const question = currentQuizData.questions[index];
                    const isCorrect = questionResult.correct;
                    const selectedOptionId = questionResult.selected_option;
                    const correctOptionId = questionResult.correct_option;

                    // Find the selected option text and correct option text
                    const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
                    const correctOption = question.options.find(opt => opt.id === correctOptionId);

                    return `
                        <li class="question-result ${isCorrect ? 'correct' : 'incorrect'}">
                            <div class="question-header">
                                <span class="question-number">Question ${index + 1}:</span>
                                <span class="question-text">${question.question_text}</span>
                            </div>
                            <div class="question-meta">
                                <span class="result-icon">${isCorrect ? '✓' : '✗'}</span>
                                <span class="result-text">${isCorrect ? 'Correct!' : 'Incorrect'}</span>
                            </div>
                            <div class="options-list">
                                ${question.options.map(option => {
                                    let className = '';
                                    let title = '';

                                    if (option.id === correctOptionId && option.id === selectedOptionId) {
                                        // Correctly selected
                                        className = 'correct-selected';
                                        title = 'Correct answer (your selection)';
                                    } else if (option.id === correctOptionId) {
                                        // Correct answer (not selected or selected but wrong)
                                        className = 'correct-answer';
                                        title = 'Correct answer';
                                    } else if (option.id === selectedOptionId) {
                                        // Incorrectly selected
                                        className = 'incorrect-selected';
                                        title = 'Your selection (incorrect)';
                                    }

                                    return `<label class="option-label ${className}" title="${title}">
                                                <input type="radio" name="question_result_${index}" value="${option.id}" disabled>
                                                <span class="option-text">${option.option_text}</span>
                                            </label>`;
                                }).join('')}
                            </div>
                            ${!selectedOptionId ? `<p class="correct-answer-text">Correct answer: ${correctOption.option_text}</p>` : ''}
                        </li>
                    `;
                }).join('')}
            </ol>

            <div class="result-actions">
                <button id="retake-quiz" class="btn btn-warning">Retake Quiz</button>
                <button id="back-to-dashboard" class="btn btn-secondary">Back to Dashboard</button>
            </div>
        </div>
    `;

    // Add event listeners for the new buttons
    document.getElementById('retake-quiz').addEventListener('click', () => {
        // Reset the quiz to initial state
        showQuiz(currentQuizData);
    });

    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        window.location.href = '/dashboard';
    });
}

async function fetchQuizData(quizId) {
    try {
        const response = await fetch(`/api/quizzes/${quizId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

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