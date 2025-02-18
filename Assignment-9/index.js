
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];

const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
};

const bookingModal = document.getElementById('bookingModal');
const confirmationModal = document.getElementById('confirmationModal');
const appointmentsList = document.querySelector('.appointments-list');
const searchInput = document.getElementById('searchAppointment');
const filterStatus = document.getElementById('filterStatus');
const appointmentForm = document.getElementById('appointmentForm');

document.querySelectorAll('.book-btn').forEach(button => {
    button.addEventListener('click', () => {
        const service = button.dataset.service;
        document.getElementById('service').value = service;
        openModal(bookingModal);
    });
});

document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
        closeModal(button.closest('.modal'));
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});

appointmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm()) {
        saveAppointment();
    }
});

const formInputs = {
    fullName: {
        element: document.getElementById('fullName'),
        validate: (value) => value.length >= 2 || 'Name must be at least 2 characters long'
    },
    email: {
        element: document.getElementById('email'),
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Please enter a valid email address'
    },
    phone: {
        element: document.getElementById('phone'),
        validate: (value) => /^\d{10}$/.test(value) || 'Phone number must be 10 digits'
    },
    datetime: {
        element: document.getElementById('datetime'),
        validate: (value) => {
            const selected = new Date(value);
            const now = new Date();
            return selected > now || 'Please select a future date and time'
        }
    }
};

Object.entries(formInputs).forEach(([key, {element}]) => {
    element.addEventListener('input', () => validateField(key));
});

function validateField(fieldName) {
    const {element, validate} = formInputs[fieldName];
    const errorElement = element.nextElementSibling;
    const result = validate(element.value);
    
    if (result === true || result === undefined) {
        errorElement.textContent = '';
        element.classList.remove('invalid');
        return true;
    } else {
        errorElement.textContent = result;
        element.classList.add('invalid');
        return false;
    }
}

function validateForm() {
    let isValid = true;
    Object.keys(formInputs).forEach(key => {
        if (!validateField(key)) {
            isValid = false;
        }
    });

    const terms = document.getElementById('terms');
    if (!terms.checked) {
        terms.nextElementSibling.textContent = 'You must agree to the terms';
        isValid = false;
    }

    return isValid;
}

function openModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function saveAppointment() {
    const appointment = {
        id: generateId(),
        name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        datetime: document.getElementById('datetime').value,
        requests: document.getElementById('requests').value,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: 'a2ys'
    };

    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    showConfirmation(appointment);
    closeModal(bookingModal);
    appointmentForm.reset();
    renderAppointments();
}

function showConfirmation(appointment) {
    const message = document.getElementById('confirmationMessage');
    message.textContent = `Thank you, ${appointment.name}! Your appointment for ${appointment.service} on ${formatDate(appointment.datetime)} is confirmed.`;
    openModal(confirmationModal);
}

function renderAppointments() {
    let filteredAppointments = [...appointments];
    
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredAppointments = filteredAppointments.filter(apt => 
            apt.name.toLowerCase().includes(searchTerm) ||
            apt.service.toLowerCase().includes(searchTerm) ||
            apt.email.toLowerCase().includes(searchTerm)
        );
    }

    const statusFilter = filterStatus.value;
    if (statusFilter !== 'all') {
        filteredAppointments = filteredAppointments.filter(apt => 
            apt.status === statusFilter
        );
    }

    filteredAppointments.sort((a, b) => 
        new Date(b.datetime) - new Date(a.datetime)
    );

    appointmentsList.innerHTML = filteredAppointments.map(apt => `
        <div class="appointment-item" data-id="${apt.id}">
            <div class="appointment-info">
                <h3>${apt.name}</h3>
                <p><strong>Service:</strong> ${apt.service}</p>
                <p><strong>Date & Time:</strong> ${formatDate(apt.datetime)}</p>
                <p><strong>Email:</strong> ${apt.email}</p>
                <p><strong>Phone:</strong> ${apt.phone}</p>
                ${apt.requests ? `<p><strong>Special Requests:</strong> ${apt.requests}</p>` : ''}
            </div>
            <div class="appointment-actions">
                <span class="status-badge status-${apt.status}">${apt.status}</span>
                ${new Date(apt.datetime) > new Date() ? `
                    <select class="status-update" onchange="updateAppointmentStatus('${apt.id}', this.value)">
                        <option value="" disabled selected>Update Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button class="reschedule-btn" onclick="rescheduleAppointment('${apt.id}')">Reschedule</button>
                    <button class="cancel-btn" onclick="cancelAppointment('${apt.id}')">Cancel</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

searchInput.addEventListener('input', renderAppointments);
filterStatus.addEventListener('change', renderAppointments);

function updateAppointmentStatus(appointmentId, newStatus) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
        appointment.status = newStatus;
        localStorage.setItem('appointments', JSON.stringify(appointments));
        renderAppointments();
    }
}

function rescheduleAppointment(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
        document.getElementById('fullName').value = appointment.name;
        document.getElementById('email').value = appointment.email;
        document.getElementById('phone').value = appointment.phone;
        document.getElementById('service').value = appointment.service;
        document.getElementById('requests').value = appointment.requests;
        
        appointments = appointments.filter(apt => apt.id !== appointmentId);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        openModal(bookingModal);
        renderAppointments();
    }
}

function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        appointments = appointments.filter(apt => apt.id !== appointmentId);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        renderAppointments();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const datetimeInput = document.getElementById('datetime');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    datetimeInput.min = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    renderAppointments();
});
