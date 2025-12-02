document.addEventListener('DOMContentLoaded', () => {
    // Definindo as variáveis globais para o sistema
    let subjects = {};
    let performance = {};
    let currentSubject = null;
    let currentQuestionIndex = 0;
    let userAnswers = {};

    // Obtendo referências dos elementos do DOM
    const questionTextEl = document.getElementById('question-text');
    const optionsContainerEl = document.getElementById('options-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const checkBtn = document.getElementById('check-btn');
    const feedbackContainerEl = document.getElementById('feedback-container');
    const resultTextEl = document.getElementById('result-text');
    const commentaryTextEl = document.getElementById('commentary-text');
    const mainView = document.getElementById('main-view');
    const dataInputView = document.getElementById('data-input-view');
    const dashboardView = document.getElementById('dashboard-view');
    const jsonInputEl = document.getElementById('json-input');
    const addQuestionsBtn = document.getElementById('add-questions-btn');
    const subjectSelectEl = document.getElementById('subject-select');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const newSubjectNameEl = document.getElementById('new-subject-name');
    const deleteSubjectBtn = document.getElementById('delete-subject-btn');
    const currentSubjectNameEl = document.getElementById('current-subject-name');
    const deleteQuestionBtn = document.getElementById('delete-question-btn');
    const performanceSummaryEl = document.getElementById('subject-performance');
    const backToQuestionsBtnDashboard = document.getElementById('back-to-questions-btn-dashboard');
    const backToQuestionsBtnData = document.getElementById('back-to-questions-btn-data');
    const goToDataBtn = document.getElementById('go-to-data-btn');
    const dashboardViewBtn = document.getElementById('dashboard-view-btn');

    // --- LISTA DE MATÉRIAS COMPLETA E ORIGINAL ---
    // Esta é a lista exata do seu primeiro arquivo, agora formatada para melhor leitura.
    const initialData = {};
    // --- FIM DA LISTA DE MATÉRIAS ---

    const loadSubjects = () => {
        const savedSubjects = localStorage.getItem('subjects');
        subjects = savedSubjects ? JSON.parse(savedSubjects) : initialData;
        populateSubjectSelect();
    };

    const saveSubjects = () => localStorage.setItem('subjects', JSON.stringify(subjects));
    const loadPerformance = () => {
        const savedPerformance = localStorage.getItem('performance');
        performance = savedPerformance ? JSON.parse(savedPerformance) : {};
    };
    const savePerformance = () => localStorage.setItem('performance', JSON.stringify(performance));

    const populateSubjectSelect = () => {
        subjectSelectEl.innerHTML = '<option value="">Selecione uma matéria</option>';
        Object.keys(subjects).sort().forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelectEl.appendChild(option);
        });
    };
    
    const addSubject = () => {
        const newSubjectName = newSubjectNameEl.value.trim();
        if (newSubjectName && !subjects[newSubjectName]) {
            subjects[newSubjectName] = [];
            performance[newSubjectName] = { correct: 0, incorrect: 0 };
            saveSubjects();
            savePerformance();
            populateSubjectSelect();
            newSubjectNameEl.value = '';
            alert(`Matéria '${newSubjectName}' adicionada!`);
        } else if (subjects[newSubjectName]) {
            alert(`A matéria '${newSubjectName}' já existe.`);
        }
    };
    
    const deleteSubject = () => {
        if (currentSubject && confirm(`Tem certeza que deseja excluir a matéria '${currentSubject}' e todas as suas questões?`)) {
            delete subjects[currentSubject];
            delete performance[currentSubject];
            saveSubjects();
            savePerformance();
            currentSubject = null;
            subjectSelectEl.value = "";
            populateSubjectSelect();
            toggleView(null);
            deleteSubjectBtn.disabled = true;
            alert('Matéria excluída com sucesso.');
        }
    };
    
    const selectSubject = () => {
        currentSubject = subjectSelectEl.value;
        if (currentSubject) {
            currentQuestionIndex = 0;
            userAnswers = {};
            toggleView('main');
            deleteSubjectBtn.disabled = false;
            showQuestion();
        } else {
            toggleView(null);
            deleteSubjectBtn.disabled = true;
        }
    };

    const showQuestion = () => {
        const questions = subjects[currentSubject] || [];
        if (questions.length === 0) {
            questionTextEl.innerHTML = 'Nenhuma questão nesta matéria.<br>Clique em <strong>+ Inserir Novas Questões</strong> para começar.';
            optionsContainerEl.innerHTML = '';
            feedbackContainerEl.classList.add('hidden');
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
            checkBtn.classList.add('hidden');
            deleteQuestionBtn.classList.add('hidden');
            return;
        }
        
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        checkBtn.classList.remove('hidden');
        deleteQuestionBtn.classList.remove('hidden');
        deleteQuestionBtn.disabled = false;
        
        const currentQuestion = questions[currentQuestionIndex];
        questionTextEl.innerHTML = `${currentQuestionIndex + 1}. ${currentQuestion.pergunta}`;
        optionsContainerEl.innerHTML = '';
        feedbackContainerEl.classList.add('hidden');
        checkBtn.disabled = false;
        
        Object.entries(currentQuestion.alternativas).forEach(([key, value]) => {
            const label = document.createElement('label');
            label.className = 'option-label';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question-${currentQuestion.id || currentQuestionIndex}`;
            input.value = key;
            input.className = 'option-input';
            const span = document.createElement('span');
            span.className = 'text-base';
            span.innerHTML = `<strong>${key.toUpperCase()})</strong> ${value}`;
            label.append(input, span);
            optionsContainerEl.appendChild(label);
        });

        const savedAnswer = userAnswers[currentQuestion.id || currentQuestionIndex];
        if (savedAnswer) {
            const selectedInput = document.querySelector(`input[value="${savedAnswer}"]`);
            if (selectedInput) {
                selectedInput.checked = true;
                checkAnswer(true); 
            }
        }
        updateNavigationButtons();
    };

    const checkAnswer = (isFromLoad = false) => {
        const questionId = subjects[currentSubject][currentQuestionIndex].id || currentQuestionIndex;
        const selectedOption = document.querySelector(`input[name="question-${questionId}"]:checked`);
        if (!selectedOption) return;
        
        checkBtn.disabled = true;
        const currentQuestion = subjects[currentSubject][currentQuestionIndex];
        const selectedValue = selectedOption.value;
        
        document.querySelectorAll(`input[name="question-${questionId}"]`).forEach(option => {
            const parentLabel = option.parentElement;
            parentLabel.classList.add('pointer-events-none');
            if (option.value === currentQuestion.gabarito) {
                parentLabel.classList.add('bg-green-200', 'border-green-500');
            } else if (option.value === selectedValue) {
                parentLabel.classList.add('bg-red-200', 'border-red-500');
            }
        });
        
        if (!isFromLoad && !userAnswers[questionId]) {
            userAnswers[questionId] = selectedValue;
            performance[currentSubject] = performance[currentSubject] || { correct: 0, incorrect: 0 };
            if (selectedValue === currentQuestion.gabarito) {
                performance[currentSubject].correct++;
            } else {
                performance[currentSubject].incorrect++;
            }
            savePerformance();
        }
        
        resultTextEl.textContent = userAnswers[questionId] === currentQuestion.gabarito ? 'Resposta Correta! 🎉' : 'Resposta Incorreta. 😞';
        resultTextEl.className = `text-xl font-bold text-center mb-4 ${userAnswers[questionId] === currentQuestion.gabarito ? 'text-green-600' : 'text-red-600'}`;
        commentaryTextEl.innerHTML = currentQuestion.comentario;
        feedbackContainerEl.classList.remove('hidden');
    };
    
    const updateNavigationButtons = () => {
        const questions = subjects[currentSubject] || [];
        prevBtn.disabled = currentQuestionIndex === 0;
        nextBtn.disabled = currentQuestionIndex >= questions.length - 1;
    };

    const addQuestionsToSubject = () => {
        if (!currentSubject) return;
        try {
            const newQuestions = JSON.parse(jsonInputEl.value);
            if (Array.isArray(newQuestions) && newQuestions.every(q => q.pergunta && q.alternativas && q.gabarito)) {
                newQuestions.forEach((q, i) => q.id = `q-${Date.now()}-${i}`);
                subjects[currentSubject].push(...newQuestions);
                saveSubjects();
                jsonInputEl.value = '';
                toggleView('main');
                currentQuestionIndex = subjects[currentSubject].length - newQuestions.length;
                showQuestion();
                alert(`${newQuestions.length} questões adicionadas com sucesso!`);
            } else {
                alert('Formato JSON inválido. Verifique se os objetos contêm as chaves "pergunta", "alternativas" e "gabarito".');
            }
        } catch (e) {
            alert('Erro ao processar JSON. Verifique o texto colado.');
            console.error(e);
        }
    };
    
    const deleteQuestion = () => {
        const questions = subjects[currentSubject];
        if (questions && questions.length > 0 && confirm('Tem certeza que deseja excluir esta questão?')) {
            questions.splice(currentQuestionIndex, 1);
            saveSubjects();
            if (currentQuestionIndex >= questions.length && questions.length > 0) {
                currentQuestionIndex = questions.length - 1;
            }
            showQuestion();
            alert('Questão excluída com sucesso!');
        }
    };
    
    const renderDashboard = () => {
        performanceSummaryEl.innerHTML = '';
        Object.keys(subjects).sort().forEach(subject => {
            const perf = performance[subject] || { correct: 0, incorrect: 0 };
            const total = perf.correct + perf.incorrect;
            const correctPercentage = total > 0 ? ((perf.correct / total) * 100).toFixed(1) : 0;
            const subjectCard = document.createElement('div');
            subjectCard.className = 'bg-white rounded-lg p-4 shadow-sm border border-gray-200';
            subjectCard.innerHTML = `<h3 class="font-bold text-lg text-gray-800 mb-2">${subject}</h3><p class="text-sm text-gray-600 mb-2">Respondidas: ${total}</p><div class="w-full bg-gray-200 rounded-full h-2.5 mb-2"><div class="bg-blue-600 h-2.5 rounded-full" style="width: ${correctPercentage}%"></div></div><div class="flex justify-between text-sm"><span class="font-medium text-green-600">Acertos: ${perf.correct}</span><span class="font-bold text-blue-700">${correctPercentage}%</span></div>`;
            performanceSummaryEl.appendChild(subjectCard);
        });
    };

    const toggleView = (view) => {
        mainView.classList.add('hidden');
        dataInputView.classList.add('hidden');
        dashboardView.classList.add('hidden');
        
        if (view === 'main' && currentSubject) {
            mainView.classList.remove('hidden');
        } else if (view === 'data' && currentSubject) {
            dataInputView.classList.remove('hidden');
            currentSubjectNameEl.textContent = currentSubject;
        } else if (view === 'dashboard') {
            renderDashboard();
            dashboardView.classList.remove('hidden');
        }
    };

    // Event Listeners
    addSubjectBtn.addEventListener('click', addSubject);
    deleteSubjectBtn.addEventListener('click', deleteSubject);
    subjectSelectEl.addEventListener('change', selectSubject);
    
    prevBtn.addEventListener('click', () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; showQuestion(); } });
    nextBtn.addEventListener('click', () => { if (currentQuestionIndex < subjects[currentSubject].length - 1) { currentQuestionIndex++; showQuestion(); } });
    checkBtn.addEventListener('click', () => checkAnswer(false));
    deleteQuestionBtn.addEventListener('click', deleteQuestion);
    
    addQuestionsBtn.addEventListener('click', addQuestionsToSubject);
    
    dashboardViewBtn.addEventListener('click', () => toggleView('dashboard'));
    goToDataBtn.addEventListener('click', () => {
        if (currentSubject) {
            toggleView('data');
        } else {
            alert('Por favor, selecione uma matéria antes de inserir questões.');
        }
    });
    backToQuestionsBtnDashboard.addEventListener('click', () => toggleView('main'));
    backToQuestionsBtnData.addEventListener('click', () => toggleView('main'));

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key.toLowerCase() === 'd') {
            dashboardView.classList.contains('hidden') ? toggleView('dashboard') : toggleView('main');
            return;
        }
        if (mainView.classList.contains('hidden') || !currentSubject) return;

        if (e.key === 'ArrowRight' && !nextBtn.disabled) nextBtn.click();
        if (e.key === 'ArrowLeft' && !prevBtn.disabled) prevBtn.click();
        if (e.key === 'Enter' && !checkBtn.disabled) checkBtn.click();
        if (e.key >= '1' && e.key <= '5') {
            const optionKey = String.fromCharCode(96 + parseInt(e.key));
            const input = document.querySelector(`input[value="${optionKey}"]`);
            if (input) input.checked = true;
        }
    });

    loadSubjects();
    loadPerformance();
});
