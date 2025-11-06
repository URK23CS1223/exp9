import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MusicApp = () => {
  const [user, setUser] = useState(null);
  const [songs, setSongs] = useState([]);
  const [newSong, setNewSong] = useState({ title: '', artist: '', duration: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api/songs';

  // Authentication check
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  // Fetch songs
  const fetchSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching songs with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Songs data:', data);
      setSongs(data);
    } catch (err) {
      console.error('Fetch songs error:', err);
      setError(`Failed to fetch songs: ${err.message}. Make sure the backend server is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'songs') {
      fetchSongs();
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSong(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!newSong.title || !newSong.artist) {
      setError('Title and Artist must be filled out.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Submitting song with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newSong.title,
          artist: newSong.artist,
          duration: newSong.duration ? parseInt(newSong.duration) : undefined
        }),
      });
      
      console.log('Add song response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to add song. Status: ${response.status}`);
      }

      const addedSong = await response.json();
      setSongs(prev => [...prev, addedSong]);
      setNewSong({ title: '', artist: '', duration: '' });
      setSuccess('Song added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Submit error:', err);
      setError(`Could not submit data to the server: ${err.message}. Please check if the backend is running.`);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete song.');
      }
      
      setSongs(prev => prev.filter(song => song._id !== id));
      setSuccess('Song deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error deleting song.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        const data = await response.json();
        setSuccess(`Backend connection successful: ${data.message}`);
      } else {
        setError('Backend is not responding properly');
      }
    } catch (err) {
      setError('Cannot connect to backend server. Make sure it\'s running on port 5000.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <header className="bg-white/20 backdrop-blur-lg border-b border-white/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Music App</h1>
            <div className="flex items-center space-x-6">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-lg transition duration-200 ${
                    activeTab === 'dashboard' 
                      ? 'bg-white/30 text-white' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('songs')}
                  className={`px-4 py-2 rounded-lg transition duration-200 ${
                    activeTab === 'songs' 
                      ? 'bg-white/30 text-white' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  Manage Songs
                </button>
              </nav>
              <div className="flex items-center space-x-4">
                <span className="text-white">Welcome, {user.username}!</span>
                <button 
                  onClick={handleLogout} 
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' ? (
          <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4">Welcome to Your Music Journey</h2>
              <p className="text-white/80 text-lg">Start exploring your favorite music!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="feature-card bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition duration-300">
                <h3 className="text-xl font-semibold text-white mb-3">🎵 Discover Music</h3>
                <p className="text-white/80">Explore new songs and artists from around the world</p>
              </div>
              <div className="feature-card bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition duration-300">
                <h3 className="text-xl font-semibold text-white mb-3">🎧 Create Playlists</h3>
                <p className="text-white/80">Build your personal music collections and share with friends</p>
              </div>
              <div className="feature-card bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition duration-300">
                <h3 className="text-xl font-semibold text-white mb-3">🌟 Favorites</h3>
                <p className="text-white/80">Save your most loved tracks and never lose them</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-3">📊 Your Stats</h3>
                <div className="text-white/80 space-y-2">
                  <p>🎵 Total Songs: {songs.length}</p>
                  <p>❤️ Favorite Songs: 0</p>
                  <p>📁 Playlists Created: 0</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-3">🚀 Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveTab('songs')}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition duration-200"
                  >
                    Manage Songs
                  </button>
                  <button 
                    onClick={testBackendConnection}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition duration-200"
                  >
                    Test Backend Connection
                  </button>
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition duration-200">
                    Explore Genres
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl w-full bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
            <h1 className="text-4xl font-bold text-center mb-8 text-white drop-shadow-lg">
              🎵 Music Playlist Manager
            </h1>

            {/* Connection Test Button */}
            <div className="flex justify-end mb-4">
              {/* <button
                onClick={testBackendConnection}
                className="text-sm px-3 py-1 bg-green-500/80 hover:bg-green-600/80 text-white rounded-md transition border border-white/30"
              >
                Test Connection
              </button> */}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400 text-red-300 rounded-lg px-4 py-2 mb-4 text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-400 text-green-300 rounded-lg px-4 py-2 mb-4 text-center">
                {success}
              </div>
            )}

            {/* Add New Song Section */}
            <h2 className="text-2xl font-semibold mb-4 text-white">➕ Add New Song</h2>
            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  name="title"
                  placeholder="Song Title"
                  value={newSong.title}
                  onChange={handleInputChange}
                  required
                  className="p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-white border border-white/30"
                />
                <input
                  name="artist"
                  placeholder="Artist Name"
                  value={newSong.artist}
                  onChange={handleInputChange}
                  required
                  className="p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-white border border-white/30"
                />
                <input
                  name="duration"
                  type="number"
                  placeholder="Duration (seconds)"
                  value={newSong.duration}
                  onChange={handleInputChange}
                  className="p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-white border border-white/30"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-white/30 hover:bg-white/40 rounded-lg text-white font-semibold transition duration-300 border border-white/30"
              >
                Add Song
              </button>
            </form>

            <hr className="border-white/30 mb-6" />

            {/* Songs List Section */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">🎧 Your Songs</h2>
              <button
                onClick={fetchSongs}
                disabled={loading}
                className="text-sm px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-md transition border border-white/30 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <p className="text-center text-white/80">Loading songs...</p>
            ) : (
              <ul className="space-y-3">
                {songs.length > 0 ? (
                  songs.map(song => (
                    <li
                      key={song._id}
                      className="flex justify-between items-center bg-white/10 hover:bg-white/20 transition p-4 rounded-xl border border-white/20"
                    >
                      <div>
                        <p className="text-lg font-medium text-white">{song.title}</p>
                        <p className="text-sm text-white/70">
                          by {song.artist} {song.duration ? `(${song.duration}s)` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(song._id)}
                        className="px-3 py-1 bg-red-500/80 hover:bg-red-600/80 text-white rounded-lg text-sm transition"
                      >
                        Delete
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-center text-white/80">No songs found. Add one above!</p>
                )}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;