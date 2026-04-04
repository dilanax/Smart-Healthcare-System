import Navbar from "../components/navbar";
import Hero from "../components/hero";

export default function Home({ navigate, currentUser }) {
  return (
    <div>
      <Navbar navigate={navigate} currentUser={currentUser} />
      <Hero navigate={navigate} currentUser={currentUser} />
    </div>
  );
}


   
