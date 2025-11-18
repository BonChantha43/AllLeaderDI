document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const tableBody = document.getElementById('tableBody');
    const totalCount = document.getElementById('totalCount');
    const maleCount = document.getElementById('maleCount');
    const femaleCount = document.getElementById('femaleCount');
    const printButton = document.getElementById('printButton');
    const loader = document.getElementById('loader');

    // --- Google Sheet Details ---
    const SHEET_ID = '1_Kgl8UQXRsVATt_BOHYQjVWYKkRIBA12R-qnsBoSUzc';
    const SHEET_NAME = 'បញ្ជឺឈ្មោះរួម';
    const FILTER_ROLE = 'ប្រធានក្រុម-DI'; // តួនាទីដែលត្រូវត្រងយក

    // --- Google Visualization API URL ---
    const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

    // --- Column Index Mapping (Zero-based) ---
    // E = 4, G = 6, L = 11, N = 13, S = 18, W = 22
    const COL_ID = 4;
    const COL_GROUP = 6;
    const COL_NAME = 11;
    const COL_GENDER = 13;
    const COL_ROLE = 18;
    const COL_TELEGRAM = 22;

    /**
     * Fetches and processes data from Google Sheet
     */
    async function fetchData() {
        loader.classList.add('active');
        tableBody.innerHTML = ''; // Clear previous data

        try {
            const response = await fetch(URL);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            let text = await response.text();
            
            // Need to parse the JSONP response from Google
            const json = JSON.parse(text.substring(47, text.length - 2));
            
            const rows = json.table.rows;
            const filteredData = [];
            let male = 0;
            let female = 0;

            // Start from index 8 to skip headers (since user specified row 9)
            for (let i = 8; i < rows.length; i++) {
                const row = rows[i].c; // Get cells for the current row
                
                // Helper to get cell value, handling nulls
                const getCellVal = (index) => (row[index] ? row[index].v : null);

                const role = getCellVal(COL_ROLE);

                // Filter by role
                if (role === FILTER_ROLE) {
                    const gender = getCellVal(COL_GENDER);
                    
                    filteredData.push({
                        id: getCellVal(COL_ID),
                        name: getCellVal(COL_NAME),
                        gender: gender,
                        group: getCellVal(COL_GROUP),
                        role: role,
                        telegram: getCellVal(COL_TELEGRAM)
                    });

                    // Count gender (Assuming Khmer text)
                    if (gender === 'ប្រុស') {
                        male++;
                    } else if (gender === 'ស្រី') {
                        female++;
                    }
                }
            }
            
            renderTable(filteredData);
            updateStats(filteredData.length, male, female);

        } catch (error) {
            console.error('Error fetching data:', error);
            loader.innerHTML = '<p style="color: red;">Error: Could not load data. Please check the sheet link or your connection.</p>';
        } finally {
            loader.classList.remove('active');
        }
    }

    /**
     * Renders the data into the HTML table
     */
    function renderTable(data) {
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No matching data found.</td></tr>';
            return;
        }

        data.forEach((item, index) => {
            // Format Telegram link
            let telegramLink = 'N/A';
            if (item.telegram) {
                // Remove "@" if it exists, as t.me doesn't need it
                const username = item.telegram.replace('@', '');
                telegramLink = `<a href="https://t.me/${username}" target="_blank">${item.telegram}</a>`;
            }

            const tr = document.createElement('tr');
            
            // <<< ថ្មី (NEW) >>> - បាន​ប្តូរ​លំដាប់ "ឈ្មោះ" និង "ID"
            tr.innerHTML = `
                <td data-label="ល.រ">${index + 1}</td>
                <td data-label="ឈ្មោះ (Name)">${item.name || ''}</td>
                <td data-label="ID">${item.id || ''}</td>
                <td data-label="ភេទ (Sex)">${item.gender || ''}</td>
                <td data-label="ក្រុម (Group)">${item.group || ''}</td>
                <td data-label="តួនាទី (Role)">${item.role || ''}</td>
                <td data-label="Telegram">${telegramLink}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    /**
     * Updates the statistic cards
     */
    function updateStats(total, male, female) {
        totalCount.textContent = total;
        maleCount.textContent = male;
        femaleCount.textContent = female;
    }

    // --- Event Listeners ---
    printButton.addEventListener('click', () => {
        window.print();
    });

    // --- Initial Load ---
    fetchData();
});