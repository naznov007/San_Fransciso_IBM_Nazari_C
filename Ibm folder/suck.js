function updateSS(field, value) {
    sessionStorage.setItem(field, value);
    window.dispatchEvent(new CustomEvent('ss_update', { 'detail': { 'key': field, 'newValue': value } }));
}

function addEventListeners() {
    Array.from(document.getElementById('table').children).slice(1).forEach((element) => {
        element.addEventListener(('click'), (e) => {
            document.getElementById('overlay').style.display = 'grid';
        })
    })
    document.getElementById('navigation_back').addEventListener('click', (e) => {
        const currentPage = sessionStorage.getItem('currentPage');
        updateSS('currentPage', (currentPage * 1 - 1) >= 0 ? (currentPage * 1 - 1) : (currentPage * 1))
    })
    document.getElementById('navigation_forward').addEventListener('click', (e) => {
        const currentPage = sessionStorage.getItem('currentPage');
        const maxPage = JSON.parse(sessionStorage.getItem('movies')).length / 8;
        updateSS('currentPage', (currentPage * 1 + 1) <= maxPage ? (currentPage * 1 + 1) : (currentPage * 1))
    })
    document.getElementById('overlay').addEventListener('click', () => {
        document.getElementById('overlay').style.display = 'none';

    });

    var observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio < 0.10) {
                document.getElementById('header_main_row').classList.add('inverted_colors');
                document.getElementById('header_main_row').classList.remove('default_colors');

            } else {
                document.getElementById('header_main_row').classList.add('default_colors');
                document.getElementById('header_main_row').classList.remove('inverted_colors');

            }
        });

    }, { threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 1], rootMargin: '5%' });

    observer.observe(document.getElementById('scene_1'));

    window.addEventListener('ss_update', (storageEvent) => {
        console.log(storageEvent)
        switch (storageEvent.detail.key) {
            case 'currentPage':
                Array.from(document.getElementById('navigation_page_number').children)[0].innerText = sessionStorage.getItem('currentPage') * 1 + 1;
                fillTable()
                break;
            case 'maxPages':
                Array.from(document.getElementById('navigation_page_number').children)[1].innerText = (sessionStorage['maxPages']);
                break;
        }
    });
}

function requestMovies() {
    if (!sessionStorage.getItem('movies')) {
        $.ajax({
            url: "https://data.sfgov.org/resource/yitu-d5am.json",
            type: "GET",
            data: {
                "$limit": 5000,
                "$$app_token": "AwjLtOPvvx9TNlX8bH70zuBL2"
            }
        }).done(function(data) {
            if (data.length > 1) {

                var condensedList = condenseMovies(data);
                condensedList.push(function(...args) {
                    return this.filter((value) => {
                        let condition = false;
                        for (let i = 0; i < args.length / 2; i += 2) {
                            condition = value[args[i]] == args[i + 1];
                        }
                        return condition;
                    })
                });
                updateSS('movies', JSON.stringify(condensedList));
                updateSS('currentPage', 0);
                updateSS('maxPages', Math.round(condensedList.length / 8));
                Array.from(document.getElementById('navigation_page_number').children)[1].innerText = Math.round(condensedList.length / 8);
                console.log(JSON.parse(sessionStorage.getItem('movies')));
                fillTable();
            }
        });
    } else {
        Array.from(document.getElementById('navigation_page_number').children)[0].innerText = sessionStorage.getItem('currentPage') * 1 + 1;
        Array.from(document.getElementById('navigation_page_number').children)[1].innerText = sessionStorage.getItem('maxPages');;
        fillTable()
    }
}

function condenseMovies(data) {
    var locations = [];
    const condensedList_ = data.filter((value, index, array) => {
        if (array[index + 1]) {
            if (value.title != array[index + 1].title && value.director != array[index + 1].director) {
                value.locations ? locations.push(value.locations) : null;
                value.locations = locations;
                value.director = value.director.split(/\band|&|,/);
                locations = [];
                return true;
            } else { locations.push(value.locations); return false; }
        }
    });
    return condensedList_;
}

function search(type, search_query) {
    var list = JSON.parse(sessionStorage.getItem('movies'));
    var results = [];
    switch (type) {
        case 'title':
            list.forEach(element => {
                if (element.title.startsWith(search_query)) { results.push(element) }
            });
            break;
        case 'director':
            Array.from(list).sort((a, b) => { a.director[0] - b.director[0] }).forEach(element => {
                if ((element.director).split(' ').findIndex((value) => {
                        return value.startsWith(search_query);
                    }) != -1) { results.push(element) }
            });
            break;
        case 'release_year':
            Array.from(list).sort((a, b) => a.release_year - b.release_year).forEach(element => {
                if (element.release_year >= search_query.lm && element.release_year <= search_query.um) {
                    results.push(element);
                }
            })
            break;
        case 'locations':
            list.forEach(element => {
                if (element.locations.findIndex((value) => { return value.startsWith(search_query) }) != -1) { results.push(element) }
            });
            break;
    }
    return results;
}

function fillTable() {
    const data = JSON.parse(sessionStorage.getItem('movies'));
    const currentPage = sessionStorage.getItem('currentPage');
    const table_rows = Array.from(document.getElementById('table').children);
    table_rows.splice(0, 1);
    if (table_rows.length * (currentPage * 1) < data.length) {
        for (let i = table_rows.length * currentPage, k = 0; i < table_rows.length * (currentPage * 1 + 1); i++, k++) {
            if (k < table_rows.length) {
                table_rows[k].display = 'inline-grid';
                const container = Array.from(table_rows[k].children);
                container[0].innerText = data[i].title;
                container[1].innerText = data[i].release_year;
                container[2].innerText = data[i].director[0];
            }
        }
    } else {
        const remainingEntries = table_rows.length * (currentPage * 1) - data.length;
        console.log(table_rows.length * (currentPage * 1), data.length, remainingEntries)
        for (let i = 0; i < remainingEntries; i++) {
            const container = Array.from(table_rows[i].children);
            container[0].innerText = data[i].title;
            container[1].innerText = data[i].release_year;
            container[2].innerText = data[i].director[0];
        }
        for (let i = 0; i < table_rows.length - remainingEntries; i++) {
            table_rows[table_rows.length - i].style.display = 'none';
        }
    }
}