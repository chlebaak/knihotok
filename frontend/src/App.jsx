import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/authContext";

import Navbar from "./components/navbar.jsx";
import Footer from "./components/footer.jsx";
import Search from "./components/search.jsx";
import Domov from "./pages/Domov.jsx";
import Zebricky from "./pages/Zebricky.jsx";
import Login from "./pages/LogIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Profil from "./pages/Profil.jsx";
import BookDetails from "./pages/BookDetails.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import Posts from "./pages/Posts.jsx";
import PostDetails from "./pages/PostDetails.jsx";
import Events from "./pages/Events.jsx";
import Messages from "./pages/Messages.jsx";

import './index.css'





export default function App() {
  return (
    <AuthProvider>
    <Router>
        {/* Navbar */}
        <Navbar />
        
        
        <main className="flex-grow">
          <Routes>
             <Route path="/" element={<Domov />} />
             <Route path="/zebricky" element={<Zebricky />} />
             <Route path="/LogIn" element={<Login />} />
             <Route path="/SignUp" element={<SignUp />} />
             <Route path="/profile/:id" element={<Profil />} />
             <Route path="/Search" element={<Search />} />
             
              <Route path="/search-results" element={<SearchResults />} />
              <Route path="/events" element={<Events />} />

              <Route path="/books/:id" element={<BookDetails />} />
              <Route path="/posts" element={<Posts />} />
        <Route path="/posts/:id" element={<PostDetails />} />
        <Route path="/messages" element={<Messages />} />

          </Routes>
        </main>
        {/* Footer */}
        <Footer />
      
    </Router>
    </AuthProvider>
  );
}
