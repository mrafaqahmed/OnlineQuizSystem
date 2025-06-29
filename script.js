
// Global state
let currentUser = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizData = {
    users: [],
    categories: [],
    questions: [],
    results: []
};

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('quizAppData');
    if (saved) {
        quizData = JSON.parse(saved);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('quizAppData', JSON.stringify(quizData));
}

// Initialize app
function init() {
    loadData();
    showScreen('auth-screen');
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Authentication functions
function showLogin() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('login-form').classList.add('active');
}

function showSignup() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('signup-form').classList.add('active');
}

function signup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const role = document.querySelector('input[name="signup-role"]:checked').value;
    
    if (!name || !email || !password) {
        alert('Please fill all fields');
        return;
    }
    
    // Check if user already exists
    if (quizData.users.find(u => u.email === email)) {
        alert('User already exists');
        return;
    }
    
    const user = {
        id: Date.now(),
        name,
        email,
        password,
        role
    };
    
    quizData.users.push(user);
    saveData();
    alert('Registration successful! Please login.');
    showLogin();
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const role = document.querySelector('input[name="login-role"]:checked').value;
    
    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }
    
    const user = quizData.users.find(u => 
        u.email === email && u.password === password && u.role === role
    );
    
    if (!user) {
        alert('Invalid credentials');
        return;
    }
    
    currentUser = user;
    
    if (user.role === 'teacher') {
        showScreen('teacher-screen');
        loadTeacherDashboard();
    } else {
        showScreen('student-screen');
        loadStudentDashboard();
    }
}

function logout() {
    currentUser = null;
    currentQuiz = null;
    currentQuestionIndex = 0;
    userAnswers = [];
    showScreen('auth-screen');
}

// Teacher functions
function loadTeacherDashboard() {
    loadCategories();
    loadQuestions();
    loadResults();
    updateQuestionCategorySelect();
}

function showTeacherSection(section) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.teacher-section').forEach(sec => sec.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(section + '-section').classList.add('active');
}

function createCategory() {
    const name = document.getElementById('category-name').value;
    if (!name) {
        alert('Please enter category name');
        return;
    }
    
    const category = {
        id: Date.now(),
        name,
        createdBy: currentUser.id
    };
    
    quizData.categories.push(category);
    saveData();
    loadCategories();
    updateQuestionCategorySelect();
    document.getElementById('category-name').value = '';
}

function loadCategories() {
    const categoriesList = document.getElementById('categories-list');
    const userCategories = quizData.categories.filter(c => c.createdBy === currentUser.id);
    
    categoriesList.innerHTML = userCategories.map(category => {
        const questionCount = quizData.questions.filter(q => q.categoryId === category.id).length;
        return `
            <div class="category-item">
                <h3>${category.name}</h3>
                <p>${questionCount} questions</p>
                <button onclick="deleteCategory(${category.id})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Delete</button>
            </div>
        `;
    }).join('');
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure? This will also delete all questions in this category.')) {
        quizData.categories = quizData.categories.filter(c => c.id !== categoryId);
        quizData.questions = quizData.questions.filter(q => q.categoryId !== categoryId);
        saveData();
        loadCategories();
        loadQuestions();
        updateQuestionCategorySelect();
    }
}

function updateQuestionCategorySelect() {
    const select = document.getElementById('question-category');
    const userCategories = quizData.categories.filter(c => c.createdBy === currentUser.id);
    
    select.innerHTML = userCategories.map(category => 
        `<option value="${category.id}">${category.name}</option>`
    ).join('');
}

function addQuestion() {
    const categoryId = parseInt(document.getElementById('question-category').value);
    const questionText = document.getElementById('question-text').value;
    const options = [
        document.getElementById('option1').value,
        document.getElementById('option2').value,
        document.getElementById('option3').value,
        document.getElementById('option4').value
    ];
    const correctAnswer = parseInt(document.getElementById('correct-answer').value);
    
    if (!categoryId || !questionText || options.some(opt => !opt)) {
        alert('Please fill all fields');
        return;
    }
    
    const question = {
        id: Date.now(),
        categoryId,
        questionText,
        options,
        correctAnswer,
        createdBy: currentUser.id
    };
    
    quizData.questions.push(question);
    saveData();
    loadQuestions();
    
    // Clear form
    document.getElementById('question-text').value = '';
    document.getElementById('option1').value = '';
    document.getElementById('option2').value = '';
    document.getElementById('option3').value = '';
    document.getElementById('option4').value = '';
}

function loadQuestions() {
    const questionsList = document.getElementById('questions-list');
    const userQuestions = quizData.questions.filter(q => q.createdBy === currentUser.id);
    
    questionsList.innerHTML = userQuestions.map(question => {
        const category = quizData.categories.find(c => c.id === question.categoryId);
        return `
            <div class="question-item">
                <h4>${question.questionText}</h4>
                <p><strong>Category:</strong> ${category ? category.name : 'Unknown'}</p>
                <p><strong>Options:</strong> ${question.options.join(', ')}</p>
                <p><strong>Correct Answer:</strong> ${question.options[question.correctAnswer]}</p>
                <button onclick="deleteQuestion(${question.id})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Delete</button>
            </div>
        `;
    }).join('');
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        quizData.questions = quizData.questions.filter(q => q.id !== questionId);
        saveData();
        loadQuestions();
    }
}

function loadResults() {
    const resultsList = document.getElementById('results-list');
    const userCategories = quizData.categories.filter(c => c.createdBy === currentUser.id);
    const categoryIds = userCategories.map(c => c.id);
    const relevantResults = quizData.results.filter(r => categoryIds.includes(r.categoryId));
    
    resultsList.innerHTML = relevantResults.map(result => {
        const student = quizData.users.find(u => u.id === result.studentId);
        const category = quizData.categories.find(c => c.id === result.categoryId);
        const passed = result.score >= 50;
        
        return `
            <div class="result-item ${passed ? 'passed' : ''}">
                <h4>${student ? student.name : 'Unknown Student'}</h4>
                <p><strong>Quiz:</strong> ${category ? category.name : 'Unknown'}</p>
                <p><strong>Score:</strong> ${result.score}% (${result.correctAnswers}/${result.totalQuestions})</p>
                <p><strong>Date:</strong> ${new Date(result.date).toLocaleDateString()}</p>
            </div>
        `;
    }).join('');
}

// Student functions
function loadStudentDashboard() {
    loadStudentCategories();
}

function loadStudentCategories() {
    const categoriesList = document.getElementById('student-categories-list');
    const availableCategories = quizData.categories.filter(category => {
        return quizData.questions.some(q => q.categoryId === category.id);
    });
    
    categoriesList.innerHTML = availableCategories.map(category => {
        const questionCount = quizData.questions.filter(q => q.categoryId === category.id).length;
        return `
            <div class="student-category-item" onclick="startQuiz(${category.id})">
                <h3>${category.name}</h3>
                <p>${questionCount} questions</p>
                <p>📝 Take Quiz</p>
            </div>
        `;
    }).join('');
}

function startQuiz(categoryId) {
    const questions = quizData.questions.filter(q => q.categoryId === categoryId);
    if (questions.length === 0) {
        alert('No questions available for this category');
        return;
    }
    
    currentQuiz = {
        categoryId,
        questions: questions.sort(() => Math.random() - 0.5), // Shuffle questions
        category: quizData.categories.find(c => c.id === categoryId)
    };
    
    currentQuestionIndex = 0;
    userAnswers = [];
    
    document.getElementById('quiz-selection').classList.add('hidden');
    document.getElementById('quiz-taking').classList.remove('hidden');
    
    loadQuestion();
}

function loadQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    
    document.getElementById('quiz-title').textContent = currentQuiz.category.name;
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = currentQuiz.questions.length;
    document.getElementById('question-text').textContent = question.questionText;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = question.options.map((option, index) => `
        <div class="option" onclick="selectOption(${index})">
            ${option}
        </div>
    `).join('');
    
    const nextBtn = document.getElementById('next-btn');
    nextBtn.textContent = currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next';
    nextBtn.disabled = true;
}

function selectOption(optionIndex) {
    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    event.target.classList.add('selected');
    
    userAnswers[currentQuestionIndex] = optionIndex;
    document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
    if (userAnswers[currentQuestionIndex] === undefined) {
        alert('Please select an answer');
        return;
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= currentQuiz.questions.length) {
        finishQuiz();
    } else {
        loadQuestion();
    }
}

function finishQuiz() {
    let correctAnswers = 0;
    const totalQuestions = currentQuiz.questions.length;
    
    currentQuiz.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            correctAnswers++;
        }
    });
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Save result
    const result = {
        id: Date.now(),
        studentId: currentUser.id,
        categoryId: currentQuiz.categoryId,
        score,
        correctAnswers,
        totalQuestions,
        date: Date.now(),
        answers: userAnswers
    };
    
    quizData.results.push(result);
    saveData();
    
    showQuizResult(score, correctAnswers, totalQuestions);
}

function showQuizResult(score, correctAnswers, totalQuestions) {
    document.getElementById('quiz-taking').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
    
    const scoreDisplay = document.getElementById('score-display');
    const passed = score >= 50;
    
    scoreDisplay.innerHTML = `
        <div class="score ${passed ? 'passed' : 'failed'}">
            <h3>${passed ? '🎉 Congratulations!' : '😔 Better luck next time!'}</h3>
            <p>Your Score: ${score}%</p>
            <p>${correctAnswers} out of ${totalQuestions} correct</p>
        </div>
    `;
    
    showAnswersReview();
}

function showAnswersReview() {
    const reviewContainer = document.getElementById('answers-review');
    
    reviewContainer.innerHTML = '<h3>Review Your Answers:</h3>' + 
        currentQuiz.questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return `
                <div class="review-question ${isCorrect ? 'correct' : 'incorrect'}">
                    <h4>${question.questionText}</h4>
                    <p><strong>Your Answer:</strong> <span class="${isCorrect ? 'correct-answer' : 'incorrect-answer'}">${question.options[userAnswer]}</span></p>
                    ${!isCorrect ? `<p><strong>Correct Answer:</strong> <span class="correct-answer">${question.options[question.correctAnswer]}</span></p>` : ''}
                </div>
            `;
        }).join('');
}

function backToCategories() {
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('quiz-selection').classList.remove('hidden');
    currentQuiz = null;
    currentQuestionIndex = 0;
    userAnswers = [];
}

// Initialize app when page loads
window.onload = init;
