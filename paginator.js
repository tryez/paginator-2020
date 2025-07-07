
function Pagination(settings){
	let _this = this;

    this.container = this.$(settings.container);
    if(!this.container){
        return;
    }

    this.loader_body = this.container.querySelector('.paginator-data');

    this.paginator_container = this.container.querySelector('.paginator-menu');
    this.url = settings.url;
    this.total = settings.total;
    this.renderData = settings.renderData;
    this.generateUrl = settings.generateUrl;
    this.requestMethod = settings.requestMethod || 'POST';
    this.urlGetParams = settings.urlGetParams || function(){
    	return {
	        page: _this.page,
	        max: _this.max,
	    }
    }

    const buttonBackgroundColor = settings.buttonColors?.background ? `--button-background: ${settings.buttonColors.background};` : '';
    const buttonHoverColor = settings.buttonColors?.hover ? `--button-hover-background: ${settings.buttonColors.hover};` : '';
    const buttonActiveColor = settings.buttonColors?.active ? `--button-active-background: ${settings.buttonColors.active};` : '';

    this.customStyles = buttonBackgroundColor + buttonHoverColor + buttonActiveColor;

    this.controller = null;

    this.requestParams = settings.requestParams;

    this.data = settings.initial_data || null;
    this.loading = false;

    this.extractResponseData = settings.extractResponseData;
    this.drawSkeleton = settings.drawSkeleton;


    this.page = 1;
    this.max = settings.max || 10;

    this.pages = 0;
    

    
    this.spaceLimit = settings.spaceLimit || 8;
    this.savedSpaceLimit = this.spaceLimit;

    let screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    if(screenWidth < 520){
        this.spaceLimit = 5;
    }

    this.per_page_list = settings.maxOptions ? settings.maxOptions : [5, 7, 10, 20];
    this.hidden_dropdown = true;

    
    if(this.data){
        this.updateTable(this.data);
    }else{
        this.paginate(1);
    }

    this.generatePaginationElements();

    

    Pagination.instances.push(this);



    // this.container.on('click', '.paginator-page-button', function(){
    this.on(this.container, 'click', '.paginator-page-button', function(){
        // if($(this).attr('aria-pressed') === 'true'){
        if( this.getAttribute('aria-pressed') === 'true' ){
            return;
        }
        let target_page = parseInt(this.dataset.page);
        _this.paginate(target_page);
    })



    // this.container.on('click', '.paginator-backward-button', function(){
	this.on(this.container, 'click', '.paginator-backward-button', function(){
        if(_this.page === 1){
            return;
        }
        let target_page = _this.page - 1;

        _this.paginate(target_page);
    })


    // this.container.on('click', '.paginator-forward-button', function(){
    this.on(this.container, 'click', '.paginator-forward-button', function(){	
        if(_this.page === _this.pages){
            return;
        }
        let target_page = _this.page + 1;

        _this.paginate(target_page);
    })

    
    // this.container.on('click', '.paginator-max-button', function(){
    this.on(this.container, 'click', '.paginator-max-button', function(){	
        _this.hidden_dropdown = !_this.hidden_dropdown;

        
        if(_this.hidden_dropdown){

            // _this.paginator_container.find('.paginator-dropdown').addClass('is-hidden');
            // _this.paginator_container.find('.paginator-max-button').removeClass('active-page-cell');

        	_this.findElementsAndCallback(_this.paginator_container, '.paginator-dropdown', function(){ this.classList.add('is-hidden') })
        	_this.findElementsAndCallback(_this.paginator_container, '.paginator-max-button', function(){ this.classList.remove('active-page-cell') })

            
        }else{
            // _this.paginator_container.find('.paginator-dropdown').removeClass('is-hidden');
            // _this.paginator_container.find('.paginator-max-button').addClass('active-page-cell');
            
        	_this.findElementsAndCallback(_this.paginator_container, '.paginator-dropdown', function(){ 
                
                this.classList.remove('is-hidden');

                this.style.bottom = 'auto';
                this.style.top = 'calc(100% + 8px)';

                let rect = this.getBoundingClientRect();
                
                if(rect.height + rect.top > document.documentElement.clientHeight){
                    this.style.top = 'auto';
                    this.style.bottom = 'calc(100% + 8px)';
                }
            })
        	_this.findElementsAndCallback(_this.paginator_container, '.paginator-max-button', function(){ this.classList.add('active-page-cell') })

        }
        
    })

    // this.container.on('click', '.paginator-dropdown-item', function(){
    this.on(this.container, 'click', '.paginator-dropdown-item', function(){
        _this.hidden_dropdown = true;
        let new_max = parseInt(this.dataset.id);
        if(_this.max === new_max){
            return;
        }
        _this.max = new_max;
        let target_page = 1;

        _this.paginate(target_page);
    })

  
}

Pagination.instances = [];
Pagination.forceSpaceLimit = null;
  
  
Pagination.prototype.paginate = async function(target_page){
    let _this = this;
    this.page = target_page;

    try{
        let response = await this.loadData();
        this.data = this.extractResponseData ? this.extractResponseData(response) : response.data;
        this.updateTable(this.data);
    }catch(error){
        if(error.name === "AbortError"){
            console.log('Pagination aborted.');
        }else{
            throw error;
        }
    }
    // this.generatePaginationElements();
}
  
Pagination.prototype.updateTable = function(data){
    let _this = this;
    let rows_html = '';

    if(this.renderData){
    	rows_html = this.renderData(data)
    }

    this.loader_body.innerHTML = rows_html;
}
  
Pagination.prototype.loadData = function(){
    let _this = this;
    if(this.loading){
        this.controller.abort()
    }
    this.loading = true;
    this.controller = new AbortController()

    return new Promise(function(resolve, reject){

        let url_params = _this.toQueryParam(_this.urlGetParams.apply(_this));

        _this.generatePaginationElements();

		if(_this.drawSkeleton){
    		_this.displayData(_this.drawSkeleton.apply(_this));
    	}

        let url = _this.generateUrl ? _this.generateUrl.apply(_this) : `${_this.url}?${url_params}`;

        let requestSettings = {
            method: _this.requestMethod,
            signal: _this.controller.signal,
            headers: {
              'Content-Type': _this.requestParams ? 'application/x-www-form-urlencoded' : 'application/json'
            },
        }

        if(_this.requestParams){
            requestSettings.body = new URLSearchParams(_this.requestParams.apply(_this));
        }

        fetch(url, requestSettings)
            .then(response => response.json())
            .then(response => {
                _this.loading = false;
                _this.removeProgressLoader();
                resolve(response);
            })
            .catch(error => {
                if(error.name !== "AbortError"){
                    _this.showError('INVALID REQUEST');
                }
                reject(error);
            });

    })
}

Pagination.prototype.removeProgressLoader = function(){
	this.paginator_container.querySelector('.paginator-progress-loader').remove();
}

// Pagination.prototype.displayProgressLoader = function(){
// 	// this.paginator_container.innerHTML += `
// 	// 	<div class="paginator-progress-loader" style="margin-left: 6px;">
// 	// 		<div class="paginator-progress-loader-circle" style="--loader-width: 20px;"></div>
// 	// 	</div>`;
// }

Pagination.prototype.showError = function(message){
	let error_element = document.createElement('div');
	error_element.textContent = message;
	error_element.classList.add('pagination-error-message');

	this.loader_body.innerHTML = error_element;
}
Pagination.prototype.displayData = function(data){
	this.loader_body.innerHTML = data;
}
  
Pagination.prototype.toQueryParam  = function(obj){
    var str = [];

    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            str.push(
                encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])
            );
        }
    }

    return str.join('&');
}

Pagination.prototype.on = function(parentElement, eventType, selector, callback){
	if(typeof parentElement === 'string'){
		parentElement = document.querySelector(parentElement);
	}
	parentElement.addEventListener(eventType, function(event){
		if(event.target.matches(selector)){
			callback.call(event.target, event);
		}
	})
}

Pagination.prototype.$ = function(selector){
	return document.querySelector(selector);
}

Pagination.prototype.findElements = function(selector, parentElement){
	let elements = (parentElement || document).querySelectorAll(selector);
	return Array.from(elements);
}

Pagination.prototype.findElementsAndCallback = function(parentElement, selector, callback){
	if(typeof parentElement === 'string'){
		parentElement = document.querySelector(parentElement);
	}
	let elements = parentElement.querySelectorAll(selector);
	
	elements.forEach(function(element){
		callback.apply(element);
	})
}


Pagination.prototype.generatePaginationElements = function(){
    let _this = this;
    let paginator_container = this.paginator_container;
    paginator_container.innerHTML = '';

    this.pages = Math.ceil(this.total / this.max);

    let dropdown_item_check_element = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path fill-rule="evenodd" d="M9.688 15.898l-3.98-3.98a1 1 0 00-1.415 1.414L8.98 18.02a1 1 0 001.415 0L20.707 7.707a1 1 0 00-1.414-1.414l-9.605 9.605z" clip-rule="evenodd"></path></svg>`;


    let backward_element = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" class="paginator-svg"><path fill-rule="evenodd" d="M16.091 4.929l-7.057 7.078 7.057 7.064a1 1 0 01-1.414 1.414l-7.764-7.77a1 1 0 010-1.415l7.764-7.785a1 1 0 111.415 1.414z" clip-rule="evenodd"></path></svg>`;

    let three_dot_element = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" class="paginator-svg"><path fill-rule="evenodd" d="M4.4 14a2 2 0 100-4 2 2 0 000 4zm9.6-2a2 2 0 11-4 0 2 2 0 014 0zm7.6 0a2 2 0 11-4 0 2 2 0 014 0z" clip-rule="evenodd"></path></svg>`;

    let forward_element = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" class="paginator-svg"><path fill-rule="evenodd" d="M7.913 19.071l7.057-7.078-7.057-7.064a1 1 0 011.414-1.414l7.764 7.77a1 1 0 010 1.415l-7.764 7.785a1 1 0 01-1.414-1.414z" clip-rule="evenodd"></path></svg>`;

    let paginator_pages = '';


    
    let space_available = (this.pages < this.spaceLimit ? this.pages : this.spaceLimit) - 2; 
    let off_limit_pages = this.pages > this.spaceLimit;

    let pages_to_display = space_available;

    // first page 
    if(this.pages > 0){
        let active_first_page = this.page === 1;
        paginator_pages += `
            <div class="paginator-button-cell paginator-page-button ${active_first_page ? 'active-page-cell' : ''}" aria-pressed="${active_first_page ? 'true' : 'false'}" data-page="1">
                1
            </div>
            `;
    }

    
    let first_dots = false;
    let last_dots = false;
    let starting_page = 2;


    if(off_limit_pages){
        let lower_limit = space_available - 1;
        let higher_limit = this.pages - (space_available - 2); // 3
        if(this.page > lower_limit){
            first_dots = true;
            paginator_pages += `<div class="paginator-button-cell disabled-page-cell">${three_dot_element}</div>`;
            pages_to_display--;
        }

        if(this.page < higher_limit || this.page <= lower_limit){ // 2nd part for the edge case when lower_limit == higher_limit
            last_dots = true;
            pages_to_display--;    
        }

        if(first_dots && last_dots){
            starting_page = this.page - Math.ceil((pages_to_display/2) - 1);
        
        }else if(first_dots && !last_dots){
            starting_page = higher_limit - 1; // higher_limit - 2
        }
    }


    for (let index = 0; index < pages_to_display; index++) {
        let to_generate_page = index + starting_page;
        let active = to_generate_page === this.page;


        paginator_pages += `
        <div class="paginator-button-cell paginator-page-button ${active ? 'active-page-cell' : ''}" aria-pressed="${active ? 'true' : 'false'}" data-page="${to_generate_page}">
            ${to_generate_page}
        </div>
        `;
    }


    if(last_dots){
        paginator_pages += `<div class="paginator-button-cell disabled-page-cell">${three_dot_element}</div>`;
    }


    // last page
    if(this.pages > 1){
        let active_last_page = this.page === this.pages;
        
        paginator_pages += `
        <div class="paginator-button-cell paginator-page-button ${active_last_page ? 'active-page-cell' : ''}" aria-pressed="${active_last_page ? 'true' : 'false'}" data-page="${this.pages}">
            ${this.pages}
        </div>
        `;
    }



    let dropdown_html = '';

    this.per_page_list.forEach(function(per_page){
        let is_active = per_page === _this.max;

        dropdown_html += `<div class="paginator-dropdown-item ${is_active ? 'is-active' : ''}" data-id="${per_page}">
                <span>${per_page}</span> 
                <div class="paginator-dropdown-item-check">${is_active ? dropdown_item_check_element : ''}</div>
            </div>`

        
    })

    let paginator_element = `
        <div class="main-paginator-wrapper" style="${this.customStyles}">
            <div class="main-paginator">

	            <div style="position: relative;">
	                <div class="paginator-button-cell paginator-max-button ${this.hidden_dropdown ? '' : 'active-page-cell'}" style="margin-right: 14px; cursor: pointer">
	                    Max: ${this.max}
	                </div>
	                <div class="paginator-dropdown ${this.hidden_dropdown ? 'is-hidden' : ''}">
	                    ${dropdown_html}
	                </div>
	            </div>

                <div class="paginator-button-cell paginator-backward-button paginator-arrows ${this.page === 1 ? 'disabled-page-cell' : ''}">
                ${backward_element}
                </div>

                ${paginator_pages}

                <div class="paginator-button-cell paginator-forward-button paginator-arrows ${this.page === this.pages ? 'disabled-page-cell' : ''}">
                ${forward_element}
                </div>


                ${this.loading ? `<div class="paginator-progress-loader" style="position: relative">
					<div class="paginator-progress-loader-circle" style="--loader-width: 20px;"></div>
				</div>` : ''}

            </div>
        </div>
    `;
    paginator_container.innerHTML += paginator_element;
}


Pagination.mobileResized = false;

Pagination.prototype.closeAllPops = function(){
    Pagination.instances.forEach(function(item){
        if(!item.hidden_dropdown){
            item.hidden_dropdown = true;
            item.generatePaginationElements();
        }
    })
}

Pagination.resizeForScreen = function(){

    let screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    let mobileResizeDetected = false;
    let spaceLimit = null;
    if(screenWidth < 520){
        spaceLimit = 5;
        mobileResizeDetected = true;
    }

    if(Pagination.mobileResized !== mobileResizeDetected){
        Pagination.instances.forEach(function(instance){
            instance.spaceLimit = spaceLimit ? spaceLimit : instance.savedSpaceLimit;
            instance.generatePaginationElements();
        })  

        Pagination.mobileResized = mobileResizeDetected;
    }
}

window.addEventListener('resize', Pagination.resizeForScreen);


window.addEventListener('click', function (e) {
    if(!e.target.closest('.paginator-max-button')){
        Pagination.prototype.closeAllPops();
    }
});