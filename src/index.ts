import express from "express";
import cors from "cors";

const port = 8080;
const app = express();
const apiKey = process.env.YT_API_KEY;

app.use(cors());

// requires gameTitle query param
// searches for videos relating to title
app.get("/api/ytsearch", async (req, res) => {
	if (!req.query.gameTitle) {
		res.status(400).json({
			error: 'Bad Request. Requires "gameTitle" query parameter.',
			status: 400,
		});
		return;
	}

	if (!apiKey) {
		res.status(500).json({
			error: "Internal Server Error.",
			status: 500,
		});
		return;
	}

	const videos: Video[] = [];
	const gameTitleSearch = req.query.gameTitle;
	if (typeof gameTitleSearch !== "string") {
		res.status(400).json({
			error: "Bad Request.",
			status: 400,
		});
		return;
	}

	const data: YoutubeSearchData | null = await fetch(
		`https://www.googleapis.com/youtube/v3/search?part=snippet&order=relevance&q=${gameTitleSearch}&type=video&videoDefinition=high&maxResults=15&topicId=/m/0bzvm2&key=${apiKey}`
	)
		.then((response) => {
			if (response.ok) return response.json();
			return response.json().then((json) => Promise.reject(json));
		})
		.catch((error) => {
			console.log(error);
			return null;
		});

	if (data !== null) {
		for (let item of data.items) {
			videos.push({
				videoId: item.id.videoId,
				publishedAt: item.snippet.publishedAt,
				title: item.snippet.title,
				channelTitle: item.snippet.channelTitle,
				thumbnail: item.snippet.thumbnails.medium,
			});
		}
	}

	res.json({ data: videos });
});

app.listen(port, () => {
	console.log(`Listening on port: ${port}`);
});

type YoutubeSearchData = {
	items: {
		id: {
			videoId: string;
		};
		snippet: {
			publishedAt: string;
			title: string;
			channelTitle: string;
			thumbnails: {
				medium: {
					url: string;
					width: number;
					height: number;
				};
			};
		};
	}[];
};

type Video = {
	videoId: string;
	publishedAt: string;
	title: string;
	channelTitle: string;
	thumbnail: {
		url: string;
		width: number;
		height: number;
	};
};
