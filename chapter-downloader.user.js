// ==UserScript==
// @name         MangaDex Downloader
// @version      1.1
// @description  A userscript to add download-buttons to mangadex
// @author       Hajile-Haji/Icelord/Eva
// @homepage     https://github.com/Hajile-Haji/mangadex-scripts
// @updateURL    https://raw.githubusercontent.com/Hajile-Haji/mangadex-scripts/master/chapter-downloader.user.js
// @downloadURL  https://raw.githubusercontent.com/Hajile-Haji/mangadex-scripts/master/chapter-downloader.user.js
// @match        https://mangadex.com/manga/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @grant        GM_xmlhttpRequest
// @connect      mangadex.com
// ==/UserScript==

(function() {
	'use strict';

	const d = document,
		languages = {
			Arabic: 'ara',
			Bengali: 'ben',
			Bulgarian: 'bul',
			Catalan: 'cat',
			Chinese: 'chi',
			Czech: 'cze',
			Danish: 'dan',
			Dutch: 'dut',
			English: 'eng',
			Filipino: 'fil',
			Finnish: 'fin',
			French: 'fre',
			German: 'ger',
			Greek: 'gre',
			Hungarian: 'hun',
			Indonesian: 'ind',
			Italian: 'ita',
			Japanese: 'jpn',
			Korean: 'kor',
			Malaysian: 'may',
			Mongolian: 'mon',
			Persian: 'per',
			Polish: 'pol',
			'Portuguese (Brazil)': 'por',
			'Portuguese (Portugal)': 'por',
			Romanian: 'rum',
			Russian: 'rus',
			'Serbo-Croatian': 'hrv',
			'Spanish (LATAM)': 'spa',
			'Spanish (Spain)': 'spa',
			Swedish: 'swe',
			Thai: 'tha',
			Turkish: 'tur',
			Vietnamese: 'vie'
		}

	// Inject download-buttons
	// No need for jQuery
	d.querySelectorAll('[id^="chapter_"] td:first-child a').forEach((item, i) => {
		const dlBtn = item.cloneNode() // We'll clone the link because it has all the needed info in data and href attributes
		dlBtn.innerHTML = '' // Remove the chapter text
		dlBtn.classList.add('fas', 'fa-download')
		dlBtn.style.marginRight = '6px'
		dlBtn.addEventListener('click', e => {
			e.preventDefault()
			downloadChapter(item)
		})
		item.parentNode.insertBefore(dlBtn, item)
	})

	//Function to download a chapter (called by download-buttons)
	function downloadChapter(chapData) {
		// Inject progress element
		const progress = d.createElement('progress') // Use native progress element, because why not?

		progress.style.display = 'block'
		progress.style.height = '5px'
		progress.style.marginBottom = '5px'
		progress.style.width = '100%'

		chapData.parentNode.insertBefore(progress, chapData.previousSibling)

		getPageUrls(chapData.href)
			.then(urls => zipFiles(chapData, urls, progress))
			.catch(err => {
				if (err.message)
					alert(err.message)
				if (err.error)
					console.log(err.error)
			})
	}

	function zipFiles(chapData, urls, progress) {
		// Using a Promise allows us to have one error callback keeping things DRY
		return new Promise((resolve, reject) => {
			let zip = new JSZip(),
				zipFilename = getFolderTitle(chapData),
				pageCount = urls.length,
				activeDownloads = 0

			progress.max = pageCount

			let interval = setInterval(() => {
				if (activeDownloads < 3 && urls.length > 0) {
					let pageToDownload = urls.shift()

					activeDownloads++;

					GM_fetch(pageToDownload)
						.then(data => {
							zip.file('x' + (pageToDownload.split('/').pop().split('.').shift().substr(1)).padStart(5, '0') + '.' + pageToDownload.split('.').pop(), data)

							setProgress(progress, (pageCount - urls.length))

							activeDownloads--
						})
						.catch(err => {
							reject({ error: err, message: 'A page-download failed. Check the console for more details.'})
							clearInterval(interval)
							setProgress(progress, null)
						})
				} else if (activeDownloads === 0 && urls.length === 0) {
					clearInterval(interval)
					zip.generateAsync({
						type: "blob"
					}).then((zipFile) => {
						saveAs(zipFile, zipFilename)
						setProgress(progress, null)
						resolve()
					});
				}
			}, 500);
		})
	}

	//Get all page-urls of chapter
	function getPageUrls(url) {
		return new Promise((resolve, reject) => {
			fetch(url)
				.then(response => response.ok ? response.text() : reject({error: null, message: 'The page-urls could not be fetched. Check the console for more details.'}))
				.then(data => {
					try {
						let urls = [],
							server = data.match(/var server = \'(.+)\';/)[1],
							dataurl = data.match(/var dataurl = \'(.+)\';/)[1],
							pageArray = data.match(/var page_array = \[\r\n(.+)\];/)[1].replace(/\'/g, '').split(',')

						pageArray.pop()
						pageArray.forEach(item => urls.push(`${server+dataurl}/${item}`))

						resolve(urls)
					} catch (ex) {
						reject({error: ex, message: 'Something when wrong when parsing the page. Check the console for more details.'})
					}
				})
				.catch(reject)
		})
	}

	function getFolderTitle(chapData) {
		let chapter = chapData.dataset.chapterNum,
			volume = chapData.dataset.volumeNum,
			title = chapData.dataset.chapterName,
			group = chapData.parentNode.nextElementSibling.nextElementSibling.firstElementChild.innerText,
			mangaTitle = d.querySelector('.panel-title').innerText.trim(),
			language = languages[chapData.parentNode.nextElementSibling.firstElementChild.title]

		if (language === 'eng') {
			language = ''
		} else {
			language = ` [${language}]`
		}

		if (volume > 0) {
			volume = ` (v${volume.padStart(2, '0')})`
		}

		return `${mangaTitle + language} - c${chapter.padStart(3, '0') + volume} [${group}].zip`
	}

	//Set progress of download for id
	function setProgress(progress, value) {
		value ?	progress.value = value : progress.remove()
	}

	function GM_fetch(url) {
		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				method: 'GET',
				url: url,
				responseType: 'arraybuffer',
				ignoreCache: true,
				onload: data => resolve(data.response),
				onerror: data => reject(data)
			})
		})
	}
})();
