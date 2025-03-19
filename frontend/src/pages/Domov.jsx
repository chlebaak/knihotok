import Book from "../assets/books2.png";
import Home from "../assets/home.png";
import Home2 from "../assets/home2.png";
import Home3 from "../assets/home3.png";
import { Link } from "react-router-dom";
import Search from "../components/search.jsx";

export default function Domov() {
  return (
    <div>
      <div className="mx-5">
        <Search />
      </div>
      <section className="bg-white">
        <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="text-[#67001a] max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl">
              Knihotok: Vaše místo pro knihomoly
            </h1>
            <p className="max-w-2xl mb-6 font-light text-[#800020] lg:mb-8 md:text-lg lg:text-xl">
              Objevte tisíce knih, přečtěte si recenze, hodnoťte své oblíbené
              tituly a sdílejte své literární zážitky s ostatními.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/LogIn"
                className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium
             overflow-hidden rounded-xl bg-gradient-to-r from-[#800020] to-[#aa0030]
             text-white transition-all duration-300
             hover:shadow-lg hover:shadow-[#800020]/30
             focus:outline-none focus:ring-2 focus:ring-[#800020] focus:ring-offset-2"
              >
                <span className="relative flex items-center">
                  Začněte objevovat
                  <svg
                    className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </Link>

              <Link
                to="/SignUp"
                className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium
             rounded-xl border-2 border-[#800020] text-[#800020]
             transition-all duration-300 
             hover:bg-[#800020] hover:text-white
             hover:shadow-lg hover:shadow-[#800020]/20
             focus:outline-none focus:ring-2 focus:ring-[#800020] focus:ring-offset-2"
              >
                <span className="relative flex items-center group-hover:scale-105 transition-transform duration-300">
                  Připojte se ke komunitě
                  <svg
                    className="w-5 h-5 ml-2 opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
          <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
            <img src={Book} alt="mockup" />
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16">
          <div
            className="bg-gray-50 border border-gray-200 rounded-lg p-8 md:p-12 mb-8 bg-cover bg-center"
            style={{
              backgroundImage: `url(${Home})`,
            }}
          >
            <Link
              to="/"
              className="bg-blue-100 text-blue-800 text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-md"
            >
              <svg
                className="w-2.5 h-2.5 me-1.5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 14"
              >
                <path d="M11 0H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm8.585 1.189a.994.994 0 0 0-.9-.138l-2.965.983a1 1 0 0 0-.685.949v8a1 1 0 0 0 .675.946l2.965 1.02a1.013 1.013 0 0 0 1.032-.242A1 1 0 0 0 20 12V2a1 1 0 0 0-.415-.811Z" />
              </svg>
              Registrace
            </Link>
            <h1 className="text-gray-50 text-3xl md:text-5xl font-extrabold mb-2">
              Vstupte do světa literatury
            </h1>
            <p className="text-lg font-normal text-gray-200 mb-6">
              Knihotok propojuje čtenáře a knihy. Zjistěte, co ostatní čtou,
              sdílejte své recenze a inspirujte se trendy v literatuře.
            </p>
            <a
              href="#"
              className="inline-flex justify-center items-center py-2.5 px-5 text-base font-medium text-center text-white rounded-lg bg-red-900 hover:bg-red-800 focus:ring-4 focus:ring-red-400"
            >
              Prozkoumejte knihy
              <svg
                className="w-3.5 h-3.5 ms-2 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5h12m0 0L9 1m4 4L9 9"
                />
              </svg>
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div
              className="bg-gray-50 border border-gray-200 rounded-lg p-8 md:p-12 bg-cover bg-center"
              style={{
                backgroundImage: `url(${Home2})`,
              }}
            >
              <Link
                to="/zebricky"
                className="bg-green-100 text-green-800 text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-md"
              >
                <svg
                  className="w-2.5 h-2.5 me-1.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 18 18"
                >
                  <path d="M17 11h-2.722L8 17.278a5.512 5.512 0 0 1-.9.722H17a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1ZM6 0H1a1 1 0 0 0-1 1v13.5a3.5 3.5 0 1 0 7 0V1a1 1 0 0 0-1-1ZM3.5 15.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM16.132 4.9 12.6 1.368a1 1 0 0 0-1.414 0L9 3.55v9.9l7.132-7.132a1 1 0 0 0 0-1.418Z" />
                </svg>
                Žebříčky
              </Link>
              <h2 className="text-gray-50 text-3xl font-extrabold mb-2">
                Nejlepší knihy podle čtenářů
              </h2>
              <p className="text-lg font-normal text-gray-200 mb-4">
                Projděte si žebříček knih, které čtenáři hodnotí nejvýše.
                Najděte svůj další čtenářský skvost.
              </p>
              <Link
                to="/zebricky"
                className="text-[#cd0033] hover:underline font-medium text-lg inline-flex items-center"
              >
                Zobrazit žebříčky
                <svg
                  className="w-3.5 h-3.5 ms-2 rtl:rotate-180"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </Link>
            </div>
            <div
              className="bg-gray-50 border border-gray-200 rounded-lg p-8 md:p-12 bg-cover bg-center"
              style={{
                backgroundImage: `url(${Home3})`,
              }}
            >
              <a
                href="#"
                className="bg-purple-100 text-purple-800 text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-md"
              >
                <svg
                  className="w-2.5 h-2.5 me-1.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 4 1 8l4 4m10-8 4 4-4 4M11 1 9 15"
                  />
                </svg>
                Příspěvky
              </a>
              <h2 className="text-gray-50 text-3xl font-extrabold mb-2">
                Tipy od čtenářů, diskutujte o knihách
              </h2>
              <p className="text-lg font-normal text-gray-200 mb-4">
                Podívejte se na doporučení od členů naší komunity. Inspirujte se
                jejich oblíbenými knihami a diskutujte s ostatními.
              </p>
              <Link
                to="/posts"
                className="text-[#cd0033] hover:underline font-medium text-lg inline-flex items-center"
              >
                Prozkoumejte příspěvky
                <svg
                  className="w-3.5 h-3.5 ms-2 rtl:rotate-180"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
