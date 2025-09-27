import React, { useEffect, useState, useRef, useCallback } from "react";
import { Book, Users, ArrowLeft, Plus, Trash2, BookOpen, UserCheck, Camera, Search, Calendar, FileText, Download, Upload, Settings, Bell, AlertCircle } from 'lucide-react';

// Mock Firebase functions for demonstration
const mockFirebase = {
  initializeApp: () => ({ name: 'mock' }),
  getApps: () => [],
  getAuth: () => ({
    currentUser: null,
    onAuthStateChanged: (callback) => {
      // Auto-login for demo
      setTimeout(() => callback({ email: 'demo@library.com', uid: 'demo-user' }), 100);
      return () => {};
    },
    signInWithPopup: () => Promise.resolve({ user: { email: 'demo@library.com', uid: 'demo-user' } }),
    signOut: () => Promise.resolve()
  }),
  GoogleAuthProvider: function() { return {}; }
};

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

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Mock login for demo
      setTimeout(() => {
        onLogin({ email: 'demo@library.com', uid: 'demo-user' });
        setLoading(false);
      }, 1000);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-200">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center w-96">
        <h1 className="text-3xl font-bold mb-4">📚 Bibliokeeper</h1>
        <p className="text-sm text-gray-600 mb-4">Church Library Management System</p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold w-full transition-colors"
        >
          {loading ? "Signing in..." : "Demo Login"}
        </button>
        <p className="text-xs text-gray-500 mt-4">Demo mode - no authentication required</p>
      </div>
    </div>
  );
};

const LibraryApp = ({ user, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [books, setBooks] = useState([
    {
      id: 'B001',
      title: 'The Purpose Driven Life',
      author: 'Rick Warren',
      isbn: '9780310205715',
      category: 'Christian Living',
      available: 2,
      total: 3
    },
    {
      id: 'B002', 
      title: 'Mere Christianity',
      author: 'C.S. Lewis',
      isbn: '9780060652926',
      category: 'Theology',
      available: 1,
      total: 2
    }
  ]);
  
  const [members, setMembers] = useState([
    {
      id: 'M001',
      name: 'John Smith',
      email: 'john@email.com',
      phone: '555-0123',
      joinDate: '2024-01-15',
      membershipType: 'Standard'
    },
    {
      id: 'M002',
      name: 'Sarah Johnson', 
      email: 'sarah@email.com',
      phone: '555-0124',
      joinDate: '2024-02-10',
      membershipType: 'Staff'
    }
  ]);

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
  const [cameraError, setCameraError] = useState(null);
  
  const videoRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const isScanningRef = useRef(false);
  const streamRef = useRef(null);
  
  const [settings, setSettings] = useState({
    libraryName: 'Bibliokeeper',
    maxLoansPerMember: 10,
    loanPeriodDays: 14,
    enableFines: false,
    finePerDay: 0.00,
    allowReservations: true,
    autoReminders: true
  });

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

  // Simple Open Library API function
  const fetchBookInfoFromAPI = async (isbn) => {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    try {
      // Use CORS proxy to access Open Library API
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&jscmd=data&format=json`;
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const bookData = data[`ISBN:${cleanISBN}`];
      
      if (bookData) {
        const title = bookData.title || '';
        const author = bookData.authors && bookData.authors.length > 0 
          ? bookData.authors[0].name 
          : '';
        const category = bookData.subjects && bookData.subjects.length > 0 
          ? bookData.subjects[0].name 
          : 'General';
        
        return { title, author, category };
      }
      
      return null;
    } catch (error) {
      console.error('API error:', error);
      return null;
    }
  };

  // Enhanced barcode scanning simulation
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
      // Request camera permissions
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
          console.log('Camera ready for scanning');
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
      let errorMessage = "Camera access denied or not available. Using manual entry.";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "Camera access denied. Please allow camera permissions or use manual entry.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No camera found. Please connect a camera or use manual entry.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application. Using manual entry.";
      }
      
      setCameraError(errorMessage);
      // Don't stop scanning, allow manual entry
    }
  };

  const handleBarcodeDetected = async (barcode) => {
    if (!barcode || !barcode.trim()) return;
    
    const cleanBarcode = barcode.trim();
    stopBarcodeScanning();
    
    if (scanningFor === 'isbn') {
      // Auto-fill book form with scanned ISBN
      setNewBook(prev => ({ ...prev, isbn: cleanBarcode }));
      
      // Fetch book info and auto-fill form
      try {
        const bookInfo = await fetchBookInfoFromAPI(cleanBarcode);
        if (bookInfo && bookInfo.title && bookInfo.author) {
          setNewBook({
            title: bookInfo.title,
            author: bookInfo.author,
            isbn: cleanBarcode,
            category: bookInfo.category || 'General',
            quantity: 1
          });
        }
      } catch (error) {
        // If API fails, just keep the ISBN and let user fill manually
        console.log('Could not fetch book details');
      }
    } else if (scanningFor === 'book') {
      setScanInput(cleanBarcode);
      const existingBook = findBook(cleanBarcode);
      if (existingBook) {
        alert(`Found: "${existingBook.title}"`);
      }
    } else if (scanningFor === 'member') {
      setMemberScanInput(cleanBarcode);
    }
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
              Position barcode in view of camera or click "Manual Entry" to type it in
            </p>
          </div>
          
          {cameraError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">{cameraError}</p>
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
              onClick={captureBarcode} 
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
              disabled={fetchingBook}
            >
              Manual Entry
            </button>
            <button 
              onClick={stopBarcodeScanning} 
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
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
                      <p className="text-xs text-gray-500 mt-1">Scan barcode to auto-fill book details</p>
                    </div>onClick={() => fillBookFormWithISBN('9780310205715')} 
                          className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          Try: 9780310205715
                        </button>
                        <button 
                          onClick={() => fillBookFormWithISBN('9780060652926')} 
                          className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          Try: 9780060652926
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Scan ISBN barcode or click sample ISBNs to auto-fill book details</p>
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
                    <button onClick={handleAddBook} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold">
                      Add Book
                    </button>
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
      
      // Additional screens would go here (members, notifications, reports, settings)
      // For brevity, I'll just show the main screens above
      
      default: return <MainScreen />;
    }
  };

  return renderScreen();
};

const Root = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication for demo
    const mockAuth = mockFirebase.getAuth();
    const unsubscribe = mockAuth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await mockFirebase.getAuth().signOut();
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return <LibraryApp user={user} onLogout={handleLogout} />;
};

export default Root;
