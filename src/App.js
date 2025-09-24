import React, { useEffect, useState, useRef, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Book, Users, ArrowLeft, Plus, Trash2, BookOpen, UserCheck, Camera, Search, Calendar, FileText, Download, Upload, Settings, Bell } from 'lucide-react';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCeJLBYthkoyaMckgTT0vnoZ_slIXYrvC4", 
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "bibliokeeper.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "bibliokeeper",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "bibliokeeper.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "771697995545",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:771697995545:web:c23b431eb9321dbd49df88"
};

function isPlaceholderConfig(cfg) {
  return Object.values(cfg).some(
    (v) => typeof v === "string" && v.includes("YOUR_")
  );
}

function ensureFirebaseApp() {
  if (typeof window === "undefined") return null;
  if (getApps().length) {
    return getApps()[0];
  }
  try {
    return initializeApp(firebaseConfig);
  } catch (err) {
    console.error("Firebase initialization error:", err);
    return null;
  }
}

// Login Component
const LoginScreen = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    if (isPlaceholderConfig(firebaseConfig)) {
      setError("Firebase config still incomplete. Check your values.");
      setLoading(false);
      return;
    }

    const app = ensureFirebaseApp();
    if (!app) {
      setError("Unable to initialize Firebase app. Check console for details.");
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (err) {
      console.error("Auth error:", err);
      setError(err?.message || "Login failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-200">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center w-96">
        <h1 className="text-3xl font-bold mb-4">📚 Librarian Login</h1>
        <p className="text-sm text-gray-600 mb-4">Sign in with a Google account authorized by the library.</p>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold w-full"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
};

// Main Library App
const LibraryApp = ({ user, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [books, setBooks] = useState([
    { id: 'B001', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5', category: 'Fiction', available: 2, total: 3 },
    { id: 'B002', title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4', category: 'Fiction', available: 1, total: 2 },
    { id: 'B003', title: '1984', author: 'George Orwell', isbn: '978-0-452-28423-4', category: 'Dystopian', available: 3, total: 4 },
    { id: 'B004', title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '978-0-316-76948-0', category: 'Fiction', available: 1, total: 1 }
  ]);
  
  const [members, setMembers] = useState([
    { id: 'M001', name: 'John Doe', email: 'john@email.com', phone: '555-0123', joinDate: '2024-01-15', membershipType: 'Standard' },
    { id: 'M002', name: 'Jane Smith', email: 'jane@email.com', phone: '555-0456', joinDate: '2024-02-20', membershipType: 'Premium' },
    { id: 'M003', name: 'Bob Johnson', email: 'bob@email.com', phone: '555-0789', joinDate: '2024-03-10', membershipType: 'Standard' }
  ]);
  
  const [loans, setLoans] = useState([
    { id: 'L001', bookId: 'B001', memberId: 'M001', loanDate: '2024-09-01', dueDate: '2024-09-15', status: 'active' },
    { id: 'L002', bookId: 'B002', memberId: 'M002', loanDate: '2024-08-20', dueDate: '2024-09-03', status: 'active' },
    { id: 'L003', bookId: 'B003', memberId: 'M001', loanDate: '2024-09-10', dueDate: '2024-09-24', status: 'active' }
  ]);
  
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
  const videoRef = useRef(null);
  
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
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  };

  const findBook = (bookId) => books.find(book => book.id === bookId || book.isbn === bookId);
  const findMember = (memberId) => members.find(member => member.id === memberId);

  const handleScanInputChange = useCallback((e) => setScanInput(e.target.value), []);
  const handleMemberScanInputChange = useCallback((e) => setMemberScanInput(e.target.value), []);
  const handleSearchQueryChange = useCallback((e) => setSearchQuery(e.target.value), []);

  const startBarcodeScanning = (type) => {
    setScanningFor(type);
    setIsScanning(true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    })
    .catch(() => {
      alert("Camera access denied. Please use manual input.");
      setIsScanning(false);
    });
  };

  const stopBarcodeScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
    setScanningFor(null);
  };

  const captureBarcode = () => {
    const simulatedBarcodes = ['B001', 'B002', 'B003', 'B004', 'M001', 'M002', 'M003'];
    const randomBarcode = simulatedBarcodes[Math.floor(Math.random() * simulatedBarcodes.length)];
    
    if (scanningFor === 'book') {
      setScanInput(randomBarcode.startsWith('B') ? randomBarcode : 'B001');
    } else if (scanningFor === 'member') {
      setMemberScanInput(randomBarcode.startsWith('M') ? randomBarcode : 'M001');
    }
    
    stopBarcodeScanning();
    alert(`Barcode detected: ${randomBarcode}`);
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
  }, [loans]);

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
      b.id === book.id ? { ...b, available: b.available - 1 } : b
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
      b.id === book.id ? { ...b, available: b.available + 1 } : b
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
    
    const book = {
      id: generateId('B'),
      title: newBook.title,
      author: newBook.author,
      isbn: newBook.isbn,
      category: newBook.category || 'General',
      available: parseInt(newBook.quantity),
      total: parseInt(newBook.quantity)
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
    
    setBooks(books.filter(book => book.id !== bookId));
    alert('Book deleted successfully!');
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      alert('Please fill in required fields (Name and Email)!');
      return;
    }
    
    if (members.some(member => member.email === newMember.email)) {
      alert('A member with this email already exists!');
      return;
    }
    
    const member = {
      id: generateId('M'),
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone || '',
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
    
    setMembers(members.filter(member => member.id !== memberId));
    alert('Member deleted successfully!');
  };

  const getMemberLoans = (memberId) => {
    return loans
      .filter(loan => loan.memberId === memberId && loan.status === 'active')
      .map(loan => ({
        ...loan,
        book: findBook(loan.bookId)
      }));
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
    const data = { books, members, loans, reservations, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bibliokeeper_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.books) setBooks(data.books);
        if (data.members) setMembers(data.members);
        if (data.loans) setLoans(data.loans);
        if (data.reservations) setReservations(data.reservations);
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const BarcodeScannerModal = () => (
    isScanning && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 m-4 max-w-md w-full">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">Scanning for {scanningFor}</h3>
            <p className="text-gray-600">Point camera at barcode</p>
          </div>
          
          <div className="relative mb-4">
            <video 
              ref={videoRef} 
              className="w-full h-64 bg-black rounded-lg"
              autoPlay 
              playsInline 
            />
            <div className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-red-500"></div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={captureBarcode} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold">
              Capture
            </button>
            <button onClick={stopBarcodeScanning} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold">
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
            <button onClick={onLogout} className="p-3 bg-red-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all">
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
                    <input type="text" value={newBook.isbn} onChange={(e) => setNewBook({...newBook, isbn: e.target.value})} placeholder="ISBN *" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
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
                      <input type="number" value={settings.maxLoansPerMember} onChange={(e) => setSettings({...settings, maxLoansPerMember: parseInt(e.target.value)})} min="1" max="50" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loan period (days)</label>
                      <input type="number" value={settings.loanPeriodDays} onChange={(e) => setSettings({...settings, loanPeriodDays: parseInt(e.target.value)})} min="1" max="90" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                        <input type="number" value={settings.finePerDay} onChange={(e) => setSettings({...settings, finePerDay: parseFloat(e.target.value)})} min="0" step="0.01" className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Data Management</h3>
                  <div className="flex gap-4">
                    <button onClick={exportData} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
                      <Download className="w-5 h-5" />
                      Export All Data
                    </button>
                    <label className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">
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
                  }} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
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

  useEffect(() => {
    if (typeof window !== "undefined" && !isPlaceholderConfig(firebaseConfig)) {
      ensureFirebaseApp();
    }
  }, []);

  const handleLogout = async () => {
    try {
      const app = ensureFirebaseApp();
      if (app) {
        const auth = getAuth(app);
        await signOut(auth);
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }
  return <LibraryApp user={user} onLogout={handleLogout} />;
};

export default Root;
