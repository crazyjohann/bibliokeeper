  import React, { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from '@supabase/supabase-js';
import { Book, Users, ArrowLeft, Plus, Trash2, BookOpen, UserCheck, Camera, Search, Calendar, FileText, Download, Upload, Settings, Bell, AlertCircle, LogIn } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://zhyigfuzgdvdixvhuvgf.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeWlnZnV6Z2R2ZGl4dmh1dmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTQ0NjMsImV4cCI6MjA3NTM3MDQ2M30.Lrq-akIdI5x2a4Bci9-K4x-OO8EJooMENZtCnLwG3-0";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const VerificationScreen = ({ onVerified }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(() => sessionStorage.getItem('libraryVerified') === 'true');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'infantjesus1231!') {
      setError('');
      setVerified(true);
      sessionStorage.setItem('libraryVerified', 'true');
      setPassword('');
      setTimeout(() => {
        if (typeof onVerified === 'function') {
          onVerified();
        }
      }, 800);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  if (verified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-96">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Verified!</h2>
          <p className="text-gray-600">You can now proceed to the login screen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-96">
        <div className="mb-6">
          <Book className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📚 Bibliokeeper</h1>
          <p className="text-sm text-gray-600">Library Access Verification</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
            placeholder="Enter access password"
            autoFocus
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold w-full transition-colors"
          >
            Verify Access
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">Authorized librarians only</p>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">The application encountered an error. Please refresh the page to try again.</p>
            <button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading Bibliokeeper...</p>
    </div>
  </div>
);

const LoginScreen = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
        });
        if (result.error) throw result.error;
        if (result.data.user) {
          setError("Please check your email to confirm your account before signing in.");
          setIsSignUp(false);
        }
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (result.error) throw result.error;
        if (result.data.user) {
          onLogin(result.data.user);
        }
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google authentication error:", err);
      setError(err.message || "Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-200">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center w-96">
        <h1 className="text-3xl font-bold mb-4">📚 Bibliokeeper</h1>
        <p className="text-sm text-gray-600 mb-6">Church Library Management System</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength="6"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold w-full transition-colors"
          >
            {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold w-full transition-colors flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
        </button>
        
        <p className="text-xs text-gray-500 mt-4">Authorized librarians only</p>
      </div>
    </div>
  );
};

const LibraryApp = ({ user, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [memberScanInput, setMemberScanInput] = useState('');
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: '', quantity: 1 });
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', membershipType: 'Standard' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanningFor, setScanningFor] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isLoadingBookData, setIsLoadingBookData] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  
  const videoRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const isScanningRef = useRef(false);
  const streamRef = useRef(null);
  const quaggaRef = useRef(null);
  const quaggaOnDetectedRef = useRef(null);
  
  const [settings, setSettings] = useState({
    libraryName: 'Bibliokeeper',
    maxLoansPerMember: 10,
    loanPeriodDays: 14,
    enableFines: false,
    finePerDay: 0.00,
    allowReservations: true,
    autoReminders: true
  });

  // Load data from Supabase on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setDataError(null);
    try {
      // Load books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (booksError) throw booksError;
      setBooks(booksData || []);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Load loans
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (loansError) throw loansError;
      setLoans(loansData || []);

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!settingsError && settingsData) {
        setSettings(settingsData.settings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setDataError('Failed to load library data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          settings: newSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const generateId = (prefix) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  };

  const findBook = (bookId) => {
    if (!bookId) return null;
    return books.find(book => book.id === bookId || book.isbn === bookId);
  };
  
  const findMember = (memberId) => {
    if (!memberId) return null;
    return members.find(member => member.id === memberId);
  };

  const handleScanInputChange = useCallback((e) => setScanInput(e.target.value), []);
  const handleMemberScanInputChange = useCallback((e) => setMemberScanInput(e.target.value), []);
  const handleSearchQueryChange = useCallback((e) => setSearchQuery(e.target.value), []);

  const fetchAuthorName = async (authorEntry) => {
    if (!authorEntry) return null;
    if (authorEntry.name) return authorEntry.name;
    if (authorEntry.key) {
      try {
        const response = await fetch(`https://openlibrary.org${authorEntry.key}.json`);
        if (response.ok) {
          const authorData = await response.json();
          if (authorData?.name) return authorData.name;
        }
      } catch (error) {
        console.error('Error fetching author details from Open Library:', error);
      }
    }
    return null;
  };

  const cleanISBN = (isbn) => {
    return isbn.replace(/[^0-9X]/gi, '').toUpperCase();
  };

  const fetchBookInfoFromAPI = async (isbn) => {
    setApiError(null);
    setIsLoadingBookData(true);
    
    const cleanedISBN = cleanISBN(isbn);
    
    if (cleanedISBN.length < 10) {
      setApiError(`Invalid ISBN length: ${cleanedISBN}. Please try again.`);
      setIsLoadingBookData(false);
      return null;
    }
    
    try {
      console.log(`Fetching book info from Open Library for ISBN: ${cleanedISBN}`);
      
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanedISBN}&jscmd=data&format=json`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Open Library API response:', data);
      
      const bookData = data[`ISBN:${cleanedISBN}`];
      
      if (bookData) {
        const title = bookData.title || 'Unknown Title';
        
        let author = 'Unknown Author';
        if (bookData.authors && bookData.authors.length > 0) {
          const resolvedAuthor = await fetchAuthorName(bookData.authors[0]);
          author = resolvedAuthor || bookData.by_statement || 'Unknown Author';
        } else if (bookData.by_statement) {
          author = bookData.by_statement;
        }
        
        const category = bookData.subjects && bookData.subjects.length > 0 
          ? bookData.subjects[0].name 
          : 'General';
        
        const bookInfo = { title, author, category };
        console.log('Successfully parsed book info from Books API:', bookInfo);
        setIsLoadingBookData(false);
        return bookInfo;
      } else {
        console.log('No data from Books API, trying ISBN endpoint...');
        const isbnResponse = await fetch(`https://openlibrary.org/isbn/${cleanedISBN}.json`);
        
        if (!isbnResponse.ok) {
          throw new Error(`ISBN endpoint responded with status: ${isbnResponse.status}`);
        }
        
        const isbnData = await isbnResponse.json();
        console.log('ISBN endpoint response:', isbnData);
        
        if (isbnData) {
          const title = isbnData.title || 'Unknown Title';
          let author = isbnData.by_statement || 'Unknown Author';

          if (isbnData.authors && isbnData.authors.length > 0) {
            const resolvedAuthor = await fetchAuthorName(isbnData.authors[0]);
            if (resolvedAuthor) {
              author = resolvedAuthor;
            }
          }
          
          const category = isbnData.subjects && isbnData.subjects.length > 0
            ? isbnData.subjects[0]
            : 'General';

          const bookInfo = { title, author, category };
          console.log('Successfully parsed book info from ISBN endpoint:', bookInfo);
          setIsLoadingBookData(false);
          return bookInfo;
        }
      }

      throw new Error('No book data found');
      
    } catch (error) {
      console.error('Error with Open Library API:', error);
      setApiError(`Could not find book information for ISBN: ${cleanedISBN}. Please enter details manually.`);
      setIsLoadingBookData(false);
      return null;
    }
  };

  const startBarcodeScanning = async (type) => {
    setScanningFor(type);
    setIsScanning(true);
    setCameraError(null);
    setApiError(null);
    isScanningRef.current = true;
    setLastScannedBarcode(null);
    
    if (type === 'isbn') {
      setNewBook({ title: '', author: '', isbn: '', category: '', quantity: 1 });
    }
    
    scanTimeoutRef.current = setTimeout(() => {
      stopBarcodeScanning();
      alert('Scanning timed out after 30 seconds. Please try again.');
    }, 30000);
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      
      if (!hasCamera) {
        setCameraError("No webcam detected. Please use your physical USB barcode scanner by typing/scanning directly into the input field, then press Tab.");
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } 
      });
      
      if (videoRef.current && isScanningRef.current) {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
          startQuaggaScanning();
        } catch (playError) {
          console.error('Video play error:', playError);
          setCameraError("Could not start video playback. Use your physical barcode scanner instead.");
        }
      } else {
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error('Camera error:', err);
      let errorMessage = "Camera not available. Use your physical USB barcode scanner by typing/scanning in the input field.";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "Camera access denied. Use your physical barcode scanner instead.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No webcam found. Use your physical barcode scanner instead.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "Camera is in use. Use your physical barcode scanner instead.";
      }
      
      setCameraError(errorMessage);
    }
  };

  const startQuaggaScanning = async () => {
    if (!videoRef.current || typeof window === 'undefined') {
      console.warn('Video element not ready for scanning');
      stopBarcodeScanning();
      return;
    }

    try {
      if (!window.Quagga) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const Quagga = window.Quagga;

      if (!Quagga || typeof Quagga.init !== 'function') {
        console.error('Quagga library did not load correctly');
        setCameraError('Barcode detection library failed to load. Please refresh and try again.');
        stopBarcodeScanning();
        return;
      }

      if (quaggaRef.current && quaggaOnDetectedRef.current) {
        try {
          quaggaRef.current.offDetected(quaggaOnDetectedRef.current);
          quaggaRef.current.stop();
        } catch (cleanupError) {
          console.warn('Error cleaning up previous Quagga instance:', cleanupError);
        }
      }

      quaggaRef.current = Quagga;

      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader', 
            'upc_reader',
            'upc_e_reader',
            'code_128_reader',
            'code_39_reader'
          ]
        },
        locate: true,
        debug: false
      }, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          setCameraError('Barcode detection failed to initialize. Please try again.');
          stopBarcodeScanning();
          return;
        }

        if (!isScanningRef.current) {
          Quagga.stop();
          return;
        }

        Quagga.start();
        console.log('Quagga started successfully');
      });

      const onDetected = (data) => {
        const detectedCode = data?.codeResult?.code;
        if (detectedCode && detectedCode !== lastScannedBarcode) {
          console.log('Barcode detected:', detectedCode);
          setLastScannedBarcode(detectedCode);
          handleBarcodeDetected(detectedCode);
        }
      };

      Quagga.onDetected(onDetected);
      quaggaOnDetectedRef.current = onDetected;

    } catch (error) {
      console.error('Error loading Quagga for barcode scanning:', error);
      setCameraError('Barcode detection is unavailable. Please refresh the page and try again.');
      stopBarcodeScanning();
    }
  };

  const handleBarcodeDetected = async (barcode) => {
    if (!barcode || !barcode.trim()) return;
    
    const cleanBarcode = barcode.trim();
    console.log('Processing barcode:', cleanBarcode);
    
    if (scanningFor === 'book') {
      setScanInput(cleanBarcode);
      const existingBook = findBook(cleanBarcode);
      if (!existingBook && cleanBarcode.length >= 10) {
        try {
          const bookInfo = await fetchBookInfoFromAPI(cleanBarcode);
          if (bookInfo) {
            const newBookEntry = {
              id: generateId('B'),
              title: bookInfo.title,
              author: bookInfo.author,
              isbn: cleanBarcode,
              category: bookInfo.category || 'General',
              available: 1,
              total: 1
            };
            
            // Save to Supabase
            const { error } = await supabase
              .from('books')
              .insert([newBookEntry]);
            
            if (!error) {
              setBooks(prev => [...prev, newBookEntry]);
              stopBarcodeScanning();
              alert(`New book "${bookInfo.title}" by ${bookInfo.author} added to library automatically!`);
              return;
            }
          }
        } catch (error) {
          console.error('Error auto-adding book:', error);
        }
      }
    } else if (scanningFor === 'member') {
      setMemberScanInput(cleanBarcode);
    } else if (scanningFor === 'isbn') {
      const bookInfo = await fetchBookInfoFromAPI(cleanBarcode);
      if (bookInfo) {
        setNewBook({
          title: bookInfo.title,
          author: bookInfo.author,
          isbn: cleanBarcode,
          category: bookInfo.category,
          quantity: 1
        });
        stopBarcodeScanning();
        alert(`Book information found and auto-filled!\nTitle: ${bookInfo.title}\nAuthor: ${bookInfo.author}`);
        return;
      } else {
        setNewBook(prev => ({ ...prev, isbn: cleanBarcode }));
        stopBarcodeScanning();
        alert(`ISBN detected: ${cleanBarcode}\nCould not fetch book details automatically. Please fill in the remaining fields.`);
        return;
      }
    }
    
    stopBarcodeScanning();
    alert(`Barcode detected: ${cleanBarcode}`);
  };

  const stopBarcodeScanning = () => {
    console.log('Stopping barcode scanning');
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    isScanningRef.current = false;
    
    if (quaggaRef.current) {
      try {
        if (quaggaOnDetectedRef.current) {
          quaggaRef.current.offDetected(quaggaOnDetectedRef.current);
        }
        quaggaRef.current.stop();
      } catch (error) {
        console.error('Error stopping Quagga:', error);
      } finally {
        quaggaRef.current = null;
        quaggaOnDetectedRef.current = null;
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setScanningFor(null);
    setCameraError(null);
    setIsLoadingBookData(false);
  };

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      isScanningRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (quaggaRef.current) {
        try {
          if (quaggaOnDetectedRef.current) {
            quaggaRef.current.offDetected(quaggaOnDetectedRef.current);
          }
          quaggaRef.current.stop();
        } catch (error) {
          console.error('Error stopping Quagga during cleanup:', error);
        } finally {
          quaggaRef.current = null;
          quaggaOnDetectedRef.current = null;
        }
      }
    };
  }, []);

  const calculateDueDate = (loanDate, days = settings.loanPeriodDays) => {
    const date = new Date(loanDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const overdue = loans.filter(loan => loan.status === 'active' && loan.due_date < today);
    setOverdueItems(overdue);
    
    const newNotifications = overdue.map(item => {
      const book = findBook(item.book_id);
      const member = findMember(item.member_id);
      return {
        id: item.id,
        type: 'overdue',
        message: `"${book?.title || 'Unknown Book'}" loaned to ${member?.name || 'Unknown Member'} is overdue`,
        date: today
      };
    });
    setNotifications(newNotifications);
  }, [loans, books, members]);

  const handleLoan = async () => {
    const book = findBook(scanInput);
    const member = findMember(memberScanInput);
    
    if (!book) {
      alert('Book not found! Please check the ID or scan again.');
      return;
    }
    
    if (!member) {
      alert('Member not found! Please check the ID or scan again.');
      return;
    }
    
    if (book.available <= 0) {
      alert('Book not available!');
      return;
    }
    
    const memberLoans = loans.filter(loan => loan.member_id === member.id && loan.status === 'active');
    if (memberLoans.length >= settings.maxLoansPerMember) {
      alert(`Member has reached maximum loan limit (${settings.maxLoansPerMember} books)!`);
      return;
    }
    
    const loanDate = new Date().toISOString().split('T')[0];
    const dueDate = calculateDueDate(loanDate);
    
    const newLoan = {
      id: generateId('L'),
      book_id: book.id,
      member_id: member.id,
      loan_date: loanDate,
      due_date: dueDate,
      status: 'active'
    };
    
    try {
      // Save loan to Supabase
      const { error: loanError } = await supabase
        .from('loans')
        .insert([newLoan]);
      
      if (loanError) throw loanError;
      
      // Update book availability
      const { error: bookError } = await supabase
        .from('books')
        .update({ available: Math.max(0, book.available - 1) })
        .eq('id', book.id);
      
      if (bookError) throw bookError;
      
      setLoans([...loans, newLoan]);
      setBooks(books.map(b => 
        b.id === book.id ? { ...b, available: Math.max(0, b.available - 1) } : b
      ));
      
      setScanInput('');
      setMemberScanInput('');
      alert(`Book "${book.title}" loaned to ${member.name}!\nDue date: ${dueDate}`);
    } catch (error) {
      console.error('Error processing loan:', error);
      alert('Failed to process loan. Please try again.');
    }
  };

  const handleReturn = async () => {
    const book = findBook(scanInput);
    
    if (!book) {
      alert('Book not found! Please check the ID or scan again.');
      return;
    }
    
    const loanToReturn = loans.find(loan => loan.book_id === book.id && loan.status === 'active');
    
    if (!loanToReturn) {
      alert('This book is not currently loaned out!');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = today > loanToReturn.due_date;
    
    try {
      // Update loan status in Supabase
      const { error: loanError } = await supabase
        .from('loans')
        .update({ 
          status: 'returned', 
          return_date: today 
        })
        .eq('id', loanToReturn.id);
      
      if (loanError) throw loanError;
      
      // Update book availability
      const { error: bookError } = await supabase
        .from('books')
        .update({ available: Math.min(book.total, book.available + 1) })
        .eq('id', book.id);
      
      if (bookError) throw bookError;
      
      setLoans(loans.map(loan => 
        loan.id === loanToReturn.id 
          ? { ...loan, status: 'returned', return_date: today } 
          : loan
      ));
      
      setBooks(books.map(b => 
        b.id === book.id ? { ...b, available: Math.min(b.total, b.available + 1) } : b
      ));
      
      setScanInput('');
      const message = isOverdue 
        ? `Book "${book.title}" returned successfully! (This book was overdue)`
        : `Book "${book.title}" returned successfully!`;
      alert(message);
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Failed to process return. Please try again.');
    }
  };

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.isbn) {
      alert('Please fill in all required fields (Title, Author, ISBN)!');
      return;
    }
    
    if (books.some(book => book.isbn === newBook.isbn)) {
      alert('A book with this ISBN already exists!');
      return;
    }
    
    const quantity = parseInt(newBook.quantity) || 1;
    
    if (quantity < 1 || quantity > 100) {
      alert('Please enter a valid quantity between 1 and 100');
      return;
    }
    
    const book = {
      id: generateId('B'),
      title: newBook.title.trim(),
      author: newBook.author.trim(),
      isbn: newBook.isbn.trim(),
      category: newBook.category.trim() || 'General',
      available: quantity,
      total: quantity
    };
    
    try {
      const { error } = await supabase
        .from('books')
        .insert([book]);
      
      if (error) throw error;
      
      setBooks([...books, book]);
      setNewBook({ title: '', author: '', isbn: '', category: '', quantity: 1 });
      alert(`Book "${book.title}" added successfully with ID: ${book.id}`);
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book. Please try again.');
    }
  };

  const handleDeleteBook = async (bookId) => {
    const activeLoans = loans.filter(loan => loan.book_id === bookId && loan.status === 'active');
    if (activeLoans.length > 0) {
      alert('Cannot delete book with active loans!');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        const { error } = await supabase
          .from('books')
          .delete()
          .eq('id', bookId);
        
        if (error) throw error;
        
        setBooks(books.filter(book => book.id !== bookId));
        alert('Book deleted successfully!');
      } catch (error) {
        console.error('Error deleting book:', error);
        alert('Failed to delete book. Please try again.');
      }
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      alert('Please fill in required fields (Name and Email)!');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      alert('Please enter a valid email address!');
      return;
    }
    
    if (members.some(member => member.email.toLowerCase() === newMember.email.toLowerCase())) {
      alert('A member with this email already exists!');
      return;
    }
    
    const member = {
      id: generateId('M'),
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      phone: newMember.phone.trim() || '',
      join_date: new Date().toISOString().split('T')[0],
      membership_type: newMember.membershipType
    };
    
    try {
      const { error } = await supabase
        .from('members')
        .insert([member]);
      
      if (error) throw error;
      
      setMembers([...members, member]);
      setNewMember({ name: '', email: '', phone: '', membershipType: 'Standard' });
      alert(`Member "${member.name}" added successfully with ID: ${member.id}`);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  const handleDeleteMember = async (memberId) => {
    const activeLoans = loans.filter(loan => loan.member_id === memberId && loan.status === 'active');
    if (activeLoans.length > 0) {
      alert('Cannot delete member with active loans!');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', memberId);
        
        if (error) throw error;
        
        setMembers(members.filter(member => member.id !== memberId));
        alert('Member deleted successfully!');
      } catch (error) {
        console.error('Error deleting member:', error);
        alert('Failed to delete member. Please try again.');
      }
    }
  };

  const getMemberLoans = (memberId) => {
    return loans
      .filter(loan => loan.member_id === memberId && loan.status === 'active')
      .map(loan => ({
        ...loan,
        book: findBook(loan.book_id)
      }))
      .filter(loan => loan.book);
  };

  const getFilteredBooks = () => {
    if (!searchQuery) return books;
    const query = searchQuery.toLowerCase();
    return books.filter(book => 
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.isbn.includes(query) ||
      book.category.toLowerCase().includes(query) ||
      book.id.toLowerCase().includes(query)
    );
  };

  const getFilteredMembers = () => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(member => 
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.id.toLowerCase().includes(query)
    );
  };

  const exportData = () => {
    try {
      const data = { 
        books, 
        members, 
        loans, 
        reservations, 
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bibliokeeper_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Import books
      if (data.books && data.books.length > 0) {
        const { error } = await supabase
          .from('books')
          .insert(data.books);
        if (!error) setBooks(data.books);
      }
      
      // Import members
      if (data.members && data.members.length > 0) {
        const { error } = await supabase
          .from('members')
          .insert(data.members);
        if (!error) setMembers(data.members);
      }
      
      // Import loans
      if (data.loans && data.loans.length > 0) {
        const { error } = await supabase
          .from('loans')
          .insert(data.loans);
        if (!error) setLoans(data.loans);
      }
      
      // Import settings
      if (data.settings) {
        await saveSettings(data.settings);
      }
      
      alert('Data imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing data. Please check the file format.');
    }
    
    event.target.value = '';
  };

  const importSpreadsheet = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        }


// --- Import Members Spreadsheet Function ---
const importMembersSpreadsheet = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    if (!window.XLSX) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const XLSX = window.XLSX;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

    if (rows.length === 0) {
      alert('Spreadsheet is empty or could not be read.');
      return;
    }

    let newMembersAdded = 0;
    let duplicatesSkipped = 0;

    const newMembersList = [];
    for (const row of rows) {
      const name = String(row['NAME'] || row['Name'] || '').trim();
      const email = String(row['EMAIL'] || row['Email'] || '').trim();
      const phone = String(row['PHONE'] || row['Phone'] || '').trim();
      const type = String(row['TYPE'] || row['Type'] || 'Standard').trim();

      if (!name || !email) continue;

      if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
        duplicatesSkipped++;
        continue;
      }

      const newMember = {
        id: generateId('M'),
        name,
        email,
        phone,
        join_date: new Date().toISOString().split('T')[0],
        membership_type: type || 'Standard'
      };

      newMembersList.push(newMember);
      newMembersAdded++;
    }

    if (newMembersList.length > 0) {
      const { error } = await supabase.from('members').insert(newMembersList);
      if (!error) {
        setMembers(prev => [...prev, ...newMembersList]);
      } else {
        throw error;
      }
    }

    let message = `Import Complete!\n\n`;
    message += `✓ New members added: ${newMembersAdded}\n`;
    message += `⊘ Duplicates skipped: ${duplicatesSkipped}\n`;
    message += `\nTotal members: ${members.length + newMembersAdded}`;

    alert(message);
  } catch (error) {
    console.error('Spreadsheet import error:', error);
    alert('Error importing spreadsheet: ' + error.message);
  }

  event.target.value = '';
};
);
      }
      
      const XLSX = window.XLSX;
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
      
      if (rows.length === 0) {
        alert('Spreadsheet is empty or could not be read.');
        return;
      }
      
      let newBooksAdded = 0;
      let duplicatesSkipped = 0;
      let booksWithoutISBN = 0;
      
      const newBooks = [];
      
      for (const row of rows) {
        try {
          const isbnRaw = row['ISBN'] || row['\'ISBN\''] || row['isbn'] || row['Isbn'] || row['Primary ISBN'] || '';
          const titleRaw = row['TITLE'] || row['Title'] || row['title'] || row['BOOK TITLE'] || '';
          const authorRaw = row['AUTHOR'] || row['Author'] || row['author'] || row['AUTHORS'] || row['Primary Author'] || '';
          const categoryRaw = row['COLLECTIONS'] || row['Collections'] || row['Category'] || row['CATEGORY'] || 'General';
          
          const isbn = String(isbnRaw).trim().replace(/[^0-9X]/gi, '');
          const title = String(titleRaw).trim();
          const author = String(authorRaw).trim();
          const category = String(categoryRaw).trim() || 'General';
          
          if (!title) {
            continue;
          }
          
          const finalAuthor = author || 'Unknown Author';
          
          if (!isbn || isbn.length < 10) {
            booksWithoutISBN++;
          }
          
          const finalISBN = (isbn && isbn.length >= 10) ? isbn : '';
          
          if (finalISBN) {
            const existingBook = books.find(b => b.isbn === finalISBN);
            if (existingBook) {
              duplicatesSkipped++;
              continue;
            }
          }
          
          const book = {
            id: generateId('B'),
            title,
            author: finalAuthor,
            isbn: finalISBN,
            category,
            available: 1,
            total: 1
          };
          
          newBooks.push(book);
          newBooksAdded++;
          
        } catch (error) {
          console.error(`Error processing row:`, error);
        }
      }
      
      if (newBooks.length > 0) {
        const { error } = await supabase
          .from('books')
          .insert(newBooks);
        
        if (!error) {
          setBooks(prev => [...prev, ...newBooks]);
        } else {
          throw error;
        }
      }
      
      let message = `Import Complete!\n\n`;
      message += `✓ New books added: ${newBooksAdded}\n`;
      message += `⊘ Duplicates skipped: ${duplicatesSkipped}\n`;
      if (booksWithoutISBN > 0) {
        message += `ℹ Books without ISBN: ${booksWithoutISBN} (still added)\n`;
      }
      message += `\nTotal books in library: ${books.length + newBooksAdded}`;
      
      alert(message);
      
    } catch (error) {
      console.error('Spreadsheet import error:', error);
      alert('Error importing spreadsheet: ' + error.message);
    }
    
    event.target.value = '';
  };

  const BarcodeScannerModal = () => (
    isScanning && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 m-4 max-w-md w-full">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">
              {scanningFor === 'isbn' ? 'Scanning Book ISBN' : `Scanning for ${scanningFor}`}
            </h3>
            <p className="text-gray-600">
              Position barcode clearly in camera view
            </p>
            {isLoadingBookData && (
              <p className="text-sm text-blue-600 mt-2">Loading book information...</p>
            )}
            {!isLoadingBookData && (
              <p className="text-sm text-green-600 mt-2">Camera ready - point at barcode</p>
            )}
          </div>
          
          {cameraError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{cameraError}</p>
            </div>
          )}
          
          <div className="relative mb-4">
            <video 
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              autoPlay 
              playsInline 
              muted
            />
            <div className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-red-500"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-32 bg-red-500"></div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={stopBarcodeScanning} 
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
              disabled={isLoadingBookData}
            >
              {isLoadingBookData ? 'Processing...' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    )
  );

  const MainScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {(apiError || dataError) && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
            <AlertCircle className="inline w-4 h-4 mr-2" />
            {apiError || dataError}
          </div>
        )}
        
        <div className="flex justify-between items-center mb-12">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">📚 {settings.libraryName}</h1>
            <p className="text-gray-600 text-lg">Church Library Management System</p>
            <p className="text-sm text-gray-500 mt-2">Logged in as: {user?.email}</p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setCurrentScreen('notifications')} className="relative p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all">
              <Bell className="w-6 h-6 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <button onClick={() => setCurrentScreen('reports')} className="p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all">
              <FileText className="w-6 h-6 text-gray-600" />
            </button>
            <button onClick={() => setCurrentScreen('settings')} className="p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all">
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
            <button onClick={onLogout} className="p-3 bg-red-500 text-white rounded-lg shadow-lg hover:shadow-xl hover:bg-red-600 transition-all">
              Logout
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Books</p>
                <p className="text-2xl font-bold text-blue-600">{books.reduce((sum, book) => sum + book.total, 0)}</p>
              </div>
              <Book className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Loans</p>
                <p className="text-2xl font-bold text-green-600">{loans.filter(loan => loan.status === 'active').length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Members</p>
                <p className="text-2xl font-bold text-purple-600">{members.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueItems.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setCurrentScreen('loan')} className="bg-green-500 hover:bg-green-600 text-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <BookOpen className="w-16 h-16 mx-auto mb-4" />
            <span className="text-2xl font-semibold">LOAN BOOK</span>
            <p className="text-green-100 mt-2">Scan & loan books to members</p>
          </button>
          
          <button onClick={() => setCurrentScreen('return')} className="bg-blue-500 hover:bg-blue-600 text-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <UserCheck className="w-16 h-16 mx-auto mb-4" />
            <span className="text-2xl font-semibold">RETURN BOOK</span>
            <p className="text-blue-100 mt-2">Process book returns</p>
          </button>
          
          <button onClick={() => setCurrentScreen('inventory')} className="bg-orange-500 hover:bg-orange-600 text-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <Book className="w-16 h-16 mx-auto mb-4" />
            <span className="text-2xl font-semibold">INVENTORY</span>
            <p className="text-orange-100 mt-2">Manage book collection</p>
          </button>
          
          <button onClick={() => setCurrentScreen('members')} className="bg-purple-500 hover:bg-purple-600 text-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <span className="text-2xl font-semibold">MEMBERS</span>
            <p className="text-purple-100 mt-2">Manage library members</p>
          </button>
        </div>
      </div>
      
      <BarcodeScannerModal />
    </div>
  );

  const renderScreen = () => {
    if (loading) return <LoadingScreen />;
    
    switch(currentScreen) {
      case 'loan': return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <button onClick={() => setCurrentScreen('main')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-3xl font-bold text-gray-800">Loan Book</h2>
                </div>
                <div className="text-sm text-gray-600">Loan Period: {settings.loanPeriodDays} days</div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Book ID / ISBN</label>
                    <div className="flex">
                      <input type="text" value={scanInput} onChange={handleScanInputChange} placeholder="Enter book ID or ISBN" className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <button onClick={() => startBarcodeScanning('book')} className="px-4 py-3 bg-green-500 text-white border border-green-500 rounded-r-lg hover:bg-green-600">
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    {scanInput && findBook(scanInput) && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-800">{findBook(scanInput).title}</div>
                        <div className="text-sm text-green-600">by {findBook(scanInput).author}</div>
                        <div className="text-sm text-green-600">Available: {findBook(scanInput).available}</div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Member ID</label>
                    <div className="flex">
                      <input type="text" value={memberScanInput} onChange={handleMemberScanInputChange} placeholder="Enter member ID" className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <button onClick={() => startBarcodeScanning('member')} className="px-4 py-3 bg-green-500 text-white border border-green-500 rounded-r-lg hover:bg-green-600">
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    {memberScanInput && findMember(memberScanInput) && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-800">{findMember(memberScanInput).name}</div>
                        <div className="text-sm text-blue-600">{findMember(memberScanInput).email}</div>
                        <div className="text-sm text-blue-600">Type: {findMember(memberScanInput).membership_type}</div>
                      </div>
                    )}
                  </div>
                  
                  <button onClick={handleLoan} disabled={!scanInput || !memberScanInput} className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-4 rounded-lg font-semibold text-lg transition-colors">
                    Process Loan
                  </button>
                </div>
                
                {memberScanInput && findMember(memberScanInput) && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Current Loans ({getMemberLoans(memberScanInput).length}/{settings.maxLoansPerMember})</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {getMemberLoans(memberScanInput).length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No active loans</p>
                      ) : (
                        getMemberLoans(memberScanInput).map(loan => {
                          const isOverdue = new Date().toISOString().split('T')[0] > loan.due_date;
                          return (
                            <div key={loan.id} className={`p-4 rounded-lg border-2 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                              <div className="font-medium">{loan.book?.title}</div>
                              <div className="text-sm text-gray-600">Due: {loan.due_date} {isOverdue && <span className="text-red-600 font-medium">(OVERDUE)</span>}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <BarcodeScannerModal />
        </div>
      );
      
      case 'return': return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <button onClick={() => setCurrentScreen('main')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-gray-800">Return Book</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Book ID / ISBN</label>
                  <div className="flex">
                    <input type="text" value={scanInput} onChange={handleScanInputChange} placeholder="Enter book ID or ISBN" className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => startBarcodeScanning('book')} className="px-4 py-3 bg-blue-500 text-white border border-blue-500 rounded-r-lg hover:bg-blue-600">
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  {scanInput && findBook(scanInput) && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-800">{findBook(scanInput).title}</div>
                      <div className="text-sm text-blue-600">by {findBook(scanInput).author}</div>
                    </div>
                  )}
                </div>
                
                <button onClick={handleReturn} disabled={!scanInput} className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-4 rounded-lg font-semibold text-lg transition-colors">
                  Process Return
                </button>
              </div>
              
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Recent Returns</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loans.filter(loan => loan.status === 'returned').slice(0, 5).map(loan => {
                    const book = findBook(loan.book_id);
                    const member = findMember(loan.member_id);
                    return (
                      <div key={loan.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">{book?.title}</div>
                        <div className="text-sm text-gray-600">Returned by {member?.name} on {loan.return_date}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <BarcodeScannerModal />
        </div>
      );
      
      case 'inventory': return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <button onClick={() => setCurrentScreen('main')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-3xl font-bold text-gray-800">Inventory Management</h2>
                </div>
                
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import Spreadsheet
                    <input type="file" accept=".xls,.xlsx" onChange={importSpreadsheet} className="hidden" />
                  </label>
                  <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
              
              {apiError && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
                  <AlertCircle className="inline w-4 h-4 mr-2" />
                  {apiError}
                </div>
              )}
              
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" value={searchQuery} onChange={handleSearchQueryChange} placeholder="Search books by title, author, ISBN, category, or ID..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Book
                  </h3>
                  <div className="space-y-4">
                    <input type="text" value={newBook.title} onChange={(e) => setNewBook({...newBook, title: e.target.value})} placeholder="Book Title *" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <input type="text" value={newBook.author} onChange={(e) => setNewBook({...newBook, author: e.target.value})} placeholder="Author *" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    
                    <div>
                      <div className="flex">
                        <input 
                          type="text" 
                          value={newBook.isbn} 
                          onChange={async (e) => {
                            const isbn = e.target.value;
                            setNewBook({...newBook, isbn: isbn});
                            
                            if (isbn.length >= 10 && isbn.length <= 13 && !newBook.title && !newBook.author) {
                              const bookInfo = await fetchBookInfoFromAPI(isbn);
                              if (bookInfo) {
                                setNewBook(prev => ({
                                  ...prev,
                                  title: bookInfo.title,
                                  author: bookInfo.author,
                                  category: bookInfo.category
                                }));
                              }
                            }
                          }}
                          placeholder="ISBN *" 
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500" 
                        />
                        <button onClick={() => startBarcodeScanning('isbn')} className="px-4 py-3 bg-orange-500 text-white border border-orange-500 rounded-r-lg hover:bg-orange-600">
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <select value={newBook.category} onChange={(e) => setNewBook({...newBook, category: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="">Select Category</option>
                      <option value="Fiction">Fiction</option>
                      <option value="Non-Fiction">Non-Fiction</option>
                      <option value="Christian Living">Christian Living</option>
                      <option value="Theology">Theology</option>
                      <option value="Biography">Biography</option>
                      <option value="Children">Children</option>
                      <option value="Youth">Youth</option>
                      <option value="Reference">Reference</option>
                    </select>
                    <input type="number" value={newBook.quantity} onChange={(e) => setNewBook({...newBook, quantity: e.target.value})} placeholder="Quantity" min="1" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <button onClick={handleAddBook} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold">Add Book</button>
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Book Collection ({getFilteredBooks().length})</h3>
                    <div className="text-sm text-gray-600">Total copies: {getFilteredBooks().reduce((sum, book) => sum + book.total, 0)}</div>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getFilteredBooks().length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No books found</p>
                    ) : (
                      getFilteredBooks().map(book => {
                        const activeLoans = loans.filter(loan => loan.book_id === book.id && loan.status === 'active').length;
                        return (
                          <div key={book.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-lg">{book.title}</div>
                                <div className="text-gray-600">by {book.author}</div>
                                <div className="text-sm text-gray-500 mt-1">ISBN: {book.isbn} | Category: {book.category}</div>
                                <div className="text-sm text-gray-500">ID: {book.id} | Available: {book.available}/{book.total}
                                  {activeLoans > 0 && <span className="ml-2 text-blue-600">({activeLoans} on loan)</span>}
                                </div>
                              </div>
                              <button onClick={() => handleDeleteBook(book.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg ml-4" title="Delete book">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <BarcodeScannerModal />
        </div>
      );
      
      case 'members': return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <button onClick={() => setCurrentScreen('main')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-3xl font-bold text-gray-800">Members Management</h2>
                </div>
                
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import Spreadsheet
                    <input type="file" accept=".xls,.xlsx" onChange={importMembersSpreadsheet} className="hidden" />
                  </label>
                  <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" value={searchQuery} onChange={handleSearchQueryChange} placeholder="Search members by name, email, or ID..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Member
                  </h3>
                  <div className="space-y-4">
                    <input type="text" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} placeholder="Full Name *" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <input type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} placeholder="Email Address *" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <input type="tel" value={newMember.phone} onChange={(e) => setNewMember({...newMember, phone: e.target.value})} placeholder="Phone Number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <select value={newMember.membershipType} onChange={(e) => setNewMember({...newMember, membershipType: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="Standard">Standard</option>
                      <option value="Student">Student</option>
                      <option value="Senior">Senior</option>
                    </select>
                    <button onClick={handleAddMember} className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold">Add Member</button>
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Member Directory ({getFilteredMembers().length})</h3>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getFilteredMembers().length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No members found</p>
                    ) : (
                      getFilteredMembers().map(member => {
                        const memberLoans = getMemberLoans(member.id);
                        const memberOverdue = overdueItems.filter(item => item.member_id === member.id);
                        return (
                          <div key={member.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-lg">{member.name}</div>
                                <div className="text-gray-600">{member.email}</div>
                                {member.phone && <div className="text-sm text-gray-500">{member.phone}</div>}
                                <div className="text-sm text-gray-500 mt-1">ID: {member.id} | Type: {member.membership_type} | Joined: {member.join_date}</div>
                                <div className="text-sm mt-1">
                                  <span className="text-blue-600">Active Loans: {memberLoans.length}/{settings.maxLoansPerMember}</span>
                                  {memberOverdue.length > 0 && <span className="ml-3 text-red-600">Overdue: {memberOverdue.length}</span>}
                                </div>
                              </div>
                              <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg ml-4" title="Delete member">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <BarcodeScannerModal />
        </div>
      );

      case 'notifications': return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <button onClick={() => setCurrentScreen('main')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-gray-800">Notifications</h2>
              </div>
              
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map(notification => (
                    <div key={notification.id} className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p className="text-yellow-800">{notification.message}</p>
                      <p className="text-xs text-yellow-600 mt-2">{notification.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );

      case 'reports': return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <button onClick={() => setCurrentScreen('main')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-gray-800">Library Reports</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Collection Summary</h3>
                  <div className="space-y-2">
                    <p className="flex justify-between"><span>Total Books:</span> <span className="font-semibold">{books.length}</span></p>
                    <p className="flex justify-between"><span>Total Copies:</span> <span className="font-semibold">{books.reduce((sum, book) => sum + book.total, 0)}</span></p>
                    <p className="flex justify-between"><span>Available:</span> <span className="font-semibold">{books.reduce((sum, book) => sum + book.available, 0)}</span></p>
                    <p className="flex justify-between"><span>On Loan:</span> <span className="font-semibold">{loans.filter(loan => loan.status === 'active').length}</span></p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Member Statistics</h3>
                  <div className="space-y-2">
                    <p className="flex justify-between"><span>Total Members:</span> <span className="font-semibold">{members.length}</span></p>
                    <p className="flex justify-between"><span>Active Borrowers:</span> <span className="font-semibold">{new Set(loans.filter(l => l.status === 'active').map(l => l.member_id)).size}</span></p>
                    <p className="flex justify-between"><span>New This Month:</span> <span className="font-semibold">
                      {members.filter(m => {
                        const joinDate = new Date(m.join_date);
                        const now = new Date();
                        return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
                      }).length}
                    </span></p>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Loan Activity</h3>
                  <div className="space-y-2">
                    <p className="flex justify-between"><span>Active Loans:</span> <span className="font-semibold">{loans.filter(loan => loan.status === 'active').length}</span></p>
                    <p className="flex justify-between"><span>Overdue Items:</span> <span className="font-semibold text-red-600">{overdueItems.length}</span></p>
                    <p className="flex justify-between"><span>Returns Today:</span> <span className="font-semibold">
                      {loans.filter(loan => loan.return_date === new Date().toISOString().split('T')[0]).length}
                    </span></p>
                    <p className="flex justify-between"><span>Total Returns:</span> <span className="font-semibold">{loans.filter(loan => loan.status === 'returned').length}</span></p>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Popular Categories</h3>
                  <div className="space-y-2">
                    {Object.entries(books.reduce((acc, book) => {
                      acc[book.category] = (acc[book.category] || 0) + 1;
                      return acc;
                    }, {}))
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([category, count]) => (
                        <p key={category} className="flex justify-between">
                          <span>{category}:</span>
                          <span className="font-semibold">{count} books</span>
                        </p>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button onClick={exportData} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                  <Download className="w-5 h-5" />
                  Export Full Report
                </button>
              </div>
            </div>
          </div>
        </div>
      );
      
      case 'settings': return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-8">
                <button onClick={() => setCurrentScreen('main')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-gray-800">Library Settings</h2>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Library Information</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Library Name</label>
                      <input type="text" value={settings.libraryName} onChange={(e) => saveSettings({...settings, libraryName: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Loan Policies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maximum loans per member</label>
                      <input type="number" value={settings.maxLoansPerMember} onChange={(e) => saveSettings({...settings, maxLoansPerMember: parseInt(e.target.value) || 10})} min="1" max="50" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loan period (days)</label>
                      <input type="number" value={settings.loanPeriodDays} onChange={(e) => saveSettings({...settings, loanPeriodDays: parseInt(e.target.value) || 14})} min="1" max="90" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Data Management</h3>
                  <div className="flex gap-4">
                    <button onClick={exportData} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      <Download className="w-5 h-5" />
                      Export All Data
                    </button>
                    <label className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
                      <Upload className="w-5 h-5" />
                      Import Data
                      <input type="file" accept=".json" onChange={importData} className="hidden" />
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Export creates a backup of all library data. Import allows you to restore from a previous backup.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      
      default: return <MainScreen />;
    }
  };

  return renderScreen();
};

const Root = () => {
  const [verified, setVerified] = useState(() => sessionStorage.getItem('libraryVerified') === 'true');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(verified);

  useEffect(() => {
    if (!verified) {
      setLoading(false);
      return;
    }

    setLoading(true);
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [verified]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      alert("Error signing out. Please try again.");
    }
  };

  if (!verified) {
    return <VerificationScreen onVerified={() => setVerified(true)} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return <LibraryApp user={user} onLogout={handleLogout} />;
};

const App = () => (
  <ErrorBoundary>
    <Root />
  </ErrorBoundary>
);

export default App;
