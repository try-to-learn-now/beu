/* HTML Structure Assumed:
Make sure you have elements with IDs:
- 'branch', 'semester' for branch and semester selection.
- 'subject-container' to show subjects.
- 'theory-table' and 'practical-table' for subject tables.
- 'results' to display SGPA.
- 'remarks-container' and 'greeting-container' for remarks and greeting messages.
- 'load-subjects' and 'calculate-cgpa' buttons.
*/
function loadSubjects() {    
  const branch = document.getElementById('branch').value;
    const semester = document.getElementById('semester').value;

    if (!SubjectData || !SubjectData[branch]) {
        console.error("Invalid branch data.");
        return;
    }
 // Locate the correct semester object by matching semester value as a string
    const subjects = SubjectData[branch].find(sem => String(sem.semester) === semester);
    if (!subjects) {
        console.error("Invalid semester data.");
        return;
    }

    loadTable(subjects.Theory, "theory-table", "theory");
    loadTable(subjects.Practical, "practical-table", "practical");
    document.getElementById('subject-container').style.display = 'block';
}

function loadTable(subjectList, tableId, type) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';

    subjectList.forEach(subject => {
        const row = document.createElement('tr');
        row.classList.add("subject-row");
        row.dataset.type = type;
        row.dataset.credit = subject.credit;
      if (subject.special) row.dataset.special = "true";

      const maxESE = type === 'theory' || subject.special ? 70 : 30;       
      const maxIA = type === 'theory' || subject.special ? 30 : 20;


        row.innerHTML = `            
            <td>${subject.code}</td>
            <td class="name">${subject.name}</td>
            <td><input type="number" class="ese" max="${maxESE}" min="0" oninput="enforceInputLimit(this, ${maxESE})"></td>
            <td><input type="number" class="ia" max="${maxIA}" min="0" oninput="enforceInputLimit(this, ${maxIA})"></td>
            <td class="total"></td>
            <td class="grade"></td>
            <td>${subject.credit}</td>
        `;
        tableBody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-subjects').addEventListener('click', loadSubjects);
});


function enforceInputLimit(input, max) {
    const value = parseInt(input.value) ;
    if (value > max) {
        input.value = '';  // Clear the input if it exceeds the max
    } else {
        input.value = Math.max(0, value);  // Ensure value is not below 0
    }
}

function getGrade(percentage, isTheory, eseMarks) {
    if ((isTheory && eseMarks < 24.5) || (!isTheory && eseMarks < 12)) {
        return { grade: 'F', point: 0 };
    }

    if (percentage >= 90) return { grade: 'A+', point: 10 };
    if (percentage >= 80) return { grade: 'A', point: 9 };
    if (percentage >= 70) return { grade: 'B', point: 8 };
    if (percentage >= 60) return { grade: 'C', point: 7 };
    if (percentage >= 50) return { grade: 'D', point: 6 };
    if ((percentage >= 35 && isTheory) || (percentage >= 40 && !isTheory)) return { grade: 'P', point: 5 };
    return { grade: 'F', point: 0 };
}

function calculateCGPA() {
    let subjects = document.querySelectorAll(".subject-row");
    let totalCredits = 0, totalPoints = 0, failedSubjects = [];
    
    subjects.forEach(subjectRow => {
        const ese = parseInt(subjectRow.querySelector(".ese").value) || 0;
        const ia = parseInt(subjectRow.querySelector(".ia").value) || 0;
        const totalMarks = ese + ia;
        const isTheory = subjectRow.getAttribute("data-type") === "theory" || subjectRow.getAttribute("data-special") === "true";
        const maxMarks = isTheory ? 100 : 50;

        const sub = {
            name: subjectRow.querySelector(".name").textContent,
            theory: isTheory
        };

        const { grade, point } = getGrade((totalMarks / maxMarks) * 100, isTheory, ese);

        subjectRow.querySelector(".total").textContent = totalMarks;
        subjectRow.querySelector(".grade").textContent = grade;
        
        const credit = parseFloat(subjectRow.getAttribute("data-credit"));
        totalCredits += credit;
        if (grade !== 'F') {
            totalPoints += point * credit;
        } else {
            if (!sub.theory || subjectRow.getAttribute("data-special") === "true") {
                failedSubjects.push(`${sub.name} (Practical)`);
            } else {
                failedSubjects.push(`${sub.name} (Theory)`);
            }
        }
    });

    const sgpa = totalCredits ? totalPoints / totalCredits : 0;
    document.getElementById('results').innerHTML = `<strong>SGPA: ${sgpa.toFixed(2)}</strong>`;
    displayRemarks(failedSubjects);

    // Show greeting based on SGPA value
    const greetingContainer = document.getElementById('greeting-container');
    greetingContainer.style.display = 'block';
    if (failedSubjects.length > 0 || sgpa < 5) {
        greetingContainer.innerHTML = `<strong>Fail Hue Ho</strong>`;
    } else if (sgpa >= 9 && sgpa <= 10) {
        greetingContainer.innerHTML = `<strong>Excellent</strong>`;
    } else if (sgpa >= 8 && sgpa < 9) {
        greetingContainer.innerHTML = `<strong>Very Good</strong>`;
    } else if (sgpa >= 7 && sgpa < 8) {
        greetingContainer.innerHTML = `<strong>Good</strong>`;
    } else if (sgpa >= 6 && sgpa < 7) {
        greetingContainer.innerHTML = `<strong>Average</strong>`;
    } else if (sgpa >= 5 && sgpa < 6) {
        greetingContainer.innerHTML = `<strong>Pass</strong>`;
    }
}

function displayRemarks(failedSubjects) {
    const remarksContainer = document.getElementById('remarks-container');
    remarksContainer.innerHTML = '';

    if (failedSubjects.length) {
        remarksContainer.innerHTML = `<strong>Remarks: You are failing in these subject(s)</strong>`;
        const failedSubjectContainer = document.createElement('div');
        failedSubjectContainer.classList.add('failed-subject-container');

        failedSubjects.forEach(subject => {
            const subjectElement = document.createElement('div');
            subjectElement.classList.add('failed-subject');
            subjectElement.textContent = subject;
            failedSubjectContainer.appendChild(subjectElement);
        });

        const remaining = 3 - (failedSubjects.length % 3);
        if (remaining < 3) {
            for (let i = 0; i < remaining; i++) {
                const emptyElement = document.createElement('div');
                emptyElement.classList.add('empty-placeholder');
                failedSubjectContainer.appendChild(emptyElement);
            }
        }

        remarksContainer.appendChild(failedSubjectContainer);
    } else {
        remarksContainer.innerHTML = `<strong>Remarks: PASS</strong>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-subjects').addEventListener('click', loadSubjects);
    document.getElementById('calculate-cgpa').addEventListener('click', () => {
        calculateCGPA();
        document.getElementById('results').style.display = 'block';
        document.getElementById('remarks-container').style.display = 'block';
    });
});