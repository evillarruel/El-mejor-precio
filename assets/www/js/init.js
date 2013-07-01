$(document).ready(function(){
	Zepto(function($){
		get_location();
		uiPageSet();
	})
	
});
/*
this.addLocation = function(event) {
    event.preventDefault();
    console.log('addLocation');
    navigator.geolocation.getCurrentPosition(
        function(position) {
            $('.location', this.el).html(position.coords.latitude + ',' + position.coords.longitude);
        },
        function() {
            alert('Error getting location');
        });
    return false;
};
*/
var MELI_URL = "https://api.mercadolibre.com";
var query;
var queryResults;
var offset = 0;
var limit = 0;
var lowestPrice;
var maximumPrice;
var distance;
var itemsShown = {};
var itemsFavoriteShown = {};
var userPoint = {};
var parentPage = '#index';
var states = new Array();
var recentsQuerys = new Array();
var itemFavirite = new Array();
var condition = 'new';
//stateId = "AR-C";
var filterState;

function uiPageSet() {
	wrapperHeight = $(window).height()
	$('.wrapper-page').height(wrapperHeight);
}
$.fn.enterKey = function (fnc) {
    return this.each(function () {
        $(this).keypress(function (ev) {
            var keycode = (ev.keyCode ? ev.keyCode : ev.which);
            if (keycode == '13') {
                fnc.call(this, ev);
            }
        })
    })
}

function get_location() {
	navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
}

function geoSuccess(point) {
	userPoint.latitude = point.coords.latitude;
	userPoint.longitude = point.coords.longitude;
	/*eliminar*/
	//userPoint.latitude = '-31.3526556'; 
	//userPoint.longitude = '-64.2460254';
	loadCountries();
}
function geoError() {
	navigator.notification.alert(
		'Intenta activar tu GPRS o conectarse a una red movil.',      // (message)
		alertDismissed,         										// (alertCallback)
		'No podemos encontrar tu ubicaci\u00f3n',            							// (title)
		'Ok'                											// (buttonName)
	);
}
function doGet(pathUrl, callback, asynch) {
	if (!asynch) {
		asynch = false;
	}
	$.ajax({
		type: 'GET',
		url: pathUrl,
		dataType: 'json',
		async: asynch,
		success:callback,
		error: function(xhr, type){
			navigator.notification.alert(
				'Intenta activar tu conexi\u00f3n a una red movil o WiFi.',      // (message)
				alertDismissed,         										// (alertCallback)
				'No tiene conexi\u00f3n a una red!',            							// (title)
				'Ok'                											// (buttonName)
			);
		}
	})
};
function categoriesList() {
	doGet(MELI_URL+'/sites/MLA/categories', categorieSet);
}
function loadCountries() {
	doGet('./statesJson.txt', locationSet);
	loadDropStates();
}

function locationSet(data) {
	nearestState = data[0];
	var nearestCity = data[0].cities[0];
	nearestCity.distance = getModule(nearestCity, userPoint);
	
	for (var i=1; i < data.length; i++) {
		var state = {};
		state.name = data[i].name;
		state.id = data[i].id;
		states[i-1] =  state;
		for (var j=0; j < data[i].cities.length; j++) {
			cityAux = data[i].cities[j];
			cityAux.distance = getModule(cityAux, userPoint);
			if (nearestCity.distance > cityAux.distance) {
				nearestCity = cityAux;
				nearestState = data[i];
				stateId = nearestState.id;
				filterState ='&state='+stateId;
				break;
			}        
		}
	}
	$('.state').html(nearestState.name);
	$('.location').animate({
		opacity: 1
	}, 200);
}
function getNearestCity(states) {
	var nearestCity = states[0].cities[0];
	for (var i=0; i < states.length; i++) {
	    for (var j=0; j < states[i].cities.length; j++) {
	        if (nearestCity.distance > states[i].cities[j].distance) {
	            nearestCity = states[i].cities[j];
	        }        
	    }
	}
	return nearestCity;
}

function countriesSet(data) {
	var statesML = data.states;
	var states = new Array(statesML.length);
	for (var i=0; i< statesML.length; i++) {
		state = {};
		state.name = statesML[i].name;
		state.id = statesML[i].id;
		state.cities;
		doGet(MELI_URL+'/states/'+state.id, citieSet);
		states[i] = state;
	}
	var min = states[0].cities[0];
	for (var i=0; i < states.length; i++) {
	    for (var j=0; j < states[i].cities.length; j++) {
	        if (min.distance > states[i].cities[j].distance) {
	            min = states[i].cities[j];
	        }
	    }
	}
	$('.locations-list ul').append(states)
}
function citieSet(data) {
	state.cities = data.cities;
	for (var i=0; i< data.cities.length; i++) {
		var city= {};
		city.name = state.cities[i].name;
		city.id = state.cities[i].id;
		city.latitude;
		city.longitude;
		city.stateName;
		city.stateId;
		doGet(MELI_URL+'/cities/'+city.id, citieDataSet);
		city.distance = getModule(city,userPoint);
		state.cities[i] = city;
	}
}
function citieDataSet(data) {
	var geo_information = data.geo_information;
	if (geo_information != null) {
		city.latitude = geo_information.location.latitude;
		city.longitude = geo_information.location.longitude;
	}
	city.stateName = data.state.name;
	city.stateId = data.state.id;
}

function getModule(city, userPoint) {
	return	Math.sqrt(Math.pow((userPoint.latitude-city.latitude),2) + Math.pow((userPoint.longitude-city.longitude),2));
}

function alertDismissed() {
    // action
}


$(".labelSearch").enterKey(function () {
	$('#index .loading').show();
	$(".labelSearch").blur();
	search();
	$('.interLabelSearch').attr('placeholder', query);
});
$('#productList .interLabelSearch').enterKey(function () {
	$('#productList .loading').show();
	query = $('#productList .interLabelSearch').val();
	$("#productList .interLabelSearch").blur();
	$('.interLabelSearch').val('').attr('placeholder', query);
	searchQuery();
});
$('#productDetails .interLabelSearch').enterKey(function () {
	$('#productDetails .loading').show();
	query = $('#productDetails .interLabelSearch').val();
	$("#productDetails .interLabelSearch").blur();
	$('.interLabelSearch').val('').attr('placeholder', query);
	searchQuery();
	getPage(productDetails, productList);
	$('.ch-carousel .slide li img').animate({opacity:0},0)
});

$(".btn-location").click(function () {
	$('.page').removeClass('active');
	$('#setLocations').addClass('active')
});
$(".btn-information").click(function () {
	$('.page').removeClass('active');
	$('#appinfo').addClass('active')
});
$(".btn-favorite").click(function () {
	$('.page').removeClass('active');
	$('#favorites').addClass('active');
	$(".favorites-list ul").html('');
	setFavorites();
});
$(".btn-recents").click(function () {
	$('.page').removeClass('active');
	$('#recentSerch').addClass('active')
	loadRecentQuerys()
});
function setFavorites () {
	if ( localStorage.hasOwnProperty('itemFavirite') == true) {
		itemFavirite = JSON.parse(localStorage.itemFavirite);
		var i =  itemFavirite.length;
		var itemsList ="";
		for (var index=0; index < i; index++) {
			itemsList = itemsList+itemFavirite[index]+','
		}
		itemsList = itemsList.substring(0,itemsList.length-1);
		doGet(MELI_URL+'/items?ids='+itemsList, renderFavorites, true);
	}else{
		i = 0;
		$('.favorites-list .list-result-alert').show().animate({
		    opacity: 1
		}, 100);
	}
}
function renderFavorites(data){
	var results = {
	    items: data
	}
	for (var i=0; i < data.length; i++) {
		itemsShown[data[i].id] = data[i];
	}
	var item = $(".tmp-favorites-item").html();
	$(".favorites-list ul").html(Mustache.render( item, results));
}
function deleteItem(item){
	var itenIndex = itemFavirite.indexOf(item.id);
	itemFavirite.splice(itenIndex,1);
	var item = '#'+item.id;
	$(item).remove()
	localStorage.itemFavirite = JSON.stringify(itemFavirite);
}
function showBtnDelet (obj) {
	var item = '#'+obj.id;
	var btnDelete = item + ' .icon-delete';
	$(btnDelete).animate({
	    opacity: 1,
	    right: '0'
	}, 200);
	$(item+' .wrap-item').animate({
	    opacity: 0.4
	}, 100);
}
function hideBtnDelet (obj) {
	var item = '#'+obj.id;
	var btnDelete = item + ' .icon-delete';
	$(btnDelete).animate({
	    opacity: 0,
	    right: '-60px'
	}, 200);
	$(item+' .wrap-item').animate({
	    opacity: 1
	}, 100);
}
function cloneDropStates() {
	var dropStates = $('.btn-geolocation').html();
	$('.header').append(dropStates);
}
function search() {
	query = $('.labelSearch').val();
	var control = searchQuery();
	if (control != false) {
		setTimeout('getPage(index , productList)',1000);
	}else{
		msg();
		$('.labelSearch').val("");
		$('.loading').hide();
	}
}
function getPage(current, nextPage) {
	$(current).removeClass('active');
	$(nextPage).addClass('active');
}

function loadDropStates(){
	var obj = {};
	obj.states = states;
	var statesData = $('.tmp-states').html();
	$('.locations-list ul').append(Mustache.render( statesData, obj));

	$('.locations-list ul li a').on('click',function() {
		stateId = $(this).attr('id');
		if (stateId != 'all'){
			filterState ='&state='+stateId;
		}else{
			filterState ='';
		}
		$('.state').html($(this).html());
	});
}

function searchQuery() {
	var standardDeviation = getPrices();
	lowestPrice = Math.abs(standardDeviation.media-standardDeviation.deviation);
	maximumPrice = Math.abs(standardDeviation.media+standardDeviation.deviation);
	if (standardDeviation.results == 0) {
		var actionPage = false;
		return actionPage;
	}else{
		offset = 0;
		limit = 5;
		loadSearchQuery(renderResultsSet);
	}
	recentLocalStorage();
}

function recentLocalStorage() {
	if ( localStorage.hasOwnProperty('recentsQuerys') == true) {
		var i = JSON.parse(localStorage.recentsQuerys).length;
		recentsQuerys = JSON.parse(localStorage.recentsQuerys);
	}else{
		i = 0;
	}
	var obj = {};
	obj.query = query;
	recentsQuerys[i]= obj;
	localStorage.recentsQuerys = JSON.stringify(recentsQuerys);
	var querys = JSON.parse(localStorage.recentsQuerys);
}
function loadRecentQuerys(){
	if ( localStorage.hasOwnProperty('recentsQuerys') == true) {
		var i = JSON.parse(localStorage.recentsQuerys).length;
		recentsQuerys = JSON.parse(localStorage.recentsQuerys);
		$('.recent-top').show().animate({
		    opacity: 1
		}, 100);
	}else{
		$('.recent-list .list-result-alert').show().animate({
		    opacity: 1
		}, 100);
	}
	renderRecentSerch(recentsQuerys);
}
function renderRecentSerch(data){
	var obj = {};
	obj.recentsQuerys = data;
	var recentSerch = $(".tmp-recents").html();
	$(".recent-list ul").html(Mustache.render( recentSerch, obj))
	$('.recent-list ul li a').click(function () {
		query= $(this).attr('id');
		serchRecentQuery()
	});
}
function serchRecentQuery(){
	$("#productList .interLabelSearch").blur();
	$('.interLabelSearch').val('').attr('placeholder', query);
	searchQuery();
	$('.page').removeClass('active');
	$('#productList').addClass('active')
}
function removeLocalStorage() {
	localStorage.removeItem('recentsQuerys');
}
function rewriteLocalStorageFavorites(id) {
	if ( localStorage.hasOwnProperty('itemFavirite') == true) {
		var i = JSON.parse(localStorage.itemFavirite).length;
		itemFavirite = JSON.parse(localStorage.itemFavirite);
	}else{
		i = 0;
	}
	var itemId = {};
	itemId = id;
	itemFavirite[i]= itemId;
	localStorage.itemFavirite = JSON.stringify(itemFavirite);
	var querys = JSON.parse(localStorage.itemFavirite);
}
function msg() {
	alert('error');
}
function getPrices() {
	var retVal = {};
	doGet(MELI_URL+'/sites/MLA/search?q='+ query +filterState+'&condition='+condition,
		function(data) {
			var n = data.results.length;
			var add = 0;
			var desviacionDato;
			for (var i=0; i< n; i++) {
				add+= data.results[i].price;
			}
			var media = add/n;
			add = 0;
			for (var i=0; i< n;) {
				add+= Math.pow(data.results[i].price-media, 2 )
				i++;
			}
			if (add != 0) {
				desviacionDato = Math.sqrt(add/(n-1))
			}else{
				desviacionDato = 0;
			}
			retVal.results = n;
			retVal.deviation = desviacionDato;
			retVal.media = media;
		}
	);
	return retVal;
}
function loadSearchQuery(renderSet) {
	doGet(MELI_URL+'/sites/MLA/search?q='+query+filterState+'&condition='+condition+'&sort=price_asc&price='+lowestPrice+'-'+maximumPrice+'&offset='+offset+'&limit='+limit, renderSet);
}

function renderResultsSet(data){
	addItemsToHash(data.results);
	queryResults = $(".tmp-item").html();
	$(".products").html('');
	$(".products").html(Mustache.render( queryResults, data))
	$(".products li").show();
	$('#productList .loading').hide();
	$('#productDetails .loading').hide();
	$('.list-result-alert').hide();
	$('.load-more').show();
}
function renderAddResultsSet(data){
	var lastItem = data.paging.total-data.paging.offset;
	if (lastItem >= 0) {
		addItemsToHash(data.results);
		$(".products").append(Mustache.render( queryResults, data));
		$(".products li").show();
	}else{
		i = limit;
		$('.list-result-alert b').html(query);
		$('.list-result-alert').show().animate({opacity:1}, 200);
		$('.load-more').hide();
	}
}
function addItemsToHash(items) {
	for (var i=0; i < items.length; i++) {
		if ( items[i].condition == "new" ) {
			items[i].condition = "nuevo";
		}else{
			items[i].condition = "usado";
		}
		itemsShown[items[i].id] = items[i];
	}
}
function viewItem(obj) {
	var objId = obj.parentElement.id;
	var objClass = obj.parentElement.className;
	$('.page').removeClass('active');
	$('#productDetails').addClass('active')
	var itemData = $('.tmp-details').html();
	var itemTitle = $('.tmp-title-product').html();
	$('.item-details').html(Mustache.render( itemData, itemsShown[objId]));
	$('.product-info').html(Mustache.render( itemTitle ,itemsShown[objId]) );
	doGet(MELI_URL+'/items/'+objId, imagesCarouselSet, true);
	parentPage = '#'+$('.'+objClass).parents('.page').attr('id');
}
function imagesCarouselSet(data) {
	var carouselTmp = $('.tmp-carousel').html();
	$('.slide').html(Mustache.render( carouselTmp, data));
	carouselSet(data.pictures.length);
	$('.ch-carousel .slide li img').animate({opacity:1}, 200)
}
function carouselSet(index) {
	var sliderWidth = ($(window).width()/100)*60;
	var paddingSlider = ($('.ch-carousel ul li').css('padding').replace('px',''))*2;
	var totalWidth = (sliderWidth+paddingSlider)*index;
	var limit = totalWidth - (sliderWidth+paddingSlider);
	$('.ch-carousel').width(sliderWidth)
	$('.ch-carousel ul').width(totalWidth);
	$('.ch-carousel ul li').width(sliderWidth);
	$('.ch-carousel-next').show();
	
	$('.ch-carousel-next').click(function(){
		position = $('.ch-carousel ul').css('left').replace('px','');
		if (position != (-limit)) {
			var moveNext= (position*1)-(sliderWidth+paddingSlider);
			$('.ch-carousel-prev').show();
			$('.ch-carousel ul').animate({
				left: (moveNext)+'px'
			}, 250);	
		}else{
			$('.ch-carousel-next').hide();
		}
	});
	$('.ch-carousel-prev').click(function(){
		position = $('.ch-carousel ul').css('left').replace('px','');
		if (position != '0') {
			var movePrev= (position*1)+(sliderWidth+paddingSlider);
			$('.ch-carousel-next').show();
			$('.ch-carousel ul').animate({
				left: movePrev+'px'
			}, 250);	
		}else{
			$('.ch-carousel-prev').hide();
		}
		
	});	
	
	$('.item-details').swipeLeft(function(){
		position = $('.ch-carousel ul').css('left').replace('px','');
		if (position != (-limit)) {
			var moveNext= (position*1)-(sliderWidth+paddingSlider);
			$('.ch-carousel-prev').show();
			$('.ch-carousel ul').animate({
				left: (moveNext)+'px'
			}, 250);	
		}else{
			$('.ch-carousel-next').hide();
		}
	});
	$('.item-details').swipeRight(function(){
		position = $('.ch-carousel ul').css('left').replace('px','');
		if (position != '0') {
			var movePrev= (position*1)+(sliderWidth+paddingSlider);
			$('.ch-carousel-next').show();
			$('.ch-carousel ul').animate({
				left: movePrev+'px'
			}, 250);	
		}else{
			$('.ch-carousel-prev').hide();
		}
		
	});	
	
	
	
}
$('#productList .icon-back').click(function(){
	getPage(productList, index);
	$('#index .loading').hide();
});

$('#productDetails .icon-back').click(function(){
	$('.page').removeClass('active');
	$(parentPage).addClass('active')
	$('.ch-carousel .slide li img').animate({opacity:0},0)
});

$('.page.simple .icon-back').click(function(){
	$('.page').removeClass('active');
	$('#index').addClass('active')
	$('#index .loading').hide();
});
$('.used').click(function(){
	condition = 'used';
	$('.new').removeClass('active');
	$('.used').addClass('active');	
	searchQuery();
});
$('.new').click(function(){
	condition = 'new';
	$('.used').removeClass('active');
	$('.new').addClass('active');	
	searchQuery();
});
function goProduct(url){
	location.href=url;
}
function loadItems() {
	offset=offset+5;
	loadSearchQuery(renderAddResultsSet);
}











