import axios from "axios";

async function run() {
  const urls = [
    "http://localhost:3000/api/integrations",
    "http://localhost:3000/api/logs",
    "http://localhost:3000/api/stats",
    "http://localhost:3000/api/users",
  ];

  for (const url of urls) {
    try {
      console.log(`Fetching: ${url}`);
      const res = await axios.get(url);
      console.log(`STATUS: ${res.status}, data length: ${JSON.stringify(res.data).length}`);
    } catch (err: any) {
      if (err.response) {
        console.error(`ERROR fetching ${url}: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      } else {
        console.error(`ERROR fetching ${url}: ${err.message}`);
      }
    }
  }
}

run();
