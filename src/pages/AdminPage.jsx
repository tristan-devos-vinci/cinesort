import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc,
  deleteDoc,
  getDoc, // Added this import
  limit 
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DraggableImage from '../components/DraggableImage';
import Lightbox from '../components/Lightbox';
import AdminCalendar from '../components/AdminCalendar';

const AdminPage = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [puzzleDate, setPuzzleDate] = useState('');
  const [images, setImages] = useState([]);
  const [upcomingPuzzles, setUpcomingPuzzles] = useState([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [editingPuzzleId, setEditingPuzzleId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editImages, setEditImages] = useState([]); // New state for editing images
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, url: '', alt: '' });
  const [todaysPuzzle, setTodaysPuzzle] = useState(null);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false); // Flag to track if we're editing images
  const [dateHasPuzzle, setDateHasPuzzle] = useState(false); // Flag to track if selected date already has a puzzle
  const [formMode, setFormMode] = useState('create'); // 'create' or 'update'

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper: convert File -> data URL
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const cancelUpload = () => {
    setUploading(false);
    setImages([]);
    console.log('Upload canceled by user');
    alert('Upload canceled. You can try again.');
  };
  
  const resetUploadState = () => {
    setUploading(false);
    setImages([]);
    console.log('Upload state reset');
    alert('Upload state has been reset. You can try uploading again.');
  };

  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase Storage connection...');
      
      // Create a small test file
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testRef = ref(storage, `test/${Date.now()}_connection_test.txt`);
      
      await uploadBytes(testRef, testBlob);
      console.log('✅ Firebase Storage connection successful!');
      alert('Firebase Storage is working correctly!');
    } catch (error) {
      console.error('❌ Firebase Storage test failed:', error);
      alert(`Firebase Storage test failed: ${error.message}\n\nPlease check:\n1. Firebase Storage is enabled\n2. Storage rules allow authenticated uploads\n3. Your Firebase configuration is correct`);
    }
  };

  // Initialize form
  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setPuzzleDate(today);
    loadUpcomingPuzzles();
    loadTodaysPuzzle();
  }, []);

  // Check if a puzzle exists for the selected date
  useEffect(() => {
    if (!puzzleDate) return;

    const checkExistingPuzzle = async () => {
      try {
        const q = query(collection(db, 'puzzles'), where('date', '==', puzzleDate), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          setDateHasPuzzle(true);
          const puzzleDoc = snap.docs[0];
          const puzzleData = puzzleDoc.data();
          
          // Pre-fill form for updating if there's a puzzle on this date
          if (formMode === 'create') {
            setEditingPuzzleId(puzzleDoc.id);
            setMovieTitle(puzzleData.title || '');
            // Don't set images yet - user needs to explicitly choose to edit images
          }
        } else {
          setDateHasPuzzle(false);
          // If switching to a date with no puzzle, reset the form for creation
          if (formMode === 'update') {
            resetForm();
          }
        }
      } catch (err) {
        console.error('Failed to check for existing puzzle:', err);
      }
    };
    
    checkExistingPuzzle();
  }, [puzzleDate]);

  // Reset form to creation mode
  const resetForm = () => {
    setMovieTitle('');
    setImages([]);
    setEditingPuzzleId(null);
    setIsEditingImages(false);
    setFormMode('create');
  };

  // Load upcoming puzzles (date >= today)
  const loadUpcomingPuzzles = async () => {
    try {
      setLoadingPuzzles(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'puzzles'),
        where('date', '>=', todayStr),
        orderBy('date', 'asc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUpcomingPuzzles(list);
    } catch (err) {
      console.error('Failed to load upcoming puzzles:', err);
      setUpcomingPuzzles([]);
    } finally {
      setLoadingPuzzles(false);
    }
  };

  // Load today's puzzle specifically
  const loadTodaysPuzzle = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const q = query(collection(db, 'puzzles'), where('date', '==', todayStr), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const todayDoc = snap.docs[0];
        setTodaysPuzzle({ id: todayDoc.id, ...todayDoc.data() });
      } else {
        setTodaysPuzzle(null);
      }
    } catch (err) {
      console.error('Failed to load today\'s puzzle:', err);
      setTodaysPuzzle(null);
    }
  };

  // Load puzzle images for editing
  const loadPuzzleImages = async (puzzleId) => {
    try {
      setUploading(true);
      const docRef = doc(db, 'puzzles', puzzleId);
      const puzzleSnap = await getDoc(docRef); // Changed getDocs to getDoc for single document
    
      if (puzzleSnap.exists()) {
        const puzzleData = puzzleSnap.data();
        if (puzzleData.images && puzzleData.images.length > 0) {
          setEditImages(puzzleData.images);
          setIsEditingImages(true);
        } else {
          alert('No images found for this puzzle.');
        }
      } else {
        alert('Puzzle not found.');
      }
    } catch (err) {
      console.error('Failed to load puzzle images:', err);
      alert('Error loading puzzle images.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    console.log('Files selected:', files.length);
    
    if (files.length === 0) {
      alert('Please select some images');
      return;
    }
    
    if (files.length !== 5) {
      alert(`Please select exactly 5 images. You selected ${files.length} images.`);
      return;
    }

    if (!storage) {
      alert('Firebase Storage is not properly configured. Please check your Firebase setup.');
      console.error('Storage not initialized');
      return;
    }

    if (!user) {
      alert('You must be logged in to upload images.');
      return;
    }

    setUploading(true);
    console.log('Starting upload...', formMode === 'update' ? 'in UPDATE mode' : 'in CREATE mode');
    
    try {
      // Compress image client-side then upload with resumable task and a longer timeout (120s)
      const compressImage = async (file, maxWidth = 1600, quality = 0.8) => {
        const dataUrl = await fileToDataUrl(file);
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = dataUrl;
        });
        const ratio = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        return blob || file;
      };

      const uploadFileResumable = (file, index, timeoutMs = 120000) => {
        return new Promise(async (resolve, reject) => {
          try {
            // compress (returns Blob)
            const toUpload = await compressImage(file, 1600, 0.78);
            const fileName = `${Date.now()}_${index}_${sanitizeFileName(file.name)}`;
            const imageRef = ref(storage, `puzzles/${fileName}`);
            const uploadTask = uploadBytesResumable(imageRef, toUpload);

            const timeoutId = setTimeout(() => {
              try { uploadTask.cancel && uploadTask.cancel(); } catch (e) {}
              reject(new Error(`Upload timeout for file ${index + 1}`));
            }, timeoutMs);

            uploadTask.on('state_changed',
              () => { /* progress available if needed */ },
              (err) => {
                clearTimeout(timeoutId);
                reject(err);
              },
              async () => {
                clearTimeout(timeoutId);
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                  url,
                  storagePath: uploadTask.snapshot.ref.fullPath,
                  blobBase64: undefined,
                  alt: `Scene ${index + 1}`,
                  originalIndex: index,
                  id: index.toString()
                });
              }
            );
          } catch (e) {
            reject(e);
          }
        });
      };

      const uploadPromises = files.map((file, index) => uploadFileResumable(file, index, 120000));
 
      console.log('Waiting for all uploads to complete...');
      const uploadedImages = await Promise.all(uploadPromises);
      console.log('All uploads completed:', uploadedImages);
      
      // HERE'S THE FIX: Use the correct state variable based on form mode
      if (formMode === 'update' && isEditingImages) {
        setEditImages(uploadedImages);
        console.log('Updated editImages with new uploads in update mode');
      } else {
        setImages(uploadedImages);
        console.log('Updated images with new uploads in create mode');
      }
      
      alert('Images uploaded successfully!');
      
      // Clear the file input
      e.target.value = '';
      
      // If we're in update mode, make sure we keep it that way
      if (dateHasPuzzle && formMode === 'create') {
        setFormMode('update');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to upload images: ';
      if (error.code === 'storage/unauthorized') {
        errorMessage += 'You do not have permission to upload files. Check Firebase Storage rules.';
      } else if (error.code === 'storage/canceled') {
        errorMessage += 'Upload was canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage += 'Unknown error occurred. Check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Upload timed out. Please try again with smaller images.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
      console.log('Upload process completed, resetting uploading state');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const updateImages = formMode === 'create' ? setImages : setEditImages;
      
      updateImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateAltText = (id, newAlt) => {
    const updateImages = formMode === 'create' ? setImages : setEditImages;
    
    updateImages(currentImages => currentImages.map(img => 
      img.id === id ? { ...img, alt: newAlt } : img
    ));
  };

  // Save new puzzle or update existing puzzle
  const savePuzzle = async () => {
    if (!movieTitle || !puzzleDate) {
      alert('Please fill in the movie title and date.');
      return;
    }

    if (formMode === 'create' && images.length !== 5) {
      alert('Please upload 5 images.');
      return;
    }

    if (formMode === 'update' && isEditingImages && editImages.length !== 5) {
      alert('Please ensure you have 5 images.');
      return;
    }

    setSaving(true);
    
    try {
      // Check for existing puzzle on this date (double-check)
      const existingPuzzleQuery = query(collection(db, 'puzzles'), where('date', '==', puzzleDate), limit(1));
      const existingPuzzleSnap = await getDocs(existingPuzzleQuery);
      
      // Prepare image metadata and ensure we DO NOT persist blobBase64
      const imagesToSave = formMode === 'create' ? images.map((img, index) => ({
        id: img.id ?? String(index),
        url: img.url ?? '',
        storagePath: img.storagePath ?? null,
        alt: img.alt ?? '',
        originalIndex: img.originalIndex ?? index,
      })) : isEditingImages ? editImages.map((img, index) => ({
        id: img.id ?? String(index),
        url: img.url ?? '',
        storagePath: img.storagePath ?? null,
        alt: img.alt ?? '',
        originalIndex: img.originalIndex ?? index,
      })) : null;

      // Create new puzzle
      if (formMode === 'create') {
        if (!existingPuzzleSnap.empty) {
          // A puzzle already exists for this date!
          if (!confirm(`A puzzle already exists for ${puzzleDate}. Do you want to replace it?`)) {
            setSaving(false);
            return;
          }
          
          // User confirmed they want to replace it - delete the existing one
          await deleteDoc(doc(db, 'puzzles', existingPuzzleSnap.docs[0].id));
        }
        
        await addDoc(collection(db, 'puzzles'), {
          title: movieTitle,
          date: puzzleDate,
          images: imagesToSave,
          createdAt: serverTimestamp(),
          createdBy: user.uid
        });
        
        alert('Puzzle saved successfully!');
      }
      // Update existing puzzle
      else if (formMode === 'update') {
        if (editingPuzzleId) {
          const updateData = {
            title: movieTitle,
            date: puzzleDate,
          };
          
          // Only update images if they were edited
          if (isEditingImages) {
            updateData.images = imagesToSave;
          }
          
          await updateDoc(doc(db, 'puzzles', editingPuzzleId), updateData);
          alert('Puzzle updated successfully!');
        } else {
          throw new Error('No puzzle ID found for updating');
        }
      }
      
      resetForm();
      
      const today = new Date().toISOString().split('T')[0];
      setPuzzleDate(today);
      
      // Reload puzzles
      loadUpcomingPuzzles();
      loadTodaysPuzzle();
    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to save puzzle: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle calendar date selection
  const handleCalendarDateSelect = (dateStr) => {
    setPuzzleDate(dateStr);
    
    // Check if a puzzle already exists for this date
    const existingPuzzle = upcomingPuzzles.find(p => p.date === dateStr);
    if (existingPuzzle) {
      // Pre-fill the form with existing puzzle data
      setMovieTitle(existingPuzzle.title || '');
      setEditingPuzzleId(existingPuzzle.id);
      setFormMode('update');
    } else {
      // Reset the form for a new puzzle
      resetForm();
    }
    
    // Scroll to the top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Hide calendar view if shown
    setShowCalendarView(false);
  };

  // Admin actions: edit / delete
  const openEdit = (puzzle) => {
    setEditingPuzzleId(puzzle.id);
    setMovieTitle(puzzle.title ?? '');
    setPuzzleDate(puzzle.date ?? new Date().toISOString().split('T')[0]);
    setFormMode('update');
    
    // If puzzle has images, make them available but don't load into the edit interface yet
    if (puzzle.images && puzzle.images.length > 0) {
      console.log('Setting editImages from puzzle:', puzzle.images.length);
      setEditImages(puzzle.images.map(img => ({...img}))); // Create a copy of the images array
      setIsEditingImages(false); // User must click "Edit Images" to modify them
    } else {
      console.log('No images found in puzzle');
      setEditImages([]);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Enable editing images for an existing puzzle
  const enableImageEditing = () => {
    console.log('Enable image editing', { editImages: editImages.length });
  
    if (editImages.length > 0) {
      setIsEditingImages(true);
      console.log('Setting isEditingImages to true');
    } else {
      // If no images found, attempt to load them from Firestore
      if (editingPuzzleId) {
        loadPuzzleImages(editingPuzzleId);
      } else {
        alert('No images found for this puzzle. Please upload new images.');
      }
    }
  };
  
  const cancelEdit = () => {
    resetForm();
    const today = new Date().toISOString().split('T')[0];
    setPuzzleDate(today);
  };
  
  const saveEdit = async () => {
    if (!editingPuzzleId) return;
    try {
      const refDoc = doc(db, 'puzzles', editingPuzzleId);
      await updateDoc(refDoc, { title: movieTitle, date: puzzleDate });
      resetForm();
      await loadUpcomingPuzzles();
      await loadTodaysPuzzle();
      alert('Puzzle updated');
    } catch (err) {
      console.error('Failed to update puzzle:', err);
      alert('Update failed');
    }
  };
  
  const deletePuzzle = async (id) => {
    if (!confirm('Delete this puzzle? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'puzzles', id));
      await loadUpcomingPuzzles();
      await loadTodaysPuzzle();
      
      // If we were editing this puzzle, reset the form
      if (editingPuzzleId === id) {
        resetForm();
      }
      
      alert('Puzzle deleted');
    } catch (err) {
      console.error('Failed to delete puzzle:', err);
      alert('Delete failed');
    }
  };

  const sanitizeFileName = (name) =>
    String(name)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();

  // Helper renderer for upcoming puzzles
  const renderUpcoming = () => {
    if (loadingPuzzles) {
      return <div className="text-slate-600">Loading puzzles...</div>;
    }

    if (!loadingPuzzles && upcomingPuzzles.length === 0) {
      return <div className="text-slate-500">No upcoming puzzles found.</div>;
    }

    return (
      <div className="space-y-4">
        {upcomingPuzzles.map((p) => (
          <div key={p.id} className="flex items-center justify-between border p-3 rounded bg-white/80 hover:bg-white transition-colors">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-slate-500">Date: {p.date}</div>
              <div className="text-xs text-slate-500">Images: {p.images?.length || 0}</div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openEdit(p)} 
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => deletePuzzle(p.id)} 
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
 
  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 font-['Inter'] mb-2">
              Admin Portal
            </h2>
            <p className="text-slate-600 font-['Inter']">Access the puzzle management system</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2 font-['Inter']">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-['Inter'] transition-colors"
                placeholder="admin@cinematech.com"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2 font-['Inter']">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-['Inter'] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors font-['Inter']"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main admin interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <a 
              href="/"
              className="absolute left-4 top-4 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Game
            </a>
            <h1 className="text-4xl font-bold text-slate-800 font-['Orbitron']">
              Cinema Puzzle Studio
            </h1>
          </div>
          <p className="text-slate-600 font-['Inter'] text-lg">
            Create and manage daily movie challenges
          </p>
          <p className="text-slate-500 font-['Inter'] text-sm mt-2">
            Access: /admin0424
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 font-['Inter']">
                {formMode === 'create' ? 'Create New Puzzle' : 'Update Puzzle'}
              </h2>
            </div>
            
            {formMode === 'update' && (
              <button
                onClick={cancelEdit}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-sm transition-colors"
              >
                Cancel Editing
              </button>
            )}
          </div>
          
          {/* Form Status Indicator */}
          {dateHasPuzzle && formMode === 'create' && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 text-yellow-800">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  A puzzle already exists for {puzzleDate}. 
                  <button 
                    className="ml-2 text-blue-600 underline"
                    onClick={() => {
                      const existingPuzzle = upcomingPuzzles.find(p => p.date === puzzleDate);
                      if (existingPuzzle) openEdit(existingPuzzle);
                    }}
                  >
                    Edit existing puzzle instead
                  </button>
                </span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2 font-['Inter']">
                Movie Title
              </label>
              <input
                type="text"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-['Inter'] transition-colors"
                placeholder="Enter movie title..."
              />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2 font-['Inter']">
                Puzzle Date
              </label>
              <input
                type="date"
                value={puzzleDate}
                onChange={(e) => setPuzzleDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-['Inter'] transition-colors"
              />
            </div>
          </div>

          {/* Image Section */}
          <div className="mb-8">
            {formMode === 'update' && !isEditingImages ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-800 mb-3">
                  {editImages.length > 0 
                    ? `This puzzle has ${editImages.length} existing images.`
                    : 'This puzzle has no images.'}
                </p>
                <button 
                  onClick={enableImageEditing} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editImages.length > 0 ? 'Edit Existing Images' : 'Upload Images'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-slate-700 text-sm font-medium font-['Inter']">
                    {formMode === 'create' 
                      ? 'Upload 5 Images (in chronological order)' 
                      : 'Edit Images (in chronological order)'}
                  </label>
                  
                  {/* Add a Cancel button for edit mode */}
                  {formMode === 'update' && isEditingImages && (
                    <button
                      onClick={() => setIsEditingImages(false)}
                      className="text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                      Cancel image editing
                    </button>
                  )}
                </div>
                
                {/* Firebase Upload */}
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-600 font-['Inter'] transition-colors hover:border-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-lg">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-slate-600 font-['Inter'] font-medium">Uploading images...</span>
                      </div>
                      <button
                        onClick={cancelUpload}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-['Inter'] text-sm transition-colors"
                      >
                        Cancel Upload
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm text-slate-500 font-['Inter'] space-y-1">
                  <p>• Select exactly 5 images</p>
                  <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                  <p>• Arrange them in the order they appear in the movie</p>
                  {formMode === 'create' && images.length > 0 && (
                    <p className="text-green-600 font-medium">✓ {images.length} images uploaded successfully</p>
                  )}
                  {formMode === 'update' && isEditingImages && editImages.length > 0 && (
                    <p className="text-green-600 font-medium">✓ {editImages.length} images ready for editing</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Firebase Connection Test */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-blue-800 font-semibold mb-3 font-['Inter']">System Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div className="text-slate-600 font-['Inter']">
                Auth: {auth ? <span className="text-green-600 font-medium">✓ Connected</span> : <span className="text-red-600 font-medium">✗ Disconnected</span>}
              </div>
              <div className="text-slate-600 font-['Inter']">
                Database: {db ? <span className="text-green-600 font-medium">✓ Connected</span> : <span className="text-red-600 font-medium">✗ Disconnected</span>}
              </div>
              <div className="text-slate-600 font-['Inter']">
                Storage: {storage ? <span className="text-green-600 font-medium">✓ Connected</span> : <span className="text-red-600 font-medium">✗ Disconnected</span>}
              </div>
              <div className="text-slate-600 font-['Inter']">
                User: {user ? <span className="text-green-600 font-medium">✓ {user.email}</span> : <span className="text-red-600 font-medium">✗ Not logged in</span>}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={testFirebaseConnection}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-['Inter'] text-sm transition-colors"
              >
                Test Storage
              </button>
              <button
                onClick={resetUploadState}
                className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-['Inter'] text-sm transition-colors"
              >
                Reset State
              </button>
            </div>

            {/* Debug Info Button */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => console.log({
      formMode,
      isEditingImages,
      images: images.length, 
      editImages: editImages.length,
      dateHasPuzzle,
      editingPuzzleId
    })}
    className="px-4 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-['Inter'] text-sm transition-colors"
              >
                Debug Info
              </button>
            </div>
          </div>

          {/* Display Images Section */}
          {((formMode === 'create' && images.length > 0) || (formMode === 'update' && isEditingImages && editImages.length > 0)) && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-6 text-slate-800 font-['Inter'] flex items-center">
                <svg className="w-6 h-6 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Arrange Scenes in Chronological Order
              </h3>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={formMode === 'create' 
                    ? images.map(img => img.id)
                    : editImages.map(img => img.id)
                  }
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(formMode === 'create' ? images : editImages).map((image, index) => (
                      <div key={image.id} className="space-y-4">
                        <div className="relative">
                          <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-semibold z-10 shadow-lg font-['Inter']">
                            {index + 1}
                          </div>
                          <DraggableImage
                            id={image.id}
                            image={image.url}
                            alt={image.alt}
                            onClick={() => setLightbox({ open: true, url: image.url, alt: image.alt || '' })}
                          />
                        </div>
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(e) => updateAltText(image.id, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-['Inter'] text-sm transition-colors"
                          placeholder="Scene description..."
                        />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
           
          {/* Lightbox for admin images */}
          <Lightbox
            open={lightbox.open}
            url={lightbox.url}
            alt={lightbox.alt}
            onClose={() => setLightbox({ open: false, url: '', alt: '' })}
          />
 
          {/* Save Button */}
          <button
            onClick={savePuzzle}
            disabled={saving || 
                     !movieTitle || 
                     !puzzleDate || 
                     (formMode === 'create' && images.length !== 5) || 
                     (formMode === 'update' && isEditingImages && editImages.length !== 5)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors font-['Inter'] disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {formMode === 'create' ? 'Creating Puzzle...' : 'Updating Puzzle...'}
              </span>
            ) : (
              formMode === 'create' ? 'Create Puzzle' : 'Update Puzzle'
            )}
          </button>
        </div>
        
        {/* Today's Puzzle Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800 font-['Inter'] flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Today's Puzzle
            </h3>
            <button 
              onClick={loadTodaysPuzzle}
              className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
          {todaysPuzzle ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800">{todaysPuzzle.title}</h4>
                  <p className="text-sm text-slate-600">Date: {todaysPuzzle.date}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEdit(todaysPuzzle)} 
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => window.open('/', '_blank')} 
                    className="px-3 py-1 bg-slate-600 text-white rounded text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </button>
                </div>
              </div>
              
              {/* Preview of today's images */}
              {todaysPuzzle.images && todaysPuzzle.images.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {todaysPuzzle.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={img.url} 
                        alt={img.alt} 
                        className="w-full h-20 object-cover rounded border border-slate-300 cursor-pointer"
                        onClick={() => setLightbox({ open: true, url: img.url, alt: img.alt || '' })}
                      />
                      <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-700">No puzzle scheduled for today!</p>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setPuzzleDate(today);
                  resetForm();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
              >
                Create Today's Puzzle
              </button>
            </div>
          )}
        </div>
        
        {/* Toggle Calendar View */}
        <div className="max-w-4xl mx-auto mb-4 flex justify-end">
          <button
            onClick={() => setShowCalendarView(!showCalendarView)}
            className="flex items-center px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {showCalendarView ? 'Hide Calendar' : 'Show Calendar View'}
          </button>
        </div>
        
        {/* Calendar or List View */}
        {showCalendarView ? (
          <div className="max-w-4xl mx-auto mb-8">
            <AdminCalendar 
              puzzles={upcomingPuzzles} 
              onEditPuzzle={openEdit} 
              onDeletePuzzle={deletePuzzle} 
              onDateSelect={handleCalendarDateSelect} 
            />
          </div>
        ) : (
          <section className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto border border-slate-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-['Inter']">Upcoming Puzzles</h3>
              <button onClick={loadUpcomingPuzzles} className="text-sm px-3 py-1 bg-slate-100 rounded">Refresh</button>
            </div>
            {renderUpcoming()}
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
