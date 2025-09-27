import React, { useEffect, useState, useRef, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { Book, Users, ArrowLeft, Plus, Trash2, BookOpen, UserCheck, Camera, Search, Calendar, FileText, Download, Upload, Settings, Bell, AlertCircle } from 'lucide-react';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCeJLBYthkoyaMckgTT0vnoZ_slXYrvC4",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "bibliokeeper.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "bibliokeeper",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "bibliokeeper.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "771697995545",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:771697995545:web:c23b431eb9321dbd49df88"
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

function isPlaceholderConfig(cfg) {
  return Object.values(cfg).some((v) => typeof v === "string" && (v.includes("YOUR_") || v === ""));
}

function ensureFirebaseApp() {
  if (typeof window === "undefined") return null;
  if (getApps().length) return getApps()[0];
  try {
    return initializeApp(firebaseConfig);
  } catch (err) {
    console.error("Firebase initialization error:", err);
    return null;
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

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    if (isPlaceholderConfig(firebaseConfig)) {
      setError("Firebase configuration is incomplete. Please check your environment variables.");
      setLoading(false);
      return;
    }
    const app = ensureFirebaseApp();
    if (!app) {
      setError("Unable to initialize Firebase. Please check your configuration.");
      setLoading(false);
      return;
    }
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (err) {
      console.error("Authentication error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Sign-in failed. Please try again or contact support.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-200">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center w-96">
        <h1 className="text-3xl font-bold mb-4">📚 Bibliokeeper</h1>
        <p className="text-sm text-gray-600 mb-4">Church Library Management System</p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold w-full transition-colors"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
        <p className="text-xs text-gray-500 mt-4">Authorized librarians only</p>
      </div>
    </div>
  );
};

const LibraryApp = ({ user, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [books, setBooks] = useState(() => {
    try {
      const saved = localStorage.getItem('bibliokeeper_books');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [members, setMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('bibliokeeper_members');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loans, setLoans] = useState(() => {
    try {
      const saved = localStorage.getItem('bibliokeeper_loans');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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
  const videoRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const isScanningRef = useRef(false);
  const streamRef = useRef(null);
  const quaggaRef = useRef(null);
  const quaggaOnDetectedRef = useRef(null);
  
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('bibliokeeper_settings');
      return saved ? JSON.parse(saved) : {
        libraryName: 'Bibliokeeper',
        maxLoansPerMember: 10,
        loanPeriodDays: 14,
        enableFines: false,
        finePerDay: 0.00,
        allowReservations: true,
        autoReminders: true
      };
    } catch {
      return {
        libraryName: 'Bibliokeeper',
        maxLoansPerMember: 10,
        loanPeriodDays: 14,
        enableFines: false,
        finePerDay: 0.00,
        allowReservations: true,
        autoReminders: true
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bibliokeeper_books', JSON.stringify(books));
    } catch (e) {
      console.error('Failed to save books to localStorage:', e);
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem('bibliokeeper_members', JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save members to localStorage:', e);
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem('bibliokeeper_loans', JSON.stringify(loans));
    } catch (e) {
      console.error('Failed to save loans to localStorage:', e);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem('bibliokeeper_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

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

  // Open Library API function - using Books API with jscmd=data
  const fetchAuthorName = async (authorEntry) => {
    if (!authorEntry) return null;

    if (authorEntry.name) {
      return authorEntry.name;
    }

    if (authorEntry.key) {
      try {
        const response = await fetch(`https://openlibrary.org${authorEntry.key}.json`);
        if (response.ok) {
          const authorData = await response.json();
          if (authorData?.name) {
            return authorData.name;
          }
        }
      } catch (error) {
        console.error('Error fetching author details from Open Library:', error);
      }
    }

    return null;
  };

  const fetchBookInfoFromAPI = async (isbn) => {
    setApiError(null);
    
    // Clean ISBN (remove hyphens, spaces)
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    try {
      console.log(`Fetching book info from Open Library for ISBN: ${cleanISBN}`);
      
      // Use Open Library Books API with jscmd=data for detailed information
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&jscmd=data&format=json`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Open Library API response:', data);
      
      const bookData = data[`ISBN:${cleanISBN}`];
      
      if (bookData) {
        // Extract book information from Open Library data format
        const title = bookData.title || 'Unknown Title';
        const author = bookData.authors && bookData.authors.length > 0 
          ? await fetchAuthorName(bookData.authors[0]) || bookData.by_statement || 'Unknown Author' 
          : bookData.by_statement || 'Unknown Author';
        const category = bookData.subjects && bookData.subjects.length > 0 
          ? bookData.subjects[0].name 
          : 'General';
        
        const bookInfo = { title, author, category };
        console.log('Successfully parsed book info from Open Library:', bookInfo);
        return bookInfo;
      } else {
        // Try the simpler ISBN endpoint as fallback
        console.log('No data from Books API, trying ISBN endpoint...');
        const isbnResponse = await fetch(`https://openlibrary.org/isbn/${cleanISBN}.json`);
        
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
          return bookInfo;
        }
      }

      throw new Error('No book data found');
      
    } catch (error) {
      console.error('Error with Open Library API:', error);
      setApiError(`Could not find book information for ISBN: ${cleanISBN}. Please enter details manually.`);
      return null;
    }
  };

  const fetchBookInfoFromISBN = async (isbn) => {
    try {
      const bookInfo = await fetchBookInfoFromAPI(isbn);
      if (bookInfo) {
        setNewBook({
          title: bookInfo.title,
          author: bookInfo.author,
          isbn: isbn,
          category: bookInfo.category,
          quantity: 1
        });
        alert(`Book information found and filled automatically!\nTitle: ${bookInfo.title}\nAuthor: ${bookInfo.author}`);
      } else {
        setNewBook(prev => ({ ...prev, isbn: isbn }));
        alert(`ISBN detected: ${isbn}\nCould not fetch book details automatically. Please fill in the remaining fields.`);
      }
    } catch (error) {
      console.error('Error fetching book info:', error);
      setNewBook(prev => ({ ...prev, isbn: isbn }));
      alert(`ISBN detected: ${isbn}\nError fetching book details. Please fill in the remaining fields.`);
    }
  };

  // Improved camera scanning with better error handling
  const startBarcodeScanning = async (type) => {
    setScanningFor(type);
    setIsScanning(true);
    setCameraError(null);
    isScanningRef.current = true;
    
    // Set timeout for scanning
    scanTimeoutRef.current = setTimeout(() => {
      stopBarcodeScanning();
      alert('Scanning timed out after 30 seconds. Please try manual entry.');
    }, 30000);
    
    try {
      // Request camera permissions with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } 
      });
      
      if (videoRef.current && isScanningRef.current) {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
          
          // Start manual scanning since BarcodeDetector has limited support
          startManualScanning();
        } catch (playError) {
          console.error('Video play error:', playError);
          setCameraError("Could not start video playback. Please try again.");
          stopBarcodeScanning();
        }
      } else {
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error('Camera error:', err);
      let errorMessage = "Camera access denied or not available.";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "Camera access denied. Please allow camera permissions and try again.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No camera found. Please connect a camera and try again.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application.";
      }
      
      setCameraError(errorMessage);
      setIsScanning(false);
      isScanningRef.current = false;
      setScanningFor(null);
    }
  };

  // Manual scanning approach since BarcodeDetector has limited support
  const startManualScanning = async () => {
    if (!videoRef.current || typeof window === 'undefined') {
      console.warn('Video element not ready for scanning; falling back to manual entry');
      captureBarcode();
      return;
    }

    try {
      const importedQuagga = await import('quagga');
      const quaggaInstance = importedQuagga?.default ?? importedQuagga;

      if (!quaggaInstance || typeof quaggaInstance.init !== 'function') {
        console.error('Quagga library did not load as expected:', importedQuagga);
        alert('Automatic barcode detection is unavailable. Please enter the barcode manually.');
        captureBarcode();
        return;
      }

      if (quaggaRef.current && quaggaOnDetectedRef.current) {
        try {
          quaggaRef.current.offDetected(quaggaOnDetectedRef.current);
        } catch (cleanupError) {
          console.warn('Error removing previous Quagga handler:', cleanupError);
        }
        quaggaRef.current.stop();
      }

      quaggaRef.current = quaggaInstance;

      quaggaInstance.init({
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
          readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'code_128_reader']
        },
        locate: true
      }, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          alert('Automatic barcode detection failed to start. Please use manual entry.');
          captureBarcode();
          return;
        }

        if (!isScanningRef.current) {
          quaggaInstance.stop();
          return;
        }

        quaggaInstance.start();
      });

      const onDetected = (data) => {
        const detectedCode = data?.codeResult?.code;
        if (detectedCode) {
          handleBarcodeDetected(detectedCode);
        }
      };

      quaggaInstance.onDetected(onDetected);
      quaggaOnDetectedRef.current = onDetected;
    } catch (error) {
      console.error('Error loading Quagga for barcode scanning:', error);
      alert('Automatic barcode detection is unavailable. Please enter the barcode manually.');
      captureBarcode();
    }
  };

  const handleBarcodeDetected = async (barcode) => {
    if (!barcode || !barcode.trim()) return;
    
    const cleanBarcode = barcode.trim();
    
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
            setBooks(prev => [...prev, newBookEntry]);
            alert(`New book "${bookInfo.title}" by ${bookInfo.author} added to library automatically!`);
          }
        } catch (error) {
          console.error('Error auto-adding book:', error);
        }
      }
    } else if (scanningFor === 'member') {
      setMemberScanInput(cleanBarcode);
    } else if (scanningFor === 'isbn') {
      await fetchBookInfoFromISBN(cleanBarcode);
    }
    
    stopBarcodeScanning();
    alert(`Barcode detected: ${cleanBarcode}`);
  };

  const stopBarcodeScanning = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    isScanningRef.current = false;
    
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
          console.error('Error stopping Quagga:', error);
        } finally {
          quaggaRef.current = null;
          quaggaOnDetectedRef.current = null;
        }
      }
    };
  }, []);

  const captureBarcode = () => {
    const userInput = prompt('Please enter the barcode/ISBN manually:');
    if (userInput && userInput.trim()) {
      handleBarcodeDetected(userInput.trim());
    } else {
      stopBarcodeScanning();
    }
  };

  const calculateDueDate = (loanDate, days = settings.loanPeriodDays) => {
    const date = new Date(loanDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const overdue = loans.filter(loan => loan.status === 'active' && loan.dueDate < today);
    setOverdueItems(overdue);
    
    const newNotifications = overdue.map(item => {
      const book = findBook(item.bookId);
      const member = findMember(item.memberId);
      return {
        id: item.id,
        type: 'overdue',
        message: `"${book?.title || 'Unknown Book'}" loaned to ${member?.name || 'Unknown Member'} is overdue`,
        date: today
      };
    });
    setNotifications(newNotifications);
  }, [loans, books, members]);

  const handleLoan = () => {
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
    
    const memberLoans = loans.filter(loan => loan.memberId === member.id && loan.status === 'active');
    if (memberLoans.length >= settings.maxLoansPerMember) {
      alert(`Member has reached maximum loan limit (${settings.maxLoansPerMember} books)!`);
      return;
    }
    
    const loanDate = new Date().toISOString().split('T')[0];
    const dueDate = calculateDueDate(loanDate);
    
    const newLoan = {
      id: generateId('L'),
      bookId: book.id,
      memberId: member.id,
      loanDate,
      dueDate,
      status: 'active'
    };
    
    setLoans([...loans, newLoan]);
    setBooks(books.map(b => 
      b.id === book.id ? { ...b, available: Math.max(0, b.available - 1) } : b
    ));
    
    setScanInput('');
    setMemberScanInput('');
    alert(`Book "${book.title}" loaned to ${member.name}!\nDue date: ${dueDate}`);
  };

  const handleReturn = () => {
    const book = findBook(scanInput);
    
    if (!book) {
      alert('Book not found! Please check the ID or scan again.');
      return;
    }
    
    const loanToReturn = loans.find(loan => loan.bookId === book.id && loan.status === 'active');
    
    if (!loanToReturn) {
      alert('This book is not currently loaned out!');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = today > loanToReturn.dueDate;
    
    setLoans(loans.map(loan => 
      loan.id === loanToReturn.id 
        ? { ...loan, status: 'returned', returnDate: today } 
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
  };

  const handleAddBook = () => {
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
    
    setBooks([...books, book]);
    setNewBook({ title: '', author: '', isbn: '', category: '', quantity: 1 });
    alert(`Book "${book.title}" added successfully with ID: ${book.id}`);
  };

  const handleDeleteBook = (bookId) => {
    const activeLoans = loans.filter(loan => loan.bookId === bookId && loan.status === 'active');
    if (activeLoans.length > 0) {
      alert('Cannot delete book with active loans!');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this book?')) {
      setBooks(books.filter(book => book.id !== bookId));
      alert('Book deleted successfully!');
    }
  };

  const handleAddMember = () => {
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
      joinDate: new Date().toISOString().split('T')[0],
      membershipType: newMember.membershipType
    };
    
    setMembers([...members, member]);
    setNewMember({ name: '', email: '', phone: '', membershipType: 'Standard' });
    alert(`Member "${member.name}" added successfully with ID: ${member.id}`);
  };

  const handleDeleteMember = (memberId) => {
    const activeLoans = loans.filter(loan => loan.memberId === memberId && loan.status === 'active');
    if (activeLoans.length > 0) {
      alert('Cannot delete member with active loans!');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this member?')) {
      setMembers(members.filter(member => member.id !== memberId));
      alert('Member deleted successfully!');
    }
  };

  const getMemberLoans = (memberId) => {
    return loans
      .filter(loan => loan.memberId === memberId && loan.status === 'active')
      .map(loan => ({
        ...loan,
        book: findBook(loan.bookId)
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

  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          alert('Error reading file.');
          return;
        }
        
        const data = JSON.parse(text);
        
        if (!data.version) {
          alert('Invalid backup file format.');
          return;
        }
        
        if (window.confirm('This will replace all current data. Are you sure you want to continue?')) {
          if (Array.isArray(data.books)) setBooks(data.books);
          if (Array.isArray(data.members)) setMembers(data.members);
          if (Array.isArray(data.loans)) setLoans(data.loans);
          if (Array.isArray(data.reservations)) setReservations(data.reservations);
          if (data.settings && typeof data.settings === 'object') setSettings(data.settings);
          alert('Data imported successfully!');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    reader.readAsText(file);
    
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
              {scanningFor === 'isbn' 
                ? 'Position barcode clearly in view and click "Manual Entry" to input the code'
                : 'Position barcode clearly in view and click "Manual Entry" to input the code'
              }
            </p>
            <p className="text-sm text-orange-600 mt-2">Camera ready - click "Manual Entry" to input barcode</p>
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
            <button onClick={captureBarcode} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors">
              Manual Entry
            </button>
            <button onClick={stopBarcodeScanning} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );

  const MainScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {apiError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
            <AlertCircle className="inline w-4 h-4 mr-2" />
            {apiError}
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
                        <div className="text-sm text-blue-600">Type: {findMember(memberScanInput).membershipType}</div>
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
                          const isOverdue = new Date().toISOString().split('T')[0] > loan.dueDate;
                          return (
                            <div key={loan.id} className={`p-4 rounded-lg border-2 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                              <div className="font-medium">{loan.book?.title}</div>
                              <div className="text-sm text-gray-600">Due: {loan.dueDate} {isOverdue && <span className="text-red-600 font-medium">(OVERDUE)</span>}</div>
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
                    const book = findBook(loan.bookId);
                    const member = findMember(loan.memberId);
                    return (
                      <div key={loan.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">{book?.title}</div>
                        <div className="text-sm text-gray-600">Returned by {member?.name} on {loan.returnDate}</div>
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
                  <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import
                    <input type="file" accept=".json" onChange={importData} className="hidden" />
                  </label>
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
                        <input type="text" value={newBook.isbn} onChange={(e) => setNewBook({...newBook, isbn: e.target.value})} placeholder="ISBN *" className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        <button onClick={() => startBarcodeScanning('isbn')} className="px-4 py-3 bg-orange-500 text-white border border-orange-500 rounded-r-lg hover:bg-orange-600" title="Scan ISBN barcode">
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Scan ISBN barcode to auto-fill book details</p>
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
                        const activeLoans = loans.filter(loan => loan.bookId === book.id && loan.status === 'active').length;
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
              <div className="flex items-center mb-6">
                <button onClick={() => setCurrentScreen('main')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-gray-800">Members Management</h2>
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
                      <option value="Staff">Church Staff</option>
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
                        const memberOverdue = overdueItems.filter(item => item.memberId === member.id);
                        return (
                          <div key={member.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-lg">{member.name}</div>
                                <div className="text-gray-600">{member.email}</div>
                                {member.phone && <div className="text-sm text-gray-500">{member.phone}</div>}
                                <div className="text-sm text-gray-500 mt-1">ID: {member.id} | Type: {member.membershipType} | Joined: {member.joinDate}</div>
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
                    <p className="flex justify-between"><span>Active Borrowers:</span> <span className="font-semibold">{new Set(loans.filter(l => l.status === 'active').map(l => l.memberId)).size}</span></p>
                    <p className="flex justify-between"><span>New This Month:</span> <span className="font-semibold">
                      {members.filter(m => {
                        const joinDate = new Date(m.joinDate);
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
                      {loans.filter(loan => loan.returnDate === new Date().toISOString().split('T')[0]).length}
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
                      <input type="text" value={settings.libraryName} onChange={(e) => setSettings({...settings, libraryName: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Loan Policies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maximum loans per member</label>
                      <input type="number" value={settings.maxLoansPerMember} onChange={(e) => setSettings({...settings, maxLoansPerMember: parseInt(e.target.value) || 10})} min="1" max="50" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loan period (days)</label>
                      <input type="number" value={settings.loanPeriodDays} onChange={(e) => setSettings({...settings, loanPeriodDays: parseInt(e.target.value) || 14})} min="1" max="90" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Features</h3>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input type="checkbox" checked={settings.allowReservations} onChange={(e) => setSettings({...settings, allowReservations: e.target.checked})} className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span>Allow book reservations</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input type="checkbox" checked={settings.autoReminders} onChange={(e) => setSettings({...settings, autoReminders: e.target.checked})} className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span>Send automatic overdue reminders</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input type="checkbox" checked={settings.enableFines} onChange={(e) => setSettings({...settings, enableFines: e.target.checked})} className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span>Enable overdue fines (not recommended for church libraries)</span>
                    </label>
                    
                    {settings.enableFines && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fine per day ($)</label>
                        <input type="number" value={settings.finePerDay} onChange={(e) => setSettings({...settings, finePerDay: parseFloat(e.target.value) || 0})} min="0" step="0.01" className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}
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
                
                <div className="pt-6 border-t border-gray-200">
                  <button onClick={() => {
                    if (window.confirm('This will reset all settings to defaults. Continue?')) {
                      setSettings({
                        libraryName: 'Bibliokeeper',
                        maxLoansPerMember: 10,
                        loanPeriodDays: 14,
                        enableFines: false,
                        finePerDay: 0.00,
                        allowReservations: true,
                        autoReminders: true
                      });
                      alert('Settings reset to defaults.');
                    }
                  }} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    Reset to Defaults
                  </button>
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    if (isPlaceholderConfig(firebaseConfig)) {
      setAuthError("Firebase configuration is incomplete. Please set up environment variables.");
      setLoading(false);
      return;
    }

    const app = ensureFirebaseApp();
    if (!app) {
      setAuthError("Failed to initialize Firebase");
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, 
        (user) => {
          setUser(user);
          setLoading(false);
        },
        (error) => {
          console.error("Auth state change error:", error);
          setAuthError("Authentication service unavailable");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Auth setup error:", error);
      setAuthError("Failed to set up authentication");
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const app = ensureFirebaseApp();
      if (app) {
        const auth = getAuth(app);
        await signOut(auth);
        setUser(null);
        try {
          localStorage.removeItem('bibliokeeper_books');
          localStorage.removeItem('bibliokeeper_members');
          localStorage.removeItem('bibliokeeper_loans');
          localStorage.removeItem('bibliokeeper_settings');
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Error signing out. Please try again.");
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
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
