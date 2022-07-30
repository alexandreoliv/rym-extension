const rymExtension = () => {
	if (document.location.href.includes("https://rateyourmusic.com")) {
		console.log("inside rymExtension");
		window.addEventListener("load", async () => {
			const myAlbums = await getMyAlbums(yourID);
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

const getMyAlbums = async (id) => {
	console.log("inside getMyAlbums");
	const savedAlbums = await getSavedAlbums();
	console.log("inside getMyAlbums again -> savedAlbums", savedAlbums);
	const oneDayAgo = Date.now() - 86400000;
	if (savedAlbums?.date >= oneDayAgo) return savedAlbums.albums;

	const myAlbumsOnCSV = await getMyAlbumsOnCSV(id);
	const myAlbumsOnJSON = convertCSVtoJSON(myAlbumsOnCSV);
	saveMyAlbumsOnLocalStorage(myAlbumsOnJSON);
	return myAlbumsOnJSON;
};

const getSavedAlbums = async () => {
	console.log("inside getSavedAlbums");
	const myAlbums = localStorage.getItem("myAlbums");
	if (!myAlbums) return false;
	console.log("inside getSavedAlbums -> myAlbums", myAlbums);
	return JSON.parse(myAlbums);
};

const saveMyAlbumsOnLocalStorage = (myAlbums) => {
	console.log("inside saveMyAlbumsOnLocalStorage");
	const data = {
		date: Date.now(),
		albums: myAlbums,
	};
	localStorage.setItem("myAlbums", JSON.stringify(data));
};

const getMyAlbumsOnCSV = async (id) => {
	console.log("inside getMyAlbumsOnCSV");
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
	console.log("inside convertCSVtoJSON");
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

		let jsonProperties = string.split("|");

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
