import { useState, useEffect } from 'react';
import axios from 'axios';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '', 
    eventDate: '',
    location: ''
  });

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL_LOCAL}/api/auth/profile`, {
          withCredentials: true
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    // Fetch events
    const fetchEvents = async () => {
      try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL_LOCAL}/api/events`, {
        withCredentials: true
      });
      setEvents(response.data);
      } catch (error) {
      console.error('Error fetching events:', error);
      }
    };

    fetchUser();
    fetchEvents();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        userId: user.id
      };

      // Ensure eventDate is in ISO format
      if (eventData.eventDate) {
        eventData.eventDate = new Date(eventData.eventDate).toISOString();
      }

      await axios.post(`${import.meta.env.VITE_API_URL_LOCAL}/api/events`, eventData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      setShowForm(false);
      // Refresh events list
      const response = await axios.get(`${import.meta.env.VITE_API_URL_LOCAL}/api/events`, {
        withCredentials: true
      });
      setEvents(response.data);
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        location: ''
      });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Chyba při vytváření události. Zkuste to prosím znovu.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {user && (
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-6"
          onClick={() => setShowForm(true)}
        >
          Přidat Event
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Nový Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="title" className="text-gray-700 mb-1">Název:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="description" className="text-gray-700 mb-1">Popis:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="border rounded-md p-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="eventDate" className="text-gray-700 mb-1">Datum akce:</label>
                <input
                  type="datetime-local"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                  className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="location" className="text-gray-700 mb-1">Místo konání:</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                  Vytvořit
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold mb-2">{event.title}</h3>
            <p className="text-gray-600 mb-4">{event.description}</p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="mr-2">🗓</span>
                <span>{event.event_date ? new Date(event.event_date).toLocaleString() : 'Datum není k dispozici'}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📍</span>
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
