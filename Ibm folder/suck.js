
function requestMovies(){
    $.ajax({
        url: "https://data.sfgov.org/resource/yitu-d5am.json",
        type: "GET",
        data: {
          "$limit" : 5000,
          "$$app_token" : "AwjLtOPvvx9TNlX8bH70zuBL2"
        }
    }).done(function(data) {
      alert("Retrieved " + data.length + " records from the dataset!");
      if(data.length>1){
        
        var condensedList = condenseMovies(data);
        condensedList.push(function (...args) { 
            return this.filter((value) => { 
                let condition = false; 
                for (let i = 0; i < args.length / 2; i += 2) { 
                    condition = value[args[i]] == args[i + 1]; 
                } 
                return condition; 
            }) 
        });
        sessionStorage.setItem('movies',JSON.stringify(condensedList));
        console.log(JSON.parse(sessionStorage.getItem('movies')))
      }
    });
}
function condenseMovies(data){
    var locations = []; 
    const condensedList_ = data.filter((value, index, array) => { 
        if (array[index + 1]) { 
            if (value.title != array[index + 1].title && value.director != array[index + 1].director) { 
                value.locations ? locations.push(value.locations) : null; 
                value.locations = locations; 
                locations = []; 
                return true; 
            } else { locations.push(value.locations); return false; } 
        } 
    });
    return condensedList_;
}
// var locations = []; 
// const condensedList = sessionStorage.getItem('movies').filter((value, index, array) => { 
//     if (array[index + 1]) { 
//         if (value.title != array[index + 1].title && value.director != array[index + 1].director) { 
//             value.locations ? locations.push(value.locations) : null; 
//             value.locations = locations; 
//             locations = []; 
//             return true; 
//         } else { locations.push(value.locations); return false; } 
//     } 
// }) 
function search(type, search_query) { 
    var list = JSON.parse(sessionStorage.getItem('movies'));
    var results=[]; 
    switch (type) { 
        case 'title': 
            list.forEach(element => { 
                if (element.title.startsWith(search_query)) { results.push(element) } 
            }); 
            break; 
            case 'director': 
            Array.from(list).sort((a,b)=>{a.director[0] - b.director[0]}).forEach(element => { 
                if ((element.director).split(' ').findIndex((value)=>{ 
                    return value.startsWith(search_query); 
                }) != -1) { results.push(element) } 
            }); 
            break;
        case 'release_year': 
            Array.from(list).sort((a,b)=>a.release_year - b.release_year).forEach(element=>{ 
                if(element.release_year >= search_query.lm && element.release_year <= search_query.um){ 
                    results.push(element); 
                } 
            }) 
            break; 
        case 'locations': 
            list.forEach(element => { 
                if (element.locations.findIndex((value) => { return value.startsWith(search_query)}) != -1) { results.push(element) } 
            }); 
            break; 
    } return results; 
} 
function fillTable(){
    const data = JSON.parse(sessionStorage.getItem('movies'));
    const table_sections = Array.from(document.getElementById('table').children);
      table_sections.splice(0,1);
      for(let i = 0; i< table_sections.length; i++){
        const container = Array.from(table_sections[i].children);
        container[0].innerText = data[i].title;
        container[1].innerText= data[i].release_year;
        container[2].innerText = data[i].director;
      }
  }
