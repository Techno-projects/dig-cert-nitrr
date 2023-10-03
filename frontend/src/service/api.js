import axios from "axios";

let baseURL = "";
if (process.env.NODE_ENV === "production") {
  baseURL = "https://App-name.herokuapp.com";
} else {
  baseURL = "http://localhost:8000";
}

export default axios.create({
  baseURL,
});