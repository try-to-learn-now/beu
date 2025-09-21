document.addEventListener('DOMContentLoaded', () => {
    // Add this helper function at the start of your script
    function getElement(selector, context = document) {
        const element = context.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
        }
        return element;
    }

    // Use it for critical elements
    const fetchButton = getElement('#fetchButton');
    const printButton = getElement('#printButton');
    const creditButton = getElement('#creditButton');
    const resultsContainer = getElement('#results');

    // Get all DOM elements
    const semesterSelect = document.getElementById('semester');
    const batchSelect = document.getElementById('batch');
    const messageDiv = document.getElementById('message');
    const regNoInput = document.getElementById('regNo');

    // Define semester to batch mapping
    const semesterToBatchMapping = {
        '1st': ['2024','2023', '2022'],
        '2nd': ['2024', '2023'],
        '3rd': ['2023'],
        '4th': ['2024', '2023', '2022'],
        '5th': ['2023', '2022'],
        '6th': ['2024', '2023'],
        '7th': ['2024', '2023', '2022'],
        '8th': ['2025','2024', '2023']
    };

    // Draggable Print Button Implementation
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Touch events for print button
    printButton.addEventListener('touchstart', dragStart, false);
    printButton.addEventListener('touchend', dragEnd, false);
    printButton.addEventListener('touchmove', drag, false);

    // Mouse events for print button
    printButton.addEventListener('mousedown', dragStart, false);
    printButton.addEventListener('mouseup', dragEnd, false);
    printButton.addEventListener('mousemove', drag, false);

    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === printButton) {
            isDragging = true;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            if (e.type === 'touchmove') {
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentY = e.clientY - initialY;
            }

            // Limit vertical movement
            const maxDistance = 230;
            if (currentY > maxDistance) currentY = maxDistance;
            if (currentY < -maxDistance) currentY = -maxDistance;
            
            yOffset = currentY;
            printButton.style.transform = `translateY(${currentY}px)`;
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // Handle semester selection change
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
            
            // Show examination year selection message immediately after semester is selected
            messageDiv.innerHTML = `
                <div style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border: 1px solid #ffeeba;">
                    Please select examination year
                </div>`;
            batchSelect.focus();
        } else {
            batchSelect.disabled = true;
        }
    });

    // Handle batch selection change
    batchSelect.addEventListener('change', () => {
        messageDiv.textContent = '';
        
        // If registration number is empty, show registration input message
        if (!regNoInput.value) {
            messageDiv.innerHTML = `
                <div style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border: 1px solid #ffeeba;">
                    Please enter a valid 11-digit registration number
                </div>`;
            regNoInput.focus();
        }
        // If registration number is complete, validate and fetch
        else if (regNoInput.value.length === 11) {
            validateAndFetch(regNoInput.value);
        }
    });

    // Function to validate registration number and fetch results
    function validateAndFetch(value) {
        // Only check if it's 11 digits
        if (value.length === 11) {
            fetchButton.click();
        }
    }

    // Function to get failed subjects
    function getFailedSubjects(entry) {
        const failedSubjects = [];
        
        if (entry.theory_subjects) {
            entry.theory_subjects.forEach(subject => {
                if (subject.grade === 'F') {
                    failedSubjects.push({
                        code: subject.subject_code,
                        name: subject.subject_name,
                        type: 'Theory'
                    });
                }
            });
        }
        
        if (entry.practical_subjects) {
            entry.practical_subjects.forEach(subject => {
                if (subject.grade === 'F') {
                    failedSubjects.push({
                        code: subject.subject_code,
                        name: subject.subject_name,
                        type: 'Practical'
                    });
                }
            });
        }
        
        return failedSubjects;
    }

    // Function to format marks table
    function formatMarksTable(subjects, type) {
        if (!subjects || subjects.length === 0) return '';
        
        return `
            <h3 style="font-size: 16px; font-weight: 600;">${type} Subjects</h3>
            <table class="marks-table">
                <thead>
                    <tr>
                        <th style="font-size: 16px; font-weight: 600;">Subject Code</th>
                        <th style="font-size: 16px; font-weight: 600;">Subject Name</th>
                        <th style="font-size: 16px; font-weight: 600;">ESE</th>
                        <th style="font-size: 16px; font-weight: 600;">IA</th>
                        <th style="font-size: 16px; font-weight: 600;">Total</th>
                        <th style="font-size: 16px; font-weight: 600;">Grade</th>
                        <th style="font-size: 16px; font-weight: 600;">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    ${subjects.map(subject => `
                        <tr>
                            <td style="font-size: 16px; font-weight: 600;">${subject.subject_code}</td>
                            <td class="subject-name" style="font-size: 16px; font-weight: 600;">${subject.subject_name}</td>
                            <td style="font-size: 16px; font-weight: 600;">${subject.ese || '-'}</td>
                            <td style="font-size: 16px; font-weight: 600;">${subject.ia || '-'}</td>
                            <td style="font-size: 16px; font-weight: 600;">${subject.total || '0'}</td>
                            <td class="${subject.grade === 'F' ? 'failed-grade' : ''}" style="font-size: 16px; font-weight: 600;">${subject.grade}</td>
                            <td style="font-size: 16px; font-weight: 600;">${subject.credit}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Function to format failed subjects display
    function formatFailedSubjects(failedSubjects) {
        if (failedSubjects.length === 0) {
            return '<div class="pass-status">PASS</div>';
        }

        // Split subjects into rows of max 4
        const rows = [];
        for (let i = 0; i < failedSubjects.length; i += 4) {
            rows.push(failedSubjects.slice(i, i + 4));
        }

        return `
            <div style="color: #c62828; font-weight: bold; margin-bottom: 5px; text-align: center;">
                Remarks: You are failed in these subject(s)
            </div>
            ${rows.map(row => `
                <div class="failed-subject-row">
                    ${row.map(subject => `
                        <div class="failed-subject">
                            ${subject.name} (${subject.type})
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        `;
    }

    // Function to display results
    function displayResult(data) {
        resultsContainer.innerHTML = '';
        
        data.forEach((entry, index) => {
            if (!entry.separator) {
                const failedSubjects = getFailedSubjects(entry);
                
             // uesr shown formate
                const resultHTML = `
                    <div class="result-page">
                        <div class="university-header">
                            <h1>BIHAR ENGINEERING UNIVERSITY, PATNA</h1>
                            <div class="semester-header" style="font-size: 16px; font-weight: 600;">
                                ${entry.exam_name}
                            </div>
                        </div>

                        <table class="student-info">
                            <tr>
                                <th style="font-size: 16px; font-weight: 600;">Registration No:</th>
                                <td style="font-size: 16px; font-weight: 600;">${entry.registration_no}</td>
                                <th style="font-size: 16px; font-weight: 600;">Semester:</th>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester}</td>
                            </tr>
                            <tr>
                                <th style="font-size: 16px; font-weight: 600;">Student Name:</th>
                                <td colspan="3" class="student-name-cell" style="font-size: 16px; font-weight: 600;">${entry.student_name}</td>
                            </tr>
                            <tr>
                                <th style="font-size: 16px; font-weight: 600;">College Name:</th>
                                <td colspan="3" style="font-size: 16px; font-weight: 600;">${entry.college_name}</td>
                            </tr>
                            <tr>
                                <th style="font-size: 16px; font-weight: 600;">Course Name:</th>
                                <td colspan="3" style="font-size: 16px; font-weight: 600;">${entry.course_name}</td>
                            </tr>
                        </table>

                        <div class="marks-section">
                            ${formatMarksTable(entry.theory_subjects, 'Theory')}
                            ${formatMarksTable(entry.practical_subjects, 'Practical')}
                        </div>

                        <div style="display: flex; justify-content: flex-end; margin: 15px 0;">
                            <table class="sgpa-table">
                                <tr>
                                    <td class="sgpa-label" style="font-size: 16px; font-weight: 600;">SGPA</td>
                                    <td class="sgpa-value" style="font-size: 16px; font-weight: 600;">${entry.sgpa || '0.00'}</td>
                                </tr>
                            </table>
                        </div>

                        <table class="semester-grade-table">
                            <tr>
                                <th style="font-size: 16px; font-weight: 600;">Semester</th>
                                <th style="font-size: 16px; font-weight: 600;">I</th>
                                <th style="font-size: 16px; font-weight: 600;">II</th>
                                <th style="font-size: 16px; font-weight: 600;">III</th>
                                <th style="font-size: 16px; font-weight: 600;">IV</th>
                                <th style="font-size: 16px; font-weight: 600;">V</th>
                                <th style="font-size: 16px; font-weight: 600;">VI</th>
                                <th style="font-size: 16px; font-weight: 600;">VII</th>
                                <th style="font-size: 16px; font-weight: 600;">VIII</th>
                                <th style="font-size: 16px; font-weight: 600;">CGPA</th>
                            </tr>
                            <tr>
                                <td style="font-size: 16px; font-weight: 600;">Grade</td>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester_grades.find(g => g.semester === 'I')?.sgpa || 'NA'}</td>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester_grades.find(g => g.semester === 'II')?.sgpa || 'NA'}</td>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester_grades.find(g => g.semester === 'III')?.sgpa || 'NA'}</td>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester_grades.find(g => g.semester === 'IV')?.sgpa || 'NA'}</td>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester_grades.find(g => g.semester === 'V')?.sgpa || 'NA'}</td>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester_grades.find(g => g.semester === 'VI')?.sgpa || 'NA'}</td>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester_grades.find(g => g.semester === 'VII')?.sgpa || 'NA'}</td>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester_grades.find(g => g.semester === 'VIII')?.sgpa || 'NA'}</td>
                                <td style="font-size: 16px; font-weight: 600;">${entry.semester_grades.find(g => g.semester === 'Cur. CGPA')?.sgpa || 'NA'}</td>
                            </tr>
                        </table>

                        <table class="remarks-table">
                            <tr>
                                <td>${formatFailedSubjects(failedSubjects)}</td>
                            </tr>
                        </table>

                        <table class="publish-date-table">
                            <tr>
                                <th style="font-size: 16px; font-weight: 600;">Publish Date:</th>
                                <td style="font-size: 16px; font-weight: 600;">${entry.publish_date || 'N/A'}</td>
                            </tr>
                        </table>

                        <div class="watermark">
                            <a href="https://beu.pages.dev" target="_blank" style="font-size: 16px; font-weight: 600;">
                                Click Here To Download Result: BEU.pages.dev
                            </a>
                        </div>
                    </div>
                `;

                resultsContainer.innerHTML += resultHTML;
            }
        });
    }

    // Update fetch button click handler with precise timing
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

        // Initialize loading counter for 4.2-7.8 seconds duration
        let progress = 0;
        const minTime = 4200; // 4.2 seconds
        const maxTime = 7800; // 7.8 seconds
        const interval = 250; // Update every 250ms
        
        // Calculate random total duration between min and max
        const duration = Math.floor(Math.random() * (maxTime - minTime)) + minTime;
        const incrementsNeeded = duration / interval;
        const avgIncrement = 100 / incrementsNeeded;

        const loadingInterval = setInterval(() => {
            // Add a small random variation to the increment
            progress += avgIncrement + (Math.random() * 0.5 - 0.25);
            
            if (progress > 100) progress = 100;
            
            messageDiv.innerHTML = `
                <div style="color: #004085; background: #cce5ff; padding: 10px; border-radius: 4px; border: 1px solid #b8daff; text-align: center;">
                    Processing Result... ${Math.floor(progress)}%
                </div>
            `;
        }, interval);

        const url = `https://api.beunotes.workers.dev/result?sem=${semester}&year=${batch}&reg_no=${regNo}`;
        console.log("Fetching URL:", url); // Log the URL

        fetch(url)
            .then(response => {
                console.log("Response Status:", response.status);
                if (!response.ok) throw new Error('No Result Found');
                return response.json();
            })
            .then(data => {
                console.log("Response Data:", data);
                clearInterval(loadingInterval);
                messageDiv.textContent = '';
                
                // Update error message for no data
                if (!data || data.length === 0) {
                    messageDiv.innerHTML = `
                        <table style="width: 100%; border-collapse: collapse; margin: 10px 0; background-color: #fff5f5; border: 2px solid #dc3545;">
                            <tr>
                                <td style="padding: 15px; text-align: center; border-bottom: 1.5px solid #dc3545;">
                                    <span style="color: #dc3545; font-size: 16px; font-weight: bold;">No Result Found</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 15px;">
                                    <div style="color: #dc3545; margin-bottom: 10px; font-weight: bold;">Please verify:</div>
                                    <ol style="color: #dc3545; margin-left: 20px; line-height: 1.6; font-weight: bold;">
                                        <li>Registration number is correct</li>
                                        <li>Selected semester is correct</li>
                                        <li>Selected examination year is correct</li>
                                        <li>Results have been published</li>
                                    </ol>
                                </td>
                            </tr>
                        </table>
                    `;
                    return;
                }
                
                displayResult(data);
            })
            .catch(error => {
                clearInterval(loadingInterval);
                messageDiv.innerHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin: 10px 0; background-color: #fff5f5; border: 2px solid #dc3545;">
                        <tr>
                            <td style="padding: 15px; text-align: center; border-bottom: 1.5px solid #dc3545;">
                                <span style="color: #dc3545; font-size: 16px; font-weight: bold;">No Result Found</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 15px;">
                                <div style="color: #dc3545; margin-bottom: 10px; font-weight: bold;">Please verify the following:</div>
                                <ol style="color: #dc3545; margin-left: 20px; line-height: 1.6; font-weight: bold;">
                                    <li>Check if your registration number is entered correctly (Only Numbers)</li>
                                    <li>Registration number should be 11 digits only</li>
                                    <li>Ensure you've selected the correct semester</li>
                                    <li>Verify your batch year selection</li>
                                    <li>Confirm that your results have been published</li>
                                </ol>
                                <div style="color: #dc3545; margin-top: 10px; font-style: italic; font-weight: bold;">
                                    Example Registration Number Format: 23101134001
                                    <br><br>
                                    If the problem persists, your results might not be available in the database yet.
                                </div>
                            </td>
                        </tr>
                    </table>
                `;
                console.error('Error:', error);
            });
    });

    // Handle print button click
    printButton.addEventListener('click', (e) => {
        // Only trigger print if not dragging
        if (!isDragging) {
            if (resultsContainer.innerHTML.trim()) {
                togglePrintPreview();
            } else {
                messageDiv.textContent = 'Please fetch results before printing.';
            }
        }
    });

    // Prevent default form submission
    document.querySelector('form')?.addEventListener('submit', (e) => e.preventDefault());

    // Add help button handler
    const regNoHelp = document.getElementById('regNoHelp');
    regNoHelp.addEventListener('click', () => {
        const helpMessage = `Registration Number Format:
=========================
YY-BBB-CCC-NNN (11 digits)

YY = Year (23)
BBB = Branch Code (101)
CCC = College Code (134)
NNN = Roll No (001)

Branch Codes:
101 = Civil Engineering
102 = Mechanical Engineering
104 = Electronics & Communication

College Codes:
134 = GEC Banka
135 = GEC Vaishali

Example: 23101134001`;
        
        alert(helpMessage);
    });

    // Update registration number input handler
    regNoInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        
        // Limit to 11 digits
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        
        e.target.value = value;
        messageDiv.textContent = '';

        // Show semester selection message if not selected
        if (value.length > 0 && !semesterSelect.value) {
            messageDiv.innerHTML = `
                <div style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border: 1px solid #ffeeba;">
                    Please select your semester first
                </div>`;
            semesterSelect.focus();
            return;
        }

        // Show batch selection message if semester selected but batch not selected
        if (value.length > 0 && semesterSelect.value && !batchSelect.value) {
            messageDiv.innerHTML = `
                <div style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border: 1px solid #ffeeba;">
                    Please select examination year
                </div>`;
            batchSelect.focus();
            return;
        }

        // Validate and fetch if 11 digits entered
        if (value.length === 11) {
            validateAndFetch(value);
        }
    });

    // Stop dragging when mouse leaves the window
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener('mouseleave', dragEnd);

    // Add these constants at the top of your script
    const CSS_CLASSES = {
        FAILED_GRADE: 'failed-grade',
        PRINT_ONLY: 'print-only',
        RESULT_PAGE: 'result-page',
        MESSAGE: 'message',
        WATERMARK: 'watermark'
    };

    // Then use them in your code like:
    function markFailedGrades() {
        const gradeElements = document.querySelectorAll('.marks-table td:nth-child(6)');
        gradeElements.forEach(element => {
            if (parseInt(element.textContent) < 40) {
                element.classList.add(CSS_CLASSES.FAILED_GRADE);
            }
        });
    }

    // Add these constants at the top
    const MAX_STUDENTS_PER_PAGE = 60;
    const RESULTS_PER_PAGE = 1; // 1 student per page

    function handlePrint() {
        const results = document.getElementById('results');
        if (!results || !results.innerHTML.trim()) {
            messageDiv.innerHTML = `
                <div style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; border: 1px solid #ffeeba;">
                    Please fetch results before printing
                </div>`;
            return;
        }

        // Get all result pages
        const resultPages = results.getElementsByClassName('result-page');
        const totalResults = resultPages.length;

        // Validate maximum results
        if (totalResults > MAX_STUDENTS_PER_PAGE) {
            messageDiv.innerHTML = `
                <div style="color: #721c24; background: #f8d7da; padding: 10px; border-radius: 4px; border: 1px solid #f5c6cb;">
                    Maximum ${MAX_STUDENTS_PER_PAGE} results allowed for printing
                </div>`;
            return;
        }

        // Add print-mode class to body
        document.body.classList.add('print-mode');

        // Add page numbers and separators
        Array.from(resultPages).forEach((page, index) => {
            // Add page number
            const pageNumber = document.createElement('div');
            pageNumber.className = 'page-number';
            pageNumber.textContent = `Page ${index + 1} of ${totalResults}`;
            page.appendChild(pageNumber);

            // Force page break
            page.style.pageBreakBefore = 'always';
            page.style.pageBreakAfter = 'always';
        });

        // Print
        window.print();

        // Cleanup after printing
        Array.from(resultPages).forEach(page => {
            const pageNumber = page.querySelector('.page-number');
            if (pageNumber) {
                pageNumber.remove();
            }
        });

        // Remove print-mode class
        document.body.classList.remove('print-mode');
    }

    // Add print button event listener
    document.getElementById('printButton').addEventListener('click', handlePrint);

    // Add this to handle responsive layouts
    function handleResponsiveLayout() {
        const container = getElement('.container');
        if (!container) return;

        if (window.innerWidth <= 1024) {
            container.style.width = '95%';
        } else {
            container.style.width = '1000px';
        }
    }

    // Add resize listener
    window.addEventListener('resize', handleResponsiveLayout);
    // Initial call
    handleResponsiveLayout();

    // Add drag functionality for credit button
    function initializeDragButton() {
        const creditBtn = getElement('#creditButton');
        if (!creditBtn) return;

        let isDragging = false;
        let currentY;
        let initialY;
        let yOffset = 0;

        creditBtn.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialY = e.clientY - yOffset;
            isDragging = true;
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            currentY = e.clientY - initialY;
            yOffset = currentY;

            // Constrain to viewport
            const maxY = window.innerHeight - creditBtn.offsetHeight;
            yOffset = Math.max(0, Math.min(maxY, yOffset));

            setTranslate(yOffset);
        }

        function setTranslate(yPos) {
            creditBtn.style.transform = `translateY(${yPos}px)`;
        }

        function dragEnd() {
            isDragging = false;
        }
    }

    // Initialize drag functionality
    initializeDragButton();

    // Add this function to your script.js
    function togglePrintPreview() {
        const body = document.body;
        const container = document.querySelector('.container');
        const previewControls = document.createElement('div');
        
        if (!body.classList.contains('print-preview')) {
            // Enter print preview mode
            body.classList.add('print-preview');
            
            // Add preview controls
            previewControls.className = 'print-preview-controls';
            previewControls.innerHTML = `
                <button onclick="window.print()">Print</button>
                <button onclick="togglePrintPreview()">Exit Preview</button>
            `;
            body.appendChild(previewControls);
            
            // Hide non-preview elements
            document.querySelector('.input-section').style.display = 'none';
            document.querySelector('#printButton').style.display = 'none';
            document.querySelector('#creditButton').style.display = 'none';
            
        } else {
            // Exit print preview mode
            body.classList.remove('print-preview');
            
            // Remove preview controls
            const controls = document.querySelector('.print-preview-controls');
            if (controls) controls.remove();
            
            // Show hidden elements
            document.querySelector('.input-section').style.display = 'block';
            document.querySelector('#printButton').style.display = 'block';
            document.querySelector('#creditButton').style.display = 'block';
        }
    }

    // Update print button click handler
    document.getElementById('printButton').addEventListener('click', function() {
        if (document.querySelector('#results').innerHTML.trim()) {
            togglePrintPreview();
        } else {
            messageDiv.textContent = 'Please fetch results before printing.';
        }
    });
});
