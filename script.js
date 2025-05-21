// Zmienne globalne
let clickCount = 0;
let keyCount = 0;
let startTime = Date.now();
let countries = [];
let formSubmitted = false;

// Elementy DOM
let form, countrySearch, countrySuggestions, countryInput, countryCodeSelect;
let clickCountSpan, keyCountSpan, timeSpentSpan, vatCheckbox, vatNumberGroup, zipCodeInput;

// Inicjalizacja po załadowaniu DOM
function initializeElements() {
    form = document.getElementById('form');
    countrySearch = document.getElementById('countrySearch');
    countrySuggestions = document.getElementById('countrySuggestions');
    countryInput = document.getElementById('country');
    countryCodeSelect = document.getElementById('countryCode');
    clickCountSpan = document.getElementById('click-count');
    keyCountSpan = document.getElementById('key-count');
    timeSpentSpan = document.getElementById('time-spent');
    vatCheckbox = document.getElementById('vatUE');
    vatNumberGroup = document.getElementById('vatNumberGroup');
    zipCodeInput = document.getElementById('zipCode');
}

// Liczenie kliknięć i naciśnięć klawiszy
function handleClick() {
    clickCount++;
    if (clickCountSpan) {
        clickCountSpan.textContent = clickCount;
    }
}

function handleKeyPress(event) {
    keyCount++;
    if (keyCountSpan) {
        keyCountSpan.textContent = keyCount;
    }
    
    // Obsługa skrótów klawiaturowych
    if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        if (countrySearch) {
            countrySearch.focus();
        }
    }
    
    // Wysłanie formularza przez Enter
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        handleFormSubmit(event);
    }
}

function updateTimeSpent() {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    if (timeSpentSpan) {
        timeSpentSpan.textContent = timeSpent;
    }
}

// Toast powiadomienia
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    setTimeout(() => {
        toastElement.remove();
    }, 5000);
}

// Pobieranie krajów z API
async function fetchCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        if (!response.ok) throw new Error('Błąd pobierania krajów');
        
        const data = await response.json();
        countries = data.map(country => ({
            name: country.name.common,
            code: country.cca2,
            dialCode: country.idd?.root ? country.idd.root + (country.idd.suffixes?.[0] || '') : ''
        })).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
        
        console.log('Kraje załadowane:', countries.length);
    } catch (error) {
        console.error('Błąd pobierania krajów:', error);
        showToast('Nie udało się pobrać listy krajów', 'warning');
    }
}

// Kompatybilność z oryginalną funkcją
async function fetchAndFillCountries() {
    await fetchCountries();
    
    // Wypełnienie selecta kraju (jeśli istnieje)
    const countrySelect = document.getElementById('country');
    if (countrySelect && countrySelect.tagName === 'SELECT') {
        const options = countries.map(country => 
            `<option value="${country.name}">${country.name}</option>`
        ).join('');
        countrySelect.innerHTML = '<option value="">Wybierz kraj</option>' + options;
    }
}

// Wyszukiwanie krajów
function searchCountries(query) {
    if (!countrySuggestions) return;
    
    if (!query || query.length < 2) {
        countrySuggestions.style.display = 'none';
        return;
    }
    
    const filtered = countries.filter(country => 
        country.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    if (filtered.length === 0) {
        countrySuggestions.style.display = 'none';
        return;
    }
    
    countrySuggestions.innerHTML = filtered.map(country => 
        `<div class="country-suggestion" data-country="${country.name}" data-code="${country.dialCode}">
            ${country.name}
        </div>`
    ).join('');
    
    countrySuggestions.style.display = 'block';
}

// Wybór kraju
function selectCountry(countryName, dialCode) {
    if (countrySearch) {
        countrySearch.value = countryName;
        countrySearch.classList.add('auto-filled');
        countrySearch.classList.remove('is-invalid');
    }
    
    if (countryInput) {
        countryInput.value = countryName;
    }
    
    if (countrySuggestions) {
        countrySuggestions.style.display = 'none';
    }
    
    // Auto-wypełnienie kodu kierunkowego
    if (dialCode && dialCode !== 'undefined' && countryCodeSelect) {
        const option = Array.from(countryCodeSelect.options).find(opt => opt.value === dialCode);
        if (option) {
            countryCodeSelect.value = dialCode;
            countryCodeSelect.classList.add('auto-filled');
            showToast(`Automatycznie ustawiono kod ${dialCode}`, 'success');
        }
    }
}

// Pobieranie lokalizacji z IP
function getCountryByIP() {
    fetch('https://get.geojs.io/v1/ip/geo.json')
        .then(response => response.json())
        .then(data => {
            const countryCode = data.country;
            if (countryCode && countries.length > 0) {
                const country = countries.find(c => c.code === countryCode);
                if (country) {
                    selectCountry(country.name, country.dialCode);
                    showToast(`Automatycznie wykryto kraj: ${country.name}`, 'success');
                    
                    // Wywołaj również getCountryCode dla kompatybilności
                    getCountryCode(country.name);
                }
            }
        })
        .catch(error => {
            console.error('Błąd pobierania danych z serwera GeoJS:', error);
        });
}

// Pobieranie kodu kraju
function getCountryCode(countryName) {
    const apiUrl = `https://restcountries.com/v3.1/name/${countryName}?fullText=true`;

    fetch(apiUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Błąd pobierania danych');
        }
        return response.json();
    })
    .then(data => {        
        const countryCode = data[0].idd.root + data[0].idd.suffixes.join("");
        
        // Wstrzykiwanie kodu kraju do formularza
        if (countryCodeSelect && countryCode) {
            const option = Array.from(countryCodeSelect.options).find(opt => opt.value === countryCode);
            if (option) {
                countryCodeSelect.value = countryCode;
                countryCodeSelect.classList.add('auto-filled');
                showToast(`Automatycznie ustawiono kod ${countryCode}`, 'success');
            }
        }
    })
    .catch(error => {
        console.error('Błąd pobierania kodu kraju:', error);
    });
}

// Walidacja formularza
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    
    // Sprawdzenie czy pole jest wymagane i puste
    if (field.hasAttribute('required') && !value) {
        isValid = false;
    }
    
    // Specjalne walidacje
    switch (field.type) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(value) || !value;
            break;
            
        case 'tel':
            const phoneRegex = /^[0-9\s\-]{9,15}$/;
            isValid = phoneRegex.test(value) || !value;
            break;
    }
    
    // Kod pocztowy dla Polski
    if (field.id === 'zipCode' && value) {
        const zipRegex = /^[0-9]{2}-[0-9]{3}$/;
        isValid = zipRegex.test(value);
    }
    
    // VAT number
    if (field.id === 'vatNumber' && value) {
        const vatRegex = /^[A-Z]{2}[0-9A-Z]{8,12}$/;
        isValid = vatRegex.test(value.toUpperCase());
    }
    
    // Radio buttons
    if (field.type === 'radio') {
        const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
        isValid = Array.from(radioGroup).some(radio => radio.checked);
    }
    
    // Aktualizacja klasy CSS
    if (isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
    }
    
    return isValid;
}

// Walidacja całego formularza
function validateForm() {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    // Sprawdzenie radio buttons
    const radioGroups = ['shippingMethod', 'paymentMethod'];
    radioGroups.forEach(groupName => {
        const radios = document.querySelectorAll(`input[name="${groupName}"]`);
        const checked = Array.from(radios).some(radio => radio.checked);
        if (!checked) {
            isValid = false;
            radios.forEach(radio => radio.classList.add('is-invalid'));
        }
    });
    
    // Sprawdzenie kraju
    if (!countryInput.value) {
        countrySearch.classList.add('is-invalid');
        isValid = false;
    }
    
    return isValid;
}

// Formatowanie kodu pocztowego
function formatZipCode(value) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
        return numbers.slice(0, 2) + '-' + numbers.slice(2, 5);
    }
    return numbers;
}

// Obsługa wysłania formularza
function handleFormSubmit(event) {
    event.preventDefault();
    
    if (formSubmitted) return;
    
    if (!validateForm()) {
        showToast('Proszę poprawić błędy w formularzu', 'danger');
        return;
    }
    
    formSubmitted = true;
    const submitButton = form.querySelector('button[type="submit"]');
    const loadingSpinner = submitButton.querySelector('.loading-spinner');
    
    submitButton.disabled = true;
    loadingSpinner.style.display = 'inline';
    
    // Symulacja wysłania formularza
    setTimeout(() => {
        showToast('Formularz został wysłany pomyślnie!', 'success');
        
        // Pokazanie modala z raportem
        const modal = new bootstrap.Modal(document.getElementById('form-feedback-modal'));
        modal.show();
        
        submitButton.disabled = false;
        loadingSpinner.style.display = 'none';
        formSubmitted = false;
    }, 2000);
}

// Obsługa kliknięć w sugestie krajów
function handleCountrySuggestionClick(event) {
    if (event.target.classList.contains('country-suggestion')) {
        const countryName = event.target.dataset.country;
        const dialCode = event.target.dataset.code;
        selectCountry(countryName, dialCode);
    }
}

// Obsługa radio buttons
function handleRadioChange(event) {
    if (event.target.type === 'radio') {
        // Usuń klasy walidacji z całej grupy
        const radioGroup = document.querySelectorAll(`input[name="${event.target.name}"]`);
        radioGroup.forEach(radio => {
            radio.classList.remove('is-invalid');
            const card = radio.closest('.radio-card');
            if (card) {
                card.classList.remove('selected');
            }
        });
        
        // Dodaj klasę selected do wybranej opcji
        const selectedCard = event.target.closest('.radio-card');
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }
}

// Obsługa checkboxa VAT
function handleVatCheckboxChange(event) {
    if (vatNumberGroup) {
        if (event.target.checked) {
            vatNumberGroup.style.display = 'block';
            document.getElementById('vatNumber').setAttribute('required', '');
        } else {
            vatNumberGroup.style.display = 'none';
            document.getElementById('vatNumber').removeAttribute('required');
            document.getElementById('vatNumber').classList.remove('is-invalid', 'is-valid');
        }
    }
}

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    
    // Event Listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyPress);
    
    // Timer
    setInterval(updateTimeSpent, 1000);
    
    // Inicjalizacja krajów i auto-wypełnienie
    fetchCountries().then(() => {
        // Opóźnienie dla lepszego UX
        setTimeout(() => {
            getCountryByIP();
        }, 1000);
    });
    
    // Wyszukiwanie krajów
    if (countrySearch) {
        countrySearch.addEventListener('input', (e) => {
            searchCountries(e.target.value);
        });
        
        countrySearch.addEventListener('blur', () => {
            // Opóźnienie żeby kliknięcie na sugestię działało
            setTimeout(() => {
                if (countrySuggestions) {
                    countrySuggestions.style.display = 'none';
                }
            }, 200);
        });
    }
    
    // Kliknięcia w sugestie krajów
    if (countrySuggestions) {
        countrySuggestions.addEventListener('click', handleCountrySuggestionClick);
    }
    
    // Obsługa formularza
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        
        // Walidacja na żywo
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) {
                    validateField(input);
                }
            });
        });
    }
    
    // Radio buttons
    document.addEventListener('change', handleRadioChange);
    
    // Checkbox VAT
    if (vatCheckbox) {
        vatCheckbox.addEventListener('change', handleVatCheckboxChange);
    }
    
    // Formatowanie kodu pocztowego
    if (zipCodeInput) {
        zipCodeInput.addEventListener('input', (e) => {
            e.target.value = formatZipCode(e.target.value);
        });
    }
    
    // Ukrywanie sugestii przy kliknięciu poza nimi
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.country-search') && countrySuggestions) {
            countrySuggestions.style.display = 'none';
        }
    });
    
    // Obsługa klawiszy w wyszukiwaniu krajów
    if (countrySearch) {
        countrySearch.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const suggestions = countrySuggestions.querySelectorAll('.country-suggestion');
                if (suggestions.length > 0) {
                    const current = countrySuggestions.querySelector('.country-suggestion:hover') || suggestions[0];
                    const index = Array.from(suggestions).indexOf(current);
                    
                    if (e.key === 'ArrowDown') {
                        const next = suggestions[index + 1] || suggestions[0];
                        next.classList.add('hover');
                        current.classList.remove('hover');
                    } else {
                        const prev = suggestions[index - 1] || suggestions[suggestions.length - 1];
                        prev.classList.add('hover');
                        current.classList.remove('hover');
                    }
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const hovered = countrySuggestions.querySelector('.country-suggestion:hover');
                if (hovered) {
                    const countryName = hovered.dataset.country;
                    const dialCode = hovered.dataset.code;
                    selectCountry(countryName, dialCode);
                }
            } else if (e.key === 'Escape') {
                countrySuggestions.style.display = 'none';
            }
        });
    }
});

// Funkcje globalne dla kompatybilności
window.fetchCountries = fetchCountries;
window.fetchAndFillCountries = fetchAndFillCountries;
window.getCountryByIP = getCountryByIP;
window.getCountryCode = getCountryCode;