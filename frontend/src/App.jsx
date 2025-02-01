function App() {

  return (
      <div>
          <section className="px-8 py-28 xl:px-20">
              <div className="grid grid-cols-1 full gap-y-12 lg:grid-cols-3 lg:gap-20">
                  <div className="grid grid-cols-1 col-span-2 gap-8 sm:grid-cols-2">
                      <div
                          className="relative flex flex-col bg-clip-border rounded-xl bg-transparent text-gray-700 shadow-none">
                          <div className="p-6 grid">
                              <div className="mb-4 text-gray-900 rounded-lg"></div>
                              <h5 className="block antialiased tracking-normal font-sans text-xl font-semibold leading-snug text-blue-gray-900 mb-2">24/7
                                  Customer Support</h5>
                              <p className="block antialiased font-sans text-base leading-relaxed text-inherit font-normal !text-gray-500">Our
                                  AI chatbot is available round the clock to provide instant assistance to customers,
                                  ensuring prompt responses to queries and requests.</p>
                          </div>
                      </div>
                      <div
                          className="relative flex flex-col bg-clip-border rounded-xl bg-transparent text-gray-700 shadow-none">
                          <div className="p-6 grid">
                              <div className="mb-4 text-gray-900 rounded-lg"></div>
                              <h5 className="block antialiased tracking-normal font-sans text-xl font-semibold leading-snug text-blue-gray-900 mb-2">Reservation
                                  Management</h5>
                              <p className="block antialiased font-sans text-base leading-relaxed text-inherit font-normal !text-gray-500">Allow
                                  customers to easily book tables and manage their reservations through the AI chatbot,
                                  reducing the workload on your staff.</p>
                          </div>
                      </div>
                      <div
                          className="relative flex flex-col bg-clip-border rounded-xl bg-transparent text-gray-700 shadow-none">
                          <div className="p-6 grid">
                              <div className="mb-4 text-gray-900 rounded-lg"></div>
                              <h5 className="block antialiased tracking-normal font-sans text-xl font-semibold leading-snug text-blue-gray-900 mb-2">Personalized
                                  Recommendations</h5>
                              <p className="block antialiased font-sans text-base leading-relaxed text-inherit font-normal !text-gray-500">Utilize
                                  AI algorithms to offer personalized food and drink recommendations based on customer
                                  preferences and past orders.</p>
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center justify-center">
                      <div
                          className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 shadow-md h-">
                          <div
                              className="relative bg-clip-border mx-4 rounded-xl overflow-hidden bg-white text-gray-700 shadow-lg -mt-6">
                              <img
                                  src="https://bucket.material-tailwind.com/magic-ai/3582b3d039594149b4ad1a6fc541adc400f4e198f04d847dca914a1f1d4de3c7.jpg"
                                  alt="card-image" className="object-cover object-center w-full h-full"/></div>
                          <div className="p-6 flex flex-col items-center">
                              <h5 className="block antialiased tracking-normal font-sans text-xl font-semibold leading-snug text-inherit mb-2 text-center !text-gray-900">AI
                                  Chat Template</h5>
                              <p className="block antialiased font-sans text-base leading-relaxed text-inherit mb-4 text-center !text-base font-normal !text-gray-500">Enhance
                                  customer experience and streamline communication with our AI chat template. Our
                                  chatbot is designed to assist customers in making reservations, answering FAQs, and
                                  providing personalized recommendations.</p>
                              <button
                                  className="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-green-500 text-white shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                                  type="button">Read More
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </section>
      </div>
  )
}

export default App
