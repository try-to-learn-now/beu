export class ErrorHandler {
    static handleInputError(element, message) {
        element.classList.add('input-error');
        element.setAttribute('title', message);
        
        setTimeout(() => {
            element.classList.remove('input-error');
        }, 3000);
    }

    static handleAPIError(error) {
        console.error('API Error:', error);
        return {
            type: 'error',
            message: 'Failed to fetch results. Please try again.',
            details: error.message
        };
    }

    static handleValidationError(field, value) {
        const errors = {
            semester: 'Please select a valid semester',
            batch: 'Please select your batch year',
            regNo: 'Please enter a valid 11-digit registration number'
        };
        
        return errors[field] || 'Invalid input';
    }
} 
