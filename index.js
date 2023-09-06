const express = require("express");
const app = express();
require('dotenv').config();
const cors = require("cors");
app.use(cors());
const fetch = require('node-fetch');


const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhNWM3ZWE2YTVjZGFjMTE1MzFkMDRkYWU0Mzc3YjE4YiIsInN1YiI6IjY0ZjI0NWRlOTQwOGVjMDBjNmJkNTJkZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.MGKavoCiMRUnKd-QZjdj91pAocYEviqHCDXlUt5r6J0'
  }
};

async function getResponse(url, options){
    try{
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }
        const jsonData = await response.json();
        return jsonData;
    }catch (error) {
        console.error('Error:', error);
    }
}

async function getBackdropImageUrl(apiKey, backdropPath) {
    try {
        const configUrl = `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`;
        const configResponse = await fetch(configUrl);
        if (!configResponse.ok) {
            throw new Error(`Request failed with status: ${configResponse.status}`);
        }
        
        const configData = await configResponse.json();
        const baseImageUrl = configData.images.base_url;
        const backdropSize = 'original'; // Choose the desired size ('original' for the original size)

        const backdropImageUrl = `${baseImageUrl}${backdropSize}${backdropPath}`;
        return backdropImageUrl;
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}

// Usage example:
const apiKey = process.env.APIKEY; // Replace with your actual TMDb API key

async function getPopularMovies(url){
    const response =  await getResponse(url,options);
    const pages = response.total_pages;
    try{
        const results = await Promise.all(response.results.map(async (object)=>
        {
            const fullurl = await getBackdropImageUrl(apiKey, object.backdrop_path);
            return {...object, backdrop_path:fullurl}
        }
        
    ));
        return [results,pages];
    }catch(error){
        console.log(error);
        return [];
    }
};

app.get("/toprated/:page",async (req,res)=>{
    const url =`https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${req.params.page}`;
    const [response, pages] = await getPopularMovies(url);
    res.status(200).send({
        status: 'success',
        data: response,
        message: pages,
      });
    
});
app.get("/popularmovies/:page",async(req,res)=>{
    const url =`https://api.themoviedb.org/3/movie/popular?language=en-US&page=${req.params.page}`;
    const [response, pages] = await getPopularMovies(url);
    res.status(200).send({
        status: 'success',
        data: response,
        message: pages,
      });
})
app.get("/upcomingmovies/:page",async(req,res)=>{
    const url = `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=${req.params.page}`;
    const [response, pages] = await getPopularMovies(url);
    res.status(200).send({
        status: 'success',
        data: response,
        message: pages,
      });
})
app.get("/nowplaying/:page",async(req,res)=>{
    const url = `https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=${req.params.page}`;
    const [response, pages] = await getPopularMovies(url);
    res.status(200).send({
        status: 'success',
        data: response,
        message: pages,
      });
    
})
async function Stream(type="movie",id=1030987){
const url = `https://streaming-availability.p.rapidapi.com/get?output_language=en&tmdb_id=${type}%2F${id}`;
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.XRAPIDAPIKEY,
    'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
  }
};

try {
	const response = await fetch(url, options);
	const results = await response.json();
    console.log(process.env.XRAPIDAPIKEY);
    const apiResponse = results.result.streamingInfo.us;
    const serviceLinks = {};
    apiResponse.forEach(item => {
  const { service, link } = item;

  if (!serviceLinks[service]) {
    serviceLinks[service] = [];
  }

  serviceLinks[service].push(link);
});  
    for (const service in serviceLinks) {
    const uniqueLinks = [...new Set(serviceLinks[service])];
    serviceLinks[service] = uniqueLinks;
  }
    
    console.log(serviceLinks);
    
    return serviceLinks;
} catch (error) {
	console.error(error);
}
}

app.get("/stream/:type/:id", async(req,res)=>{
   console.log(await Stream(type=req.params.type, id = req.params.id))
    res.send(await Stream(type=req.params.type, id = req.params.id));
})
app.get("/search/movie/:title/:page",async(req,res)=>{
    const url = `https://api.themoviedb.org/3/search/movie?query=${req.params.title}&include_adult=false&language=en-US&page=${req.params.page}`;
    const [response, pages] = await getPopularMovies(url);
    res.status(200).send({
        status: 'success',
        data: response,
        message: pages,
      });
    res.send(response);
});
app.get("/",(req,res)=>{
    res.send("Server is running");
})
app.listen(8000, async ()=>{
    res.send("Server is running");
})