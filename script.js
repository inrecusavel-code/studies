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
    const backToQuestionsBtn = document.getElementById('back-to-questions-btn');
    
    // Simulação do banco de dados inicial
    const initialData = {
        "Direito Processual Penal": [
            {
                "id": 11,
                "pergunta": "No processo penal, a citação do réu tem por finalidade principal cientificá-lo da existência do processo e chamá-lo para a causa, sendo considerada a materialização dos princípios do contraditório e da ampla defesa. Qual o momento em que o processo completa sua formação, nos termos do CPP?",
                "alternativas": {
                    "a": "Quando o juiz recebe a denúncia ou queixa.",
                    "b": "Com a citação do acusado.",
                    "c": "Na apresentação da resposta à acusação.",
                    "d": "Com a juntada do mandado de citação aos autos.",
                    "e": "No momento do interrogatório do réu."
                },
                "gabarito": "b",
                "comentario": "A questão aborda o conceito de citação e o momento da formação da relação processual, conforme o artigo 363 do CPP. A citação é o ato fundamental que integra o réu ao processo, garantindo-lhe o exercício da ampla defesa e do contraditório. O processo somente se considera formado após a realização desse ato. (Páginas 3 e 4)"
            },
            {
                "id": 12,
                "pergunta": "Quando o réu estiver fora do território da jurisdição do juiz que a ordenou, a citação se dará por meio de carta precatória. Sobre essa modalidade de citação, assinale a alternativa correta.",
                "alternativas": {
                    "a": "A carta precatória não possui caráter itinerante, devendo ser devolvida ao juiz deprecante caso o réu não seja encontrado na localidade do juiz deprecado.",
                    "b": "Não é cabível a citação por hora certa no juízo deprecado, sendo a precatória imediatamente devolvida ao juiz deprecante para citação por edital, caso o réu se oculte para não ser citado.",
                    "c": "A citação por carta precatória não suspende o processo nem o prazo prescricional.",
                    "d": "A carta precatória para fins de citação suspende o curso do prazo prescricional e o processo até o seu cumprimento.",
                    "e": "É nula a citação por carta precatória se o réu estiver em uma comarca vizinha à do juiz processante."
                },
                "gabarito": "c",
                "comentario": "A citação por carta precatória não suspende o processo ou a prescrição, diferentemente da carta rogatória. Além disso, a precatória é itinerante, o que significa que se o réu não for encontrado na comarca do juiz deprecado, ela pode ser remetida para o juízo onde ele realmente se encontra, desde que haja tempo para o cumprimento. O tema é abordado em detalhes nas páginas 7, 8 e 9."
            }
        ]
    };

    // --- FUNÇÕES DE ARMAZENAMENTO E CARREGAMENTO ---
    const loadSubjects = () => {
        const savedSubjects = localStorage.getItem('subjects');
        if (savedSubjects) {
            subjects = JSON.parse(savedSubjects);
        } else {
            subjects = initialData;
        }
        populateSubjectSelect();
    };

    const saveSubjects = () => {
        localStorage.setItem('subjects', JSON.stringify(subjects));
    };

    const loadPerformance = () => {
        const savedPerformance = localStorage.getItem('performance');
        if (savedPerformance) {
            performance = JSON.parse(savedPerformance);
        }
    };
    
    const savePerformance = () => {
        localStorage.setItem('performance', JSON.stringify(performance));
    };

    // --- FUNÇÕES DE GERENCIAMENTO DE MATÉRIAS ---
    const populateSubjectSelect = () => {
        subjectSelectEl.innerHTML = '<option value="">Selecione uma matéria</option>';
        for (const subject in subjects) {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelectEl.appendChild(option);
        }
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
            populateSubjectSelect();
            mainView.classList.add('hidden');
            dashboardView.classList.add('hidden');
            deleteSubjectBtn.disabled = true;
            alert('Matéria excluída com sucesso.');
        }
    };
    
    const selectSubject = () => {
        currentSubject = subjectSelectEl.value;
        if (currentSubject) {
            currentQuestionIndex = 0;
            userAnswers = {};
            mainView.classList.remove('hidden');
            dataInputView.classList.add('hidden');
            dashboardView.classList.add('hidden');
            deleteSubjectBtn.disabled = false;
            showQuestion();
        } else {
            mainView.classList.add('hidden');
            dashboardView.classList.add('hidden');
            deleteSubjectBtn.disabled = true;
        }
    };

    // --- FUNÇÕES DE NAVEGAÇÃO E LÓGICA DAS QUESTÕES ---
    const showQuestion = () => {
        const questions = subjects[currentSubject] || [];
        if (questions.length === 0) {
            questionTextEl.textContent = 'Nenhuma questão nesta matéria. Adicione na área de dados.';
            optionsContainerEl.innerHTML = '';
            feedbackContainerEl.classList.add('hidden');
            updateNavigationButtons();
            deleteQuestionBtn.disabled = true;
            return;
        }
        
        deleteQuestionBtn.disabled = false;
        
        const currentQuestion = questions[currentQuestionIndex];
        questionTextEl.textContent = `${currentQuestionIndex + 1}. ${currentQuestion.pergunta}`;
        optionsContainerEl.innerHTML = '';
        feedbackContainerEl.classList.add('hidden');
        checkBtn.disabled = false;
        
        for (const [key, value] of Object.entries(currentQuestion.alternativas)) {
            const label = document.createElement('label');
            label.className = 'option-label flex items-center gap-3';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question-${currentQuestion.id}`;
            input.value = key;
            input.className = 'option-input h-4 w-4 text-blue-600 focus:ring-blue-500';
            
            const span = document.createElement('span');
            span.className = 'text-base';
            span.innerHTML = `<strong>${key.toUpperCase()})</strong> ${value}`;
            
            label.appendChild(input);
            label.appendChild(span);
            optionsContainerEl.appendChild(label);
        }

        const savedAnswer = userAnswers[currentQuestion.id];
        if (savedAnswer) {
            const selectedInput = document.querySelector(`input[name="question-${currentQuestion.id}"][value="${savedAnswer}"]`);
            if (selectedInput) {
                selectedInput.checked = true;
                checkAnswer(true); 
            }
        }

        updateNavigationButtons();
    };

    const checkAnswer = (isFromLoad = false) => {
        const selectedOption = document.querySelector(`input[name="question-${subjects[currentSubject][currentQuestionIndex].id}"]:checked`);
        if (!selectedOption) return;
        
        checkBtn.disabled = true;

        const currentQuestion = subjects[currentSubject][currentQuestionIndex];
        const selectedValue = selectedOption.value;
        
        const allOptions = document.querySelectorAll(`input[name="question-${currentQuestion.id}"]`);
        allOptions.forEach(option => {
            const parentLabel = option.parentElement;
            parentLabel.classList.add('pointer-events-none');
            
            if (option.value === currentQuestion.gabarito) {
                parentLabel.classList.add('bg-green-200', 'border-green-500');
            } else if (option.value === selectedValue) {
                parentLabel.classList.add('bg-red-200', 'border-red-500');
            }
        });
        
        if (!userAnswers[currentQuestion.id]) {
            userAnswers[currentQuestion.id] = selectedValue;

            // *** CORREÇÃO APLICADA AQUI ***
            // Garante que o objeto de performance para a matéria exista antes de atualizá-lo
            if (!performance[currentSubject]) {
                performance[currentSubject] = { correct: 0, incorrect: 0 };
            }

            if (selectedValue === currentQuestion.gabarito) {
                performance[currentSubject].correct++;
                resultTextEl.textContent = 'Resposta Correta! 🎉';
                resultTextEl.className = 'text-xl font-bold text-center mb-4 text-green-600';
            } else {
                performance[currentSubject].incorrect++;
                resultTextEl.textContent = 'Resposta Incorreta. 😞';
                resultTextEl.className = 'text-xl font-bold text-center mb-4 text-red-600';
            }
            savePerformance();
        } else {
            if (selectedValue === currentQuestion.gabarito) {
                resultTextEl.textContent = 'Resposta Correta! 🎉';
                resultTextEl.className = 'text-xl font-bold text-center mb-4 text-green-600';
            } else {
                resultTextEl.textContent = 'Resposta Incorreta. 😞';
                resultTextEl.className = 'text-xl font-bold text-center mb-4 text-red-600';
            }
        }
        
        commentaryTextEl.textContent = currentQuestion.comentario;
        feedbackContainerEl.classList.remove('hidden');
    };

    const goToPrevQuestion = () => {
        const questions = subjects[currentSubject] || [];
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion();
        }
    };

    const goToNextQuestion = () => {
        const questions = subjects[currentSubject] || [];
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        }
    };

    const updateNavigationButtons = () => {
        const questions = subjects[currentSubject] || [];
        prevBtn.disabled = currentQuestionIndex === 0;
        nextBtn.disabled = currentQuestionIndex === questions.length - 1;
    };
    
    const addQuestionsToSubject = () => {
        if (!currentSubject) {
            alert('Por favor, selecione uma matéria para adicionar questões.');
            return;
        }

        try {
            const newQuestions = JSON.parse(jsonInputEl.value);
            if (Array.isArray(newQuestions) && newQuestions.every(q => q.pergunta && q.alternativas && q.gabarito && q.comentario)) {
                subjects[currentSubject] = subjects[currentSubject].concat(newQuestions);
                saveSubjects();
                jsonInputEl.value = '';
                toggleView('main');
                currentQuestionIndex = subjects[currentSubject].length - newQuestions.length;
                showQuestion();
                alert('Questões adicionadas com sucesso!');
            } else {
                alert('Formato JSON inválido. Verifique se o array e os objetos estão corretos.');
            }
        } catch (e) {
            alert('Erro ao processar JSON. Certifique-se de que é um JSON válido.');
            console.error(e);
        }
    };

    const deleteQuestion = () => {
        const questions = subjects[currentSubject];
        if (questions && questions.length > 0 && confirm('Tem certeza que deseja excluir esta questão?')) {
            questions.splice(currentQuestionIndex, 1);
            saveSubjects();
            
            if (questions.length === 0) {
                currentQuestionIndex = 0;
                showQuestion();
            } else if (currentQuestionIndex >= questions.length) {
                currentQuestionIndex = questions.length - 1;
                showQuestion();
            } else {
                showQuestion();
            }
            alert('Questão excluída com sucesso!');
        }
    };
    
    const renderDashboard = () => {
        performanceSummaryEl.innerHTML = '';
        const allSubjects = Object.keys(subjects);
        if (allSubjects.length === 0) {
            performanceSummaryEl.innerHTML = '<p class="text-center text-gray-500">Nenhuma matéria para exibir. Adicione algumas matérias primeiro.</p>';
            return;
        }

        allSubjects.forEach(subject => {
            const perf = performance[subject] || { correct: 0, incorrect: 0 };
            const total = perf.correct + perf.incorrect;
            
            const correctPercentage = (total > 0) ? ((perf.correct / total) * 100).toFixed(1) : 0;
            const incorrectPercentage = (total > 0) ? ((perf.incorrect / total) * 100).toFixed(1) : 0;

            const subjectCard = document.createElement('div');
            subjectCard.className = 'bg-white rounded-lg p-4 shadow-sm border border-gray-200';
            subjectCard.innerHTML = `
                <h3 class="font-bold text-lg text-gray-800 mb-2">${subject}</h3>
                <p class="text-sm text-gray-600 mb-2">Total de questões respondidas: ${total}</p>
                <div class="flex items-center text-sm mb-1">
                    <span class="font-medium text-green-600">Acertos:</span>
                    <span class="ml-2">${perf.correct} (${correctPercentage}%)</span>
                </div>
                <div class="flex items-center text-sm">
                    <span class="font-medium text-red-600">Erros:</span>
                    <span class="ml-2">${perf.incorrect} (${incorrectPercentage}%)</span>
                </div>
            `;
            performanceSummaryEl.appendChild(subjectCard);
        });
    };

    const toggleView = (view) => {
        mainView.classList.add('hidden');
        dataInputView.classList.add('hidden');
        dashboardView.classList.add('hidden');
        
        if (view === 'main') {
            mainView.classList.remove('hidden');
        } else if (view === 'data') {
            dataInputView.classList.remove('hidden');
            if (currentSubject) {
                currentSubjectNameEl.textContent = currentSubject;
            }
        } else if (view === 'dashboard') {
            renderDashboard();
            dashboardView.classList.remove('hidden');
        }
    };

    // Event Listeners
    prevBtn.addEventListener('click', goToPrevQuestion);
    nextBtn.addEventListener('click', goToNextQuestion);
    checkBtn.addEventListener('click', () => checkAnswer(false));
    addSubjectBtn.addEventListener('click', addSubject);
    deleteSubjectBtn.addEventListener('click', deleteSubject);
    subjectSelectEl.addEventListener('change', selectSubject);
    addQuestionsBtn.addEventListener('click', addQuestionsToSubject);
    deleteQuestionBtn.addEventListener('click', deleteQuestion);
    backToQuestionsBtn.addEventListener('click', () => toggleView('main'));

    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'i') {
            if (dataInputView.classList.contains('hidden')) {
                toggleView('data');
            } else {
                toggleView('main');
            }
            return;
        }
        
        if (e.key.toLowerCase() === 'd') {
            toggleView('dashboard');
            return;
        }

        const isMainViewVisible = !mainView.classList.contains('hidden');
        if (!isMainViewVisible || !currentSubject) return;

        const questions = subjects[currentSubject] || [];
        if (questions.length === 0) return;

        if (e.key === 'ArrowRight') {
            goToNextQuestion();
        } else if (e.key === 'ArrowLeft') {
            goToPrevQuestion();
        } else if (e.key >= '1' && e.key <= '5') {
            const optionKey = String.fromCharCode(96 + parseInt(e.key)).toLowerCase();
            const input = document.querySelector(`input[name="question-${questions[currentQuestionIndex].id}"][value="${optionKey}"]`);
            if (input) {
                input.checked = true;
            }
        } else if (e.key === 'Enter') {
            checkAnswer(false);
        }
    });

    // Inicia a aplicação
    loadSubjects();
    loadPerformance();
});