// ==UserScript==
// @name         MangaDex MAL & MU Search Tool
// @version      1.0.3
// @author       Hajile-Haji
// @homepage     https://github.com/Hajile-Haji/mangadex-scripts
// @updateURL    https://raw.githubusercontent.com/Hajile-Haji/mangadex-scripts/master/mal-and-mu-search-tool.user.js
// @downloadURL  https://raw.githubusercontent.com/Hajile-Haji/mangadex-scripts/master/mal-and-mu-search-tool.user.js
// @match        https://mangadex.org/manga/*
// @grant        none
// ==/UserScript==

(() => {
	'use strict';
	const d = document,
		form = d.getElementById('manga_edit_form'),
		title = d.getElementById('manga_name'),
		mal = d.getElementById('manga_mal_id'),
		mu = d.getElementById('manga_mu_id')

	// Return if there's no edit form
	if (form === null) return


	// ==========================================
	// Begin Varibles
	// ==========================================


	let modal,
		fixMarkup,
		renderModal,
		createFoundItems,
		createElementsFromArray,
		populateModal,
		cleanModal,
		getJSONPData,
		modalElements = [{
			name: 'modal',
			element: 'div',
			classes: 'modal fade',
			id: 'linkingSearchResults',
			attributes: {
				tabIndex: -1,
				role: 'dialog'
			}
		}, {
			name: 'modalDialog',
			element: 'div',
			classes: 'modal-dialog',
			attributes: {
				role: 'document'
			}
		}, {
			name: 'modalContent',
			element: 'div',
			classes: 'modal-content'
		}, {
			name: 'modalHeader',
			element: 'div',
			classes: 'modal-header'
		}, {
			name: 'modalBody',
			element: 'div',
			classes: 'modal-body'
		}, {
			name: 'closeButton',
			element: 'button',
			classes: 'close',
			aria: {
				label: 'close'
			},
			data: {
				dismiss: 'modal'
			},
			attributes: {
				type: 'button'
			}
		}, {
			name: 'closeButtonIcon',
			element: 'span',
			aria: {
				hidden: 'true'
			}
		}, {
			name: 'modalTitle',
			element: 'h4',
			classes: 'modal-title'
		}]


	// ==========================================
	// End Variables
	// ==========================================


	// ==========================================
	// Begin Functions
	// ==========================================

	createElementsFromArray=function createElementsFromArray(a){var b={};return a.forEach(function(c){var d;if('textNode'===c.element)return d=document.createTextNode(c.text),void b.push(d);if(d=document.createElement(c.element),c.id&&(d.id=c.id),c.classes&&d.classList.add.apply(d.classList,c.classes.split(' ')),c.attributes)for(var e in c.attributes)d.setAttribute(e,c.attributes[e]);if(c.aria)for(var f in c.aria)d.setAttribute('aria-'+f,c.aria[f]);if(c.data)for(var g in c.data)d.dataset[g]=c.data[g];b[c.name]=d}),b};

	fixMarkup = (input, name, callback) => {
		const inputGroup = d.createElement('div'),
			btnWrap = d.createElement('span'),
			btn = d.createElement('button'),
			spinner = d.createElement('i')

		inputGroup.classList.add('input-group')
		btnWrap.classList.add('input-group-btn')

		btn.type = 'button'
		btn.classList.add('btn', 'btn-default', 'linking-search-btn')
		btn.innerText = `Find on ${name}`

		spinner.classList.add('fas', 'fa-spinner', 'fa-pulse', 'hide')
		btn.appendChild(spinner)

		input.parentNode.appendChild(inputGroup)
		inputGroup.appendChild(input)
		inputGroup.appendChild(btnWrap)
		btnWrap.appendChild(btn)

		btn.addEventListener('click', e => {
			spinner.classList.remove('hide')
			callback(name, spinner)
		})
	}

	renderModal = () => {
		let el = createElementsFromArray(modalElements)

		el.modal.appendChild(el.modalDialog)
		el.modalDialog.appendChild(el.modalContent)
		el.modalContent.appendChild(el.modalHeader)
		el.modalHeader.appendChild(el.modalTitle)
		el.modalTitle.appendChild(el.closeButton)
		el.closeButton.appendChild(el.closeButtonIcon)
		el.closeButtonIcon.innerHTML = '&times;'
		el.modalContent.appendChild(el.modalBody)

		d.body.appendChild(el.modal)

		return {
			modal: el.modal,
			title: el.modalTitle,
			body: el.modalBody
		}
	}

	createFoundItems = (items, callback) => {
		let results = d.createElement('ul')
		results.classList.add('linking-search-results')

		items.forEach(item => {
			let resultItem = d.createElement('li'),
				resultLink = d.createElement('a'),
				resultImg = d.createElement('img'),
				htmlEntitize = d.createElement('div')

			resultItem.appendChild(resultLink)
			resultLink.href = item.id
			resultLink.dataset.id = item.id
			if (item.image_url) {
				resultLink.appendChild(resultImg)
				resultImg.src = item.image_url
			} else {
				let url = `https://www.mangaupdates.com/series.html?id=${item.id}`,
					pageLink = d.createElement('a')
				pageLink.classList.add('fas', 'fa-link', 'pull-right')
				pageLink.title = 'View at MangaUpdates'
				pageLink.href = url
				pageLink.target = '_blank'
				resultItem.appendChild(pageLink)
			}
			htmlEntitize.innerHTML = item.title
			resultLink.appendChild(d.createTextNode(htmlEntitize.innerText))
			results.appendChild(resultItem)

			resultLink.addEventListener('click', e => callback(e))
		})

		return results
	}

	populateModal = (searchItems, spinner, name) => {
		modal.title.innerText = `Finding results for: ${name === 'MAL' ? 'MyAnimeList' : 'MangaUpdates'}`
		modal.body.appendChild(searchItems)
		$(modal.modal).modal('show')
		spinner.classList.add('hide')
		if (name === 'MAL') {
			modal.modal.classList.add('view-grid')
			modal.modal.classList.remove('view-list')
		} else {
			modal.modal.classList.add('view-list')
			modal.modal.classList.remove('view-grid')
		}
	}

	cleanModal = (e, name) => {
		e.preventDefault()

		let id = e.target.closest('a').dataset.id.match(/\d+/g)[0]

		if (name === 'MAL')
			mal.value = id
		else
			mu.value = id

		$(modal.modal).modal('hide')
	}

	getJSONPData=function(){var a=0;return function(b){return new Promise(function(c){var e='jsonp_cb_'+a,f=document.scripts[0],g=document.createElement('script');g.src=b+(~b.indexOf('?')?'&':'?')+'callback='+e,f.parentNode.insertBefore(g,f),window[e]=function(h){g.parentNode.removeChild(g),c(h),delete window[e]},a+=1})}}();


	// ==========================================
	// End Functions
	// ==========================================

	// ==========================================
	// Begin Custom Script
	// ==========================================


	modal = renderModal()

	fixMarkup(mal, 'MAL', (name, spinner) => {
		const url = `https://api.jikan.me/search/manga/${title.value.replace(/ /g, '-')}/1`

		fetch(url)
			.then((response) => {
				return response.json();
			})
			.then((jsonResponse) => {
				let searchItems = createFoundItems(jsonResponse.result, e => {
					cleanModal(e, name)
				})

				populateModal(searchItems, spinner, name)
			})
	})

	fixMarkup(mu, 'MU', (name, spinner) => {
		const url = `https://www.mangaupdates.com/series.html?stype=title&search=${title.value.replace(/ /g, '-')}&output=jsonp&callback=loadedMu`
		
		getJSONPData(url)
			.then(jsonResponse => {
				let searchItems = createFoundItems(jsonResponse.results.items, e => {
					cleanModal(e, name)
				})

				populateModal(searchItems, spinner, name)
			})
	})

	$(modal.modal).on('hidden.bs.modal', e => {
		modal.body.innerHTML = ''
	})


	// ==========================================
	// End Custom Script
	// ==========================================


	let style = d.createElement('style')
	style.innerText = 
`.linking-search-results {
	overflow-x: hidden;
	overflow-y: auto;
	height: 100%;
}

.view-list .linking-search-results {
	padding-right: 6px;
}

.view-grid .linking-search-results {
	display: flex;
	flex-flow: row wrap;
	line-height: 1.4;
	list-style: none outside none;
	padding-left: 0;
	justify-content: space-between;
}

.view-grid .linking-search-results li {
	flex: 1 1 25%;
	margin-bottom: 20px;
	text-align: center;
}

.view-grid .linking-search-results a {
	display: block;
}

.view-grid .linking-search-results img {
	display: block;
	margin: 0 auto 6px;
}

.linking-search-btn {
	min-width: 110px;
}

.linking-search-btn .fas {
	margin-left: 6px;
}

#linkingSearchResults .modal-dialog {
	height: calc(100% - 60px);
}

#linkingSearchResults .modal-content {
	display: flex;
	flex-flow: column nowrap;
	height: 100%;
	overflow: hidden;
}

#linkingSearchResults .modal-header {
	flex: none;
}

#linkingSearchResults .modal-body {
	flex: 1 1 auto;
	height: calc(100% - 56px);
}`
	d.head.appendChild(style)
})()
