import PocketBase from "pocketbase";

const pb = new PocketBase(`${import.meta.env.VITE_API_URL}`);
pb.autoCancellation(false);
export default pb;