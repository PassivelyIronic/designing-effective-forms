let clickCount = 0;

const countryInput = document.getElementById('country');
const countryInputCode = document.getElementById('countryCode');
const myForm = document.getElementById('form');
const modal = document.getElementById('form-feedback-modal');
const clicksInfo = document.getElementById('click-count');
const vatBox = document.getElementById('vatUE');
const vatEdit = document.getElementById('vatNumber').parentElement;
const vatData = document.getElementById('invoiceData').parentElement;
const mainContainer = document.getElementById('mainContainer');

function handleClick() {
    clickCount++;
    clicksInfo.innerText = clickCount;
}

async function fetchAndFillCountries() {
    try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/positions');
        if (!response.ok) {
            throw new Error('Błąd pobierania danych');
        }
        const data = await response.json();
        const countries = data.data.map(country => country.name).sort((a, b) => a.localeCompare(b));
        countryInput.innerHTML = '<option value="">Wybierz kraj</option>' +
            countries.map(country => `<option value="${country}">${country}</option>`).join('');
    } catch (error) {
        console.error('Wystąpił błąd:', error);
    }
}

async function fillCountryCodes() {
    const response = await fetch('countries.json');

    const data = await response.json();
    const countryCodeSelect = document.getElementById('countryCode');
    countryCodeSelect.innerHTML = '<option value="">Wybierz...</option>';
    data.countries.forEach(country => {
        const code = country.code.replace(/\s+/g, ' ').trim();
        countryCodeSelect.innerHTML += `<option value="${code}">${code} (${country.name})</option>`;
    });
}

function getCountryByIP() {
    fetch('https://get.geojs.io/v1/ip/geo.json')
        .then(response => response.json())
        .then(data => {
            const country = data.country;
            const options = Array.from(countryInput.options);
            const match = options.find(opt => opt.value === country);
            if (match) {
                countryInput.value = country;
            }
            getCountryCode(country);
        })
        .catch(error => {
            console.error('Błąd pobierania danych z serwera GeoJS:', error);
        });
}

function checkVat() {
    vatEdit.hidden = !vatBox.checked;
    vatData.hidden = !vatBox.checked;
}

async function getCountryCode(countryName) {
    const response = await fetch('countries.json');
    if (!response.ok) {
        console.error('Błąd pobierania countries.json');
        return;
    }
    const data = await response.json();

    const country = data.countries.find(
        c => c.name.toLowerCase() === countryName.toLowerCase()
    );
    if (!country) {
        console.warn('Nie znaleziono kraju:', countryName);
        return;
    }

    const countryCodeSelect = document.getElementById('countryCode');
    if (countryCodeSelect) {
        countryCodeSelect.value = country.code;
    }
}

async function changeDialCode() {
    const countrySelect = document.getElementById('country');
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    const countryName = selectedOption.text;
    await getCountryCode(countryName);

}

(() => {
    countryInput.addEventListener('change',changeDialCode);
    document.addEventListener('click', handleClick);
    vatBox.addEventListener('change', checkVat);
    mainContainer.addEventListener("keypress", function(event) { if (event.key === "Enter") { event.preventDefault(); document.getElementById("submitButton").click();      
}
});
    fetchAndFillCountries();
    fillCountryCodes();
    getCountryByIP();
})()
