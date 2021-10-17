function createElement(type, options) {
    var element = document.createElement(type);
    element.classList.add(options.class ? options.class : '');
    element.id = options.id ? options.id : '';
    element.innerHTML = options.innerHTML ? options.innerHTML : '';
    element.innerText = options.innerText ? options.innerText : '';
    if (options.data) element.dataset[options.data.attribute] = options.data.value;
    return element;
}

function updateSS(field, value) {
    sessionStorage.setItem(field, value);
    window.dispatchEvent(new CustomEvent('ss_update', { 'detail': { 'key': field, 'newValue': value } }));
}

function displayInfoCard(element) {
    console.log(element);
    document.getElementById('overlay').style.display = 'grid';
    const { title, release_year, locations, fun_facts, production_company, director, writer, actor_1, actor_2, actor_3 } = JSON.parse(element.dataset.movieData);
    console.log(JSON.parse(element.dataset.movieData))
    document.getElementById('card_title').innerText = title;
    Array.from(document.getElementById('card_production_company').children)[0].innerText = production_company;
    Array.from(document.getElementById('card_release_year').children)[0].innerText = release_year;
    Array.from(document.getElementById('card_director').children)[0].innerText = director;
    document.getElementById('card_locations').innerHTML = locations.length >= 1 ? 'Locations: <div>' + locations + '</div>' : '';
};

function addEventListeners() {
    document.getElementById('search_bar').onsubmit = (e) => {
        e.preventDefault();
        const q = e.target.elements[0].value
        if (q) {
            const results = search('title', q);
            updateSS('currentList', JSON.stringify(results));
            updateSS('maxPages', Math.round(results.length / 8) != 0 ? Math.round(results.length / 8) : 1);
            updateSS('currentPage', 0)
            document.getElementById('scene_2').scrollIntoView({ behavior: 'smooth' })


        } else {
            updateSS('maxPages', Math.round(JSON.parse(sessionStorage.getItem('movies')).length / 8));
            updateSS('currentList', sessionStorage.getItem('movies'));
            updateSS('currentPage', 0)
        }
    }
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
                // condensedList.push(function(...args) {
                //     return this.filter((value) => {
                //         let condition = false;
                //         for (let i = 0; i < args.length / 2; i += 2) {
                //             condition = value[args[i]] == args[i + 1];
                //         }
                //         return condition;
                //     })
                // });
                updateSS('movies', JSON.stringify(condensedList));
                updateSS('currentList', JSON.stringify(condensedList));
                updateSS('currentPage', 0);
                updateSS('maxPages', Math.round(condensedList.length / 8));
                Array.from(document.getElementById('navigation_page_number').children)[1].innerText = Math.round(condensedList.length / 8);
                console.log(JSON.parse(sessionStorage.getItem('movies')));
                fillTable();
            }
        });
    } else {
        updateSS('currentPage', sessionStorage.getItem('currentPage'));
        updateSS('maxPages', sessionStorage.getItem('maxPages'));
        updateSS('currentList', sessionStorage.getItem('movies'));
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
                if (element.title.toLowerCase().startsWith(search_query.toLowerCase())) { results.push(element) }
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
    //const data = JSON.parse(sessionStorage.getItem('movies'));
    const data = JSON.parse(sessionStorage.getItem('currentList'));
    const currentPage = sessionStorage.getItem('currentPage');
    const table_rows_container = document.getElementById('table_rows_container');
    let table_rows = [];
    for (let i = 8 * currentPage, k = 0; k < 8; i++, k++) {
        if (data[i]) {
            const title = createElement('div', { 'class': 'table_name', 'innerText': data[i].title });
            const ry = createElement('div', { 'class': 'table_year', 'innerText': data[i].release_year });
            const director = createElement('div', { 'class': 'table_director', 'innerText': data[i].director[0] });
            var row = createElement('div', { 'class': 'row', 'data': { 'attribute': 'movieData', 'value': JSON.stringify(data[i]) } });
            row.replaceChildren(...[title, ry, director])
            row.onclick = function() {
                displayInfoCard(this);
            }
            table_rows.push(row);
        }
    }
    table_rows_container.replaceChildren(...table_rows);
}