import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-white shadow dark:bg-[#38040e] ">
      <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <a
            href=""
            className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse"
          >
            <img src={logo} className="h-8" alt="Knihotok Logo" />
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
              Knihotok
            </span>
          </a>

          {/* Navigation links */}
          <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-200 sm:mb-0 dark:text-gray-100">
            <li>
              <a href="#" className="hover:underline me-4 md:me-6">
                Domov
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline me-4 md:me-6">
                Vyhledat knihu
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline me-4 md:me-6">
                Žebříčky
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Zaregistrovat se
              </a>
            </li>
          </ul>
        </div>

        <hr className="my-6 border-gray-200 sm:mx-auto lg:my-8" />

        <span className="block text-sm text-gray-200 sm:text-center">
          © 2024{" "}
          <a href="/" className="hover:underline">
            Knihotok™
          </a>
          . Ročníková práce 4ITA - Jan Fiala
        </span>
      </div>
    </footer>
  );
}
