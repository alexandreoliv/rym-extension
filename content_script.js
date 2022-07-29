const rymExtension = () => {
	console.log("[Web Modifier] Lighbox Blocker content script injected");
	console.log(document.location.href);

	if (document.location.href.indexOf("https://rateyourmusic.com") === 0) {
		console.log("[Web Modifier] Found RateYourMusic. Injecting Listener");
		window.addEventListener("load", (event) => {
			console.log("[Web Modifier] Executing Listener");

			const myAlbums = getMyAlbums();
			const trimmedMyAlbums = trimMyAlbums(myAlbums);
			const pageAlbumIds = getPageAlbumIds();
			const trimmedPageAlbumIds = getTrimmedPageAlbumIds(pageAlbumIds);
			const pageAlbumTitles = getPageAlbumTitles();

			const foundAlbumsOnPageById = findAlbumsOnPageById(
				trimmedPageAlbumIds,
				trimmedMyAlbums
			);

			const foundAlbumsOnPageByTitle = findAlbumsOnPageByTitle(
				pageAlbumTitles,
				trimmedMyAlbums
			);

			console.log("foundAlbumsOnPageByTitle", foundAlbumsOnPageByTitle);

			changeAlbumsOnPage(
				foundAlbumsOnPageById,
				foundAlbumsOnPageByTitle,
				trimmedMyAlbums
			);
		});
	}
};

const trimMyAlbums = (myAlbums) => {
	return myAlbums.map((e) => ({
		id: e["RYM Album"],
		artist: e["First Name"] + " " + e["Last Name"],
		artistLocalized:
			e["First Name localized"] + " " + e["Last Name localized"],
		album: e["Title"],
		rating: e["Rating"] / 2,
	}));
};

const getPageAlbumIds = () => {
	const albums = document.getElementsByClassName("album");
	const listAlbums = document.getElementsByClassName("list_album");
	const albumIds = Array.prototype.map.call(albums, (a) => a.title);
	const listAlbumIds = Array.prototype.map.call(listAlbums, (a) => a.title);
	const allIds = albumIds.concat(listAlbumIds);
	return allIds;
};

const getTrimmedPageAlbumIds = (pageAlbumIds) => {
	return pageAlbumIds.map((a) => Number(a.slice(6, -1)));
};

const getPageAlbumTitles = () => {
	// TODO there might be homonyms
	const albums = document.getElementsByClassName("ui_name_locale_original");
	const albumTitles = Array.prototype.map.call(albums, (a) => a.innerText);
	const release = document.getElementsByClassName("release");
	const releaseTitles = Array.prototype.map.call(release, (a) => a.innerText);
	const allTitles = albumTitles.concat(releaseTitles);
	return allTitles;
};

const findAlbumsOnPageById = (trimmedPageAlbums, trimmedMyAlbums) => {
	return trimmedPageAlbums.filter(
		(p) =>
			p === trimmedMyAlbums.filter((m) => m.id === p).map((m) => m.id)[0]
	);
};

const findAlbumsOnPageByTitle = (trimmedPageAlbums, trimmedMyAlbums) => {
	return trimmedPageAlbums.filter(
		(p) =>
			p ===
			trimmedMyAlbums.filter((m) => m.album === p).map((m) => m.album)[0]
	);
};

const changeAlbumsOnPage = (
	foundAlbumsOnPageById,
	foundAlbumsOnPageByTitle,
	trimmedMyAlbums
) => {
	foundAlbumsOnPageById.map((f) => {
		const elements = document.querySelectorAll(`[title="[Album${f}]"]`);
		elements.forEach((element) => {
			// prevents writing it twice
			if (!element.innerHTML.includes("span style")) {
				element.innerHTML += `<span style="font-weight: bold"> ${
					trimmedMyAlbums
						.filter((t) => t.id === f)
						.map((t) => t.rating)[0]
				}</span>`;
			}
		});
	});

	console.log("foundAlbumsOnPageByTitle", foundAlbumsOnPageByTitle);
	foundAlbumsOnPageByTitle.map((f) => {
		const element = Array.from(document.querySelectorAll("a")).filter(
			(a) => a.innerText === `${f}`
		)[0];
		console.log("element", element);
		console.log(
			"trimmedMyAlbums.filter((t) => t.album === f)",
			trimmedMyAlbums.filter((t) => t.album === f)
		);
		element.innerHTML += `<span style="font-weight: bold"> ${
			trimmedMyAlbums.filter((t) => t.album === f).map((t) => t.rating)[0]
		}</span>`;
	});
};

rymExtension();
