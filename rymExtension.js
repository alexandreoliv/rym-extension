const rymExtension = () => {
	if (document.location.href.includes("https://rateyourmusic.com")) {
		window.addEventListener("load", async () => {
			if (!rym.session?.userid) return;

			const myAlbums = await getMyAlbums();
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

const getMyAlbums = async () => {
	const savedAlbums = await getSavedAlbums();
	const oneDayAgo = Date.now() - 86400000;
	if (savedAlbums?.date >= oneDayAgo) return savedAlbums.albums;

	const myAlbumsOnCSV = await getMyAlbumsOnCSV();
	const myAlbumsOnJSON = convertCSVtoJSON(myAlbumsOnCSV);
	saveMyAlbumsOnLocalStorage(myAlbumsOnJSON);
	return myAlbumsOnJSON;
};

const getSavedAlbums = async () => {
	const myAlbums = localStorage.getItem("myAlbums");
	if (!myAlbums) return false;
	return JSON.parse(myAlbums);
};

const saveMyAlbumsOnLocalStorage = (myAlbums) => {
	const data = {
		date: Date.now(),
		albums: myAlbums,
	};
	localStorage.setItem("myAlbums", JSON.stringify(data));
};

const getMyAlbumsOnCSV = async () => {
	const id = rym.session.userid;
	const response = await fetch(
		`https://rateyourmusic.com/user_albums_export?album_list_id=${id}&noreview`,
		{
			method: "get",
			headers: {
				"content-type": "text/csv;charset=UTF-8",
			},
		}
	);

	if (response.status === 200) {
		return response.text();
	} else {
		console.log(`Error code ${response.status}`);
	}
};

const convertCSVtoJSON = (csv) => {
	const array = csv.toString().split("\n");
	const csvToJsonResult = [];

	/* removes spaces after commas which happens in some of the headers */
	array[0] = array[0].replace(/\s*,\s*/g, ",");

	const headers = array[0].split(",");

	for (let i = 1; i < array.length - 1; i++) {
		const jsonObject = {};
		const currentArrayString = array[i];
		let string = "";

		let quoteFlag = 0;
		for (let character of currentArrayString) {
			if (character === '"' && quoteFlag === 0) {
				quoteFlag = 1;
			} else if (character === '"' && quoteFlag == 1) quoteFlag = 0;
			if (character === "," && quoteFlag === 0) character = "|";
			if (character !== '"') string += character;
		}

		const jsonProperties = string.split("|");

		for (let j in headers) {
			jsonObject[headers[j]] = jsonProperties[j];
		}
		csvToJsonResult.push(jsonObject);
	}

	return csvToJsonResult;
};

const trimMyAlbums = (myAlbums) => {
	return myAlbums.map((e) => ({
		id: Number(e["RYM Album"]),
		artist: (e["First Name"] + " " + e["Last Name"])
			.replace(/&amp;/g, "&")
			.replace(/&#34;/g, '"')
			.trim(),
		artistLocalized: (
			e["First Name localized"] +
			" " +
			e["Last Name localized"]
		)
			.replace(/&amp;/g, "&")
			.replace(/&#34;/g, '"')
			.trim(),
		album: e["Title"].replace(/&amp;/g, "&").replace(/&#34;/g, '"').trim(),
		rating: e["Rating"] === "0" ? "" : e["Rating"] / 2,
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

	ratedAlbumsOnPageByTitle.map((f) => {
		const element = Array.from(
			document.getElementsByClassName("release")
		).filter((a) => a.innerText === `${f}`)[0];

		let album = trimmedMyAlbums.filter((t) => t.album === f);

		// if multiple albums with this name have been found, compares with pageArtistNames to assign the correct rating
		if (album.length > 1)
			album = album.filter((t) =>
				// artists with Arabic names have their names in inverted order
				t.artistLocalized
					? pageArtistNames.filter((b) =>
							t.artistLocalized.includes(b.split(" ")[0])
					  )[0]
					: pageArtistNames.filter((b) =>
							t.artist.includes(b.split(" ")[0])
					  )[0]
			);

		element.innerHTML += `<span style="font-weight: bold; color: #794e15"> ${album[0].rating}</span>`;
	});
};

rymExtension();
