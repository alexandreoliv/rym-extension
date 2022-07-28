const rymExtension = () => {
	console.log("[Web Modifier] Lighbox Blocker content script injected");
	console.log(document.location.href);

	if (document.location.href.indexOf("https://rateyourmusic.com") === 0) {
		console.log("[Web Modifier] Found RateYourMusic. Injecting Listener");
		window.addEventListener("load", (event) => {
			console.log("[Web Modifier] Executing Listener");

			const myAlbums = getMyAlbums();
			const trimmedMyAlbums = trimMyAlbums(myAlbums);
			const pageAlbums = getPageAlbums();
			const trimmedPageAlbums = getTrimmedPageAlbums(pageAlbums);
			const foundAlbumsOnPage = findAlbumsOnPage(
				trimmedPageAlbums,
				trimmedMyAlbums
			);
			changeAlbumsOnPage(foundAlbumsOnPage, trimmedMyAlbums);
		});
	}
};

const trimMyAlbums = (file) => {
	return file.map((e) => ({
		id: e["RYM Album"],
		artist: e["First Name"] + " " + e["Last Name"],
		artistLocalized:
			e["First Name localized"] + " " + e["Last Name localized"],
		album: e["Title"],
		rating: e["Rating"] / 2,
	}));
};

const getPageAlbums = () => {
	const albums = document.getElementsByClassName("album");
	const albumIds = Array.prototype.map.call(albums, (a) => a.title);
	return albumIds;
};

const getTrimmedPageAlbums = (file) => {
	return file.map((a) => Number(a.slice(6, -1)));
};

const findAlbumsOnPage = (trimmedPageAlbums, trimmedMyAlbums) => {
	return trimmedPageAlbums.filter(
		(p) =>
			p === trimmedMyAlbums.filter((m) => m.id === p).map((m) => m.id)[0]
	);
};

const changeAlbumsOnPage = (foundAlbumsOnPage, trimmedMyAlbums) => {
	foundAlbumsOnPage.map((f) => {
		const elements = document.querySelectorAll(`[title="[Album${f}]"]`);
		elements.forEach(
			(element) =>
				(element.innerHTML += `<span style="font-weight: bold"> ${
					trimmedMyAlbums
						.filter((t) => t.id === f)
						.map((t) => t.rating)[0]
				}</span>`)
		);
	});
};

rymExtension();
