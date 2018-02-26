// ==UserScript==
// @name         Mangadex Static Navbar & Reader Scrolling Between Chapters
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Makes the nav-bar static instead of fixed. Fixes the scroll to top function so it scrolls to the top of the manga page when going between pages and (unique to this script) chapters.
// @author       Hajile-Haji
// @match        https://mangadex.com/chapter/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

(function () {
	'use strict';

	let fixStyle,
		getCurrentDataSrc,
		goPage,
		d = document,
		topNav = d.getElementById('top_nav'),
		currentPage = d.getElementById('current_page'),
		pageCount = d.getElementById('jump_page').length,
		redirect = GM_getValue('mangaDexRedirect', null);

	GM_deleteValue('mangaDexRedirect');

	fixStyle = () => {
		d.body.style.paddingTop = 0;
		topNav.classList.add('navbar-static-top');
		topNav.classList.remove('navbar-fixed-top');
        currentPage.style.paddingTop = '20px';
        currentPage.previousElementSibling.style.marginBottom = null;
	};

	getCurrentDataSrc = () => {
		return currentPage.dataset.page;
	};

	fixStyle();

	goPage = (page) => {
		if (page > pageCount || page < 1) {
			GM_setValue('mangaDexRedirect', true);
		}

		if (redirect) {
			currentPage.scrollIntoView();
		} else {
			currentPage.addEventListener('load', e => {
				currentPage.scrollIntoView();
			});
		}
	};

	if (redirect) {
		goPage(1);
		redirect = false;
	}

	d.getElementById('jump_page').addEventListener('change', e => {
		goPage(getCurrentDataSrc());
	});

	currentPage.addEventListener('click', e => {
		goPage(getCurrentDataSrc() + 1);
	});

	d.addEventListener('keydown', e => {
		if (e.target.tagName === 'BODY') {
			switch (e.keyCode) {
				case 37:
				case 65:
					return goPage(getCurrentDataSrc() - 1);
				case 39:
				case 68:
					return goPage(getCurrentDataSrc() + 1);
			}
		}
	});
})();
