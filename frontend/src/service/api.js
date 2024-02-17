import axios from "axios";

let baseURL = "";
if (process.env.NODE_ENV === "production") {
  baseURL = "https://App-name.herokuapp.com";
} else {
  baseURL = "";
}

export default axios.create({
  baseURL,
});