document.addEventListener('DOMContentLoaded', () => {
    // Helper function to get elements safely
    function getElement(selector, context = document) {
        const element = context.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
        }
        return element;
    }

    // --- DOM Element Selection ---
    const fetchButton = getElement('#fetchButton');
    const printButton = getElement('#printButton');
    const creditButton = getElement('#creditButton');
    const resultsContainer = getElement('#results');
    const semesterSelect = getElement('#semester');
    const batchSelect = getElement('#batch');
    const messageDiv = getElement('#message');
    const regNoInput = getElement('#regNo');
    const regNoHelp = getElement('#regNoHelp');

    // --- Semester to Batch Mapping ---
    const semesterToBatchMapping = {
        '1st': ['2023', '2223'], // Example: '2223' for 2022-23 session
        '2nd': ['2024', '2324'],
        '3rd': ['2023', '2223'],
        '4th': ['2024', '2324', '2223'],
        '5th': ['2023', '2223'],
        '6th': ['2024', '2324'],
        '7th': ['2024', '2324', '2223'],
        '8th': ['2025', '2425', '2324']
    };

    // --- Draggable Button Logic (For Print & Credit Buttons) ---
    let isDragging = false;
    let currentY;
    let initialY;
    let yOffset = 0;
    let draggedElement = null;

    function dragStart(e) {
        draggedElement = this;
        yOffset = 0; // Reset offset for new drag
        if (e.type === 'touchstart') {
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialY = e.clientY - yOffset;
        }
        isDragging = true;
    }

    function dragEnd() {
        if (isDragging) {
            // Settle the position after drag ends
            initialY = currentY;
            isDragging = false;
            setTimeout(() => { draggedElement = null; }, 10); // Clear after a small delay
        }
    }

    function drag(e) {
        if (isDragging && draggedElement) {
            e.preventDefault();
            if (e.type === 'touchmove') {
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentY = e.clientY - initialY;
            }
            const maxDistance = 230;
            if (currentY > maxDistance) currentY = maxDistance;
            if (currentY < -maxDistance) currentY = -maxDistance;
            yOffset = currentY;
            draggedElement.style.transform = `translateY(${currentY}px)`;
        }
    }

    // Apply draggable functionality to buttons
    [printButton, creditButton].forEach(btn => {
        if (btn) {
            btn.addEventListener('touchstart', dragStart, { passive: false });
            btn.addEventListener('mousedown', dragStart, false);
        }
    });
    document.addEventListener('touchend', dragEnd, false);
    document.addEventListener('mouseup', dragEnd, false);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mousemove', drag, false);


    // --- Input Handling ---
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
            messageDiv.innerHTML = `<div style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border: 1px solid #ffeeba;">Please select examination year</div>`;
            batchSelect.focus();
        } else {
            batchSelect.disabled = true;
        }
    });

    batchSelect.addEventListener('change', () => {
        messageDiv.textContent = '';
        if (!regNoInput.value) {
            messageDiv.innerHTML = `<div style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border: 1px solid #ffeeba;">Please enter a valid 11-digit registration number</div>`;
            regNoInput.focus();
        } else if (regNoInput.value.length === 11) {
            fetchButton.click();
        }
    });
    
    regNoInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
        messageDiv.textContent = '';
        if (e.target.value.length > 0 && !semesterSelect.value) {
            messageDiv.innerHTML = `<div style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border: 1px solid #ffeeba;">Please select your semester first</div>`;
            semesterSelect.focus();
        } else if (e.target.value.length === 11) {
            fetchButton.click();
        }
    });
    
    // --- Result Fetching & Display ---
    fetchButton.addEventListener('click', () => {
        const semester = semesterSelect.value.trim().toLowerCase();
        const batch = batchSelect.value.trim();
        const regNo = regNoInput.value.trim();

        messageDiv.textContent = '';
        resultsContainer.innerHTML = '';

        if (!semester || !batch || regNo.length !== 11 || isNaN(regNo)) {
            messageDiv.textContent = 'Please select valid options and enter a valid registration number.';
            return;
        }

        let progress = 0;
        const duration = Math.floor(Math.random() * (7800 - 4200)) + 4200;
        const interval = 250;
        const increments = 100 / (duration / interval);

        const loadingInterval = setInterval(() => {
            progress += increments;
            if (progress > 100) progress = 100;
            messageDiv.innerHTML = `<div style="color: #004085; background: #cce5ff; padding: 10px; border-radius: 4px; border: 1px solid #b8daff; text-align: center;">Processing Result... ${Math.floor(progress)}%</div>`;
        }, interval);

        const url = `https://api.beunotes.workers.dev/result?sem=${semester}&year=${batch}&reg_no=${regNo}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('No Result Found');
                return response.json();
            })
            .then(data => {
                clearInterval(loadingInterval);
                messageDiv.textContent = '';
                if (!data || data.length === 0) {
                    showErrorMessage();
                    return;
                }
                displayResult(data);
            })
            .catch(error => {
                clearInterval(loadingInterval);
                showErrorMessage();
                console.error('Error:', error);
            });
    });

    function displayResult(data) {
        resultsContainer.innerHTML = '';
        data.forEach(entry => {
            if (entry.separator) return;

            const failedSubjects = getFailedSubjects(entry);
            const resultHTML = `
                <div class="result-page">
                    <div class="university-header">
                        <h1>BIHAR ENGINEERING UNIVERSITY, PATNA</h1>
                        <div class="semester-header">${entry.exam_name}</div>
                    </div>
                    <table class="student-info">
                        <tr><th>Registration No:</th><td>${entry.registration_no}</td><th>Semester:</th><td>${entry.semester}</td></tr>
                        <tr><th>Student Name:</th><td colspan="3" class="student-name-cell">${entry.student_name}</td></tr>
                        <tr><th>College Name:</th><td colspan="3">${entry.college_name}</td></tr>
                        <tr><th>Course Name:</th><td colspan="3">${entry.course_name}</td></tr>
                    </table>
                    <div class="marks-section">
                        ${formatMarksTable(entry.theory_subjects, 'Theory')}
                        ${formatMarksTable(entry.practical_subjects, 'Practical')}
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin: 15px 0;">
                        <table class="sgpa-table"><tr><td class="sgpa-label">SGPA</td><td class="sgpa-value">${entry.sgpa || '0.00'}</td></tr></table>
                    </div>
                    <table class="semester-grade-table">
                        <tr><th>Semester</th><th>I</th><th>II</th><th>III</th><th>IV</th><th>V</th><th>VI</th><th>VII</th><th>VIII</th><th>CGPA</th></tr>
                        <tr>
                            <td>Grade</td>
                            ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'Cur. CGPA'].map(sem => `<td>${entry.semester_grades.find(g => g.semester === sem)?.sgpa || 'NA'}</td>`).join('')}
                        </tr>
                    </table>
                    <table class="remarks-table"><tr><td>${formatFailedSubjects(failedSubjects, entry)}</td></tr></table>
                    <table class="publish-date-table"><tr><th>Publish Date:</th><td>${entry.publish_date || 'N/A'}</td></tr></table>
                    
                    <div class="watermark">
                        <a href="https://beumate.app" target="_blank" class="watermark-print-trigger">
                            Click Here To Print Result: beumate.app
                        </a>
                    </div>
                </div>`;
            resultsContainer.innerHTML += resultHTML;
        });
        
        attachWatermarkPrintTriggers();
    }
    
    // --- Helper functions for Display ---
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

    function formatFailedSubjects(failed, entry) {
        if (failed.length === 0) {
            return '<div class="pass-status">PASS</div>';
        }

        let remarkText = 'Remarks: FAIL ( Back Paper )'; 

        const cgpaData = entry.semester_grades.find(g => g.semester === 'Cur. CGPA');
        const cgpa = cgpaData ? parseFloat(cgpaData.sgpa) : 0;

        if (cgpa < 5 && entry.semester !== 'I') {
            remarkText = 'Remarks: FAIL ( Year Back )';
        }

        let rowsHtml = '';
        const subjectsPerRow = 3;
        for (let i = 0; i < failed.length; i += subjectsPerRow) {
            const rowSubjects = failed.slice(i, i + subjectsPerRow);
            rowsHtml += `<div class="failed-subject-row">
                ${rowSubjects.map(s => `<div class="failed-subject">${s.name} (${s.type})</div>`).join('')}
            </div>`;
        }
        
        // --- ### MODIFICATION: Added margin-bottom to create space ### ---
        return `
            <div style="color: #c62828; font-weight: bold; text-align: center; margin-bottom: 10px;">${remarkText}</div>
            ${rowsHtml}
        `;
    }

    function showErrorMessage() {
        messageDiv.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0; background-color: #fff5f5; border: 2px solid #dc3545;">
                <tr><td style="padding: 15px; text-align: center; border-bottom: 1.5px solid #dc3545;"><span style="color: #dc3545; font-size: 16px; font-weight: bold;">No Result Found</span></td></tr>
                <tr>
                    <td style="padding: 15px;">
                        <div style="color: #dc3545; margin-bottom: 10px; font-weight: bold;">Please verify the following:</div>
                        <ol style="color: #dc3545; margin-left: 20px; line-height: 1.6; font-weight: bold;">
                            <li>Your registration number is correct.</li>
                            <li>The selected semester and examination year are correct.</li>
                            <li>The results for your selection have been published by the university.</li>
                        </ol>
                    </td>
                </tr>
            </table>`;
    }

    // --- Print Logic ---
    function attachWatermarkPrintTriggers() {
        document.querySelectorAll('.watermark-print-trigger').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                if (printButton) {
                    printButton.click(); 
                }
            });
        });
    }

    function handlePrintRequest() {
        if (isDragging) return;
        const results = document.getElementById('results');
        if (!results || !results.innerHTML.trim()) {
            messageDiv.textContent = 'Please fetch results before printing.';
            return;
        }
        prepareForPrint();
        window.print();
    }

    function prepareForPrint() {
        const resultPages = resultsContainer.getElementsByClassName('result-page');
        Array.from(resultPages).forEach((page, index) => {
            const oldPageNum = page.querySelector('.page-number');
            if (oldPageNum) oldPageNum.remove();
            const pageNumber = document.createElement('div');
            pageNumber.className = 'page-number';
            pageNumber.textContent = `Page ${index + 1} of ${resultPages.length}`;
            page.appendChild(pageNumber);
        });
        document.body.classList.add('print-mode');
    }

    function cleanupAfterPrint() {
        document.body.classList.remove('print-mode');
        const pageNumbers = document.querySelectorAll('.page-number');
        pageNumbers.forEach(pn => pn.remove());
    }

    if (printButton) {
        printButton.addEventListener('click', handlePrintRequest);
    }
    window.addEventListener('afterprint', cleanupAfterPrint);

    // --- Other Functionality ---
    regNoHelp.addEventListener('click', () => {
        alert(`Registration Number Format:\n=========================\nYY-BBB-CCC-NNN (11 digits)\n\nYY = Year (e.g., 23)\nBBB = Branch Code (e.g., 101 for Civil)\nCCC = College Code (e.g., 134 for GEC Banka)\nNNN = Roll No (e.g., 001)`);
    });

    document.querySelector('form')?.addEventListener('submit', (e) => e.preventDefault());
});
