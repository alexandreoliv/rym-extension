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
			const { pageAlbumTitles, pageArtistNames } = getPageAlbumTitles();

			const ratedAlbumsOnPageById = findRatedAlbumsOnPageById(
				trimmedPageAlbumIds,
				trimmedMyAlbums
			);

			const ratedAlbumsOnPageByTitle = findRatedAlbumsOnPageByTitle(
				pageAlbumTitles,
				pageArtistNames,
				trimmedMyAlbums
			);

			changeAlbumsOnPage(
				ratedAlbumsOnPageById,
				ratedAlbumsOnPageByTitle,
				trimmedMyAlbums,
				pageArtistNames
			);
		});
	}
};

const trimMyAlbums = (myAlbums) => {
	return myAlbums.map((e) => ({
		id: e["RYM Album"],
		artist: e["First Name"]
			? e["First Name"] + " " + e["Last Name"]
			: e["Last Name"],
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
	// there might be homonyms; to be handled on changeAlbumsOnPage
	const albums = document.getElementsByClassName("release");
	const pageAlbumTitles = Array.prototype.map.call(
		albums,
		(a) => a.innerText
	);
	const artists = document.getElementsByClassName("artist");
	const pageArtistNames = Array.prototype.map.call(
		artists,
		(a) => a.innerText
	);
	return { pageAlbumTitles, pageArtistNames };
};

const findRatedAlbumsOnPageById = (trimmedPageAlbums, trimmedMyAlbums) => {
	return trimmedPageAlbums.filter(
		(p) =>
			p === trimmedMyAlbums.filter((m) => m.id === p).map((m) => m.id)[0]
	);
};

const findRatedAlbumsOnPageByTitle = (
	pageAlbumTitles,
	pageArtistNames,
	trimmedMyAlbums
) => {
	pageAlbumTitles, pageArtistNames, trimmedMyAlbums;

	return pageAlbumTitles.filter(
		(p) =>
			p ===
			trimmedMyAlbums.filter((m) => m.album === p).map((m) => m.album)[0]
	);
};

const changeAlbumsOnPage = (
	ratedAlbumsOnPageById,
	ratedAlbumsOnPageByTitle,
	trimmedMyAlbums,
	pageArtistNames
) => {
	ratedAlbumsOnPageById.map((f) => {
		const elements = document.querySelectorAll(`[title="[Album${f}]"]`);
		elements.forEach((element) => {
			// prevents writing the rating multiple times on the same element if the album has been cited more than once on the page
			if (!element.innerHTML.includes("span style")) {
				element.innerHTML += `<span style="font-weight: bold; color: #794e15"> ${
					trimmedMyAlbums
						.filter((t) => t.id === f)
						.map((t) => t.rating)[0]
				}</span>`;
			}
		});
	});

	// the second .filter compares with pageArtistNames to assign the correct rating in case of homonym artists
	ratedAlbumsOnPageByTitle.map((f) => {
		const element = Array.from(
			document.getElementsByClassName("release")
		).filter((a) => a.innerText === `${f}`)[0];
		element.innerHTML += `<span style="font-weight: bold; color: #794e15"> ${
			trimmedMyAlbums
				.filter((t) => t.album === f)
				.filter(
					(t) =>
						t.artist ===
						pageArtistNames.filter((b) => b === t.artist)[0]
				)
				.map((t) => t.rating)[0]
		}</span>`;
	});
};

rymExtension();
