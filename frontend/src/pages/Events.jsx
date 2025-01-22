export default function Zebricky() {
  return (
    <section className="bg-white py-8 antialiased md:py-16">
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-gray-900">Reviews</h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="h-4 w-4 text-yellow-300"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                </svg>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-500">(4.6)</p>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-start gap-4">
            <div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 text-yellow-300"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                  </svg>
                ))}
              </div>
              <p className="text-base font-semibold text-gray-900">
                Micheal Gough
              </p>
              <p className="text-sm text-gray-500">November 18, 2023</p>
            </div>
            <div className="flex-1">
              <p className="text-base text-gray-500">
                My old IMAC was from 2013. This replacement was well needed.
                Very fast, and the colour matches my office set up perfectly.
                The display is out of this world and I’m very happy with this
                purchase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
