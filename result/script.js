document.addEventListener('DOMContentLoaded', () => {
    // --- HELPER FUNCTIONS ---

    function getElement(selector) {
        const element = document.querySelector(selector);
        if (!element) console.warn(`Element not found: ${selector}`);
        return element;
    }

    // Reusable function to make any element draggable vertically
    function makeElementDraggable(element) {
        if (!element) return;
        let isDragging = false;
        let initialY, yOffset = 0;

        function dragStart(e) {
            // Prevent text selection while dragging
            e.preventDefault();
            isDragging = true;
            initialY = (e.type === 'touchstart' ? e.touches[0].clientY : e.clientY) - yOffset;
        }

        function drag(e) {
            if (!isDragging) return;
            const currentY = (e.type === 'touchmove' ? e.touches[0].clientY : e.clientY) - initialY;
            yOffset = currentY;
            element.style.transform = `translateY(${yOffset}px)`;
        }

        function dragEnd() {
            isDragging = false;
        }

        // Attach mouse events
        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Attach touch events
        element.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);
    }

    // --- DOM ELEMENT SELECTION ---

    const fetchButton = getElement('#fetchButton');
    const printButton = getElement('#printButton');
    const creditButton = getElement('#creditButton');
    const resultsContainer = getElement('#results');
    const semesterSelect = getElement('#semester');
    const batchSelect = getElement('#batch');
    const messageDiv = getElement('#message');
    const regNoInput = getElement('#regNo');
    const regNoHelp = getElement('#regNoHelp');

    // --- DATA MAPPING ---

    const semesterToBatchMapping = {
        '1st': ['2023', '2022'], '2nd': ['2024', '2023'], '3rd': ['2023'],
        '4th': ['2024', '2023', '2022'], '5th': ['2023', '2022'], '6th': ['2024', '2023'],
        '7th': ['2024', '2023', '2022'], '8th': ['2025', '2024', '2023']
    };

    // --- EVENT LISTENERS ---

    semesterSelect.addEventListener('change', () => {
        const selectedSemester = semesterSelect.value;
        const availableBatches = semesterToBatchMapping[selectedSemester];
        batchSelect.innerHTML = '<option value="" disabled selected>Select Examination Year</option>';
        messageDiv.textContent = '';
        if (availableBatches) {
            availableBatches.forEach(batch => {
                const option = document.createElement('option');
                option.value = batch;
                option.textContent = `${batch} Examination Year`;
                batchSelect.appendChild(option);
            });
            batchSelect.disabled = false;
            messageDiv.innerHTML = `<div class="message-info">Please select examination year</div>`;
            batchSelect.focus();
        } else {
            batchSelect.disabled = true;
        }
    });

    batchSelect.addEventListener('change', () => {
        messageDiv.textContent = '';
        if (!regNoInput.value) {
            messageDiv.innerHTML = `<div class="message-info">Please enter a valid 11-digit registration number</div>`;
            regNoInput.focus();
        } else if (regNoInput.value.length === 11) {
            fetchButton.click();
        }
    });

    regNoInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        e.target.value = value;
        messageDiv.textContent = '';

        if (value.length > 0 && !semesterSelect.value) {
            messageDiv.innerHTML = `<div class="message-info">Please select your semester first</div>`;
            semesterSelect.focus();
            return;
        }
        if (value.length > 0 && semesterSelect.value && !batchSelect.value) {
            messageDiv.innerHTML = `<div class="message-info">Please select examination year</div>`;
            batchSelect.focus();
            return;
        }
        if (value.length === 11) {
            fetchButton.click();
        }
    });
    
    fetchButton.addEventListener('click', () => {
        const semester = semesterSelect.value.trim().toLowerCase();
        const batch = batchSelect.value.trim();
        const regNo = regNoInput.value.trim();

        messageDiv.textContent = '';
        resultsContainer.innerHTML = '';

        if (!semester || !batch || regNo.length !== 11 || isNaN(regNo)) {
            messageDiv.innerHTML = `<div class="message-error">Please select valid options and enter a valid registration number.</div>`;
            return;
        }

        const loadingIndicator = getElement('#loadingIndicator');
        loadingIndicator.style.display = 'flex';

        const url = `https://api.beunotes.workers.dev/result?sem=${semester}&year=${batch}&reg_no=${regNo}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('No Result Found');
                return response.json();
            })
            .then(data => {
                if (!data || data.length === 0) {
                    throw new Error('No Result Found');
                }
                displayResult(data);
            })
            .catch(error => {
                messageDiv.innerHTML = `
                    <div class="message-error">
                        <strong>No Result Found</strong>
                        <p>Please verify the following:</p>
                        <ul>
                            <li>Registration number is correct (11 digits only).</li>
                            <li>Semester and Examination Year are correct.</li>
                            <li>Results for this selection have been published.</li>
                        </ul>
                    </div>
                `;
                console.error('Error:', error);
            })
            .finally(() => {
                loadingIndicator.style.display = 'none';
            });
    });
    
    printButton.addEventListener('click', () => {
        // The isDragging check comes from the draggable function logic
        if (typeof isDragging !== 'undefined' && isDragging) return;
        handlePrint();
    });

    regNoHelp.addEventListener('click', () => {
        alert(`Registration Number Format:\n=========================\nYY-BBB-CCC-NNN (11 digits)\n\nYY = Year (e.g., 23)\nBBB = Branch Code (e.g., 101 for Civil)\nCCC = College Code (e.g., 134 for GEC Banka)\nNNN = Roll No (e.g., 001)\n\nExample: 23101134001`);
    });


    // --- RESULT DISPLAY FUNCTIONS ---

    function displayResult(data) {
        const allResultsHTML = data.map(entry => {
            if (entry.separator) return ''; // Skip separators if any
            
            const failedSubjects = getFailedSubjects(entry);
            return `
                <div class="result-page">
                    <div class="university-header">
                        <h1>BIHAR ENGINEERING UNIVERSITY, PATNA</h1>
                        <div class="semester-header">${entry.exam_name}</div>
                    </div>
                    <table class="student-info">
                        <tr><th>Registration No:</th><td>${entry.registration_no}</td><th>Semester:</th><td>${entry.semester}</td></tr>
                        <tr><th>Student Name:</th><td colspan="3">${entry.student_name}</td></tr>
                        <tr><th>College Name:</th><td colspan="3">${entry.college_name}</td></tr>
                        <tr><th>Course Name:</th><td colspan="3">${entry.course_name}</td></tr>
                    </table>
                    <div class="marks-section">
                        ${formatMarksTable(entry.theory_subjects, 'Theory')}
                        ${formatMarksTable(entry.practical_subjects, 'Practical')}
                    </div>
                    <div class="summary-section">
                        <table class="sgpa-table"><tr><td>SGPA</td><td>${entry.sgpa || '0.00'}</td></tr></table>
                    </div>
                    <table class="semester-grade-table">
                        <tr><th>Semester</th><th>I</th><th>II</th><th>III</th><th>IV</th><th>V</th><th>VI</th><th>VII</th><th>VIII</th><th>CGPA</th></tr>
                        <tr>
                            <td>Grade</td>
                            <td>${entry.semester_grades.find(g => g.semester === 'I')?.sgpa || 'NA'}</td>
                            <td>${entry.semester_grades.find(g => g.semester === 'II')?.sgpa || 'NA'}</td>
                            <td>${entry.semester_grades.find(g => g.semester === 'III')?.sgpa || 'NA'}</td>
                            <td>${entry.semester_grades.find(g => g.semester === 'IV')?.sgpa || 'NA'}</td>
                            <td>${entry.semester_grades.find(g => g.semester === 'V')?.sgpa || 'NA'}</td>
                            <td>${entry.semester_grades.find(g => g.semester === 'VI')?.sgpa || 'NA'}</td>
                            <td>${entry.semester_grades.find(g => g.semester === 'VII')?.sgpa || 'NA'}</td>
                            <td>${entry.semester_grades.find(g => g.semester === 'VIII')?.sgpa || 'NA'}</td>
                            <td>${entry.semester_grades.find(g => g.semester === 'Cur. CGPA')?.sgpa || 'NA'}</td>
                        </tr>
                    </table>
                    <div class="remarks-table">${formatFailedSubjects(failedSubjects)}</div>
                    <div class="publish-date-table">
                        <strong>Publish Date:</strong> ${entry.publish_date || 'N/A'}
                    </div>
                    <div class="watermark"><a href="https://beu.pages.dev" target="_blank">Download Result From: BEU.pages.dev</a></div>
                </div>`;
        }).join('');

        resultsContainer.innerHTML = allResultsHTML;
    }

    function getFailedSubjects(entry) {
        const failed = [];
        (entry.theory_subjects || []).forEach(s => s.grade === 'F' && failed.push({ name: s.subject_name, type: 'Theory' }));
        (entry.practical_subjects || []).forEach(s => s.grade === 'F' && failed.push({ name: s.subject_name, type: 'Practical' }));
        return failed;
    }

    function formatMarksTable(subjects, type) {
        if (!subjects || subjects.length === 0) return '';
        return `
            <h3>${type} Subjects</h3>
            <table class="marks-table">
                <thead><tr><th>Code</th><th>Subject Name</th><th>ESE</th><th>IA</th><th>Total</th><th>Grade</th><th>Credit</th></tr></thead>
                <tbody>
                    ${subjects.map(s => `
                        <tr>
                            <td>${s.subject_code}</td><td class="subject-name">${s.subject_name}</td><td>${s.ese || '-'}</td>
                            <td>${s.ia || '-'}</td><td>${s.total || '0'}</td><td class="${s.grade === 'F' ? 'failed-grade' : ''}">${s.grade}</td><td>${s.credit}</td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }

    function formatFailedSubjects(failedSubjects) {
        if (failedSubjects.length === 0) return '<div class="pass-status">PASS</div>';
        return `
            <div class="fail-remarks">Remarks: You have failed in the following subject(s)</div>
            <div class="failed-subjects-list">
                ${failedSubjects.map(s => `<span>${s.name} (${s.type})</span>`).join('')}
            </div>`;
    }

    // --- PRINT FUNCTION ---

    function handlePrint() {
        if (!resultsContainer.innerHTML.trim()) {
            messageDiv.innerHTML = `<div class="message-info">Please fetch a result before printing.</div>`;
            return;
        }
        window.print();
    }

    // --- INITIALIZATION ---

    makeElementDraggable(printButton);
    makeElementDraggable(creditButton);
});
