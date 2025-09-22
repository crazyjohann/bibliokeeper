import React, { useState, useEffect, useRef } from 'react';
import { Book, Users, ArrowLeft, Plus, Trash2, BookOpen, UserCheck, Camera, Search, Calendar, FileText, Download, Upload, Settings, Bell } from 'lucide-react';

const App = () => {
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
  
  // Form states
  const [scanInput, setScanInput] = useState('');
  const [memberScanInput, setMemberScanInput] = useState('');
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: '', quantity: 1 });
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', membershipType: 'Standard' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Barcode scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scanningFor, setScanningFor] = useState(null);
  const videoRef = useRef(null);
  
  // Settings
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

  // Barcode scanning functionality
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
    .catch(err => {
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

  // Check for overdue items
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

  // ... All your screen components and the rest of your code (unchanged)
  // (For brevity here, but you can safely copy the rest of your previous code for the UI screens, modals, and renderScreen function!)

  // Insert all your previous screen and modal components here
  // (MainScreen, LoanScreen, ReturnScreen, InventoryScreen, MembersScreen, NotificationsScreen, ReportsScreen, SettingsScreen, renderScreen)

  // Place this at the bottom:
  return renderScreen();
};

export default App;
