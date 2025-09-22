import React, { useState, useEffect, useRef } from 'react';
import { Book, Users, Plus, Trash2, BookOpen, UserCheck, Camera, Search, Calendar, FileText, Download, Upload, Settings, Bell } from 'lucide-react';

const App = () => {
  // Main navigation state
  const [screen, setScreen] = useState('main');

  // Library data states
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

  // Form states
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: '', quantity: 1 });
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', membershipType: 'Standard' });
  const [searchBook, setSearchBook] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [memberScanInput, setMemberScanInput] = useState('');

  // Helper functions
  const generateId = (prefix) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  };
  const findBook = (bookId) => books.find(book => book.id === bookId || book.isbn === bookId);
  const findMember = (memberId) => members.find(member => member.id === memberId);

  // Navigation Bar
  function NavBar() {
    return (
      <nav className="flex gap-2 mb-6">
        <button className="btn" onClick={() => setScreen('main')}><BookOpen className="inline mr-1 w-4 h-4" />Home</button>
        <button className="btn" onClick={() => setScreen('loan')}><UserCheck className="inline mr-1 w-4 h-4" />Loan</button>
        <button className="btn" onClick={() => setScreen('return')}><Book className="inline mr-1 w-4 h-4" />Return</button>
        <button className="btn" onClick={() => setScreen('inventory')}><Book className="inline mr-1 w-4 h-4" />Inventory</button>
        <button className="btn" onClick={() => setScreen('members')}><Users className="inline mr-1 w-4 h-4" />Members</button>
      </nav>
    );
  }

  // Main Screen
  function MainScreen() {
    return (
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-2">Bibliokeeper</h1>
        <p className="mb-8 text-gray-600">Church Library Management System</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <button className="btn w-full" onClick={() => setScreen('loan')}><UserCheck className="inline mr-1 w-4 h-4" />Loan Book</button>
          <button className="btn w-full" onClick={() => setScreen('return')}><Book className="inline mr-1 w-4 h-4" />Return Book</button>
          <button className="btn w-full" onClick={() => setScreen('inventory')}><BookOpen className="inline mr-1 w-4 h-4" />Inventory</button>
          <button className="btn w-full" onClick={() => setScreen('members')}><Users className="inline mr-1 w-4 h-4" />Members</button>
        </div>
      </div>
    );
  }

  // Loan Screen
  function LoanScreen() {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Loan Book</h2>
        <form onSubmit={e => { e.preventDefault(); handleLoan(); }}>
          <div className="mb-2">
            <label className="block text-sm">Book ID or ISBN</label>
            <input
              className="input"
              value={scanInput} onChange={e => setScanInput(e.target.value)}
              placeholder="Scan or enter Book ID/ISBN"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm">Member ID</label>
            <input
              className="input"
              value={memberScanInput} onChange={e => setMemberScanInput(e.target.value)}
              placeholder="Scan or enter Member ID"
              required
            />
          </div>
          <button className="btn mt-2" type="submit">Loan Book</button>
          <button className="btn-text ml-2" type="button" onClick={() => setScreen('main')}>Cancel</button>
        </form>
      </div>
    );
  }

  function handleLoan() {
    const book = findBook(scanInput.trim());
    const member = findMember(memberScanInput.trim());
    if (!book) {
      alert('Book not found!');
      return;
    }
    if (!member) {
      alert('Member not found!');
      return;
    }
    if (book.available < 1) {
      alert('Book not available!');
      return;
    }
    setLoans([
      ...loans,
      {
        id: generateId('L'),
        bookId: book.id,
        memberId: member.id,
        loanDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'active'
      }
    ]);
    setBooks(books.map(b => b.id === book.id ? { ...b, available: b.available - 1 } : b));
    setScanInput('');
    setMemberScanInput('');
    alert('Book loaned!');
    setScreen('main');
  }

  // Return Screen
  function ReturnScreen() {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Return Book</h2>
        <form onSubmit={e => { e.preventDefault(); handleReturn(); }}>
          <div className="mb-2">
            <label className="block text-sm">Book ID or ISBN</label>
            <input
              className="input"
              value={scanInput} onChange={e => setScanInput(e.target.value)}
              placeholder="Scan or enter Book ID/ISBN"
              required
            />
          </div>
          <button className="btn mt-2" type="submit">Return Book</button>
          <button className="btn-text ml-2" type="button" onClick={() => setScreen('main')}>Cancel</button>
        </form>
      </div>
    );
  }

  function handleReturn() {
    const book = findBook(scanInput.trim());
    if (!book) {
      alert('Book not found!');
      return;
    }
    const loan = loans.find(ln => ln.bookId === book.id && ln.status === 'active');
    if (!loan) {
      alert('No active loan for this book!');
      return;
    }
    setLoans(loans.map(ln => ln.id === loan.id ? { ...ln, status: 'returned', returnDate: new Date().toISOString().split('T')[0] } : ln));
    setBooks(books.map(b => b.id === book.id ? { ...b, available: b.available + 1 } : b));
    setScanInput('');
    alert('Book returned!');
    setScreen('main');
  }

  // Inventory Screen
  function InventoryScreen() {
    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(searchBook.toLowerCase()) ||
      book.author.toLowerCase().includes(searchBook.toLowerCase()) ||
      book.isbn.includes(searchBook)
    );
    return (
      <div>
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-semibold flex-1">Inventory</h2>
          <button className="btn" onClick={() => setScreen('addBook')}><Plus className="inline w-4 h-4 mr-1" />Add Book</button>
          <button className="btn-text ml-2" onClick={() => setScreen('main')}>Back</button>
        </div>
        <input
          className="input mb-2"
          placeholder="Search books..."
          value={searchBook}
          onChange={e => setSearchBook(e.target.value)}
        />
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="border-b">
              <th>ID</th><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Available</th><th>Total</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(book =>
              <tr key={book.id} className="border-b">
                <td>{book.id}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.isbn}</td>
                <td>{book.category}</td>
                <td>{book.available}</td>
                <td>{book.total}</td>
                <td>
                  <button className="btn-danger" onClick={() => handleDeleteBook(book.id)}>
                    <Trash2 className="inline w-4 h-4" />
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function handleDeleteBook(id) {
    if (!window.confirm('Delete this book?')) return;
    if (loans.some(loan => loan.bookId === id && loan.status === 'active')) {
      alert('Cannot delete book with active loan!');
      return;
    }
    setBooks(books.filter(b => b.id !== id));
  }

  // Add Book Screen
  function AddBookScreen() {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Add Book</h2>
        <form onSubmit={e => { e.preventDefault(); handleAddBook(); }}>
          <div className="mb-2"><input className="input" placeholder="Title" value={newBook.title} onChange={e => setNewBook(b => ({ ...b, title: e.target.value }))} required /></div>
          <div className="mb-2"><input className="input" placeholder="Author" value={newBook.author} onChange={e => setNewBook(b => ({ ...b, author: e.target.value }))} required /></div>
          <div className="mb-2"><input className="input" placeholder="ISBN" value={newBook.isbn} onChange={e => setNewBook(b => ({ ...b, isbn: e.target.value }))} required /></div>
          <div className="mb-2"><input className="input" placeholder="Category" value={newBook.category} onChange={e => setNewBook(b => ({ ...b, category: e.target.value }))} /></div>
          <div className="mb-2"><input className="input" type="number" placeholder="Quantity" value={newBook.quantity} onChange={e => setNewBook(b => ({ ...b, quantity: e.target.value }))} min={1} required /></div>
          <button className="btn" type="submit">Add Book</button>
          <button className="btn-text ml-2" type="button" onClick={() => setScreen('inventory')}>Cancel</button>
        </form>
      </div>
    );
  }

  function handleAddBook() {
    if (!newBook.title || !newBook.author || !newBook.isbn) {
      alert('Enter all required fields');
      return;
    }
    if (books.some(b => b.isbn === newBook.isbn)) {
      alert('Book with this ISBN already exists!');
      return;
    }
    const added = {
      id: generateId('B'),
      title: newBook.title,
      author: newBook.author,
      isbn: newBook.isbn,
      category: newBook.category || 'General',
      available: parseInt(newBook.quantity),
      total: parseInt(newBook.quantity)
    };
    setBooks([...books, added]);
    setNewBook({ title: '', author: '', isbn: '', category: '', quantity: 1 });
    alert('Book added!');
    setScreen('inventory');
  }

  // Members Screen
  function MembersScreen() {
    const filtered = members.filter(member =>
      member.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      member.email.toLowerCase().includes(searchMember.toLowerCase())
    );
    return (
      <div>
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-semibold flex-1">Members</h2>
          <button className="btn" onClick={() => setScreen('addMember')}><Plus className="inline w-4 h-4 mr-1" />Add Member</button>
          <button className="btn-text ml-2" onClick={() => setScreen('main')}>Back</button>
        </div>
        <input
          className="input mb-2"
          placeholder="Search members..."
          value={searchMember}
          onChange={e => setSearchMember(e.target.value)}
        />
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="border-b">
              <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(member =>
              <tr key={member.id} className="border-b">
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.email}</td>
                <td>{member.phone}</td>
                <td>{member.membershipType}</td>
                <td>
                  <button className="btn-danger" onClick={() => handleDeleteMember(member.id)}>
                    <Trash2 className="inline w-4 h-4" />
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function handleDeleteMember(id) {
    if (!window.confirm('Delete this member?')) return;
    if (loans.some(loan => loan.memberId === id && loan.status === 'active')) {
      alert('Cannot delete member with active loan!');
      return;
    }
    setMembers(members.filter(m => m.id !== id));
  }

  // Add Member Screen
  function AddMemberScreen() {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Add Member</h2>
        <form onSubmit={e => { e.preventDefault(); handleAddMember(); }}>
          <div className="mb-2"><input className="input" placeholder="Name" value={newMember.name} onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))} required /></div>
          <div className="mb-2"><input className="input" placeholder="Email" value={newMember.email} onChange={e => setNewMember(m => ({ ...m, email: e.target.value }))} required /></div>
          <div className="mb-2"><input className="input" placeholder="Phone" value={newMember.phone} onChange={e => setNewMember(m => ({ ...m, phone: e.target.value }))} /></div>
          <div className="mb-2">
            <select className="input" value={newMember.membershipType} onChange={e => setNewMember(m => ({ ...m, membershipType: e.target.value }))}>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <button className="btn" type="submit">Add Member</button>
          <button className="btn-text ml-2" type="button" onClick={() => setScreen('members')}>Cancel</button>
        </form>
      </div>
    );
  }

  function handleAddMember() {
    if (!newMember.name || !newMember.email) {
      alert('Enter all required fields');
      return;
    }
    if (members.some(m => m.email === newMember.email)) {
      alert('Member with this email already exists!');
      return;
    }
    const added = {
      id: generateId('M'),
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      joinDate: new Date().toISOString().split('T')[0],
      membershipType: newMember.membershipType
    };
    setMembers([...members, added]);
    setNewMember({ name: '', email: '', phone: '', membershipType: 'Standard' });
    alert('Member added!');
    setScreen('members');
  }

  // Styling
  useEffect(() => {
    // Tailwind CDN is loaded in index.html, but you can add extra styles here if needed
  }, []);

  // Button classes for tailwind (you can adjust as needed)
  const btnClass = "px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded";
  const btnText = "underline text-blue-700 hover:text-blue-900";
  const btnDanger = "px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded";

  // Attach classes to window for className short-hand
  window['btn'] = btnClass;
  window['btn-text'] = btnText;
  window['btn-danger'] = btnDanger;
  window['input'] = "border px-2 py-1 rounded w-full";

  // Main render logic
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <NavBar />
      <div className="bg-white rounded shadow p-6 w-full max-w-3xl">
        {screen === 'main' && <MainScreen />}
        {screen === 'loan' && <LoanScreen />}
        {screen === 'return' && <ReturnScreen />}
        {screen === 'inventory' && <InventoryScreen />}
        {screen === 'addBook' && <AddBookScreen />}
        {screen === 'members' && <MembersScreen />}
        {screen === 'addMember' && <AddMemberScreen />}
      </div>
    </div>
  );
};

export default App;
