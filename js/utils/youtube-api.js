// Youtube URL Parser and Metadata Fetcher

export function extractYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Convert ISO 8601 Duration (e.g. PT1H12M34S) to readable text (e.g. 1:12:34)
function parseISODuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export async function fetchYoutubeMetadata(videoUrl, customApiKey = null) {
  const videoId = extractYoutubeId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube link format.");
  }

  // If YouTube API Key is supplied, fetch full metadata
  if (customApiKey && customApiKey !== "") {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${customApiKey}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("YouTube API returned an error.");
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return {
          youtubeId: videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          duration: parseISODuration(item.contentDetails.duration),
          uploadedAt: new Date(item.snippet.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        };
      }
    } catch (e) {
      console.warn("Failed to fetch with API Key, falling back to noembed:", e);
    }
  }

  // Fallback to oEmbed noembed.com API (Free, Public, CORS-allowed)
  const fallbackUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(fallbackUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch video details from fallback server.");
  }
  const data = await response.json();
  if (data.error) {
    throw new Error("Video not found or is private.");
  }

  return {
    youtubeId: videoId,
    title: data.title,
    channel: data.author_name,
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    duration: "N/A", // oEmbed does not support video length details
    uploadedAt: "Recently" // oEmbed does not support published date details
  };
}
