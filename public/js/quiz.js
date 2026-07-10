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
            <a href="/" class="btn btn-secondary">Back to Home</a>
        </div>
    `;
}

function showQuiz(quizData) {
    currentQuizData = quizData;
    currentQuizId = quizData.id;

    const quizContainer = document.getElementById('quiz-container');

    // Create quiz header
    const quizHeader = document.createElement('div');
    quizHeader.className = 'quiz-header';
    quizHeader.innerHTML = `
        <h1 class="quiz-title">${quizData.title}</h1>
        <p class="quiz-description">${quizData.description || 'No description available'}</p>
    `;

    // Create progress indicator
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = `
        <div class="progress-bar" id="progress-bar"></div>
    `;
    quizContainer.appendChild(progressContainer);

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

    // Create submit button container (sticky)
    const stickyContainer = document.createElement('div');
    stickyContainer.className = 'sticky-container';
    stickyContainer.innerHTML = `
        <button id="submit-quiz" class="btn btn-primary">Submit Quiz</button>
    `;

    // Append to container
    quizContainer.innerHTML = '';
    quizContainer.appendChild(quizHeader);
    quizContainer.appendChild(quizBody);
    quizContainer.appendChild(stickyContainer);

    // Add event listener to submit button
    const submitButton = document.getElementById('submit-quiz');
    submitButton.addEventListener('click', handleSubmitQuiz);

    // Add event listeners to radio buttons to update progress
    const radios = quizBody.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('change', updateAnswerCount);
    });

    // Update progress bar initially
    updateProgressBar(0);
}

function updateAnswerCount() {
    if (!currentQuizData || !currentQuizData.questions) return;

    const answeredQuestions = [];
    currentQuizData.questions.forEach((question, index) => {
        const selectedOption = document.querySelector(`input[name="question_${index}"]:checked`);
        if (selectedOption) {
            answeredQuestions.push(index);
        }
    });

    // Find the highest answered question index
    const highestAnswered = answeredQuestions.length > 0 ? Math.max(...answeredQuestions) : -1;
    updateProgressBar(highestAnswered);
}

function updateProgressBar(currentQuestionIndex) {
    if (!currentQuizData || !currentQuizData.questions) return;

    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;

    const totalQuestions = currentQuizData.questions.length;
    // If no questions answered, show 0%
    // If at least one question answered, show progress based on highest answered
    const progressPercent = currentQuestionIndex === -1 ? 0 : ((currentQuestionIndex + 1) / totalQuestions) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

async function handleSubmitQuiz() {
    if (!currentQuizData || !currentQuizData.questions) {
        showError('Quiz data not available');
        return;
    }

    // Collect answers
    const answers = [];
    let hasUnanswered = false;

    currentQuizData.questions.forEach((question, index) => {
        const selectedOption = document.querySelector(`input[name="question_${index}"]:checked`);
        if (selectedOption) {
            answers.push({
                question_id: question.id,
                selected_option_id: parseInt(selectedOption.value)
            });
        } else {
            hasUnanswered = true;
        }
    });

    // If there are unanswered questions, ask for confirmation
    if (hasUnanswered) {
        if (!confirm('You have unanswered questions. Submit anyway?')) {
            return;
        }
    }

    // Disable the submit button to prevent double submission
    const submitButton = document.getElementById('submit-quiz');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        // Send the answers to the backend
        const response = await api.post(`/api/quizzes/${currentQuizId}/submit`, { answers });

        if (response.status === 'success') {
            showResult(response.data);
        } else {
            showError('Failed to submit quiz: ' + response.message);
            // Re-enable the button on error
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Quiz';
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        showError('An error occurred while submitting the quiz. Please try again.');
        // Re-enable the button on error
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Quiz';
    }
}

function showResult(result) {
    const quizContainer = document.getElementById('quiz-container');

    // Disable all radio buttons
    const radios = quizContainer.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.disabled = true;
    });

    // Determine if passed (assuming 60% is passing)
    const passed = result.percentage >= 60;

    // Build the result display
    let resultHTML = `
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
    `;

    result.results.forEach((questionResult, index) => {
        const question = currentQuizData.questions[index];
        const isCorrect = questionResult.correct;
        const selectedOptionId = questionResult.selected_option;
        const correctOptionId = questionResult.correct_option;

        // Find the selected option text and correct option text
        const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
        const correctOption = question.options.find(opt => opt.id === correctOptionId);

        resultHTML += `
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
    });

    resultHTML += `
            </ol>
            <div class="result-actions">
                <button id="retake-quiz" class="btn btn-warning">Retake Quiz</button>
                <button id="back-to-home" class="btn btn-secondary">Back to Home</button>
            </div>
        </div>
    `;

    quizContainer.innerHTML = resultHTML;

    // Add event listeners for the new buttons
    document.getElementById('retake-quiz').addEventListener('click', () => {
        // Reset the quiz to initial state
        showQuiz(currentQuizData);
    });

    document.getElementById('back-to-home').addEventListener('click', () => {
        // Go back to the home page (quiz list)
        window.location.href = '/';
    });
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