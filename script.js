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

function handleKeyPress() {
    keyCount++;
    if (keyCountSpan) {
        keyCountSpan.textContent = keyCount;
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