import express from 'express';
import Song from '../models/Song.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all songs for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const songs = await Song.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ message: 'Server error fetching songs' });
  }
});

// Add new song
router.post('/', auth, async (req, res) => {
  try {
    const { title, artist, duration } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ message: 'Title and artist are required' });
    }

    const song = new Song({
      title,
      artist,
      duration: duration || null,
      createdBy: req.user._id
    });

    const savedSong = await song.save();
    res.status(201).json(savedSong);
  } catch (error) {
    console.error('Error adding song:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    res.status(500).json({ message: 'Server error adding song' });
  }
});

// Delete song
router.delete('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ message: 'Server error deleting song' });
  }
});

export default router;
